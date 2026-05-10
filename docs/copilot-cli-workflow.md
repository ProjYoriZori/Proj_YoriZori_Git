# Copilot CLI Compact Workflow

This project does not assume Copilot CLI is installed. The goal is to minimize token use by sending only a small, sanitized context packet instead of the whole repository or long logs.

## Generate Context

```powershell
.\tools\copilot-compact-context.ps1
```

The script writes `copilot-context.md` at the repository root. It includes:

- sanitized `.env` key names only
- current git status
- backend local DB config
- recent backend log tail with secrets masked
- verification commands

## Use With Copilot CLI

After installing and authenticating Copilot CLI, pass only the compact file:

```powershell
copilot ask "Review this context and suggest the smallest next fix for DB image loading." --file .\copilot-context.md
```

If your installed command uses GitHub CLI Copilot instead, use the equivalent `gh copilot` command and paste or attach `copilot-context.md`.

## Token-Saving Rules

- Do not paste `.env` values.
- Do not send full logs; use the generated tail.
- Ask one narrow question at a time.
- Prefer local tests first, then send only failing command output.
- Regenerate `copilot-context.md` after each meaningful config or log change.
