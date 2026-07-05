const FEATURES = [
  { icon: "⚡", title: "Fast by default", body: "A design system, not a blank page — replace the copy, keep the bones." },
  { icon: "✦", title: "Themed light & dark", body: "Semantic tokens in globals.css flip automatically with the OS theme." },
  { icon: "◆", title: "Yours to shape", body: "Swap the palette and brand voice from the dossier; the whole UI follows." },
];

export default function Home() {
  return (
    <main className="min-h-dvh">
      <section className="relative overflow-hidden">
        {/* soft brand wash behind the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand/15 via-transparent to-transparent"
        />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
            <span className="size-2 rounded-full bg-accent" />
            Now in early access
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            cyber-bean
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">
            A starting point with real design bones. Replace this copy as tickets land —
            keep the system.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href="#features"
              className="rounded-xl bg-brand px-5 py-3 font-medium text-brand-foreground shadow-sm transition hover:bg-brand-strong"
            >
              Get started
            </a>
            <a
              href="#features"
              className="rounded-xl border border-border px-5 py-3 font-medium transition hover:bg-surface"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-6 pb-28">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-brand/10 text-lg text-brand">
                {f.icon}
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
