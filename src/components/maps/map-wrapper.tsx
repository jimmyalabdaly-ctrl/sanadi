"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapProvider } from "./provider-map";

const ProviderMap = dynamic(() => import("./provider-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-[12px]" />,
});

interface MapWrapperProps {
  providers: MapProvider[];
  locale?: string;
  className?: string;
}

export function MapWrapper({ providers, locale = "en", className }: MapWrapperProps) {
  return (
    <div className={className ?? "h-96 w-full"}>
      <ProviderMap providers={providers} locale={locale} />
    </div>
  );
}
