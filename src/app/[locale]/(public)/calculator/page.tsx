"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ArrowLeft, Calculator, Home, Building2,
  Droplets, Zap, Paintbrush, Wind, Sparkles, Hammer,
  Grid3X3, Umbrella, Truck, TreePine, Square, Wifi, Wrench,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  averagePriceMin: number | null;
  averagePriceMax: number | null;
}

type PropertyType = "apartment" | "house";

const serviceIcons: Record<string, React.ElementType> = {
  plumbing: Droplets,
  electrical: Zap,
  painting: Paintbrush,
  "ac-repair": Wind,
  cleaning: Sparkles,
  carpentry: Hammer,
  tiling: Grid3X3,
  waterproofing: Umbrella,
  moving: Truck,
  gardening: TreePine,
  aluminum: Square,
  satellite: Wifi,
};

const serviceColors = [
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-yellow-50 text-yellow-600 border-yellow-100",
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-cyan-50 text-cyan-600 border-cyan-100",
  "bg-pink-50 text-pink-600 border-pink-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-indigo-50 text-indigo-600 border-indigo-100",
  "bg-teal-50 text-teal-600 border-teal-100",
  "bg-violet-50 text-violet-600 border-violet-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-slate-50 text-slate-600 border-slate-100",
  "bg-sky-50 text-sky-600 border-sky-100",
];

const fadeVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const FALLBACK_PRICE_MIN = 15;
const FALLBACK_PRICE_MAX = 50;

function computeEstimate(
  category: ServiceCategory,
  propertyType: PropertyType,
  sizeM2: number,
  rooms: number,
  bathrooms: number
) {
  const baseMin = category.averagePriceMin ?? FALLBACK_PRICE_MIN;
  const baseMax = category.averagePriceMax ?? FALLBACK_PRICE_MAX;

  // Size factor: baseline 80 m²
  const sizeFactor = Math.max(0.5, Math.min(3, sizeM2 / 80));

  // Room factor influences cleaning, painting, tiling, carpentry
  const roomFactorSlugs = ["cleaning", "painting", "tiling", "carpentry"];
  const roomFactor = roomFactorSlugs.includes(category.slug)
    ? Math.max(1, rooms * 0.3 + bathrooms * 0.15)
    : 1;

  // House adds 20% premium vs apartment
  const typeFactor = propertyType === "house" ? 1.2 : 1;

  const multiplier = sizeFactor * roomFactor * typeFactor;

  const estimatedMin = Math.round(baseMin * multiplier);
  const estimatedMax = Math.round(baseMax * multiplier);
  const marketAverage = Math.round((estimatedMin + estimatedMax) / 2);

  return { estimatedMin, estimatedMax, marketAverage, multiplier };
}

