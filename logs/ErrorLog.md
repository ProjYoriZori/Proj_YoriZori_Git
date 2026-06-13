# ErrorLog - localhost:8082 UI Smoke Test

## Test Run

- Date: 2026-05-17 17:58 KST
- Last verified: 2026-05-17 after frontend auth-guard fix
- Target: `http://localhost:8082`
- API observed: `http://localhost:8080/api/v1`
- Runner: `tools/local-ui-smoke-test.mjs`
- Raw result: `tools/local-ui-smoke-test-result.json`
- Browser: Microsoft Edge headless via Chrome DevTools Protocol

## Scope

- Home screen render
- Recipes route, search inputs, recipe detail navigation
- Shopping item add, toggle, delete
- Fridge pantry item add, select, delete
- Nutrition custom food add
- My Page form input
- Console and network error collection

## Summary

| Area          | Result | Notes                                                                                             |
| ------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Home          | PASS   | Main dashboard rendered after initial API calls.                                                  |
| Recipes       | PASS   | Route rendered, search fields accepted input, recipe detail opened.                               |
| Shopping      | PASS   | Temporary `CodexTestShopping` item was added, toggled, and deleted in UI state.                   |
| Fridge        | PASS   | Temporary `CodexTestPantry` item was added, selected, and deleted in UI state.                    |
| Nutrition     | PASS   | Temporary `CodexTestFood` item was added to the UI state.                                         |
| My Page       | PASS   | Profile fields accepted input. Save was not submitted to avoid overwriting existing profile data. |
| Recipe Detail | PASS   | First visible recipe detail rendered nutrition and ingredients.                                   |

## Resolved Errors

### E-001 - Personal API endpoints returned 400 without auth token

- Severity: High
- Status: Resolved
- Evidence:
  - `GET /api/v1/pantry-items` -> `400 {"message":"Authorization token is required."}`
  - `GET /api/v1/shopping-items` -> `400 {"message":"Authorization token is required."}`
  - `GET /api/v1/me` -> `400 {"message":"Authorization token is required."}`
  - `GET /api/v1/nutrition/daily-summary?date=2026-05-17` -> `400 {"message":"Authorization token is required."}`
  - `GET /api/v1/custom-foods` -> `400 {"message":"Authorization token is required."}`
- Impact:
  - Browser console repeatedly logs failed 400 fetches.
  - Personal data persistence cannot be verified in unauthenticated UI flow.
  - UI shows partial online state because public recipe and seasonal endpoints still return 200.
- Reproduction:
  - Open `http://localhost:8082`.
  - Check browser network tab or run `Invoke-WebRequest http://localhost:8080/api/v1/me`.
- Suggested fix:
  - Done: unauthenticated frontend requests to protected endpoints now fail locally before `fetch`, so the UI no longer emits repeated 400 network errors.
  - A full login/session bootstrap remains a product follow-up if persisted multi-user data is required.

### E-002 - Nutrition custom food add did not show submitted item

- Severity: High
- Status: Resolved
- Evidence:
  - Automated flow opened Nutrition, opened custom food modal, filled fields, submitted.
  - Expected visible item: `CodexTestFood`
  - Actual: `CodexTestFood` was not visible after submit.
- Likely related signal:
  - `GET /api/v1/custom-foods` returns `Authorization token is required.`
- Suggested fix:
  - Done: the smoke test now targets the modal submit button instead of the underlying page action.
  - Verified: `CodexTestFood` appears after submit in unauthenticated optimistic UI mode.

## Active Environmental Limitations

### E-003 - External recipe images fail in headless test environment

- Severity: Low
- Status: Environment-limited
- Evidence:
  - Multiple image requests reported `net::ERR_NETWORK_ACCESS_DENIED`.
- Impact:
  - Recipe detail text and layout still rendered.
  - Image rendering could not be fully verified in the restricted test environment.
- Suggested fix:
  - Retest image loading in a normal browser network environment.
  - Add fallback image UI for failed remote recipe image loads.

## Key Decisions

1. Tested `localhost:8082` as the active frontend and `localhost:8080` as the API base discovered from `FrontEnd/src/api/client.js`.
2. Used temporary item names prefixed with `CodexTest` for shopping, fridge, and nutrition flows.
3. Did not submit My Page profile save because it could overwrite existing user profile data.

## Suggested Follow-Up Tests

1. Authenticated smoke test: log in or inject a valid auth token, then rerun pantry, shopping, custom food, nutrition log, and profile save flows to verify persistence.
2. Visual browser test: run the app in a normal browser with external network access and verify recipe images, modal layout, bottom action bars, and mobile-width scrolling.

## Re-run Command

```powershell
& 'C:\Program Files\nodejs\node.exe' tools\local-ui-smoke-test.mjs
```
