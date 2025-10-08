"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { BookOpen, Home, GraduationCap, Library, TrendingUp, Flame, Shield } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useWortlyUser } from "@/contexts/user-context";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

const getNavigationItems = (user?: Doc<"users">) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Word Library",
      url: "/library",
      icon: Library,
    },
    {
      title: "Learn",
      url: "/learn",
      icon: GraduationCap,
    },
    {
      title: "Progress",
      url: "/progress",
      icon: TrendingUp,
    },
  ];

  if (user?.role === "Admin") {
    baseItems.push({
      title: "Admin Dashboard",
      url: "/admin",
      icon: Shield,
    });
  }

  return baseItems;
};

export function AppSidebar() {
  const { user, isLoading } = useWortlyUser();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const navigationItems = getNavigationItems(user);

  const getUserStreakResult = useQuery(api.users.getUserStreak);
  const streakDays = getUserStreakResult.data?.streakDays ?? 0;
  const needsPracticeToday = getUserStreakResult.data?.needsPracticeToday ?? false;

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Wortly</h2>
            {getUserStreakResult.isPending ? (
              <Skeleton className="h-3 w-20" />
            ) : needsPracticeToday && streakDays > 0 ? (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-red-500 cursor-pointer">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>{streakDays} day streak</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Streak at risk!</h4>
                      <p className="text-xs text-muted-foreground">
                        Your {streakDays}-day streak will expire if you don&apos;t practice today.
                      </p>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/learn">Practice now!</Link>
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="h-3 w-3 text-orange-500" />
                <span>{streakDays} day streak</span>
              </div>
            )}
          </div>
          {state === "expanded" && !isMobile && <SidebarTrigger className="ml-auto" />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.url}
                        onClick={() => {
                          // Close mobile sidebar after navigation
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {isLoading || !user ? (
          <div className="flex items-center gap-3 px-2 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <button
            className="flex items-center gap-3 px-2 py-3 w-full text-left hover:bg-sidebar-accent rounded-lg transition-colors"
            onClick={e => {
              // Don't trigger if clicking on the UserButton itself
              if ((e.target as HTMLElement).closest(".cl-userButtonTrigger")) return;

              const userButton = document.querySelector(".cl-userButtonTrigger") as HTMLElement;
              if (userButton) {
                userButton.click();
              }
            }}
          >
            <UserButton
              appearance={{
                elements: {
                  userButtonPopoverCard: {
                    pointerEvents: "initial",
                  },
                  userButtonPopoverFooter: {
                    display: "none",
                  },
                },
              }}
            />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-[150px]">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
            </div>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
