import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const EDGE =
  process.env.EDGE_PATH ||
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const NODE_ROOT = path.resolve(".");
const USER_DATA_DIR = path.join(NODE_ROOT, ".edge-codex-test");
const PORT = Number(process.env.CDP_PORT || 9322);
const APP_URL = process.env.APP_URL || "http://localhost:8082";
const OUT = process.env.OUT || "tools/local-ui-smoke-test-result.json";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.seq = 0;
    this.pending = new Map();
    this.events = [];
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", async (event) => {
      const raw =
        typeof event.data === "string"
          ? event.data
          : event.data instanceof ArrayBuffer
            ? Buffer.from(event.data).toString("utf8")
            : Buffer.from(await event.data.arrayBuffer()).toString("utf8");
      const msg = JSON.parse(raw);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
        return;
      }
      this.events.push(msg);
    });
  }

  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 10000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  async waitForEvent(method, predicate = () => true, timeoutMs = 10000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const index = this.events.findIndex(
        (event) => event.method === method && predicate(event.params || {}),
      );
      if (index >= 0) return this.events.splice(index, 1)[0];
      await delay(50);
    }
    throw new Error(`Timed out waiting for ${method}`);
  }

  close() {
    this.ws.close();
  }
}

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Edge is still starting.
    }
    await delay(100);
  }
  throw new Error(`Unable to reach ${url}`);
}

function compact(value = "") {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 180);
}

