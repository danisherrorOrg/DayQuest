# TODO / Pending Work

Everything else (initial project audit, entry & review redesign,
multiple-entries-per-day, My Days/replay/delete, image export, account
management, stats, component tests, vertical chrono bar, offline-first
saving, PWA support, reminder emails) is done — see git history for the
individual fixes. What's left is tracked below.

## Navigation / routing

- [x] ~~**In-app screens aren't real routes — a refresh always drops you
      back to mode-select.**~~ Fixed (2026-09-09): `GameApp` in `App.jsx`
      now mounts a nested `<Routes>` under `/*` with a real path per screen
      — `/` (mode-select), `/days`, `/settings`, `/log`, `/timeline`,
      `/recap`, `/recap/chrono` — instead of a `useState("screen")` switch.
      All the former `setScreen(...)` calls became `navigate(...)` calls.
      `run` (the in-progress cards/blocks/date being reviewed) and
      `timelineJump` stay as lifted state in `GameApp` since they're
      ephemeral, non-serializable entry data — a reload mid-recap or
      mid-timeline-jump still loses that in-memory state (same as before;
      nothing is saved until "Save This Day"), but `/recap` and
      `/recap/chrono` redirect to `/` rather than crashing if hit with no
      `run` in memory (e.g. a raw refresh). Verified with `npm run lint`,
      `npm run build -w client`, `npm test` (111 tests, all passing), and
      (2026-09-09, in a session where the Atlas cluster was actually
      reachable) a live Chrome walkthrough against a throwaway registered
      account: clicking "My Days"/"Settings" now updates the URL to
      `/days`/`/settings` and renders the right screen, instead of staying
      on `/` with just internal state changing. A *full page reload* on
      those routes wasn't confirmed live end-to-end — see the new
      session-refresh item below, found during this same pass.
- [ ] **A full page reload while logged in logs the user out**, landing on
      `/login` instead of back on whatever screen they were on. Found
      2026-09-09 while live-verifying the routing fix above: reloading
      `/days` (or any in-app route) fires `AuthContext`'s startup
      `POST /api/auth/refresh` (meant to silently trade the httpOnly
      refresh cookie for a new access token — see the comment above that
      call in `AuthContext.jsx`), which came back `401`, so `clearSession()`
      ran and `RequireAuth` redirected to `/login`. Not caused by or fixed
      by the routing change above — `RequireAuth.jsx`/`AuthContext.jsx`
      weren't touched — and unconfirmed whether it's a real bug (e.g. the
      refresh cookie's `SameSite`/`secure` flags not surviving a top-level
      navigation the way an XHR does) or an artifact specific to the
      Chrome-automation profile used for that pass. Worth reproducing in a
      normal browser tab before treating it as a real bug.

## UI/UX polish

From a manual design pass (2026-09-05, same session as the routing gap
above). The core game moment (dialogue recap / chrono bar — pixel
character, dialogue box, sky gradient) has real personality; everything
around it currently reads as a plain, unstyled CRUD admin panel, and the
two halves don't feel like the same product yet.

- [x] ~~**Auth screens (Login/Register) have no branding**~~ Fixed
      (2026-09-09): added a shared `AuthLayout` (`client/src/components/
      auth/AuthLayout.jsx`) — a "D" monogram mark, "Day Story" wordmark,
      and a one-line tagline on the game's dark purple gradient
      (`.authScreen`/`.authBrand` in `index.css`), with the existing cream
      `.panel` floating below with rounded top corners so it reads as one
      card rather than a hard color switch. Applied to all five auth
      screens (Login, Register, Forgot/Reset Password, Verify Email), not
      just Login/Register, since they all shared the same bare shell and
      leaving the others flat would've looked inconsistent mid-flow.
      Verified with lint, `npm run build -w client`, `npm test` (111
      passing), and a live look in Chrome — including a real register →
      click "My Days"/"Settings" smoke test against a throwaway account
      (deleted after) that also re-confirmed the routing fix above:
      client-side nav to `/days` and `/settings` render those screens with
      the URL updated to match, not mode-select. (A *full page reload* on
      those routes hit a separate, pre-existing issue — see new item
      below — so that specific half of the routing fix wasn't confirmed
      live, only by code review.)
