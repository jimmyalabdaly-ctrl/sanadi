import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-[12px] bg-warm-200", className)} {...props} />;
}

export { Skeleton };
