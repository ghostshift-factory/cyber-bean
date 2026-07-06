"use client";

import { useEffect, useState } from "react";
import type { Bean } from "@/lib/types";

/* Angular panel: hard corner cut top-right, Night City data-plate style. */
const PANEL_CLIP =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]";

/* Icon plate gets a smaller cut so the frame reads at 48px. */
const ICON_CLIP =
  "[clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)]";

/** One bean as an angular data-plate card: photo (or bean glyph), id line, armed delete. */
export function BeanCard({
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
        <BeanIcon bean={bean} />
        <div className="min-w-0 flex-1">
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

/** 48px identity plate: the bean's photo when on file, otherwise a neon bean glyph. */
function BeanIcon({ bean }: { bean: Bean }) {
  if (bean.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user uploads under /uploads, sizes unknown
      <img
        src={bean.photo_url}
        alt={`${bean.brand} ${bean.bean_type} photo`}
        className={`size-12 shrink-0 border border-border object-cover ${ICON_CLIP}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex size-12 shrink-0 items-center justify-center border border-border text-brand ${ICON_CLIP}`}
    >
      <svg
        data-testid="bean-icon-default"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-6"
      >
        {/* Coffee bean: tilted ellipse with a centre crease. */}
        <ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(30 12 12)" />
        <path d="M8.5 5.5c3.5 3 3.5 10 7 13" />
      </svg>
    </span>
  );
}
