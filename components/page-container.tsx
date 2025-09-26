"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

type PageContainerProps =
  | {
      isLoading: true;
      icon?: LucideIcon;
      title?: never;
      description?: never;
      headerActions?: never;
      children: ReactNode;
    }
  | {
      isLoading?: never;
      icon?: LucideIcon;
      title: string;
      description?: string;
      headerActions?: ReactNode;
      children: ReactNode;
    };

export function PageContainer({
  title,
  description,
  icon: Icon,
  headerActions,
  children,
  isLoading = undefined,
}: PageContainerProps) {
  const { state, isMobile } = useSidebar();

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col">
      <header className="flex h-16 items-center gap-4 border-b px-4">
        {(state === "collapsed" || isMobile) && <SidebarTrigger />}

        <div className="flex flex-1 items-center gap-3">
          {isLoading ? (
            <>
              {Icon ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <Skeleton className="h-9 w-9 rounded-lg" />
              )}
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </>
          ) : (
            <>
              {Icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold">{title}</h1>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>
            </>
          )}
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
