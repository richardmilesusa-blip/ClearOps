import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300 dark:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 bg-slate-100 text-slate-950 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-950 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        destructive:
          "border-red-500/50 bg-red-500/10 text-red-900 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-50",
        outline: "text-slate-950 border-slate-200 dark:text-slate-50 dark:border-slate-800",
        success:
          "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }