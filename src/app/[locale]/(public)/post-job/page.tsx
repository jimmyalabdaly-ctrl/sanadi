"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Upload, MapPin, Clock, CheckCircle, ArrowRight, ArrowLeft, Building2,
} from "lucide-react";
import { JORDANIAN_CITIES, AMMAN_AREAS, cn } from "@/lib/utils";

interface ServiceCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  subCategories: ServiceCategory[];
}

export default function PostJobPage() {
  const t = useTranslations("postJob");
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get("categoryId") ?? "");
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [urgency, setUrgency] = useState("FLEXIBLE");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [budget, setBudget] = useState([50, 200]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(2);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isAr = locale === "ar";
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  const ArrowNext = isRtl ? ArrowLeft : ArrowRight;
  const ArrowPrev = isRtl ? ArrowRight : ArrowLeft;

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace(`/${locale}/login?redirect=/${locale}/post-job`);
    }
  }, [sessionStatus, locale, router]);

  // Fetch real categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch {
      // Silent fail — categories remain empty
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const stepLabels = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5")];

  const urgencyOptions = [
    { value: "FLEXIBLE", label: t("flexible"), color: "bg-green-50 text-green-700 border-green-200" },
    { value: "WITHIN_WEEK", label: t("withinWeek"), color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "WITHIN_3_DAYS", label: t("within3Days"), color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { value: "URGENT_24H", label: t("urgent24h"), color: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "EMERGENCY", label: t("emergencyNow"), color: "bg-red-50 text-red-700 border-red-200" },
  ];

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          title: title || titleAr,
          titleAr: titleAr || title,
          description: description || descriptionAr,
          descriptionAr: descriptionAr || description,
          budgetMin: budget[0],
          budgetMax: budget[1],
          urgency,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          city,
          area: area || undefined,
          address: address || undefined,
          isGroupRequest: isGroup,
          groupSize: isGroup ? groupSize : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
      // Brief delay to show success state, then redirect to dashboard
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading auth
  if (sessionStatus === "loading") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-warm-900 mb-3">{t("successTitle")}</h1>
        <p className="text-warm-500 mb-8">{t("successSubtitle")}</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/${locale}/dashboard`}>
            <Button>{t("viewMyRequests")}</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setSelectedCategoryId("");
              setTitle("");
              setTitleAr("");
              setDescription("");
              setDescriptionAr("");
              setCity("");
            }}
          >
            {t("postAnother")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">{t("title")}</h1>
        <p className="text-warm-500">{t("subtitle")}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {stepLabels.map((label, i) => (
            <span key={i} className={cn("text-xs font-medium", i + 1 <= step ? "text-brand-600" : "text-warm-400")}>
              {label}
            </span>
          ))}
        </div>
        <Progress value={progress} />
      </div>

      <Card className="shadow-medium border-0">
        <CardContent className="p-6">
          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h2 className="font-heading font-semibold text-lg text-warm-900 mb-4">{t("selectCategory")}</h2>
              {loadingCategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-[12px] bg-warm-100 animate-pulse" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-center text-warm-500 py-8">
                  {isAr ? "لا توجد فئات متاحة" : "No categories available"}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
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
                      {cat.icon && (
                        <span className="text-2xl block mb-2">{cat.icon}</span>
                      )}
                      <p className="text-sm font-medium text-warm-800">
                        {isAr ? cat.nameAr : cat.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900 mb-2">
                {isAr ? "تفاصيل المشروع" : "Project Details"}
              </h2>
              <div className="space-y-2">
                <Label>{t("projectTitle")}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("projectTitlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("projectTitleAr")}</Label>
                <Input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder={isAr ? "مثال: إصلاح حنفية المطبخ" : "e.g., إصلاح حنفية المطبخ"}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("projectDescription")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("projectDescriptionPlaceholder")}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("projectDescriptionAr")}</Label>
                <Textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={3}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("uploadPhotos")}</Label>
                <div className="border-2 border-dashed border-warm-200 rounded-[12px] p-8 text-center cursor-pointer hover:border-brand-300 transition-colors">
                  <Upload className="h-8 w-8 text-warm-400 mx-auto mb-2" />
                  <p className="text-sm text-warm-500">{t("uploadPhotosHint")}</p>
                </div>
              </div>

              {/* Group / Building request toggle */}
              <div className="rounded-[12px] border border-warm-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-medium text-warm-900 text-sm">
                        {isAr ? "طلب جماعي / مبنى" : "This is a group / building request"}
                      </p>
                      <p className="text-xs text-warm-500 mt-0.5">
                        {isAr
                          ? "رائع للمباني السكنية! كثيراً ما يقدم مزودو الخدمة خصومات للطلبات الجماعية."
                          : "Great for apartment buildings! Providers often give bulk discounts."}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isGroup}
                    onCheckedChange={(v) => setIsGroup(v)}
                  />
                </div>
                {isGroup && (
                  <div className="mt-3 space-y-1">
                    <Label className="text-sm">
                      {isAr ? "عدد الوحدات" : "Number of units"}
                    </Label>
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      value={groupSize}
                      onChange={(e) => setGroupSize(Math.min(50, Math.max(2, parseInt(e.target.value) || 2)))}
                      className="max-w-[120px]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900 mb-2">
                {isAr ? "الموقع" : "Location"}
              </h2>
              <div className="space-y-2">
                <Label>{t("selectCity")}</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 me-1 text-warm-400" />
                    <SelectValue placeholder={t("selectCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {JORDANIAN_CITIES.map((c) => (
                      <SelectItem key={c.en} value={c.en}>
                        {isAr ? c.ar : c.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {city === "Amman" && (
                <div className="space-y-2">
                  <Label>{t("selectArea")}</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectArea")} />
                    </SelectTrigger>
                    <SelectContent>
                      {AMMAN_AREAS.map((a) => (
                        <SelectItem key={a.en} value={a.en}>
                          {isAr ? a.ar : a.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("enterAddress")}</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isAr ? "العنوان التفصيلي" : "Detailed address"}
                />
              </div>
            </div>
          )}

          {/* Step 4: Schedule & Budget */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-heading font-semibold text-lg text-warm-900 mb-2">
                {isAr ? "الموعد والميزانية" : "Schedule & Budget"}
              </h2>
              <div>
                <Label className="mb-3 block">{t("urgency")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {urgencyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setUrgency(opt.value)}
                      className={cn(
                        "p-3 rounded-[12px] border-2 text-sm font-medium transition-all text-start",
                        urgency === opt.value
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : `border-warm-100 ${opt.color}`
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("preferredDate")}</Label>
                  <Input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("preferredTime")}</Label>
                  <Select value={preferredTime} onValueChange={setPreferredTime}>
                    <SelectTrigger>
                      <Clock className="h-4 w-4 me-1 text-warm-400" />
                      <SelectValue placeholder={isAr ? "اختر" : "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      {["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00"].map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-3 block">
                  {t("budget")} ({budget[0]} - {budget[1]} {isAr ? "د.ا" : "JOD"})
                </Label>
                <Slider value={budget} onValueChange={setBudget} max={1000} step={10} />
                <div className="flex justify-between mt-1 text-xs text-warm-500">
                  <span>0 {isAr ? "د.ا" : "JOD"}</span>
                  <span>1000 {isAr ? "د.ا" : "JOD"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900 mb-2">{t("reviewTitle")}</h2>
              <div className="space-y-3">
                {[
                  {
                    label: isAr ? "الخدمة" : "Service",
                    value: selectedCategory ? (isAr ? selectedCategory.nameAr : selectedCategory.name) : "—",
                  },
                  { label: isAr ? "العنوان" : "Title", value: title || titleAr },
                  { label: isAr ? "الوصف" : "Description", value: description || descriptionAr },
                  { label: isAr ? "المدينة" : "City", value: city },
                  {
                    label: isAr ? "الاستعجال" : "Urgency",
                    value: urgencyOptions.find((o) => o.value === urgency)?.label,
                  },
                  {
                    label: isAr ? "الميزانية" : "Budget",
                    value: `${budget[0]} - ${budget[1]} ${isAr ? "د.ا" : "JOD"}`,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-[8px] bg-warm-50">
                    <span className="text-sm text-warm-500">{item.label}</span>
                    <span className="text-sm font-medium text-warm-900">{item.value || "—"}</span>
                  </div>
                ))}
              </div>
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-[8px]">{submitError}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-warm-100">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                <ArrowPrev className="h-4 w-4 me-1" /> {isAr ? "السابق" : "Back"}
              </Button>
            ) : (
              <div />
            )}
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedCategoryId) ||
                  (step === 2 && !title && !titleAr) ||
                  (step === 3 && !city)
                }
              >
                {isAr ? "التالي" : "Next"} <ArrowNext className="h-4 w-4 ms-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isAr ? "جاري الإرسال..." : "Submitting..."}
                  </span>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 me-1" /> {t("submitRequest")}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
