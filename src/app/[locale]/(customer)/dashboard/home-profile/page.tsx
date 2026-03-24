"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Home, Building2, Thermometer, Droplets, CheckCircle, Trash2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeasonalReminders } from "@/components/home/seasonal-reminders";

type Features = {
  garden: boolean;
  balcony: boolean;
  parking: boolean;
  elevator: boolean;
  swimmingPool: boolean;
  centralHeating: boolean;
};

type HomeProfileData = {
  id?: string;
  propertyType?: string;
  size?: number;
  numberOfRooms?: number;
  buildingAge?: number;
  acType?: string;
  waterHeaterType?: string;
  features?: Features;
};

const defaultFeatures: Features = {
  garden: false,
  balcony: false,
  parking: false,
  elevator: false,
  swimmingPool: false,
  centralHeating: false,
};

export default function HomeProfilePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [profile, setProfile] = useState<HomeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [propertyType, setPropertyType] = useState("");
  const [size, setSize] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState("");
  const [numberOfBathrooms, setNumberOfBathrooms] = useState("");
  const [buildingAge, setBuildingAge] = useState("");
  const [acType, setAcType] = useState("");
  const [waterHeaterType, setWaterHeaterType] = useState("");
  const [features, setFeatures] = useState<Features>({ ...defaultFeatures });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/home-profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          populateForm(data.profile);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function populateForm(p: HomeProfileData) {
    setPropertyType(p.propertyType ?? "");
    setSize(p.size?.toString() ?? "");
    setNumberOfRooms(p.numberOfRooms?.toString() ?? "");
    setBuildingAge(p.buildingAge?.toString() ?? "");
    setAcType(p.acType ?? "");
    setWaterHeaterType(p.waterHeaterType ?? "");
    setFeatures({ ...defaultFeatures, ...(p.features ?? {}) });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const body = {
        propertyType: propertyType || null,
        size: size || null,
        numberOfRooms: numberOfRooms || null,
        numberOfBathrooms: numberOfBathrooms || null,
        buildingAge: buildingAge || null,
        acType: acType || null,
        waterHeaterType: waterHeaterType || null,
        features,
      };

      const method = profile?.id ? "PATCH" : "POST";
      const res = await fetch("/api/home-profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(isAr ? "هل تريد حذف ملف المنزل؟" : "Delete your home profile?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/home-profile", { method: "DELETE" });
      if (res.ok) {
        setProfile(null);
        setPropertyType("");
        setSize("");
        setNumberOfRooms("");
        setNumberOfBathrooms("");
        setBuildingAge("");
        setAcType("");
        setWaterHeaterType("");
        setFeatures({ ...defaultFeatures });
      }
    } finally {
      setDeleting(false);
    }
  }

  function toggleFeature(key: keyof Features) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const featureOptions: { key: keyof Features; labelEn: string; labelAr: string }[] = [
    { key: "garden", labelEn: "Garden", labelAr: "حديقة" },
    { key: "balcony", labelEn: "Balcony", labelAr: "شرفة" },
    { key: "parking", labelEn: "Parking", labelAr: "موقف سيارة" },
    { key: "elevator", labelEn: "Elevator", labelAr: "مصعد" },
    { key: "swimmingPool", labelEn: "Swimming Pool", labelAr: "مسبح" },
    { key: "centralHeating", labelEn: "Central Heating", labelAr: "تدفئة مركزية" },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-warm-900 flex items-center gap-2">
            <Home className="h-6 w-6 text-brand-500" />
            {isAr ? "ملف المنزل" : "Home Profile"}
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            {isAr
              ? "أضف تفاصيل منزلك للحصول على توصيات صيانة مخصصة"
              : "Add your home details to receive personalized maintenance reminders"}
          </p>
        </div>
        {profile?.id && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Property Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-500" />
            {isAr ? "نوع العقار" : "Property Type"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "apartment", labelEn: "Apartment", labelAr: "شقة", icon: "🏢" },
              { value: "house", labelEn: "House / Villa", labelAr: "منزل / فيلا", icon: "🏠" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPropertyType(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-[12px] border-2 transition-all",
                  propertyType === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-warm-200 hover:border-warm-300 text-warm-600"
                )}
              >
                <span className="text-3xl">{opt.icon}</span>
                <span className="font-medium text-sm">{isAr ? opt.labelAr : opt.labelEn}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Size & Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "المساحة والغرف" : "Size & Rooms"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{isAr ? "المساحة (م²)" : "Size (m²)"}</Label>
            <Input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. 120"
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "عدد الغرف" : "Number of Rooms"}</Label>
            <Input
              type="number"
              value={numberOfRooms}
              onChange={(e) => setNumberOfRooms(e.target.value)}
              placeholder="e.g. 3"
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "عدد الحمامات" : "Bathrooms"}</Label>
            <Input
              type="number"
              value={numberOfBathrooms}
              onChange={(e) => setNumberOfBathrooms(e.target.value)}
              placeholder="e.g. 2"
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "عمر المبنى (سنة)" : "Building Age (years)"}</Label>
            <Input
              type="number"
              value={buildingAge}
              onChange={(e) => setBuildingAge(e.target.value)}
              placeholder="e.g. 10"
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* AC & Water Heater */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-brand-500" />
            {isAr ? "التكييف وسخان الماء" : "AC & Water Heater"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{isAr ? "نوع التكييف" : "AC Type"}</Label>
            <Select value={acType} onValueChange={setAcType}>
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="split">{isAr ? "سبليت" : "Split"}</SelectItem>
                <SelectItem value="window">{isAr ? "شباك" : "Window"}</SelectItem>
                <SelectItem value="central">{isAr ? "مركزي" : "Central"}</SelectItem>
                <SelectItem value="none">{isAr ? "لا يوجد" : "None"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "نوع سخان الماء" : "Water Heater Type"}</Label>
            <Select value={waterHeaterType} onValueChange={setWaterHeaterType}>
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electric">{isAr ? "كهربائي" : "Electric"}</SelectItem>
                <SelectItem value="gas">{isAr ? "غاز" : "Gas"}</SelectItem>
                <SelectItem value="solar">{isAr ? "طاقة شمسية" : "Solar"}</SelectItem>
                <SelectItem value="none">{isAr ? "لا يوجد" : "None"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Additional Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "مميزات إضافية" : "Additional Features"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {featureOptions.map((opt) => (
              <label
                key={opt.key}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-[10px] border cursor-pointer transition-all",
                  features[opt.key]
                    ? "border-brand-400 bg-brand-50"
                    : "border-warm-200 hover:border-warm-300"
                )}
              >
                <Checkbox
                  checked={features[opt.key]}
                  onCheckedChange={() => toggleFeature(opt.key)}
                />
                <span className="text-sm font-medium text-warm-800">
                  {isAr ? opt.labelAr : opt.labelEn}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 me-2" />
          )}
          {isAr ? "حفظ الملف" : "Save Profile"}
        </Button>
        {saved && (
          <Badge className="bg-green-100 text-green-800 gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            {isAr ? "تم الحفظ" : "Saved"}
          </Badge>
        )}
      </div>

      {/* Seasonal Reminders — shown only if profile exists */}
      {profile && (
        <>
          <Separator />
          <SeasonalReminders
            profile={{
              acType: acType || undefined,
              waterHeaterType: waterHeaterType || undefined,
              features,
            }}
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
