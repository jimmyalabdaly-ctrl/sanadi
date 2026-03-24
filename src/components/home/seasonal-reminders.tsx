"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Bug, Droplets, Flame, CloudRain, ShieldCheck, Snowflake, SprayCan, Leaf, Wind, Paintbrush, Sprout } from "lucide-react";

type HomeFeatures = {
  garden?: boolean;
  balcony?: boolean;
  parking?: boolean;
  elevator?: boolean;
  swimmingPool?: boolean;
  centralHeating?: boolean;
};

interface HomeProfileData {
  acType?: string;
  waterHeaterType?: string;
  features?: HomeFeatures;
}

interface Reminder {
  icon: React.ComponentType<{ className?: string }>;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  categorySlug: string;
  color: string;
}

interface SeasonalRemindersProps {
  profile: HomeProfileData;
  locale?: string;
}

export function SeasonalReminders({ profile, locale = "en" }: SeasonalRemindersProps) {
  const isAr = locale === "ar";
  const month = new Date().getMonth(); // 0-based

  const reminders: Reminder[] = [];

  // Summer: Jun(5) - Aug(7)
  if (month >= 5 && month <= 7) {
    if (profile.acType && profile.acType !== "none") {
      reminders.push({
        icon: Thermometer,
        titleEn: "Service Your AC",
        titleAr: "صيانة التكييف",
        descEn: "Summer heat is here. Have your AC serviced for maximum efficiency.",
        descAr: "جاء حر الصيف. قم بصيانة مكيفك للحصول على أقصى كفاءة.",
        categorySlug: "ac-maintenance",
        color: "bg-orange-50 border-orange-200",
      });
    }
    reminders.push({
      icon: Bug,
      titleEn: "Schedule Pest Control",
      titleAr: "مكافحة الحشرات",
      descEn: "Summer is peak season for insects. Protect your home proactively.",
      descAr: "الصيف هو موسم الحشرات. احمِ منزلك بشكل استباقي.",
      categorySlug: "pest-control",
      color: "bg-yellow-50 border-yellow-200",
    });
    reminders.push({
      icon: Droplets,
      titleEn: "Check Water Tank",
      titleAr: "فحص خزان الماء",
      descEn: "High temperatures increase bacteria in water tanks. Clean and inspect now.",
      descAr: "درجات الحرارة المرتفعة تزيد البكتيريا في خزانات الماء. نظف وافحص الآن.",
      categorySlug: "plumbing",
      color: "bg-blue-50 border-blue-200",
    });
  }

  // Fall: Sep(8) - Nov(10)
  if (month >= 8 && month <= 10) {
    if (profile.features?.centralHeating) {
      reminders.push({
        icon: Flame,
        titleEn: "Prepare Heating System",
        titleAr: "تجهيز نظام التدفئة",
        descEn: "Winter is approaching. Get your heating system inspected before the cold.",
        descAr: "الشتاء قادم. افحص نظام التدفئة قبل البرد.",
        categorySlug: "heating",
        color: "bg-red-50 border-red-200",
      });
    }
    reminders.push({
      icon: CloudRain,
      titleEn: "Check Waterproofing",
      titleAr: "فحص العزل المائي",
      descEn: "Rain season is coming. Check roof and exterior waterproofing now.",
      descAr: "موسم الأمطار قادم. افحص عزل السطح والجدران الخارجية الآن.",
      categorySlug: "waterproofing",
      color: "bg-sky-50 border-sky-200",
    });
    if (profile.waterHeaterType && profile.waterHeaterType !== "none") {
      reminders.push({
        icon: Droplets,
        titleEn: "Service Water Heater",
        titleAr: "صيانة سخان الماء",
        descEn: "Before cold weather, flush and service your water heater.",
        descAr: "قبل الطقس البارد، قم بتنظيف وصيانة سخان الماء.",
        categorySlug: "plumbing",
        color: "bg-teal-50 border-teal-200",
      });
    }
  }

  // Winter: Dec(11) - Feb(1)
  if (month === 11 || month <= 1) {
    reminders.push({
      icon: Snowflake,
      titleEn: "Check Insulation",
      titleAr: "فحص العزل الحراري",
      descEn: "Good insulation keeps heating costs low. Check windows, doors, and walls.",
      descAr: "العزل الجيد يخفض تكاليف التدفئة. افحص النوافذ والأبواب والجدران.",
      categorySlug: "insulation",
      color: "bg-indigo-50 border-indigo-200",
    });
    if (profile.features?.centralHeating) {
      reminders.push({
        icon: Flame,
        titleEn: "Inspect Heating System",
        titleAr: "فحص نظام التدفئة",
        descEn: "Ensure your heating system is running efficiently this winter.",
        descAr: "تأكد من أن نظام التدفئة يعمل بكفاءة هذا الشتاء.",
        categorySlug: "heating",
        color: "bg-red-50 border-red-200",
      });
    }
    reminders.push({
      icon: ShieldCheck,
      titleEn: "Roof Leak Prevention",
      titleAr: "منع تسريب الأسطح",
      descEn: "Inspect your roof for cracks and potential leaks before winter rains.",
      descAr: "افحص السطح بحثاً عن الشقوق وأماكن التسرب قبل أمطار الشتاء.",
      categorySlug: "waterproofing",
      color: "bg-slate-50 border-slate-200",
    });
  }

  // Spring: Mar(2) - May(4)
  if (month >= 2 && month <= 4) {
    reminders.push({
      icon: SprayCan,
      titleEn: "Deep Cleaning for Ramadan/Eid",
      titleAr: "تنظيف عميق للرمضان/العيد",
      descEn: "Spring is the perfect time for a thorough home clean before the holy season.",
      descAr: "الربيع هو الوقت المثالي لتنظيف شامل للمنزل قبل الموسم المقدس.",
      categorySlug: "cleaning",
      color: "bg-purple-50 border-purple-200",
    });
    reminders.push({
      icon: Paintbrush,
      titleEn: "Paint Refresh",
      titleAr: "تجديد الدهانات",
      descEn: "Freshen up your home with a new coat of paint this spring.",
      descAr: "جدد مظهر منزلك بطبقة جديدة من الدهان هذا الربيع.",
      categorySlug: "painting",
      color: "bg-pink-50 border-pink-200",
    });
    if (profile.features?.garden) {
      reminders.push({
        icon: Sprout,
        titleEn: "Garden Maintenance",
        titleAr: "صيانة الحديقة",
        descEn: "Spring is ideal for pruning, planting, and refreshing your garden.",
        descAr: "الربيع هو الوقت المثالي لتقليم النباتات وزراعة حديقتك وتجديدها.",
        categorySlug: "garden",
        color: "bg-green-50 border-green-200",
      });
    }
  }

  if (reminders.length === 0) return null;

  const seasonLabel = (): string => {
    if (month >= 5 && month <= 7) return isAr ? "توصيات الصيف" : "Summer Reminders";
    if (month >= 8 && month <= 10) return isAr ? "توصيات الخريف" : "Fall Reminders";
    if (month === 11 || month <= 1) return isAr ? "توصيات الشتاء" : "Winter Reminders";
    return isAr ? "توصيات الربيع" : "Spring Reminders";
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg text-warm-900 flex items-center gap-2">
        <Leaf className="h-5 w-5 text-brand-500" />
        {seasonLabel()}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {reminders.map((reminder, i) => {
          const Icon = reminder.icon;
          return (
            <Card key={i} className={`border ${reminder.color} transition-all hover:shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-warm-900 text-sm mb-1">
                      {isAr ? reminder.titleAr : reminder.titleEn}
                    </h3>
                    <p className="text-xs text-warm-600 mb-3 leading-relaxed">
                      {isAr ? reminder.descAr : reminder.descEn}
                    </p>
                    <Link href={`/${locale}/post-job?category=${reminder.categorySlug}`}>
                      <Button size="sm" className="h-7 text-xs">
                        {isAr ? "احجز الآن" : "Book Now"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
