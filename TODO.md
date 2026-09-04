# TODO / Pending Work

Gaps and unfinished work identified via project audit (2026-09-04), beyond the
feature ideas and code-review fixes already tracked in `README.md`.

## Testing

- [ ] **No test framework at all.** No `jest`/`vitest`/`mocha` in any of the
      3 `package.json` files, no `test` script, no `*.test.js`/`*.spec.js`/
      `__tests__`. Zero coverage on auth, day-save logic, or level-building math.
      _Medium-large lift — pick a framework, wire up scripts, write an initial
      suite for `levelBuilder.js` and the auth/day controllers._

## Tooling

- [x] ~~No lint/format tooling.~~ Fixed: added a shared ESLint 9 flat config
      (`eslint.config.js`) covering both workspaces, plus Prettier
      (`.prettierrc.json`); `npm run lint`/`lint:fix`/`format`/`format:check`
      at the root, and `npm run -w client lint`.
- [x] ~~No `engines` field.~~ Fixed: `"node": ">=18.0.0"` added to the root,
      `client`, and `server` `package.json`.
- [x] ~~No `LICENSE` file / `license` field.~~ Fixed: added `LICENSE` (MIT)
      and `"license": "MIT"` to all three `package.json` files.

## Security

- [ ] **No rate limiting** on `POST /auth/login` or `/auth/register`
      (`server/src/routes/auth.routes.js`) — brute-force/credential-stuffing
      exposure. _Small-medium — add `express-rate-limit`._
- [ ] **No security headers middleware** (e.g. `helmet`) in
      `server/src/index.js`. _Small._
- [ ] **No server-side email format validation.** `auth.controller.js`
      only checks `email` is truthy; format is enforced solely by the client's
      `<input type="email">`, which a direct API call bypasses. `User` model
      has no format validator either. _Small._
- [ ] **Long-lived JWTs with no refresh/revocation.** Tokens are signed for
      7 days (`signToken` in `auth.controller.js`) with no refresh-token
      mechanism and no server-side logout/revocation — a stolen token stays
      valid for a week. _Medium._
- [ ] **No password-reset or email-verification flow.** Register/login only.
      _Medium-large._

## Code quality / client robustness

- [ ] **No handling for expired/invalid tokens mid-session.** `apiRequest`
      (`client/src/api/http.js`) doesn't special-case `401` — an expired JWT
      just throws a generic error instead of logging the user out / redirecting
      to login. _Small._
- [ ] **No offline/network-failure handling.** A failed `fetch` (network
      down) surfaces the same generic error path as any other failure — no
      retry or offline messaging.

## Docs / Config / DevOps

- [ ] **No CI.** No `.github/workflows` — nothing runs build/lint/test on
      PRs.
- [ ] **No containerization.** No Dockerfile anywhere in the repo.
- [ ] **No production deployment docs.** README only covers local dev
      (`npm run dev`); nothing on building the client for prod, serving it, or
      deploying the server/Mongo.
- [ ] **No responsive/mobile layout.** `client/src/index.css` has zero
      `@media` queries; the viewport meta tag also sets `user-scalable=no`,
      so small screens get a fixed, non-adapting layout with no manual zoom
      fallback.

## Verified fine (not gaps)

- `.gitignore` already covers `node_modules/`, `dist/`, `.env`.
- `server/.env.example` matches the `process.env.*` vars actually read in
  code (`MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`).
- Day-save input validation (`days.controller.js`) already checks date
  format and the `mode` enum properly.

---

See also `README.md` → "Ideas for next steps" (feature backlog) and
"Known issues (from code review)" (already fixed).
