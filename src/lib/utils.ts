import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Central utility for safely composing Tailwind class strings.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

