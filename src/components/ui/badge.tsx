"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-foreground/20 bg-background text-foreground",
        secondary: "border-foreground/10 bg-foreground/5 text-foreground",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        danger: "border-red-500/20 bg-red-500/10 text-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
};

