"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Briefcase,
  Wrench,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { JORDANIAN_CITIES, cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceCategory = {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
};

type SelectedService = {
  categoryId: string;
  priceMin: number | "";
  priceMax: number | "";
};

type AvailabilityDay = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type AvailabilitySchedule = Record<string, AvailabilityDay>;

const DAYS_OF_WEEK = [
  { key: "saturday", en: "Saturday", ar: "السبت" },
  { key: "sunday", en: "Sunday", ar: "الأحد" },
  { key: "monday", en: "Monday", ar: "الاثنين" },
  { key: "tuesday", en: "Tuesday", ar: "الثلاثاء" },
  { key: "wednesday", en: "Wednesday", ar: "الأربعاء" },
  { key: "thursday", en: "Thursday", ar: "الخميس" },
  { key: "friday", en: "Friday", ar: "الجمعة" },
];

const DEFAULT_SCHEDULE: AvailabilitySchedule = Object.fromEntries(
  DAYS_OF_WEEK.map(({ key }) => [key, { enabled: false, startTime: "08:00", endTime: "17:00" }])
);

// ── Wizard steps ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: "personal", icon: User, en: "Personal Info", ar: "المعلومات الشخصية" },
  { key: "business", icon: Briefcase, en: "Business Details", ar: "تفاصيل الأعمال" },
  { key: "services", icon: Wrench, en: "Services", ar: "الخدمات" },
  { key: "portfolio", icon: ImageIcon, en: "Portfolio", ar: "معرض الأعمال" },
  { key: "verification", icon: ShieldCheck, en: "Verification", ar: "التحقق" },
  { key: "availability", icon: Clock, en: "Availability", ar: "أوقات العمل" },
  { key: "review", icon: CheckCircle2, en: "Review & Submit", ar: "المراجعة والإرسال" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function ProviderOnboardingPage() {
  const { locale, isRtl } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState("");
  const [firstNameAr, setFirstNameAr] = useState("");
  const [lastName, setLastName] = useState("");
  const [lastNameAr, setLastNameAr] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Business Details
  const [businessName, setBusinessName] = useState("");
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessDescriptionAr, setBusinessDescriptionAr] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">(0);

  // Step 3: Services
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Step 4: Portfolio
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // Step 5: Verification
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [certUrls, setCertUrls] = useState<string[]>([]);
  const [verificationUploading, setVerificationUploading] = useState(false);

  // Step 6: Availability
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(DEFAULT_SCHEDULE);

  // Pre-fill from session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user?.name) {
          const parts = s.user.name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (s?.user?.email) setEmail(s.user.email);
      })
      .catch(() => {});

    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    setError(null);
    switch (step) {
      case 0:
        if (!firstName.trim() || !lastName.trim()) {
          setError(locale === "ar" ? "الاسم الأول والأخير مطلوبان" : "First and last name are required");
          return false;
        }
        return true;
      case 1:
        if (!businessName.trim() || !businessNameAr.trim()) {
          setError(locale === "ar" ? "اسم العمل مطلوب" : "Business name is required");
          return false;
        }
        return true;
      case 2:
        if (selectedServices.length === 0) {
          setError(locale === "ar" ? "اختر خدمة واحدة على الأقل" : "Select at least one service");
          return false;
        }
        if (selectedCities.length === 0) {
          setError(locale === "ar" ? "اختر مدينة خدمة واحدة على الأقل" : "Select at least one service city");
          return false;
        }
        return true;
      case 3:
        return true; // Portfolio optional
      case 4:
        if (!idFrontUrl || !idBackUrl) {
          setError(locale === "ar" ? "يرجى رفع صورة الهوية الوطنية (وجهان)" : "Please upload both sides of national ID");
          return false;
        }
        return true;
      case 5:
        return true; // Availability optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  // ── Upload helpers ──────────────────────────────────────────────────────────

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  };

  const handlePortfolioUpload = async (files: FileList | null) => {
    if (!files) return;
    setPortfolioUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, "portfolios");
      if (url) urls.push(url);
    }
    setPortfolioImages((prev) => [...prev, ...urls]);
    setPortfolioUploading(false);
  };

  const handleVerificationUpload = async (file: File, side: "front" | "back" | "cert") => {
    setVerificationUploading(true);
    const url = await uploadFile(file, "verifications");
    if (url) {
      if (side === "front") setIdFrontUrl(url);
      else if (side === "back") setIdBackUrl(url);
      else setCertUrls((prev) => [...prev, url]);
    }
    setVerificationUploading(false);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    const certificates: string[] = [];
    if (idFrontUrl) certificates.push(idFrontUrl);
    if (idBackUrl) certificates.push(idBackUrl);
    certificates.push(...certUrls);

    const payload = {
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      phone,
      businessName,
      businessNameAr,
      businessDescription,
      businessDescriptionAr,
      yearsOfExperience: Number(yearsOfExperience) || 0,
      services: selectedServices.map((s) => ({
        categoryId: s.categoryId,
        priceMin: s.priceMin === "" ? null : Number(s.priceMin),
        priceMax: s.priceMax === "" ? null : Number(s.priceMax),
      })),
      serviceAreas: selectedCities.map((city) => ({ city })),
      portfolioImages,
      certificates,
      availabilitySchedule: schedule,
    };

    const res = await fetch("/api/providers/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || (locale === "ar" ? "حدث خطأ. يرجى المحاولة مجدداً." : "Something went wrong. Please try again."));
      setSubmitting(false);
      return;
    }

    router.push(`/${locale}/pro/dashboard`);
  };

  // ── Service toggle ──────────────────────────────────────────────────────────

  const toggleService = (categoryId: string) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.categoryId === categoryId);
      if (exists) return prev.filter((s) => s.categoryId !== categoryId);
      return [...prev, { categoryId, priceMin: "", priceMax: "" }];
    });
  };

  const updateServicePrice = (categoryId: string, field: "priceMin" | "priceMax", val: string) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.categoryId === categoryId ? { ...s, [field]: val === "" ? "" : Number(val) } : s))
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  // ── Availability ────────────────────────────────────────────────────────────

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateDayTime = (day: string, field: "startTime" | "endTime", val: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  };

  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  // ── Render steps ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Personal Info ──────────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{locale === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (EN)"}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ahmad" />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ar" ? "الاسم الأول (عربي)" : "First Name (AR)"}</Label>
                <Input dir="rtl" value={firstNameAr} onChange={(e) => setFirstNameAr(e.target.value)} placeholder="أحمد" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{locale === "ar" ? "اسم العائلة (إنجليزي)" : "Last Name (EN)"}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Al-Khalidi" />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ar" ? "اسم العائلة (عربي)" : "Last Name (AR)"}</Label>
                <Input dir="rtl" value={lastNameAr} onChange={(e) => setLastNameAr(e.target.value)} placeholder="الخالدي" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={email} readOnly className="bg-warm-50 text-warm-500" />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962 7X XXX XXXX" />
            </div>
          </div>
        );

      // ── Step 1: Business Details ───────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{locale === "ar" ? "اسم الأعمال (إنجليزي)" : "Business Name (EN)"}</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Al-Khalidi Services" />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ar" ? "اسم الأعمال (عربي)" : "Business Name (AR)"}</Label>
                <Input dir="rtl" value={businessNameAr} onChange={(e) => setBusinessNameAr(e.target.value)} placeholder="خدمات الخالدي" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "وصف الأعمال (إنجليزي)" : "Business Description (EN)"}</Label>
              <Textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe your business and expertise..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "وصف الأعمال (عربي)" : "Business Description (AR)"}</Label>
              <Textarea
                dir="rtl"
                value={businessDescriptionAr}
                onChange={(e) => setBusinessDescriptionAr(e.target.value)}
                placeholder="اصف أعمالك وخبرتك..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "سنوات الخبرة" : "Years of Experience"}</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setYearsOfExperience((p) => Math.max(0, (Number(p) || 0) - 1))}
                  className="w-9 h-9 rounded-full border border-warm-300 flex items-center justify-center hover:bg-warm-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-2xl font-bold text-warm-900 w-10 text-center">{yearsOfExperience}</span>
                <button
                  type="button"
                  onClick={() => setYearsOfExperience((p) => (Number(p) || 0) + 1)}
                  className="w-9 h-9 rounded-full border border-warm-300 flex items-center justify-center hover:bg-warm-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-sm text-warm-500">{locale === "ar" ? "سنوات" : "years"}</span>
              </div>
            </div>
          </div>
        );

      // ── Step 2: Services ───────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-warm-800 mb-3">
                {locale === "ar" ? "اختر الخدمات التي تقدمها" : "Select the services you offer"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const selected = selectedServices.find((s) => s.categoryId === cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleService(cat.id)}
                      className={cn(
                        "p-3 rounded-[12px] border-2 text-start transition-all",
                        selected ? "border-brand-500 bg-brand-50" : "border-warm-200 hover:border-warm-300"
                      )}
                    >
                      {cat.icon && <span className="text-lg">{cat.icon}</span>}
                      <p className={cn("text-sm font-medium mt-1", selected ? "text-brand-700" : "text-warm-700")}>
                        {locale === "ar" ? cat.nameAr : cat.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price ranges for selected services */}
            {selectedServices.length > 0 && (
              <div>
                <h3 className="font-semibold text-warm-800 mb-3">
                  {locale === "ar" ? "حدد نطاق الأسعار (د.أ)" : "Set price range (JOD)"}
                </h3>
                <div className="space-y-3">
                  {selectedServices.map((s) => {
                    const cat = categories.find((c) => c.id === s.categoryId);
                    if (!cat) return null;
                    return (
                      <div key={s.categoryId} className="flex items-center gap-3 p-3 bg-warm-50 rounded-[12px]">
                        <span className="text-sm font-medium text-warm-700 flex-1">
                          {locale === "ar" ? cat.nameAr : cat.name}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder={locale === "ar" ? "من" : "Min"}
                          value={s.priceMin}
                          onChange={(e) => updateServicePrice(s.categoryId, "priceMin", e.target.value)}
                          className="w-24"
                        />
                        <span className="text-warm-400">–</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder={locale === "ar" ? "إلى" : "Max"}
                          value={s.priceMax}
                          onChange={(e) => updateServicePrice(s.categoryId, "priceMax", e.target.value)}
                          className="w-24"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Service cities */}
            <div>
              <h3 className="font-semibold text-warm-800 mb-3">
                {locale === "ar" ? "مناطق الخدمة" : "Service Areas"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {JORDANIAN_CITIES.map((city) => (
                  <button
                    key={city.en}
                    type="button"
                    onClick={() => toggleCity(city.en)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-all",
                      selectedCities.includes(city.en)
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-warm-300 text-warm-700 hover:border-brand-300"
                    )}
                  >
                    {locale === "ar" ? city.ar : city.en}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Step 3: Portfolio ──────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-warm-600">
              {locale === "ar"
                ? "أرفع صور لأعمالك السابقة لتعزيز ملفك الشخصي (اختياري)"
                : "Upload photos of your past work to boost your profile (optional)"}
            </p>
            <UploadZone
              label={locale === "ar" ? "رفع صور الأعمال" : "Upload Portfolio Photos"}
              multiple
              accept="image/*"
              loading={portfolioUploading}
              onFiles={handlePortfolioUpload}
            />
            {portfolioImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {portfolioImages.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-[12px] overflow-hidden border border-warm-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPortfolioImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 end-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ── Step 4: Verification ───────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-5">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] text-sm text-amber-700">
              {locale === "ar"
                ? "يرجى تحميل صورة الهوية الوطنية من الجهتين. هذا مطلوب للتحقق من هويتك."
                : "Please upload your national ID front and back. This is required to verify your identity."}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="mb-2 block">{locale === "ar" ? "الهوية الوطنية — الوجه الأمامي" : "National ID — Front"}</Label>
                {idFrontUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[12px]">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 flex-1 truncate">
                      {locale === "ar" ? "تم الرفع بنجاح" : "Uploaded successfully"}
                    </span>
                    <button type="button" onClick={() => setIdFrontUrl(null)}>
                      <X className="h-4 w-4 text-warm-400" />
                    </button>
                  </div>
                ) : (
                  <UploadZone
                    label={locale === "ar" ? "رفع الوجه الأمامي" : "Upload Front Side"}
                    accept="image/*,application/pdf"
                    loading={verificationUploading}
                    onFiles={(files) => files?.[0] && handleVerificationUpload(files[0], "front")}
                  />
                )}
              </div>

              <div>
                <Label className="mb-2 block">{locale === "ar" ? "الهوية الوطنية — الوجه الخلفي" : "National ID — Back"}</Label>
                {idBackUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[12px]">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 flex-1 truncate">
                      {locale === "ar" ? "تم الرفع بنجاح" : "Uploaded successfully"}
                    </span>
                    <button type="button" onClick={() => setIdBackUrl(null)}>
                      <X className="h-4 w-4 text-warm-400" />
                    </button>
                  </div>
                ) : (
                  <UploadZone
                    label={locale === "ar" ? "رفع الوجه الخلفي" : "Upload Back Side"}
                    accept="image/*,application/pdf"
                    loading={verificationUploading}
                    onFiles={(files) => files?.[0] && handleVerificationUpload(files[0], "back")}
                  />
                )}
              </div>

              <div>
                <Label className="mb-2 block">
                  {locale === "ar" ? "الشهادات والمؤهلات (اختياري)" : "Certificates & Qualifications (optional)"}
                </Label>
                <UploadZone
                  label={locale === "ar" ? "رفع الشهادات" : "Upload Certificates"}
                  multiple
                  accept="image/*,application/pdf"
                  loading={verificationUploading}
                  onFiles={(files) => {
                    if (files) {
                      Array.from(files).forEach((f) => handleVerificationUpload(f, "cert"));
                    }
                  }}
                />
                {certUrls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {certUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-warm-600">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="flex-1 truncate">{locale === "ar" ? `شهادة ${i + 1}` : `Certificate ${i + 1}`}</span>
                        <button type="button" onClick={() => setCertUrls((prev) => prev.filter((_, idx) => idx !== i))}>
                          <X className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ── Step 5: Availability ───────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-3">
            <p className="text-sm text-warm-600">
              {locale === "ar" ? "حدد أيام وأوقات عملك" : "Set your working days and hours"}
            </p>
            {DAYS_OF_WEEK.map(({ key, en, ar: dayAr }) => {
              const day = schedule[key];
              return (
                <div
                  key={key}
                  className={cn(
                    "p-3 rounded-[12px] border transition-all",
                    day.enabled ? "border-brand-200 bg-brand-50" : "border-warm-200 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-medium text-sm", day.enabled ? "text-brand-700" : "text-warm-600")}>
                      {locale === "ar" ? dayAr : en}
                    </span>
                    <Switch checked={day.enabled} onCheckedChange={() => toggleDay(key)} />
                  </div>
                  {day.enabled && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-warm-500">{locale === "ar" ? "من" : "From"}</Label>
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDayTime(key, "startTime", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-warm-500">{locale === "ar" ? "إلى" : "To"}</Label>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDayTime(key, "endTime", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      // ── Step 6: Review & Submit ────────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-5">
            <ReviewSection
              title={locale === "ar" ? "المعلومات الشخصية" : "Personal Info"}
              items={[
                { label: locale === "ar" ? "الاسم" : "Name", value: `${firstName} ${lastName}` },
                { label: locale === "ar" ? "البريد الإلكتروني" : "Email", value: email },
                { label: locale === "ar" ? "الهاتف" : "Phone", value: phone || "—" },
              ]}
            />
            <ReviewSection
              title={locale === "ar" ? "تفاصيل الأعمال" : "Business Details"}
              items={[
                { label: locale === "ar" ? "اسم الأعمال" : "Business Name", value: businessName },
                { label: locale === "ar" ? "سنوات الخبرة" : "Years of Experience", value: `${yearsOfExperience}` },
                { label: locale === "ar" ? "الوصف" : "Description", value: businessDescription || "—" },
              ]}
            />
            <ReviewSection
              title={locale === "ar" ? "الخدمات" : "Services"}
              items={selectedServices.map((s) => {
                const cat = categories.find((c) => c.id === s.categoryId);
                const name = cat ? (locale === "ar" ? cat.nameAr : cat.name) : s.categoryId;
                const price = s.priceMin !== "" && s.priceMax !== "" ? `${s.priceMin} – ${s.priceMax} JOD` : "—";
                return { label: name, value: price };
              })}
            />
            <ReviewSection
              title={locale === "ar" ? "مناطق الخدمة" : "Service Areas"}
              items={[{
                label: locale === "ar" ? "المدن" : "Cities",
                value: selectedCities.length > 0
                  ? selectedCities.join(", ")
                  : "—",
              }]}
            />
            <ReviewSection
              title={locale === "ar" ? "معرض الأعمال" : "Portfolio"}
              items={[{ label: locale === "ar" ? "الصور" : "Photos", value: `${portfolioImages.length}` }]}
            />
            <ReviewSection
              title={locale === "ar" ? "التحقق" : "Verification"}
              items={[
                { label: locale === "ar" ? "الهوية الوطنية" : "National ID", value: idFrontUrl && idBackUrl ? (locale === "ar" ? "مرفوع" : "Uploaded") : "—" },
                { label: locale === "ar" ? "الشهادات" : "Certificates", value: `${certUrls.length}` },
              ]}
            />
            <ReviewSection
              title={locale === "ar" ? "أوقات العمل" : "Working Hours"}
              items={DAYS_OF_WEEK.filter(({ key }) => schedule[key].enabled).map(({ key, en, ar: dayAr }) => ({
                label: locale === "ar" ? dayAr : en,
                value: `${schedule[key].startTime} – ${schedule[key].endTime}`,
              }))}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-[12px] bg-brand-500 text-white font-heading font-bold text-xl flex items-center justify-center">
            S
          </div>
          <span className="font-heading font-bold text-2xl text-warm-900">
            {locale === "ar" ? "سَنَدي" : "Sanadi"}
          </span>
        </div>
        <h1 className="text-xl font-bold text-warm-900">
          {locale === "ar" ? "إعداد ملفك كمزود خدمة" : "Set Up Your Provider Profile"}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-warm-700">
            {locale === "ar" ? `الخطوة ${step + 1} من ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
          </span>
          <span className="text-sm text-warm-500">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
        {/* Step pills */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-all",
                  i < step ? "bg-brand-100 text-brand-700" : i === step ? "bg-brand-500 text-white" : "bg-warm-100 text-warm-500"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{locale === "ar" ? s.ar : s.en}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="shadow-medium border-0">
        <CardContent className="pt-6 pb-6">
          {/* Step title */}
          <div className="flex items-center gap-2 mb-5">
            {(() => {
              const CurrentIcon = STEPS[step].icon;
              return <CurrentIcon className="h-5 w-5 text-brand-500" />;
            })()}
            <h2 className="text-lg font-bold text-warm-900">
              {locale === "ar" ? STEPS[step].ar : STEPS[step].en}
            </h2>
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation */}
          <div className={cn("flex gap-3 mt-6", isRtl ? "flex-row-reverse" : "flex-row")}>
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-1">
                {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {locale === "ar" ? "السابق" : "Back"}
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 flex items-center gap-1 justify-center">
                {locale === "ar" ? "التالي" : "Next"}
                {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting
                  ? (locale === "ar" ? "جاري الإرسال..." : "Submitting...")
                  : (locale === "ar" ? "إرسال وإطلاق الملف" : "Submit & Launch Profile")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UploadZone({
  label,
  accept,
  multiple,
  loading,
  onFiles,
}: {
  label: string;
  accept?: string;
  multiple?: boolean;
  loading?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full border-2 border-dashed border-warm-300 rounded-[12px] p-6 flex flex-col items-center gap-2 hover:border-brand-400 hover:bg-brand-50 transition-all disabled:opacity-50"
      >
        {loading ? (
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-warm-400" />
        )}
        <span className="text-sm text-warm-600">{loading ? "Uploading..." : label}</span>
      </button>
    </div>
  );
}

function ReviewSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="border border-warm-200 rounded-[12px] overflow-hidden">
      <div className="bg-warm-100 px-4 py-2">
        <h3 className="text-sm font-semibold text-warm-700">{title}</h3>
      </div>
      <div className="divide-y divide-warm-100">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between px-4 py-2 text-sm">
            <span className="text-warm-500">{item.label}</span>
            <span className="text-warm-800 font-medium text-end max-w-[60%]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
