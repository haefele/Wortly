"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  const { state, isMobile } = useSidebar();

  return (
    <header className="flex h-16 items-center gap-4 border-b px-4">
      {(state === "collapsed" || isMobile) && <SidebarTrigger />}

      <div className="flex flex-1 items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
