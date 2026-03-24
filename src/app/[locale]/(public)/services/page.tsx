"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Droplets, Zap, Paintbrush, Wind, Sparkles, Hammer,
  Grid3X3, Umbrella, Truck, TreePine, Square, Wifi,
  ChevronRight, ChevronLeft, Wrench,
} from "lucide-react";

const serviceIcons: Record<string, React.ElementType> = {
  plumbing: Droplets, electrical: Zap, painting: Paintbrush, "ac-repair": Wind,
  cleaning: Sparkles, carpentry: Hammer, tiling: Grid3X3, waterproofing: Umbrella,
  moving: Truck, gardening: TreePine, aluminum: Square, satellite: Wifi,
};

const serviceColors = [
  "bg-blue-50 text-blue-600", "bg-yellow-50 text-yellow-600", "bg-orange-50 text-orange-600",
  "bg-cyan-50 text-cyan-600", "bg-pink-50 text-pink-600", "bg-amber-50 text-amber-700",
  "bg-indigo-50 text-indigo-600", "bg-teal-50 text-teal-600", "bg-violet-50 text-violet-600",
  "bg-green-50 text-green-600", "bg-slate-50 text-slate-600", "bg-sky-50 text-sky-600",
];

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  averagePriceMin: number | null;
  averagePriceMax: number | null;
  _count: { providerServices: number };
}

function ServiceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-[14px] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServicesPage() {
  const t = useTranslations("services");
  const { locale, isRtl } = useLocale();
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCategories(data.categories ?? []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-warm-900 mb-3">{t("title")}</h1>
        <p className="text-warm-500 max-w-xl mx-auto">{t("subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : categories.map((category, i) => {
              const Icon = serviceIcons[category.slug] || Wrench;
              const color = serviceColors[i % serviceColors.length];
              const displayName = locale === "ar" ? category.nameAr : category.name;
              const providerCount = category._count.providerServices;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/${locale}/services/${category.slug}`}>
                    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-[14px] ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-warm-900 mb-0.5">
                            {displayName}
                          </h3>
                          {category.averagePriceMin != null && category.averagePriceMax != null ? (
                            <p className="text-sm text-warm-500 mb-1">
                              {category.averagePriceMin} - {category.averagePriceMax} {locale === "ar" ? "د.ا" : "JOD"}
                            </p>
                          ) : (
                            <p className="text-sm text-warm-500 mb-1">
                              {locale === "ar" ? "يتفاوت السعر" : "Price varies"}
                            </p>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {providerCount} {t("providersAvailable")}
                          </Badge>
                        </div>
                        <ChevronIcon className="h-5 w-5 text-warm-300 group-hover:text-brand-500 transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
