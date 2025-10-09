import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        clickable:
          "group/card relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer",
        spotlight:
          "relative overflow-hidden bg-background/90 supports-[backdrop-filter]:backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-primary/12 before:via-transparent before:to-transparent before:content-['']",
        toolbar:
          "py-3 px-3 sm:px-4 gap-4 md:gap-6 md:flex-row md:items-center bg-background/50 backdrop-blur-md [&[data-slot=card-content]]:px-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

function Card({ className, children, variant, ...props }: CardProps) {
  const isClickable = variant === "clickable";

  return (
    <div data-slot="card" className={cn(cardVariants({ variant, className }))} {...props}>
      {isClickable && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100"
          aria-hidden
        >
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        </div>
      )}
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
