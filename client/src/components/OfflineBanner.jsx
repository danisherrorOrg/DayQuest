import { useOnlineStatus } from "../hooks/useOnlineStatus.js";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="offlineBanner">
      You&apos;re offline — changes won&apos;t save until your connection comes back.
    </div>
  );
}
