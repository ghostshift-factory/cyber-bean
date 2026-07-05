"use client";

import { useCallback, useEffect, useState } from "react";
import { AddBeanForm } from "@/components/AddBeanForm";
import { BeanList } from "@/components/BeanList";
import type { Bean } from "@/lib/types";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-glitch text-xs uppercase tracking-[0.3em] text-brand">
      <span aria-hidden className="h-px w-4 bg-brand" />
      {children}
      <span aria-hidden className="h-px flex-1 bg-border" />
    </h2>
  );
}

export function BeanCatalogue() {
  // null = still syncing with the API on first mount.
  const [beans, setBeans] = useState<Bean[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      const res = await fetch("/api/beans");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { beans: Bean[] };
      setBeans(data.beans);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleAdded(bean: Bean) {
    setStatus(null);
    setBeans((prev) => [bean, ...(prev ?? [])]);
  }

  async function handleDelete(id: string) {
    setStatus(null);
    const res = await fetch(`/api/beans/${id}`, { method: "DELETE" }).catch(
      () => null,
    );
    // 404 = already gone server-side; drop it from the list either way.
    if (res && (res.ok || res.status === 404)) {
      setBeans((prev) => (prev ?? []).filter((b) => b.id !== id));
    } else {
      setStatus("delete failed — retry");
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <section aria-label="Register bean" className="space-y-4">
        <SectionLabel>Register bean</SectionLabel>
        <AddBeanForm onAdded={handleAdded} />
      </section>

      <section aria-label="Bean catalogue" className="space-y-4">
        <SectionLabel>
          On file{" "}
          <span className="text-neon-cyan">
            {beans === null ? "--" : String(beans.length).padStart(2, "0")}
          </span>
        </SectionLabel>

        {status && (
          <p
            role="alert"
            className="animate-glitch border border-neon-magenta/60 bg-neon-magenta/10 px-3 py-2 font-mono text-xs uppercase tracking-wider text-neon-magenta"
          >
            ⚠ {status}
          </p>
        )}

        {loadFailed ? (
          <div className="border border-dashed border-neon-magenta/60 px-4 py-10 text-center">
            <p className="font-glitch text-sm uppercase tracking-[0.25em] text-neon-magenta">
              [ catalogue offline ]
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 min-h-12 border border-border px-6 font-glitch text-xs uppercase tracking-widest text-foreground transition hover:border-brand hover:text-brand"
            >
              Retry sync
            </button>
          </div>
        ) : beans === null ? (
          <p className="border border-dashed border-border px-4 py-10 text-center font-glitch text-sm uppercase tracking-[0.25em] text-muted">
            [ syncing… ]
          </p>
        ) : (
          <BeanList beans={beans} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
