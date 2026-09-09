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
- [x] ~~**A full page reload while logged in logs the user out**~~, landing
      on `/login` instead of back on whatever screen they were on. Found
      2026-09-09 while live-verifying the routing fix above. Root-caused
      and fixed the same day: `refresh()` in `auth.controller.js` *rotates*
      the httpOnly refresh cookie's token on every call (issues a new one,
      overwrites `refreshTokenHash` in the DB). `AuthContext.jsx`'s startup
      effect called `refreshRequest()` directly — bypassing the existing
      `refreshAccessToken()` de-dup singleton in `http.js`, which only
      guards the 401-retry-on-request path, not this call. React 18
      StrictMode's dev-only double-invoke of that effect (see
      `main.jsx`'s `<StrictMode>`) fired two real, undeduplicated
      `POST /api/auth/refresh` requests with the same stale cookie; the
      first rotated the token server-side, so the second's lookup by the
      now-stale hash 401'd, and `clearSession()` logged the user out —
      exactly the "artifact of the Chrome-automation profile" this note
      was unsure about turned out to be a real race condition, just one
      StrictMode makes easy to trigger. Fixed with a `requestedRef` guard
      in `AuthContext.jsx` (same one-shot-effect idiom already used in
      `VerifyEmailScreen`/`LogCardModeScreen`) so only one refresh call
      goes out per mount, regardless of how many times the effect runs.
      Left the server-side rotation itself as-is — a legitimate multi-tab
      race (two tabs refreshing around the same instant, sharing the same
      cookie) is still theoretically possible and would need a grace-
      period or similar on the server to close fully, but that's a bigger,
      separate hardening call the reload-logs-you-out symptom didn't
      require. Verified with lint, Prettier, `npm run build -w client`,
      `npm test` (111 passing), and a live Chrome walkthrough: registered
      a throwaway account, reloaded `/` and `/days` directly, and stayed
      logged in on the right screen both times (previously reproduced the
      401/logout on both).

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
- [x] ~~**Duration input is two bare number boxes**~~ Fixed (2026-09-09):
      replaced the free-typed `0 h` / `0 m` number inputs in
      `LogCardModeScreen` with a segmented stepper — an hour segment
      (±60 min per tap) and a minute segment (±5 min per tap), each a
      `−`/value/`+` trio, both clamped to the 0–24h range. Typing is gone
      entirely (that was the point — no more mistyping), which let the
      form state collapse from separate `hours`/`minutes` strings to one
      `durationMins` number, simplifying `editCard`/`saveCard` too.
      Verified with lint, Prettier, `npm run build -w client`, `npm test`
      (111 passing — no test file covered this component before), and a
      live walkthrough in Chrome: stepped to 2h 15m, added a card, and
      confirmed "edit" repopulates the stepper from the saved duration.
- [x] ~~**"My Days" has no visual identity**~~ Fixed (2026-09-09): each row
      now sits in a vertical rail alongside the list — a colored dot
      showing the day's dominant category's emoji, connected to the next
      row by a line, evoking a timeline you're scrolling back through. The
      card itself gets a matching colored left border (same pattern
      `LogCardModeScreen` already used per-card). "Dominant category" reuses
      `buildDayPages`/`buildDaySummary` from `game/dayRecap.js` — the exact
      same breakdown math the recap screens use — so a day's color here
      always matches what it looks like once opened; legacy/empty days fall
      back to `BLACKBOX`'s neutral color/❔. Verified with lint, Prettier,
      `npm run build -w client`, `npm test` (111 passing — no test file
      covered this component before), and a live look in Chrome: saved a
      "Work" day and confirmed the dot/border render in that category's
      blue-gray.
- [x] ~~**Settings screen is the plainest screen in the app**~~ Fixed
      (2026-09-09): each of the three sections (Change Password, Reminders,
      Delete Account) is now its own bordered `.settingsSection` card
      (same visual language as `.modeCard` on mode-select) with an emoji +
      serif heading, instead of bare stacked inputs under plain `<h3>`s.
      Delete Account also gets a `.settingsSectionDanger` tint (warm-red
      border/heading) and its button switched from `.ghostBtn` to a new
      `.dangerBtn` (red outline) — it's a destructive action and was
      visually identical to a neutral Cancel button before. Verified with
      lint, Prettier, `npm run build -w client`, `npm test` (111 passing),
      and a live look in Chrome.
