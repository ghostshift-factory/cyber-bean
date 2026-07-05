"use client";

import { useState, type FormEvent } from "react";
import { ShotTimer } from "@/components/ShotTimer";
import type { DialInLog } from "@/lib/types";

/* Sage/Breville portafilter baskets. */
const BASKET_TYPES = ["single", "double", "pressurised"] as const;

const RATINGS = [1, 2, 3, 4, 5] as const;

/* Matches the taste_balance values the API stores. */
const BALANCES = ["too-sour", "balanced", "too-bitter"] as const;

const INPUT_CLASS =
  "mt-1 w-full border border-border bg-bg px-3 py-3 text-base text-foreground " +
  "placeholder:text-muted/60 focus:border-brand focus:outline-none";

const LABEL_CLASS =
  "block font-glitch text-[11px] uppercase tracking-[0.25em] text-neon-cyan";

const CHIP_CLASS =
  "block cursor-pointer border border-border px-2 py-3 text-center font-glitch " +
  "text-xs uppercase tracking-widest text-muted transition";

/** Local "now" in datetime-local format — shots are logged mid-brew. */
function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function NumberField({
  id,
  label,
  step,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  step: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-required
        className={`${INPUT_CLASS} font-glitch text-2xl`}
      />
    </div>
  );
}

export function LogShotForm({
  beanId,
  onLogged,
}: {
  beanId: string;
  onLogged: (log: DialInLog) => void;
}) {
  const [grind, setGrind] = useState("");
  const [dose, setDose] = useState("");
  const [yieldOut, setYieldOut] = useState("");
  const [seconds, setSeconds] = useState("");
  const [basket, setBasket] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loggedAt, setLoggedAt] = useState(nowLocal);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const grindNum = Number(grind);
    const doseNum = Number(dose);
    const yieldNum = Number(yieldOut);
    const secondsNum = Number(seconds);

    const missing: string[] = [];
    if (grind.trim() === "" || !Number.isFinite(grindNum)) missing.push("Grind");
    if (dose.trim() === "" || !Number.isFinite(doseNum)) missing.push("Dose");
    if (yieldOut.trim() === "" || !Number.isFinite(yieldNum)) missing.push("Yield");
    if (seconds.trim() === "" || !Number.isFinite(secondsNum)) missing.push("Time");
    if (basket === "") missing.push("Basket");
    if (rating === null) missing.push("Rating");
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
          dose_in_g: doseNum,
          yield_out_g: yieldNum,
          extraction_seconds: secondsNum,
          basket_type: basket,
          taste_rating: rating,
          logged_at: new Date(loggedAt).toISOString(),
          ...(balance !== null ? { taste_balance: balance } : {}),
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
      // Keep the basket and dose — they rarely change between pulls; re-stamp "now".
      setGrind("");
      setYieldOut("");
      setSeconds("");
      setRating(null);
      setBalance(null);
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
      {/* Stopping the timer pre-fills Time · s; typing in the field still wins. */}
      <ShotTimer onStop={(elapsed) => setSeconds(String(elapsed))} />

      <div className="grid grid-cols-2 gap-4">
        <NumberField
          id="shot-grind"
          label="Grind"
          step="0.5"
          value={grind}
          placeholder="16"
          onChange={setGrind}
        />
        <NumberField
          id="shot-seconds"
          label="Time · s"
          step="1"
          value={seconds}
          placeholder="30"
          onChange={setSeconds}
        />
        <NumberField
          id="shot-dose"
          label="Dose · g"
          step="0.1"
          value={dose}
          placeholder="18"
          onChange={setDose}
        />
        <NumberField
          id="shot-yield"
          label="Yield · g"
          step="0.1"
          value={yieldOut}
          placeholder="36"
          onChange={setYieldOut}
        />
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
              <span className={`${CHIP_CLASS} peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:border-neon-cyan`}>
                {type}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={LABEL_CLASS}>Rating</legend>
        <div className="mt-1 grid grid-cols-5 gap-2">
          {RATINGS.map((n) => (
            <label key={n}>
              <input
                type="radio"
                name="taste_rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`${CHIP_CLASS} font-glitch text-lg peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:border-neon-cyan`}
              >
                {n}★
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={LABEL_CLASS}>
          Balance <span className="text-muted">· optional</span>
        </legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {BALANCES.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={balance === b}
              onClick={() => setBalance(balance === b ? null : b)}
              className={`${CHIP_CLASS} ${
                balance === b
                  ? "border-neon-cyan bg-neon-cyan/15 text-neon-cyan"
                  : ""
              } focus-visible:border-neon-cyan focus:outline-none`}
            >
              {b}
            </button>
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
