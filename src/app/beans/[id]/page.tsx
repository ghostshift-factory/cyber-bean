import { BeanShotLog } from "@/components/BeanShotLog";

export default async function BeanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-20 pt-10 sm:pt-14">
      <nav className="mb-6">
        <a
          href="/"
          className="font-glitch text-[11px] uppercase tracking-[0.25em] text-muted transition hover:text-brand"
        >
          &lt;&lt; catalogue
        </a>
      </nav>
      <BeanShotLog beanId={id} />
    </main>
  );
}
