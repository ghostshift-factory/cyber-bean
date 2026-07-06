import type { Bean } from "@/lib/types";

/* Angular panel: hard corner cut top-right, matching the BeanCard data-plate. */
const PANEL_CLIP =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]";

/** Full-width bean photo panel for the detail page; a styled placeholder holds
 *  the same space when no photo is on file. */
export function BeanDetailPhoto({ bean }: { bean: Bean }) {
  if (bean.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user uploads under /uploads, sizes unknown
      <img
        src={bean.photo_url}
        alt={`${bean.brand} ${bean.bean_type} photo`}
        className={`aspect-[16/9] w-full border border-border object-cover ${PANEL_CLIP}`}
      />
    );
  }
  return (
    <div
      data-testid="bean-photo-placeholder"
      className={`flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 border border-dashed border-border bg-surface ${PANEL_CLIP}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-10 text-brand"
      >
        {/* Coffee bean: tilted ellipse with a centre crease. */}
        <ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(30 12 12)" />
        <path d="M8.5 5.5c3.5 3 3.5 10 7 13" />
      </svg>
      <p className="font-glitch text-[11px] uppercase tracking-[0.25em] text-muted">
        [ no photo on file ]
      </p>
    </div>
  );
}
