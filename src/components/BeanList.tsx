"use client";

import { BeanCard } from "@/components/BeanCard";
import type { Bean } from "@/lib/types";

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
        <BeanCard key={bean.id} bean={bean} onDelete={onDelete} />
      ))}
    </ul>
  );
}
