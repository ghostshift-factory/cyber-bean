"use client";

import { useEffect, useState } from "react";
import type { Bean } from "@/lib/types";

/* Angular panel: hard corner cut top-right, Night City data-plate style. */
const PANEL_CLIP =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]";

export function BeanList({
  beans,
  onDelete,
}: {
  beans: Bean[];
  onDelete: (id: string) => void;
}) {
  if (beans.length === 0) {
    return (
      <div className="border border-dashed border-border px-4 py-12 text-center">
        <p className="font-glitch text-sm uppercase tracking-[0.25em] text-muted">
          [ no beans on file ]
        </p>
        <p className="mt-2 text-sm text-muted">Register a bean to start dialling in.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {beans.map((bean) => (
        <BeanItem key={bean.id} bean={bean} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function BeanItem({
  bean,
  onDelete,
}: {
  bean: Bean;
  onDelete: (id: string) => void;
}) {
  const [armed, setArmed] = useState(false);

  // Armed delete stands down if the confirming tap never comes.
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <li
      className={`animate-glitch relative border border-border bg-surface p-4 ${PANEL_CLIP}`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand" />
      <div className="flex items-center justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate font-glitch text-[11px] uppercase tracking-[0.25em] text-neon-cyan">
            {bean.brand}
          </p>
          <h3 className="mt-0.5 truncate text-lg text-foreground">
            {/* Whole title is the tap target into the shot log — big-tap, mid-brew. */}
            <a
              href={`/beans/${bean.id}`}
              className="transition hover:text-brand focus-visible:text-brand"
            >
              {bean.bean_type}
              <span aria-hidden className="ml-2 font-glitch text-xs text-brand">
                &gt;&gt;
              </span>
            </a>
          </h3>
        </div>
        {armed ? (
          <button
            type="button"
            aria-label={`Confirm delete ${bean.brand} ${bean.bean_type}`}
            onClick={() => onDelete(bean.id)}
            className="animate-glitch min-h-12 shrink-0 border border-neon-magenta bg-neon-magenta px-4 font-glitch text-xs uppercase tracking-widest text-bg"
          >
            Sure?
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Delete ${bean.brand} ${bean.bean_type}`}
            onClick={() => setArmed(true)}
            className="min-h-12 shrink-0 border border-border px-4 font-glitch text-xs uppercase tracking-widest text-muted transition hover:border-neon-magenta hover:text-neon-magenta"
          >
            Del
          </button>
        )}
      </div>
    </li>
  );
}
