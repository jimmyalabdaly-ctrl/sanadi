import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale: string = "en"): string {
  if (locale === "ar") {
    return `${amount.toFixed(2)} د.ا`;
  }
  return `${amount.toFixed(2)} JOD`;
}

export function formatCurrencyRange(min: number, max: number, locale: string = "en"): string {
  if (locale === "ar") {
    return `${min} - ${max} د.ا`;
  }
  return `${min} - ${max} JOD`;
}

export function formatPhone(phone: string): string {
  if (phone.startsWith("+962")) return phone;
  if (phone.startsWith("0")) return `+962${phone.slice(1)}`;
  return `+962${phone}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function timeAgo(date: Date, locale: string = "en"): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === "ar") {
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-JO");
  }

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US");
}

export function getRatingLabel(rating: number, locale: string = "en"): string {
  const labels: Record<string, Record<string, string>> = {
    en: { excellent: "Excellent", good: "Good", average: "Average", poor: "Poor", terrible: "Terrible" },
    ar: { excellent: "ممتاز", good: "جيد", average: "متوسط", poor: "ضعيف", terrible: "سيء" },
  };
  const l = labels[locale] || labels.en;
  if (rating >= 4.5) return l.excellent;
  if (rating >= 3.5) return l.good;
  if (rating >= 2.5) return l.average;
  if (rating >= 1.5) return l.poor;
  return l.terrible;
}

export const JORDANIAN_CITIES = [
  { en: "Amman", ar: "عمّان" },
  { en: "Irbid", ar: "إربد" },
  { en: "Zarqa", ar: "الزرقاء" },
  { en: "Aqaba", ar: "العقبة" },
  { en: "Salt", ar: "السلط" },
  { en: "Madaba", ar: "مادبا" },
  { en: "Jerash", ar: "جرش" },
  { en: "Mafraq", ar: "المفرق" },
  { en: "Karak", ar: "الكرك" },
  { en: "Tafilah", ar: "الطفيلة" },
  { en: "Ma'an", ar: "معان" },
  { en: "Ajloun", ar: "عجلون" },
  { en: "Balqa", ar: "البلقاء" },
];

export const AMMAN_AREAS = [
  { en: "Abdoun", ar: "عبدون" },
  { en: "Shmeisani", ar: "الشميساني" },
  { en: "Jabal Amman", ar: "جبل عمّان" },
  { en: "Tlaa Al-Ali", ar: "تلاع العلي" },
  { en: "University Street", ar: "شارع الجامعة" },
  { en: "Khalda", ar: "خلدا" },
  { en: "Dabouq", ar: "دابوق" },
  { en: "Rabieh", ar: "الرابية" },
  { en: "Sweifieh", ar: "الصويفية" },
  { en: "Mecca Street", ar: "شارع مكة" },
  { en: "Gardens", ar: "الجاردنز" },
  { en: "Jubeiha", ar: "الجبيهة" },
  { en: "Tabarbour", ar: "طبربور" },
  { en: "Abu Alanda", ar: "أبو علندا" },
  { en: "Marj Al-Hamam", ar: "مرج الحمام" },
  { en: "Al-Hashmi", ar: "الهاشمي" },
  { en: "Jabal Hussein", ar: "جبل الحسين" },
  { en: "Wehdat", ar: "الوحدات" },
];