- [x] ~~**Empty states are just gray placeholder text**~~ Fixed
      (2026-09-09): new shared `EmptyState` component (`client/src/
      components/EmptyState.jsx`) draws a small static canvas of the recap
      screens' pixel character standing on a strip of ground — reusing
      `drawGroundBand`/`drawPlayerSprite` from `game/sprites.js` rather
      than new art — above the message text. Replaces the bare
      `#emptyMoments` div in both `LogCardModeScreen` ("No cards yet…")
      and `MyDaysScreen` ("No saved days yet…"), the only two places that
      pattern was used. Verified with lint, Prettier, `npm run build -w
      client`, `npm test` (111 passing), and a live look in Chrome on
      both screens.
- [x] ~~**Top nav reads as three stray links**~~ Fixed (2026-09-09): the
      three `ModeSelectScreen` topBar buttons are now a `.navGroup` pill
      (tan pill background, rounded segments) with an icon per link
      (🗓️ My Days, ⚙️ Settings, 🚪 Log out) and hover/active/press states,
      instead of three bare text buttons in a row. Only `ModeSelectScreen`
      changed — the separate `.backLink` "← Back" pattern used on other
      screens (My Days, Settings, Log Cards, …) is a different, single-
      link case and was left alone. Verified with lint, Prettier, `npm run
      build -w client`, `npm test` (111 passing), and a live look in
      Chrome, including confirming the links still navigate correctly.
- [x] ~~**Extend the game's mood into the surrounding chrome**~~ Partially
      fixed (2026-09-09): `ModeSelectScreen` — the actual home screen a
      user lands on after login — now opens with the same purple-gradient
      `.modeHeader` + floating rounded cream `.modePanel` shape as
      `AuthLayout` (new `.modeHeader`/`.modePanel` rules in `index.css`,
      reusing the exact gradient/overlap values), with dark-background
      nav-pill color overrides so `My Days`/`Settings`/`Log out` stay
      legible. Combined with the auth screens (item above) and the
      category-color accents already added to My Days (colored dots) and
      Settings (danger-section tint), the purple/warm-accent language now
      shows up before, at, and around every top-level screen except the
      three entry/edit forms themselves (Log Cards, Timeline Builder,
      Settings' input fields), which were deliberately left as plain
      cream — recoloring dense data-entry forms is a bigger, separate call
      the TODO's wording didn't clearly ask for, and risks hurting
      legibility for editable fields. Left `~~struck~~` rather than a
      fresh open item since re-scoping "extend into forms too" belongs in
      product discussion, not a leftover checkbox. Verified with lint,
      Prettier, `npm run build -w client`, `npm test` (111 passing), and a
      live look in Chrome, including confirming nav links still work from
      the new header.
- [x] ~~**Mobile responsiveness and dark-mode support are unverified**~~
      Partially resolved (2026-09-09):
      - **Dark mode**: this is a single, deliberately-themed design (cream
        panels on a dark purple ground), not a light/dark pair, and
        building a real second theme is a much bigger, separate product
        call than this checkbox implied. What *was* a real gap: no
        `color-scheme` was declared, so a browser in OS dark mode could
        auto-dark-theme native chrome (scrollbars, autofill dropdowns,
        date/time pickers) against this light-only design. Added
        `color-scheme: light` on `html` in `index.css` to fix that
        specific mismatch.
      - **Mobile responsiveness**: reviewed the CSS rather than confirming
        on an actual narrow viewport (see caveat below). The foundation
        looks sound: `index.html` has a correct `viewport` meta tag,
        `#app`/`.screen` are `width:100%; max-width:480px` (fills narrow
        viewports, centers a phone-width column on wider ones), there's
        already a `@media (max-width: 340px)` breakpoint tightening panel
        padding/heading size/control sizes for very narrow phones, and the
        one place with a fixed-pixel-width absolutely-positioned element
        (`.chronoPopup`, 200px/180px, in `ChronoBarScreen`) already clamps
        its position in JS (`clamp(x, 104, barSize - 104)`, `barSize`
        measured live from the DOM) rather than assuming a fixed
        container width. **Caveat**: this is a static read of the CSS/JS,
        not a rendered check — the sandboxed Chrome session's
        `resize_window` calls didn't change the tab's actual viewport
        (`window.innerWidth` stayed at the full display width, ~1414px,
        after requesting 375×700 and 390×750), so no narrow-viewport
        screenshot was possible this pass. Worth a real check in a phone
        or a browser's device toolbar before fully trusting this.

---

See also `README.md` for what's currently built and how it works.
