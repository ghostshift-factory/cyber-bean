"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Start/stop shot stopwatch. Reports elapsed whole seconds to `onStop` —
 * wiring that value into the log-shot form is the caller's job.
 */
export function ShotTimer({ onStop }: { onStop: (elapsedSeconds: number) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  /* Wall-clock start of the current run; elapsed is derived from it so the
     readout never drifts even if interval ticks are delayed. */
  const startedAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  function handleTap() {
    if (running) {
      const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(seconds);
      setRunning(false);
      onStop(seconds);
    } else {
      startedAt.current = Date.now();
      setElapsed(0);
      setRunning(true);
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 border bg-surface px-4 py-3 transition ${
        running ? "border-brand glow-brand" : "border-border"
      }`}
    >
      <div>
        <span className="block font-glitch text-[11px] uppercase tracking-[0.25em] text-neon-cyan">
          Shot timer
        </span>
        <p className="mt-1 font-glitch text-4xl leading-none">
          <span
            role="timer"
            aria-label="elapsed shot time"
            /* Remount on start/stop so the glitch flicker replays on each state change. */
            key={running ? "run" : "hold"}
            className={`animate-glitch tabular-nums ${
              running ? "text-brand" : "text-foreground"
            }`}
          >
            {String(elapsed).padStart(2, "0")}
          </span>
          <span className="ml-1 text-sm uppercase tracking-widest text-muted">s</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleTap}
        className={`min-h-14 min-w-32 border px-4 font-glitch text-sm uppercase tracking-[0.25em] transition ${
          running
            ? "border-neon-magenta bg-neon-magenta/15 text-neon-magenta hover:bg-neon-magenta/25"
            : "border-brand bg-brand text-brand-foreground hover:bg-brand-strong"
        }`}
      >
        {running ? "[ Stop ]" : "[ Start ]"}
      </button>
    </div>
  );
}
