"use client";

import { useCallback, useEffect, useState } from "react";
import { BeanDetailPhoto } from "@/components/BeanDetailPhoto";
import { LogShotForm } from "@/components/LogShotForm";
import { ShotHistory } from "@/components/ShotHistory";
import type { Bean, DialInLog } from "@/lib/types";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-glitch text-xs uppercase tracking-[0.3em] text-brand">
      <span aria-hidden className="h-px w-4 bg-brand" />
      {children}
      <span aria-hidden className="h-px flex-1 bg-border" />
    </h2>
  );
}

export function BeanShotLog({ beanId }: { beanId: string }) {
  // null = still syncing with the API on first mount.
  const [bean, setBean] = useState<Bean | null>(null);
  const [logs, setLogs] = useState<DialInLog[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [beanMissing, setBeanMissing] = useState(false);

  const load = useCallback(async () => {
    setLoadFailed(false);
    setBeanMissing(false);
    try {
      const [beansRes, logsRes] = await Promise.all([
        fetch("/api/beans"),
        fetch(`/api/beans/${beanId}/logs`),
      ]);
      if (!beansRes.ok) throw new Error(String(beansRes.status));
      const { beans } = (await beansRes.json()) as { beans: Bean[] };
      const match = beans.find((b) => b.id === beanId);
      if (!match) {
        setBeanMissing(true);
        return;
      }
      setBean(match);
      if (!logsRes.ok) throw new Error(String(logsRes.status));
      const { logs: rows } = (await logsRes.json()) as { logs: DialInLog[] };
      setLogs(rows);
    } catch {
      setLoadFailed(true);
    }
  }, [beanId]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleLogged(log: DialInLog) {
    // ShotHistory orders by logged_at, so position here doesn't matter.
    setLogs((prev) => [log, ...(prev ?? [])]);
  }

  function handleBestToggled(updated: DialInLog) {
    // The PATCH route clears every sibling flag before setting the target;
    // mirror that here so at most one entry stays flagged without a refetch.
    setLogs((prev) =>
      (prev ?? []).map((l) => (l.id === updated.id ? updated : { ...l, is_best: false })),
    );
  }

  if (beanMissing) {
    return (
      <div className="mt-8 border border-dashed border-neon-magenta/60 px-4 py-10 text-center">
        <p className="font-glitch text-sm uppercase tracking-[0.25em] text-neon-magenta">
          [ bean not on file ]
        </p>
        <a
          href="/"
          className="mt-4 inline-block min-h-12 border border-border px-6 py-3 font-glitch text-xs uppercase tracking-widest text-foreground transition hover:border-brand hover:text-brand"
        >
          Back to catalogue
        </a>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="mt-8 border border-dashed border-neon-magenta/60 px-4 py-10 text-center">
        <p className="font-glitch text-sm uppercase tracking-[0.25em] text-neon-magenta">
          [ log offline ]
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 min-h-12 border border-border px-6 font-glitch text-xs uppercase tracking-widest text-foreground transition hover:border-brand hover:text-brand"
        >
          Retry sync
        </button>
      </div>
    );
  }

  if (bean === null || logs === null) {
    return (
      <p className="mt-8 border border-dashed border-border px-4 py-10 text-center font-glitch text-sm uppercase tracking-[0.25em] text-muted">
        [ syncing… ]
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-10">
      <header>
        <div className="mb-5">
          <BeanDetailPhoto bean={bean} />
        </div>
        <p className="font-glitch text-[11px] uppercase tracking-[0.25em] text-neon-cyan">
          {bean.brand}
        </p>
        <h1 className="mt-1 text-3xl text-foreground sm:text-4xl">
          <span aria-hidden className="text-brand">
            [&nbsp;
          </span>
          {bean.bean_type}
          <span aria-hidden className="text-brand">
            &nbsp;]
          </span>
        </h1>
      </header>

      <section aria-label="Log shot" className="space-y-4">
        <SectionLabel>Log shot</SectionLabel>
        <LogShotForm beanId={beanId} onLogged={handleLogged} />
      </section>

      <section aria-label="Shot history" className="space-y-4">
        <SectionLabel>
          Shot history{" "}
          <span className="text-neon-cyan">
            {String(logs.length).padStart(2, "0")}
          </span>
        </SectionLabel>
        <ShotHistory logs={logs} onBestToggled={handleBestToggled} />
      </section>
    </div>
  );
}
