"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
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

const ERROR_CLASS =
  "animate-glitch border border-neon-magenta/60 bg-neon-magenta/10 px-3 py-2 font-mono text-xs uppercase tracking-wider text-neon-magenta";

type PhotoStatus = "idle" | "uploading" | "ready" | "error";

export function AddBeanForm({ onAdded }: { onAdded: (bean: Bean) => void }) {
  const [brand, setBrand] = useState("");
  const [beanType, setBeanType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function clearPhoto() {
    setPhotoUrl(null);
    setPhotoStatus("idle");
    setPhotoError(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrl(null);
    setPhotoError(null);
    setPhotoStatus("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPhotoError(data?.error ?? "photo upload failed — retry");
        setPhotoStatus("error");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      setPhotoUrl(url);
      setPhotoStatus("ready");
    } catch {
      setPhotoError("link down — photo not uploaded");
      setPhotoStatus("error");
    }
  }

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
    if (photoStatus === "uploading") {
      setError("photo upload in progress — hold");
      return;
    }
    if (photoStatus === "error") {
      setError("photo upload failed — retry or clear it");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/beans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          photoUrl === null ? values : { ...values, photo_url: photoUrl },
        ),
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
      clearPhoto();
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

      <div>
        <label htmlFor="bean-photo" className={LABEL_CLASS}>
          Photo
        </label>
        <input
          ref={photoInputRef}
          id="bean-photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="mt-1 w-full border border-border bg-bg px-3 py-3 text-xs text-muted file:mr-3 file:border file:border-neon-cyan/60 file:bg-transparent file:px-3 file:py-1.5 file:font-glitch file:text-[11px] file:uppercase file:tracking-[0.2em] file:text-neon-cyan"
        />
        {photoStatus === "uploading" && (
          <p
            role="status"
            className="mt-2 font-mono text-xs uppercase tracking-wider text-neon-cyan"
          >
            ▲ Uploading photo…
          </p>
        )}
        {photoUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={photoUrl}
              alt="Bean photo preview"
              className="h-16 w-16 border border-neon-cyan/60 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="min-h-10 border border-border px-3 font-glitch text-[11px] uppercase tracking-[0.2em] text-muted transition hover:border-neon-magenta hover:text-neon-magenta"
            >
              [ Clear ]
            </button>
          </div>
        )}
        {photoError && (
          <p role="alert" className={`mt-2 ${ERROR_CLASS}`}>
            ⚠ {photoError}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          ⚠ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || photoStatus === "uploading"}
        className="min-h-12 w-full border border-brand bg-brand px-4 font-glitch text-sm uppercase tracking-[0.25em] text-brand-foreground transition hover:bg-brand-strong disabled:opacity-60"
      >
        {busy ? "Uploading…" : "[ Add bean ]"}
      </button>
    </form>
  );
}
