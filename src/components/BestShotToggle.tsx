"use client";

import { useState } from "react";
import type { DialInLog } from "@/lib/types";

/**
 * Big-tap flag that marks/unmarks a shot as the bean's best dial-in via
 * PATCH /api/beans/[beanId]/logs/[logId]/best. The route clears any other
 * flagged shot for the bean; the updated row is reported through onToggled
 * so the caller can reconcile its list.
 */
export function BestShotToggle({
  log,
  isBest,
  onToggled,
}: {
  log: DialInLog;
  isBest: boolean;
  onToggled: (log: DialInLog) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/beans/${log.bean_id}/logs/${log.id}/best`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error(String(res.status));
      const { log: updated } = (await res.json()) as { log: DialInLog };
      onToggled(updated);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={isBest}
        aria-label={isBest ? "Unflag best shot" : "Flag as best shot"}
        className={`min-h-11 border px-3 font-glitch text-[10px] uppercase tracking-[0.25em] transition disabled:opacity-50 ${
          isBest
            ? "glow-brand border-brand bg-brand/10 text-brand"
            : "border-border text-muted hover:border-brand hover:text-brand"
        }`}
      >
        {isBest ? "★ best" : "☆ best"}
      </button>
      {failed && (
        <span
          role="alert"
          className="font-glitch text-[10px] uppercase tracking-[0.2em] text-neon-magenta"
        >
          [ sync fail ]
        </span>
      )}
    </div>
  );
}
