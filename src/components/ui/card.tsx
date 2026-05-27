"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-foreground/10 bg-background text-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
};

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return <div className={cn("p-4 pb-2", className)} {...props} />;
};

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return <h3 className={cn("text-base font-semibold", className)} {...props} />;
};

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CardContent = ({ className, ...props }: CardContentProps) => {
  return <div className={cn("p-4 pt-2", className)} {...props} />;
};

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const CardFooter = ({ className, ...props }: CardFooterProps) => {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
};

