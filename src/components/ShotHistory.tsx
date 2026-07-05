import { BestShotToggle } from "@/components/BestShotToggle";
import type { DialInLog } from "@/lib/types";

/* Angular panel: hard corner cut top-right, Night City data-plate style. */
const PANEL_CLIP =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]";

/** Terse local HUD stamp: 2026-07-04 07:30. */
function formatShotDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function ShotHistory({
  logs,
  onBestToggled = () => {},
}: {
  logs: DialInLog[];
  onBestToggled?: (log: DialInLog) => void;
}) {
  if (logs.length === 0) {
    return (
      <div className="border border-dashed border-border px-4 py-12 text-center">
        <p className="font-glitch text-sm uppercase tracking-[0.25em] text-muted">
          [ no shots logged ]
        </p>
        <p className="mt-2 text-sm text-muted">
          Pull a shot and log it to start dialling in.
        </p>
      </div>
    );
  }

  // Newest shot first, whatever order the caller hands us.
  const ordered = [...logs].sort(
    (a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at),
  );
  // The flagged reference is pinned above the list and never repeated in it.
  // Rendering only the first flagged row keeps the one-best invariant on
  // screen even if the data ever carried a duplicate flag.
  const best = ordered.find((l) => l.is_best);
  const rest = best ? ordered.filter((l) => l.id !== best.id) : ordered;

  return (
    <div className="space-y-5">
      {best && (
        <section aria-label="Best dial-in" className="space-y-2">
          <p className="flex items-center gap-2 font-glitch text-[10px] uppercase tracking-[0.3em] text-brand">
            <span aria-hidden>▶</span>
            best dial-in
            <span aria-hidden className="h-px flex-1 bg-brand/40" />
          </p>
          <ul>
            <ShotItem log={best} isBest onToggled={onBestToggled} />
          </ul>
        </section>
      )}
      {rest.length > 0 && (
        <ul className="space-y-3">
          {rest.map((log) => (
            <ShotItem key={log.id} log={log} isBest={false} onToggled={onBestToggled} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ShotItem({
  log,
  isBest,
  onToggled,
}: {
  log: DialInLog;
  isBest: boolean;
  onToggled: (log: DialInLog) => void;
}) {
  return (
    <li
      className={`animate-glitch relative border bg-surface p-4 ${PANEL_CLIP} ${
        isBest ? "best-shot glow-brand border-brand/70" : "border-border"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-0.5 ${isBest ? "bg-brand" : "bg-neon-cyan"}`}
      />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-3">
          {/* Headline readout: the two numbers you re-dial from, glanceable mid-brew. */}
          <dl data-readout className="flex gap-6">
            <div>
              <dt className="font-glitch text-[10px] uppercase tracking-[0.3em] text-muted">
                Grind
              </dt>
              <dd className="mt-0.5 font-glitch text-3xl leading-none text-brand">
                {log.grind_size}
              </dd>
            </div>
            <div>
              <dt className="font-glitch text-[10px] uppercase tracking-[0.3em] text-muted">
                Time
              </dt>
              <dd className="mt-0.5 font-glitch text-3xl leading-none text-brand">
                {log.extraction_seconds}
                <span className="ml-0.5 text-sm text-muted">s</span>
              </dd>
            </div>
          </dl>
          <BestShotToggle log={log} isBest={isBest} onToggled={onToggled} />
        </div>

        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase text-muted">
          <span className="text-neon-cyan">{log.basket_type}</span>
          <time dateTime={log.logged_at}>{formatShotDate(log.logged_at)}</time>
        </p>

        {log.notes && (
          <p className="mt-2 border-t border-border/60 pt-2 text-sm text-foreground">
            {log.notes}
          </p>
        )}
      </div>
    </li>
  );
}
