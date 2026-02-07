import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelHeaderProps {
  title: string;
  right?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, right, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2",
        className,
      )}
    >
      <span className="text-xs font-medium tracking-wider text-ctp-subtext0 uppercase">{title}</span>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
