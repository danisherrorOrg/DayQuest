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

- [x] ~~No rate limiting on `POST /auth/login` or `/auth/register`.~~ Fixed:
      added an `express-rate-limit` limiter (`server/src/middleware/rateLimit.js`,
      20 requests / 15 min) applied to both routes in `auth.routes.js`.
- [x] ~~No security headers middleware.~~ Fixed: `helmet()` wired in as the
      first middleware in `server/src/index.js`.
- [x] ~~No server-side email format validation.~~ Fixed: `auth.controller.js`
      now validates format with a regex before hitting the DB, and the `User`
      model has a matching Mongoose `match` validator as defense in depth.
- [x] ~~Long-lived JWTs with no refresh/revocation.~~ Fixed: access tokens
      now expire in 15 minutes; a separate opaque refresh token (stored only
      as a SHA-256 hash on the `User` doc) is issued as an httpOnly, rotated
      cookie via new `POST /auth/refresh` and `POST /auth/logout` endpoints,
      the latter revoking the stored hash server-side. Client
      (`client/src/api/http.js`) transparently refreshes on a 401 and retries.
- [x] ~~No password-reset or email-verification flow.~~ Fixed: registration now
      sends a verification email (hashed, expiring token) and exposes
      `POST /auth/verify-email` + `POST /auth/resend-verification`; a
      `POST /auth/forgot-password` / `POST /auth/reset-password` pair handles
      resets (both return a generic message regardless of whether the account
      exists, to avoid email enumeration; a reset also revokes the existing
      refresh session). Emails go through `server/src/utils/mailer.js`
      (`nodemailer`), which logs to the console instead of sending when
      `SMTP_HOST` isn't configured, so it works out of the box in local dev.
      Client adds `/forgot-password`, `/reset-password`, `/verify-email`
      screens and an in-app "verify your email" banner with a resend button.
      Login/registration remain unblocked by an unverified email — it's
      tracked, not enforced.

## Code quality / client robustness

- [x] ~~No handling for expired/invalid tokens mid-session.~~ Fixed as part
      of the refresh-token work above: `apiRequest` now retries a `401` once
      via `POST /auth/refresh` before surfacing an error, so a mid-session
      access-token expiry is transparent as long as the refresh cookie is
      still valid.
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
