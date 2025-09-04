"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { 
  BookOpen, 
  Home, 
  GraduationCap, 
  Library, 
  TrendingUp,
  Flame
} from "lucide-react"
import Link from "next/link"
import { useUser, UserButton } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Learn",
    url: "/learn",
    icon: GraduationCap,
  },
  {
    title: "Practice",
    url: "/practice",
    icon: BookOpen,
  },
  {
    title: "Word Library",
    url: "/library",
    icon: Library,
  },
  {
    title: "Progress",
    url: "/progress",
    icon: TrendingUp,
  }
];

export function AppSidebar() {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()

  const streakDays = 5 // This would come from your database/state

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Wortly</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              <span>{streakDays} day streak</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!isLoaded || !user ? (
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
            onClick={(e) => {
              // Don't trigger if clicking on the UserButton itself
              if ((e.target as HTMLElement).closest('.cl-userButtonTrigger')) return;
              
              const userButton = document.querySelector('.cl-userButtonTrigger') as HTMLElement;
              if (userButton)
                userButton.click();
            }}
          >
            <UserButton appearance={{ 
              elements: { 
                userButtonPopoverCard: { 
                  pointerEvents: "initial" 
                },
              }
            }} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-[150px]">
                {user.fullName || user.username || "User"}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {user.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </button>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}