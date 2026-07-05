"use client";

import { useState, type FormEvent } from "react";
import type { DialInLog } from "@/lib/types";

/* Sage/Breville portafilter baskets. */
const BASKET_TYPES = ["single", "double", "pressurised"] as const;

const INPUT_CLASS =
  "mt-1 w-full border border-border bg-bg px-3 py-3 text-base text-foreground " +
  "placeholder:text-muted/60 focus:border-brand focus:outline-none";

const LABEL_CLASS =
  "block font-glitch text-[11px] uppercase tracking-[0.25em] text-neon-cyan";

/** Local "now" in datetime-local format — shots are logged mid-brew. */
function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function LogShotForm({
  beanId,
  onLogged,
}: {
  beanId: string;
  onLogged: (log: DialInLog) => void;
}) {
  const [grind, setGrind] = useState("");
  const [seconds, setSeconds] = useState("");
  const [basket, setBasket] = useState("");
  const [loggedAt, setLoggedAt] = useState(nowLocal);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const grindNum = Number(grind);
    const secondsNum = Number(seconds);

    const missing: string[] = [];
    if (grind.trim() === "" || !Number.isFinite(grindNum)) missing.push("Grind");
    if (seconds.trim() === "" || !Number.isFinite(secondsNum)) missing.push("Time");
    if (basket === "") missing.push("Basket");
    if (loggedAt === "" || Number.isNaN(Date.parse(loggedAt))) missing.push("Shot date");
    if (missing.length > 0) {
      setError(`required: ${missing.join(" / ")}`);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/beans/${beanId}/logs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grind_size: grindNum,
          extraction_seconds: secondsNum,
          basket_type: basket,
          logged_at: new Date(loggedAt).toISOString(),
          ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "upload failed — retry");
        return;
      }
      const { log } = (await res.json()) as { log: DialInLog };
      onLogged(log);
      // Keep the basket — it rarely changes between pulls; re-stamp "now".
      setGrind("");
      setSeconds("");
      setNotes("");
      setLoggedAt(nowLocal());
    } catch {
      setError("link down — retry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="shot-grind" className={LABEL_CLASS}>
            Grind
          </label>
          <input
            id="shot-grind"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={grind}
            onChange={(e) => setGrind(e.target.value)}
            placeholder="16"
            autoComplete="off"
            aria-required
            className={`${INPUT_CLASS} font-glitch text-2xl`}
          />
        </div>
        <div>
          <label htmlFor="shot-seconds" className={LABEL_CLASS}>
            Time · s
          </label>
          <input
            id="shot-seconds"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            placeholder="30"
            autoComplete="off"
            aria-required
            className={`${INPUT_CLASS} font-glitch text-2xl`}
          />
        </div>
      </div>

      <fieldset>
        <legend className={LABEL_CLASS}>Basket</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {BASKET_TYPES.map((type) => (
            <label key={type}>
              <input
                type="radio"
                name="basket_type"
                value={type}
                checked={basket === type}
                onChange={() => setBasket(type)}
                className="peer sr-only"
              />
              <span className="block cursor-pointer border border-border px-2 py-3 text-center font-glitch text-xs uppercase tracking-widest text-muted transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:border-neon-cyan">
                {type}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="shot-logged-at" className={LABEL_CLASS}>
          Shot date
        </label>
        <input
          id="shot-logged-at"
          type="datetime-local"
          value={loggedAt}
          onChange={(e) => setLoggedAt(e.target.value)}
          aria-required
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="shot-notes" className={LABEL_CLASS}>
          Notes
        </label>
        <textarea
          id="shot-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="too sour — grind finer"
          rows={2}
          className={INPUT_CLASS}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="animate-glitch border border-neon-magenta/60 bg-neon-magenta/10 px-3 py-2 font-mono text-xs uppercase tracking-wider text-neon-magenta"
        >
          ⚠ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full border border-brand bg-brand px-4 font-glitch text-sm uppercase tracking-[0.25em] text-brand-foreground transition hover:bg-brand-strong disabled:opacity-60"
      >
        {busy ? "Uploading…" : "[ Log shot ]"}
      </button>
    </form>
  );
}
