"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  Briefcase,
  Clock,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react";
import { JORDANIAN_CITIES, AMMAN_AREAS, getInitials, cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type AvailabilityDay = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const DAYS_OF_WEEK = [
  { key: "saturday", en: "Saturday", ar: "السبت" },
  { key: "sunday", en: "Sunday", ar: "الأحد" },
  { key: "monday", en: "Monday", ar: "الاثنين" },
  { key: "tuesday", en: "Tuesday", ar: "الثلاثاء" },
  { key: "wednesday", en: "Wednesday", ar: "الأربعاء" },
  { key: "thursday", en: "Thursday", ar: "الخميس" },
  { key: "friday", en: "Friday", ar: "الجمعة" },
];

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS_OF_WEEK.map(({ key }) => [key, { enabled: false, startTime: "08:00", endTime: "17:00" }])
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { locale, isRtl } = useLocale();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // User fields
  const [firstName, setFirstName] = useState("");
  const [firstNameAr, setFirstNameAr] = useState("");
  const [lastName, setLastName] = useState("");
  const [lastNameAr, setLastNameAr] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [bio, setBio] = useState("");
  const [bioAr, setBioAr] = useState("");
  const [language, setLanguage] = useState("ar");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("CUSTOMER");

  // Provider fields
  const [businessName, setBusinessName] = useState("");
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessDescriptionAr, setBusinessDescriptionAr] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [instantBookEnabled, setInstantBookEnabled] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, AvailabilityDay>>(DEFAULT_SCHEDULE);

  // Fetch profile data
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        setFirstName(user.firstName || "");
        setFirstNameAr(user.firstNameAr || "");
        setLastName(user.lastName || "");
        setLastNameAr(user.lastNameAr || "");
        setPhone(user.phone || "");
        setCity(user.city || "");
        setArea(user.area || "");
        setFullAddress(user.fullAddress || "");
        setBio(user.bio || "");
        setBioAr(user.bioAr || "");
        setLanguage(user.language || "ar");
        setAvatar(user.avatar || null);
        setEmail(user.email || "");
        setRole(user.role || "CUSTOMER");

        if (user.providerProfile) {
          setBusinessName(user.providerProfile.businessName || "");
          setBusinessNameAr(user.providerProfile.businessNameAr || "");
          setBusinessDescription(user.providerProfile.businessDescription || "");
          setBusinessDescriptionAr(user.providerProfile.businessDescriptionAr || "");
          setYearsOfExperience(user.providerProfile.yearsOfExperience || 0);
          setInstantBookEnabled(user.providerProfile.instantBookEnabled || false);
          if (user.providerProfile.availabilitySchedule) {
            setSchedule({ ...DEFAULT_SCHEDULE, ...user.providerProfile.availabilitySchedule });
          }
        }
      })
      .catch(() =>
        toast({
          title: locale === "ar" ? "خطأ في تحميل البيانات" : "Failed to load profile",
          variant: "destructive",
        })
      )
      .finally(() => setLoading(false));
  }, [locale, toast]);

  // ── Avatar upload ──────────────────────────────────────────────────────────

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatars");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      const url = data.url as string;
      setAvatar(url);
      // Immediately patch profile with new avatar
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      });
      toast({
        title: locale === "ar" ? "تم تحديث الصورة الشخصية" : "Profile picture updated",
      });
    } else {
      toast({
        title: locale === "ar" ? "فشل رفع الصورة" : "Failed to upload image",
        variant: "destructive",
      });
    }
    setAvatarUploading(false);
  };

  // ── Save profile ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);

    const payload: Record<string, unknown> = {
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      phone,
      city,
      area,
      fullAddress,
      bio,
      bioAr,
      language,
    };

    if (role === "PROVIDER") {
      payload.businessName = businessName;
      payload.businessNameAr = businessNameAr;
      payload.businessDescription = businessDescription;
      payload.businessDescriptionAr = businessDescriptionAr;
      payload.yearsOfExperience = yearsOfExperience;
      payload.instantBookEnabled = instantBookEnabled;
      payload.availabilitySchedule = schedule;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast({
        title: locale === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully",
        description: locale === "ar" ? "تم تحديث ملفك الشخصي" : "Your profile has been updated",
      });
    } else {
      const data = await res.json();
      toast({
        title: data.error || (locale === "ar" ? "حدث خطأ" : "Something went wrong"),
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  // ── Availability helpers ───────────────────────────────────────────────────

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };

  const updateDayTime = (day: string, field: "startTime" | "endTime", val: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const initials = getInitials(firstName || "U", lastName || "U");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-warm-900">
          {locale === "ar" ? "إعدادات الحساب" : "Account Settings"}
        </h1>
        <p className="text-warm-500 text-sm mt-1">
          {locale === "ar" ? "إدارة معلومات ملفك الشخصي" : "Manage your profile information"}
        </p>
      </div>

      {/* Avatar section */}
      <Card className="shadow-small border-0 mb-6">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-brand-100 text-brand-700 text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -end-1 w-7 h-7 bg-brand-500 text-white rounded-full flex items-center justify-center hover:bg-brand-600 transition shadow-small disabled:opacity-50"
              >
                {avatarUploading ? (
                  <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
            </div>
            <div>
              <p className="font-semibold text-warm-900">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-warm-500">{email}</p>
              <p className="text-xs text-warm-400 mt-0.5">
                {role === "PROVIDER"
                  ? (locale === "ar" ? "مزود خدمة" : "Service Provider")
                  : (locale === "ar" ? "عميل" : "Customer")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" dir={isRtl ? "rtl" : "ltr"}>
        <TabsList className={cn("mb-6", role === "PROVIDER" ? "grid grid-cols-3" : "grid grid-cols-1 w-auto")}>
          <TabsTrigger value="personal" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {locale === "ar" ? "الملف الشخصي" : "Profile"}
          </TabsTrigger>
          {role === "PROVIDER" && (
            <>
              <TabsTrigger value="business" className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {locale === "ar" ? "الأعمال" : "Business"}
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {locale === "ar" ? "الأوقات" : "Hours"}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ── Personal tab ──────────────────────────────────────────────────── */}
        <TabsContent value="personal">
          <Card className="shadow-small border-0">
            <CardHeader>
              <CardTitle className="text-base">
                {locale === "ar" ? "المعلومات الشخصية" : "Personal Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (EN)"}</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ahmad" />
                </div>
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "الاسم الأول (عربي)" : "First Name (AR)"}</Label>
                  <Input dir="rtl" value={firstNameAr} onChange={(e) => setFirstNameAr(e.target.value)} placeholder="أحمد" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "اسم العائلة (إنجليزي)" : "Last Name (EN)"}</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Al-Khalidi" />
                </div>
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "اسم العائلة (عربي)" : "Last Name (AR)"}</Label>
                  <Input dir="rtl" value={lastNameAr} onChange={(e) => setLastNameAr(e.target.value)} placeholder="الخالدي" />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label>{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962 7X XXX XXXX" />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "المدينة" : "City"}</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "ar" ? "اختر المدينة" : "Select city"} />
                    </SelectTrigger>
                    <SelectContent>
                      {JORDANIAN_CITIES.map((c) => (
                        <SelectItem key={c.en} value={c.en}>
                          {locale === "ar" ? c.ar : c.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "المنطقة" : "Area"}</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "ar" ? "اختر المنطقة" : "Select area"} />
                    </SelectTrigger>
                    <SelectContent>
                      {AMMAN_AREAS.map((a) => (
                        <SelectItem key={a.en} value={a.en}>
                          {locale === "ar" ? a.ar : a.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{locale === "ar" ? "العنوان الكامل" : "Full Address"}</Label>
                <Input
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder={locale === "ar" ? "الشارع، المبنى، الطابق..." : "Street, Building, Floor..."}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>{locale === "ar" ? "نبذة تعريفية (إنجليزي)" : "Bio (EN)"}</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ar" ? "نبذة تعريفية (عربي)" : "Bio (AR)"}</Label>
                <Textarea
                  dir="rtl"
                  value={bioAr}
                  onChange={(e) => setBioAr(e.target.value)}
                  placeholder="اكتب نبذة تعريفية عنك..."
                  rows={3}
                />
              </div>

              {/* Language preference */}
              <div className="space-y-2">
                <Label>{locale === "ar" ? "لغة الواجهة" : "Interface Language"}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Business tab (providers only) ─────────────────────────────────── */}
        {role === "PROVIDER" && (
          <TabsContent value="business">
            <Card className="shadow-small border-0">
              <CardHeader>
                <CardTitle className="text-base">
                  {locale === "ar" ? "معلومات الأعمال" : "Business Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "اسم الأعمال (إنجليزي)" : "Business Name (EN)"}</Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Al-Khalidi Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "اسم الأعمال (عربي)" : "Business Name (AR)"}</Label>
                    <Input
                      dir="rtl"
                      value={businessNameAr}
                      onChange={(e) => setBusinessNameAr(e.target.value)}
                      placeholder="خدمات الخالدي"
                    />
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
                      onClick={() => setYearsOfExperience((p) => Math.max(0, p - 1))}
                      className="w-9 h-9 rounded-full border border-warm-300 flex items-center justify-center hover:bg-warm-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-2xl font-bold text-warm-900 w-10 text-center">{yearsOfExperience}</span>
                    <button
                      type="button"
                      onClick={() => setYearsOfExperience((p) => p + 1)}
                      className="w-9 h-9 rounded-full border border-warm-300 flex items-center justify-center hover:bg-warm-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-warm-500">{locale === "ar" ? "سنوات" : "years"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-warm-50 rounded-[12px]">
                  <div>
                    <p className="font-medium text-warm-800 text-sm">
                      {locale === "ar" ? "الحجز الفوري" : "Instant Booking"}
                    </p>
                    <p className="text-xs text-warm-500 mt-0.5">
                      {locale === "ar"
                        ? "السماح للعملاء بالحجز مباشرة دون موافقة"
                        : "Allow customers to book directly without approval"}
                    </p>
                  </div>
                  <Switch checked={instantBookEnabled} onCheckedChange={setInstantBookEnabled} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Availability tab (providers only) ─────────────────────────────── */}
        {role === "PROVIDER" && (
          <TabsContent value="availability">
            <Card className="shadow-small border-0">
              <CardHeader>
                <CardTitle className="text-base">
                  {locale === "ar" ? "جدول أوقات العمل" : "Working Hours Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DAYS_OF_WEEK.map(({ key, en, ar: dayAr }) => {
                  const day = schedule[key] || { enabled: false, startTime: "08:00", endTime: "17:00" };
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-4 rounded-[12px] border transition-all",
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
                        <div className="flex items-center gap-4">
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
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Save button — sticky bottom */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 min-w-[140px]">
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {locale === "ar" ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
