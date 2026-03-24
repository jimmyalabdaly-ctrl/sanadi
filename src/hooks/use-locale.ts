"use client";

import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { Locale } from "@/lib/i18n";

export function useLocale() {
  const locale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      const segments = pathname.split("/");
      segments[1] = newLocale;
      const newPath = segments.join("/");
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      localStorage.setItem("locale", newLocale);
      router.push(newPath);
    },
    [pathname, router]
  );

  const t = useCallback(
    (en: string, ar: string) => (locale === "ar" ? ar : en),
    [locale]
  );

  return { locale, isRtl, dir, switchLocale, t };
}
