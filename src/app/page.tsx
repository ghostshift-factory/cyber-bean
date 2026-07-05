import { BeanCatalogue } from "@/components/BeanCatalogue";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-20 pt-10 sm:pt-14">
      <header>
        <p className="font-glitch text-[11px] uppercase tracking-[0.35em] text-neon-cyan">
          cyber-bean // dial-in logbook
        </p>
        <h1 className="mt-2 text-3xl text-foreground sm:text-4xl">
          <span aria-hidden className="text-brand">
            [&nbsp;
          </span>
          Bean catalogue
          <span aria-hidden className="text-brand">
            &nbsp;]
          </span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted text-balance">
          Beans on file. Register a bag, then dial it in shot by shot.
        </p>
      </header>

      <BeanCatalogue />
    </main>
  );
}
