"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export const Table = ({ className, ...props }: TableProps) => (
  <div className="w-full overflow-auto">
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
);

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = ({
  className,
  ...props
}: TableHeaderProps) => (
  <thead className={cn("[&_tr]:border-foreground/10", className)} {...props} />
);

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = ({
  className,
  ...props
}: TableBodyProps) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export const TableRow = ({ className, ...props }: TableRowProps) => (
  <tr
    className={cn(
      "border-b border-foreground/10 transition-colors hover:bg-foreground/5 data-[state=selected]:bg-foreground/10",
      className,
    )}
    {...props}
  />
);

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export const TableHead = ({ className, ...props }: TableHeadProps) => (
  <th
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
);

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = ({ className, ...props }: TableCellProps) => (
  <td
    className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
);