- [x] ~~**Native form controls clash with the custom theme**~~ Fixed
      (2026-09-09): the reminders checkbox in `SettingsScreen` is now a
      custom `.checkboxRow`/`.checkboxBox` (hidden native input, styled
      box + checkmark SVG driven by `:checked`/`:disabled`/`:focus-visible`
      via a CSS sibling selector — see `index.css`). Every themed
      `<select>` (`#logCardForm select` in `LogCardModeScreen`, and
      `.builderPopupSheet select` in `TimelineBuilderScreen`'s block-edit
      popup, which had the identical native-arrow mismatch even though the
      TODO only named the log-card one) gets `appearance: none` plus an
      inline-SVG chevron background-image instead of the OS-default arrow
      — no markup changes needed for the selects, just CSS, since they
      already had matching border/radius/background from the existing
      `#logCardForm select` / `.builderPopupSheet select` rules. Verified
      with lint, Prettier, `npm run build -w client`, `npm test` (111
      passing), and — once the Chrome extension reconnected in a later
      pass the same day — a live look: the checkbox renders as a filled
      orange box with a cream checkmark when on, and the category select
      shows a small chevron matching the theme instead of the OS arrow.
- [x] ~~**No visible confirmation that "Save This Day" worked**~~ Fixed
      (2026-09-09): added a shared bottom-center toast stack (`ToastContext`
      / `useToast()`, mounted once via `<ToastProvider>` in `App.jsx`, CSS
      in `index.css`). `useDaySave`'s `handleSave` now toasts "Day saved ✓"
      on success and an error/offline toast on failure (the existing
      in-button "Saved ✓" label swap on `DayCompleteOverlay`'s save button
      stays too — the toast is the more-visible layer on top of it, not a
      replacement). `SettingsScreen` toasts on password change and on each
      reminder-email toggle. `DialogueRecapScreen.test.jsx` and
      `ChronoBarScreen.test.jsx` needed a `<ToastProvider>` wrapper added
      to their `renderScreen` helper, since `useDaySave` now calls
      `useToast()`, which throws outside a provider (matching `useAuth`'s
      existing behavior). Verified with lint, Prettier, `npm run build -w
      client`, `npm test` (111 passing), and a live save-flow walkthrough
      in Chrome (toggle reminders → toast; log a day → save → "Day saved
      ✓" toast alongside the button's own "Saved ✓").
- [ ] **Duration input is two bare number boxes** (`0 h` / `0 m` in
      `LogCardModeScreen`) — no steppers, easy to mistype. Redesign as one
      compact control (segmented stepper or slider).
- [ ] **"My Days" has no visual identity** — just bordered rows of
      date/badge/sentence/two text-link buttons, reads like a database
      table. Give it more of a timeline feel — a colored strip or icon per
      category, some sense of looking back through days, not rows.
- [ ] **Settings screen is the plainest screen in the app** — bare stacked
      labeled inputs, no visual hierarchy beyond section headings. Needs
      the same design pass as the rest once the native-control fix above
      lands.
- [ ] **Empty states are just gray placeholder text** ("No cards yet — add
      your first one below") — no illustration or personality in an app
      whose whole premise is turning your day into something visually fun.
      Worth a small illustration or the character sprite plus a short
      prompt instead.
- [ ] **Top nav reads as three stray links** ("My Days / Settings / Log
      out") — no icons, no active-state, no visual weight. Add icons and
      some visual grouping.
- [ ] **Extend the game's mood into the surrounding chrome** — the dark
      purple/warm-accent palette from the recap screens doesn't appear
      anywhere in mode-select, nav, or forms, which is the main reason the
      app currently feels like two products stitched together.
- [ ] **Mobile responsiveness and dark-mode support are unverified** — this
      pass was desktop-width, one theme only; worth a real check on a
      narrow viewport and under `prefers-color-scheme: dark`.

---

See also `README.md` for what's currently built and how it works.
