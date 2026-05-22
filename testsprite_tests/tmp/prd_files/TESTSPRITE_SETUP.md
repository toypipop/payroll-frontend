# TestSprite Setup

## Current Local Baseline

- Frontend is reachable at `http://localhost:5174`.
- Backend modules endpoint is reachable at `http://localhost:8000/api/v1/modules`.
- Node version is `v22.19.0`, which satisfies TestSprite MCP requirements.
- `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run build` pass.
- `npx.cmd vitest run` starts, but the repo currently has no `*.test.*` or `*.spec.*` files.

## Files To Give TestSprite

- Use `TESTSPRITE_PRD.md` as the uploaded Product Requirements Document.
- Test frontend URL: `http://localhost:5174`
- Test backend URL: `http://localhost:8000/api/v1`
- Recommended first test mode: Codebase
- Recommended scope: Frontend + Backend/API, because routes and auth are backend-driven.

## Test Credentials

Use seeded local/test accounts only.

- `admin@admin.com` / `password123`
- `staff@admin.com` / `password123`
- `alice@techa.com` / `password123`
- `david@bizgroup.com` / `password123`

## VS Code MCP Configuration

Create or update `.vscode/mcp.json` locally. Do not commit real API keys.

```json
{
  "servers": {
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your-testsprite-api-key"
      }
    }
  }
}
```

After saving the file:

1. Start the TestSprite MCP server from the VS Code MCP controls.
2. Confirm TestSprite shows as connected.
3. In the IDE chat, ask: `Help me test this project with TestSprite.`
4. In TestSprite's browser configuration page, upload `TESTSPRITE_PRD.md`, enter the local URLs, and use the seeded credentials above.

## Expected Output Location

After a TestSprite run, review:

- `testsprite_tests/TestSprite_MCP_Test_Report.md`
- `testsprite_tests/TestSprite_MCP_Test_Report.html`
- `testsprite_tests/tmp/test_results.json`

If TestSprite reports failures, use the report and ask Codex to fix the codebase based on the TestSprite results.
