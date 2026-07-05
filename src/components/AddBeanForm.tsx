"use client";

import { useState, type FormEvent } from "react";
import type { Bean } from "@/lib/types";

const FIELD_LABELS = {
  brand: "Brand",
  bean_type: "Bean type",
} as const;

const INPUT_CLASS =
  "mt-1 w-full border border-border bg-bg px-3 py-3 text-base text-foreground " +
  "placeholder:text-muted/60 focus:border-brand focus:outline-none";

const LABEL_CLASS =
  "block font-glitch text-[11px] uppercase tracking-[0.25em] text-neon-cyan";

export function AddBeanForm({ onAdded }: { onAdded: (bean: Bean) => void }) {
  const [brand, setBrand] = useState("");
  const [beanType, setBeanType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = {
      brand: brand.trim(),
      bean_type: beanType.trim(),
    };
    const missing = (Object.keys(values) as (keyof typeof values)[]).filter(
      (f) => values[f] === "",
    );
    if (missing.length > 0) {
      setError(
        `required: ${missing.map((f) => FIELD_LABELS[f]).join(" / ")}`,
      );
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/beans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "upload failed — retry");
        return;
      }
      const { bean } = (await res.json()) as { bean: Bean };
      onAdded(bean);
      setBrand("");
      setBeanType("");
    } catch {
      setError("link down — retry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bean-brand" className={LABEL_CLASS}>
            Brand
          </label>
          <input
            id="bean-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Single O"
            autoComplete="off"
            aria-required
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="bean-type" className={LABEL_CLASS}>
            Bean type
          </label>
          <input
            id="bean-type"
            value={beanType}
            onChange={(e) => setBeanType(e.target.value)}
            placeholder="Reservoir"
            autoComplete="off"
            aria-required
            className={INPUT_CLASS}
          />
        </div>
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
        {busy ? "Uploading…" : "[ Add bean ]"}
      </button>
    </form>
  );
}