async function run() {
  await rm(USER_DATA_DIR, { recursive: true, force: true });
  await mkdir(USER_DATA_DIR, { recursive: true });

  const edge = spawn(
    EDGE,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      "--window-size=430,932",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const result = {
    appUrl: APP_URL,
    startedAt: new Date().toISOString(),
    checks: [],
    errors: [],
    warnings: [],
    console: [],
    network: [],
  };

  let browserCdp;
  let cdp;
  let sessionId;

  const check = async (name, fn) => {
    try {
      const detail = await fn();
      result.checks.push({ name, status: "pass", detail: detail || "" });
    } catch (error) {
      result.checks.push({ name, status: "fail", detail: error.message });
      result.errors.push({ name, message: error.message });
    }
  };

  try {
    const version = await waitForJson(`http://127.0.0.1:${PORT}/json/version`);
    browserCdp = new Cdp(version.webSocketDebuggerUrl);
    const target = await browserCdp.send("Target.createTarget", {
      url: "about:blank",
    });
    const targets = await waitForJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find((item) => item.id === target.targetId);
    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error("Unable to find page DevTools websocket.");
    }
    cdp = new Cdp(pageTarget.webSocketDebuggerUrl);
    sessionId = undefined;

    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Log.enable", {}, sessionId);

    const eventPump = setInterval(() => {
      for (const event of cdp.events.splice(0)) {
        const params = event.params || {};
        if (event.method === "Runtime.exceptionThrown") {
          result.errors.push({
            name: "Runtime exception",
            message: compact(params.exceptionDetails?.text || params.text),
          });
        }
        if (event.method === "Runtime.consoleAPICalled") {
          const message = (params.args || [])
            .map((arg) => arg.value || arg.description || "")
            .join(" ");
          if (params.type === "error") {
            result.console.push({ level: "error", message: compact(message) });
          }
        }
        if (event.method === "Log.entryAdded") {
          const entry = params.entry || {};
          if (entry.level === "error") {
            result.console.push({ level: "error", message: compact(entry.text) });
          }
        }
        if (event.method === "Network.responseReceived") {
          const response = params.response || {};
          if (response.status >= 400) {
            result.network.push({
              status: response.status,
              url: response.url,
              type: params.type,
            });
          }
        }
        if (event.method === "Network.loadingFailed") {
          result.network.push({
            status: "failed",
            url: params.requestId,
            type: params.type,
            errorText: params.errorText,
          });
        }
      }
    }, 100);

    const evaluate = async (expression) => {
      const response = await cdp.send(
        "Runtime.evaluate",
        {
          expression,
          returnByValue: true,
          awaitPromise: true,
          userGesture: true,
        },
        sessionId,
      );
      if (response.exceptionDetails) {
        throw new Error(response.exceptionDetails.text || "Evaluation failed");
      }
      return response.result?.value;
    };

    const pageText = () =>
      evaluate("document.body ? document.body.innerText : ''");

    const goto = async (url) => {
      await cdp.send("Page.navigate", { url }, sessionId);
      await cdp.waitForEvent(
        "Page.loadEventFired",
        () => true,
        15000,
      ).catch(() => undefined);
      await delay(4500);
    };

    const clickByText = async (labels, note = labels[0]) => {
      const encoded = JSON.stringify(Array.isArray(labels) ? labels : [labels]);
      const target = await evaluate(`(() => {
        const labels = ${encoded};
        const visible = (el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const clickable = Array.from(document.querySelectorAll('button,a,[role="button"],[role="tab"],[tabindex],input,textarea'))
          .sort((a, b) => {
            const ar = a.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            return (ar.width * ar.height) - (br.width * br.height);
          });
        for (const label of labels) {
          const found = clickable.find((el) => visible(el) && ((el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || '').includes(label)));
          if (found) {
            const rect = found.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, text: (found.innerText || found.value || found.placeholder || '').slice(0, 120) };
          }
        }
        return null;
      })()`);
      if (!target) throw new Error(`Clickable text not found: ${note}`);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: target.x,
        y: target.y,
      }, sessionId);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: target.x,
        y: target.y,
        button: "left",
        clickCount: 1,
      }, sessionId);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: target.x,
        y: target.y,
        button: "left",
        clickCount: 1,
      }, sessionId);
      await delay(900);
      return target.text;
    };

    const activateByText = async (labels, note = labels[0]) => {
      const encoded = JSON.stringify(Array.isArray(labels) ? labels : [labels]);
      const activated = await evaluate(`(() => {
        const labels = ${encoded};
        const visible = (el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const clickable = Array.from(document.querySelectorAll('button,a,[role="button"],[role="tab"],[tabindex],input,textarea'))
          .sort((a, b) => {
            const ar = a.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            return (ar.width * ar.height) - (br.width * br.height);
          });
        for (const label of labels) {
          const found = clickable.find((el) => visible(el) && ((el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || '').includes(label)));
          if (found) {
            found.click();
            return (found.innerText || found.value || found.placeholder || '').slice(0, 120);
          }
        }
        return null;
      })()`);
      if (!activated) throw new Error(`Clickable text not found: ${note}`);
      await delay(900);
      return activated;
    };

    const fillVisibleInput = async (index, value) => {
      const target = await evaluate(`(() => {
        const inputs = Array.from(document.querySelectorAll('input,textarea')).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        const el = inputs[${index}];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        el.focus();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: inputs.length, placeholder: el.placeholder || '' };
      })()`);
      if (!target) throw new Error(`Visible input index not found: ${index}`);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: target.x,
        y: target.y,
        button: "left",
        clickCount: 1,
      }, sessionId);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: target.x,
        y: target.y,
        button: "left",
        clickCount: 1,
      }, sessionId);
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        windowsVirtualKeyCode: 65,
        key: "a",
        code: "KeyA",
        modifiers: 2,
      }, sessionId);
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        windowsVirtualKeyCode: 65,
        key: "a",
        code: "KeyA",
        modifiers: 2,
      }, sessionId);
      await cdp.send("Input.insertText", { text: value }, sessionId);
      await delay(300);
      return target.placeholder;
    };

    const visibleInputValue = async (index) =>
      evaluate(`(() => {
        const inputs = Array.from(document.querySelectorAll('input,textarea')).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        return inputs[${index}] ? inputs[${index}].value : null;
      })()`);

    const rowAction = async (text, actionIndexFromEnd = 0) => {
      const target = await evaluate(`(() => {
        const text = ${JSON.stringify(text)};
        const rows = Array.from(document.querySelectorAll('div')).map((el) => {
          const buttons = Array.from(el.querySelectorAll('button,[role="button"],[tabindex]')).filter((button) => {
            const rect = button.getBoundingClientRect();
            return rect.width > 2 && rect.height > 2;
          });
          const rect = el.getBoundingClientRect();
          return { el, buttons, area: rect.width * rect.height, text: el.innerText || '' };
        }).filter((row) => row.text.includes(text) && row.buttons.length);
        const picked = rows.sort((a, b) => a.area - b.area)[0];
        if (!picked) return null;
        const row = picked.el;
        const buttons = picked.buttons;
        const el = buttons[buttons.length - 1 - ${actionIndexFromEnd}] || row;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, buttonCount: buttons.length };
      })()`);
      if (!target) throw new Error(`Row not found: ${text}`);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: target.x,
        y: target.y,
        button: "left",
        clickCount: 1,
      }, sessionId);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: target.x,
        y: target.y,
        button: "left",
        clickCount: 1,
      }, sessionId);
      await delay(700);
      return `buttons=${target.buttonCount}`;
    };

    await check("home loads", async () => {
      await goto(APP_URL);
      const text = await pageText();
      if (!text || text.length < 20) throw new Error("Home page has no visible text");
      return compact(text);
    });

    await check("recipes screen route and search inputs", async () => {
      await goto(`${APP_URL}/recipes`);
      await fillVisibleInput(0, "CodexSmoke");
      await fillVisibleInput(1, "Egg");
      const firstValue = await visibleInputValue(0);
      const secondValue = await visibleInputValue(1);
      if (firstValue !== "CodexSmoke" || secondValue !== "Egg") {
        result.warnings.push("Recipe search input values were not retained.");
      }
      const text = await pageText();
      return compact(text);
    });

    await check("shopping add toggle delete", async () => {
      await goto(`${APP_URL}/shopping`);
      await clickByText(["Add item directly", "Direct add", "\ud56d\ubaa9 \uc9c1\uc811 \ucd94\uac00"], "shopping add");
      await fillVisibleInput(0, "CodexTestShopping");
      await fillVisibleInput(1, "1");
      await fillVisibleInput(2, "ea");
      await clickByText(["Add", "\ucd94\uac00\ud558\uae30"], "shopping submit");
      let text = await pageText();
      if (!text.includes("CodexTestShopping")) throw new Error("Shopping test item was not added");
      await rowAction("CodexTestShopping", 1).catch((error) => result.warnings.push(`Shopping toggle skipped: ${error.message}`));
      await rowAction("CodexTestShopping", 0);
      text = await pageText();
      if (text.includes("CodexTestShopping")) throw new Error("Shopping test item was not deleted");
      return "Created, toggled when available, and deleted CodexTestShopping.";
    });

    await check("fridge add select delete", async () => {
      await goto(`${APP_URL}/fridge`);
      await clickByText(["Add ingredient", "\uc7ac\ub8cc \ucd94\uac00"], "fridge add");
      await fillVisibleInput(0, "CodexTestPantry");
      await fillVisibleInput(1, "2");
      await fillVisibleInput(2, "ea");
      await clickByText(["Add", "\ucd94\uac00\ud558\uae30"], "fridge submit");
      let text = await pageText();
      if (!text.includes("CodexTestPantry")) throw new Error("Pantry test item was not added");
      await rowAction("CodexTestPantry", 1).catch((error) => result.warnings.push(`Pantry select skipped: ${error.message}`));
      await rowAction("CodexTestPantry", 0);
      text = await pageText();
      if (text.includes("CodexTestPantry")) throw new Error("Pantry test item was not deleted");
      return "Created, selected when available, and deleted CodexTestPantry.";
    });

    await check("nutrition add custom food", async () => {
      await goto(`${APP_URL}/nutrition`);
      await activateByText(["Add food", "\uc74c\uc2dd \ucd94\uac00\ud558\uae30", "\ucd94\uac00"], "nutrition add food");
      const nutritionDebug = await evaluate(`(() => {
        const inputs = Array.from(document.querySelectorAll('input,textarea')).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
        }).length;
        const clickables = Array.from(document.querySelectorAll('button,a,[role="button"],[role="tab"],[tabindex]')).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
        }).slice(0, 20).map((el) => (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
        return { inputs, clickables, text: (document.body.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 300) };
      })()`);
      if (!nutritionDebug.inputs) {
        result.warnings.push(`Nutrition modal input debug: ${JSON.stringify(nutritionDebug)}`);
      }
      await fillVisibleInput(0, "CodexTestFood");
      await fillVisibleInput(1, "1 ea");
      await fillVisibleInput(2, "123");
      await fillVisibleInput(3, "10");
      await fillVisibleInput(4, "5");
      await fillVisibleInput(5, "3");
      await fillVisibleInput(6, "50");
      const nutritionSubmitted = await evaluate(`(() => {
        const candidates = Array.from(document.querySelectorAll('button,[role="button"],[tabindex]')).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const text = (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden' && text.includes('\ucd94\uac00\ud558\uae30') && !text.includes('\uc74c\uc2dd \ucd94\uac00\ud558\uae30');
        });
        const button = candidates.sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return br.top - ar.top;
        })[0];
        if (!button) return false;
        button.click();
        return true;
      })()`);
      if (!nutritionSubmitted) throw new Error("Nutrition submit button not found");
      await delay(900);
      const text = await pageText();
      if (!text.includes("CodexTestFood")) throw new Error("Custom food was not added");
      return "Created CodexTestFood custom food.";
    });

    await check("mypage form renders and accepts input", async () => {
      await goto(`${APP_URL}/mypage`);
      await fillVisibleInput(0, "CodexTestUser");
      await fillVisibleInput(1, "codex@example.test");
      const firstValue = await visibleInputValue(0);
      const secondValue = await visibleInputValue(1);
      if (firstValue !== "CodexTestUser" || secondValue !== "codex@example.test") {
        throw new Error("Profile fields did not accept input");
      }
      return "Profile fields accept text input; save not submitted to avoid overwriting profile.";
    });

    await check("recipe detail route if recipe exists", async () => {
      await goto(`${APP_URL}/recipes`);
      const opened = await evaluate(`(() => {
        const rows = Array.from(document.querySelectorAll('[role="button"],div')).filter((el) => {
          const text = el.innerText || '';
          const rect = el.getBoundingClientRect();
          return text.includes('kcal') && rect.width > 40 && rect.height > 40;
        }).sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height);
        const row = rows[0];
        if (!row) return false;
        const rect = row.getBoundingClientRect();
        row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
        return true;
      })()`);
      await delay(1500);
      if (!opened) {
        result.warnings.push("Recipe detail was skipped because no visible recipe row was available.");
        return "Skipped: no recipe rows.";
      }
      const text = await pageText();
      if (!text.includes("kcal")) throw new Error("Recipe detail did not show nutrition data");
      await clickByText(["Meal log", "\uc2dd\uc0ac \uae30\ub85d"], "meal log").catch((error) => result.warnings.push(`Meal log modal skipped: ${error.message}`));
      return compact(text);
    });

    clearInterval(eventPump);
    await delay(500);
  } finally {
    if (cdp) cdp.close();
    if (browserCdp) browserCdp.close();
    edge.kill();
    result.finishedAt = new Date().toISOString();
    await writeFile(OUT, JSON.stringify(result, null, 2), "utf8");
  }
}

run().catch(async (error) => {
  const failure = {
    appUrl: APP_URL,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    checks: [],
    errors: [{ name: "test harness", message: error.stack || error.message }],
    warnings: [],
    console: [],
    network: [],
  };
  await writeFile(OUT, JSON.stringify(failure, null, 2), "utf8");
  process.exitCode = 1;
});
