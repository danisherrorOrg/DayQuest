# TODO / Pending Work

Everything else (initial project audit, entry & review redesign,
multiple-entries-per-day, My Days/replay/delete, image export, account
management, stats, component tests, vertical chrono bar, offline-first
saving, PWA support, reminder emails) is done — see git history for the
individual fixes. What's left is tracked below.

## Navigation / routing

- [ ] **In-app screens aren't real routes — a refresh always drops you back
      to mode-select.** Found during a manual UI pass (2026-09-05, temp
      account register → verify → log card → build → save → My Days →
      Settings → delete account — see git history/session notes for the
      full walkthrough). `App.jsx`'s `<Routes>` only cover the auth screens
      (`/login`, `/register`, etc.) plus a single catch-all `/` for the
      entire logged-in app; everything inside it — mode-select, My Days,
      Settings, Log Cards, Timeline Builder, the dialogue/chrono recap —
      is just a `useState("screen")` value in `GameApp`, never reflected in
      the URL. Confirmed two ways: navigating straight to `/days` bounces
      through the `<Route path="*" element={<Navigate to="/" replace />}>`
      catch-all back to mode-select instead of opening `MyDaysScreen`; and
      clicking "My Days" (a `<button>`, not a `<Link>` — URL stays `/`)
      then reloading the same URL also resets to mode-select, discarding
      whatever screen the user was on. Same would apply mid-entry (Log
      Cards/Timeline Builder) or mid-recap — a reload loses that screen's
      state too, though the underlying data isn't lost since nothing is
      saved until "Save This Day" is clicked. No fix attempted yet; likely
      shape is giving each screen its own path under `/` (`/days`,
      `/settings`, `/log`, `/timeline`) via nested `<Route>`s and swapping
      the `useState("screen")` switch for `useNavigate`/`useParams`, but
      that's a bigger refactor than this pass was scoped for.

## UI/UX polish

From a manual design pass (2026-09-05, same session as the routing gap
above). The core game moment (dialogue recap / chrono bar — pixel
character, dialogue box, sky gradient) has real personality; everything
around it currently reads as a plain, unstyled CRUD admin panel, and the
two halves don't feel like the same product yet.

- [ ] **Auth screens (Login/Register) have no branding** — just a heading,
      two inputs, a button. No logo, tagline, or visual hint this is a
      game about your day. Add a small logo/mark, a one-line tagline, and
      maybe a sliver of the game's purple/gradient palette as a background
      accent instead of flat cream.
- [ ] **Native form controls clash with the custom theme** — the
      "Reminder emails are on" checkbox (`SettingsScreen`) and the category
      `<select>` (`LogCardModeScreen`) both render as unstyled browser
      defaults against an otherwise custom cream/serif design. Restyle both
      to match (custom checkbox, custom dropdown) — cheapest fix with the
      biggest consistency payoff.
- [ ] **No visible confirmation that "Save This Day" worked** — clicking it
      gives no on-screen feedback (only visible via the network tab).
      Add a toast/banner on save success (and ideally on Settings actions —
      password change, reminder toggle) so actions feel acknowledged.
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
