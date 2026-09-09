// Shared shell for every auth screen (Login, Register, Forgot/Reset
// Password, Verify Email) — a small branded header (mark + wordmark +
// tagline) on the game's dark palette, sitting above the same light
// cream `.panel` those screens already used, so the app carries some
// personality in before a user is even logged in.
export default function AuthLayout({ children }) {
  return (
    <div className="screen active authScreen">
      <div className="authBrand">
        <div className="authLogo" aria-hidden="true">
          D
        </div>
        <div className="authWordmark">Day Story</div>
        <p className="authTagline">Run today as a level. Log it, then play it back.</p>
      </div>
      <div className="panel authPanel">{children}</div>
    </div>
  );
}