export default function CalculatorPage() {
  const { locale, isRtl } = useLocale();
  const isAr = locale === "ar";
  const ArrowNext = isRtl ? ArrowLeft : ArrowRight;
  const ArrowPrev = isRtl ? ArrowRight : ArrowLeft;

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Step 1: category
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Step 2: property
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [sizeM2, setSizeM2] = useState(80);
  const [rooms, setRooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const estimate =
    selectedCategory
      ? computeEstimate(selectedCategory, propertyType, sizeM2, rooms, bathrooms)
      : null;

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch {
      // silent fail
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const barPercent =
    estimate && selectedCategory
      ? Math.min(
          100,
          Math.round(
            ((estimate.estimatedMin + estimate.estimatedMax) /
              2 /
              Math.max(estimate.estimatedMax * 1.5, 1)) *
              100
          )
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-100 mb-4">
            <Calculator className="h-7 w-7 text-brand-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">
            {isAr ? "حاسبة تكلفة الخدمات" : "Service Cost Calculator"}
          </h1>
          <p className="text-warm-500 max-w-xl mx-auto">
            {isAr
              ? "احصل على تقدير سريع لتكلفة خدمات المنزل بناءً على خصائص عقارك"
              : "Get a quick cost estimate for home services based on your property details"}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  s < step
                    ? "bg-green-500 text-white"
                    : s === step
                    ? "bg-brand-500 text-white"
                    : "bg-warm-200 text-warm-500"
                )}
              >
                {s < step ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-0.5 transition-colors",
                    s < step ? "bg-green-500" : "bg-warm-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-medium border-0">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* ---- STEP 1: Select category ---- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-heading font-semibold text-lg text-warm-900 mb-4">
                    {isAr ? "اختر نوع الخدمة" : "Select service type"}
                  </h2>
                  {loadingCategories ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-[12px] bg-warm-100 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categories.map((cat, i) => {
                        const Icon = serviceIcons[cat.slug] || Wrench;
                        const colorClass = serviceColors[i % serviceColors.length];
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={cn(
                              "p-4 rounded-[12px] border-2 text-center transition-all",
                              selectedCategoryId === cat.id
                                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                                : "border-warm-100 hover:border-warm-200 bg-white"
                            )}
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-2",
                                colorClass
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-medium text-warm-800">
                              {isAr ? cat.nameAr : cat.name}
                            </p>
                            {cat.averagePriceMin != null && cat.averagePriceMax != null && (
                              <p className="text-xs text-warm-400 mt-0.5">
                                {cat.averagePriceMin}–{cat.averagePriceMax}{" "}
                                {isAr ? "د.ا" : "JOD"}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ---- STEP 2: Property details ---- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-heading font-semibold text-lg text-warm-900 mb-4">
                    {isAr ? "تفاصيل العقار" : "Property details"}
                  </h2>

                  {/* Property type */}
                  <div className="mb-5">
                    <Label className="mb-2 block">
                      {isAr ? "نوع العقار" : "Property type"}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["apartment", "house"] as PropertyType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setPropertyType(type)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-[12px] border-2 transition-all",
                            propertyType === type
                              ? "border-brand-500 bg-brand-50"
                              : "border-warm-100 hover:border-warm-200 bg-white"
                          )}
                        >
                          {type === "apartment" ? (
                            <Building2 className="h-5 w-5 text-brand-500 shrink-0" />
                          ) : (
                            <Home className="h-5 w-5 text-brand-500 shrink-0" />
                          )}
                          <span className="font-medium text-sm text-warm-900">
                            {isAr
                              ? type === "apartment"
                                ? "شقة"
                                : "منزل / فيلا"
                              : type === "apartment"
                              ? "Apartment"
                              : "House / Villa"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>{isAr ? "المساحة (م²)" : "Size (m²)"}</Label>
                      <Input
                        type="number"
                        min={20}
                        max={1000}
                        value={sizeM2}
                        onChange={(e) =>
                          setSizeM2(Math.max(20, parseInt(e.target.value) || 80))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{isAr ? "عدد الغرف" : "Rooms"}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={rooms}
                        onChange={(e) =>
                          setRooms(Math.max(1, parseInt(e.target.value) || 3))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{isAr ? "عدد الحمامات" : "Bathrooms"}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={bathrooms}
                        onChange={(e) =>
                          setBathrooms(Math.max(1, parseInt(e.target.value) || 2))
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ---- STEP 3: Estimate result ---- */}
              {step === 3 && estimate && selectedCategory && (
                <motion.div
                  key="step3"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-heading font-semibold text-lg text-warm-900 mb-2">
                    {isAr ? "التقدير التقريبي" : "Cost Estimate"}
                  </h2>
                  <p className="text-sm text-warm-500 mb-6">
                    {isAr
                      ? `للخدمة: ${selectedCategory.nameAr}`
                      : `For: ${selectedCategory.name}`}
                  </p>

                  {/* Price range card */}
                  <div className="rounded-[16px] bg-gradient-to-br from-brand-500 to-brand-700 text-white p-6 mb-5">
                    <p className="text-brand-200 text-sm mb-1">
                      {isAr ? "التقدير المتوقع" : "Estimated range"}
                    </p>
                    <p className="text-4xl font-heading font-bold mb-1">
                      {estimate.estimatedMin} - {estimate.estimatedMax}{" "}
                      <span className="text-xl font-normal text-brand-200">
                        {isAr ? "د.ا" : "JOD"}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-brand-400 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-white rounded-full h-2 transition-all duration-700"
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-brand-200 shrink-0">
                        {isAr
                          ? `متوسط السوق: ${estimate.marketAverage} د.ا`
                          : `Market avg: ${estimate.marketAverage} JOD`}
                      </span>
                    </div>
                  </div>

                  {/* Summary details */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      {
                        label: isAr ? "نوع العقار" : "Property type",
                        value: isAr
                          ? propertyType === "apartment"
                            ? "شقة"
                            : "منزل"
                          : propertyType === "apartment"
                          ? "Apartment"
                          : "House",
                      },
                      {
                        label: isAr ? "المساحة" : "Size",
                        value: `${sizeM2} m²`,
                      },
                      {
                        label: isAr ? "عدد الغرف" : "Rooms",
                        value: rooms.toString(),
                      },
                      {
                        label: isAr ? "الحمامات" : "Bathrooms",
                        value: bathrooms.toString(),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-warm-50 rounded-[10px] p-3"
                      >
                        <p className="text-xs text-warm-400">{item.label}</p>
                        <p className="font-semibold text-warm-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Disclaimer */}
                  <div className="rounded-[10px] bg-amber-50 border border-amber-100 p-3 mb-5">
                    <p className="text-xs text-amber-700">
                      {isAr
                        ? "* هذا تقدير تقريبي فقط. قد تختلف الأسعار الفعلية حسب حالة العقار وتفاصيل العمل. احصل على عروض حقيقية من المزودين."
                        : "* This is an approximate estimate only. Actual prices may vary based on property condition and work scope. Get real quotes from providers."}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/${locale}/post-job?categoryId=${selectedCategory.id}`}
                  >
                    <Button className="w-full" size="lg">
                      {isAr ? "احصل على عروض حقيقية" : "Get Real Quotes"}
                      <ArrowNext className="h-4 w-4 ms-2" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t border-warm-100">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowPrev className="h-4 w-4 me-1" />
                  {isAr ? "السابق" : "Back"}
                </Button>
              ) : (
                <div />
              )}
              {step < 3 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !selectedCategoryId}
                >
                  {isAr ? "التالي" : "Next"}
                  <ArrowNext className="h-4 w-4 ms-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <p className="text-center text-sm text-warm-400 mt-6">
          <Link href={`/${locale}`} className="hover:text-brand-600 transition-colors">
            {isAr ? "← العودة للرئيسية" : "← Back to home"}
          </Link>
        </p>
      </div>
    </div>
  );
}
