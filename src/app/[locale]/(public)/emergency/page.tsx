"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Phone, Clock, Shield, Star, MapPin, Loader2 } from "lucide-react";

interface EmergencyProvider {
  id: string;
  slug: string;
  businessName: string;
  businessNameAr: string;
  averageRating: number;
  totalReviews: number;
  responseTime: number;
  identityVerified: boolean;
  user: {
    id: string;
    firstName: string;
    firstNameAr: string;
    lastName: string;
    lastNameAr: string;
    avatar: string | null;
    phone: string | null;
    city: string | null;
    area: string | null;
  };
  services: Array<{
    category: { name: string; nameAr: string; slug: string };
    priceMin: number | null;
    priceMax: number | null;
  }>;
}

interface ServiceCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
}

const EMERGENCY_SLUGS = ["plumbing", "electrical", "locksmith", "glass-repair", "glass"];

export default function EmergencyPage() {
  const t = useTranslations("emergency");
  const { locale } = useLocale();
  const { data: session } = useSession();
  const isAr = locale === "ar";

  const [providers, setProviders] = useState<EmergencyProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providersRes, categoriesRes] = await Promise.all([
          fetch("/api/providers?sort=response&limit=8"),
          fetch("/api/services"),
        ]);
        const [providersData, categoriesData] = await Promise.all([
          providersRes.json(),
          categoriesRes.json(),
        ]);

        if (providersData.providers) {
          // Filter providers who offer emergency-related services
          const emergencyProviders = providersData.providers.filter(
            (p: EmergencyProvider) =>
              p.services.some((s) =>
                EMERGENCY_SLUGS.some(
                  (slug) =>
                    s.category.slug === slug ||
                    s.category.slug.includes("plumb") ||
                    s.category.slug.includes("electr")
                )
              )
          );
          setProviders(emergencyProviders.length > 0 ? emergencyProviders : providersData.providers.slice(0, 4));
        }

        if (categoriesData.categories) {
          // Filter to emergency-relevant categories
          const emergencyCats = categoriesData.categories.filter((c: ServiceCategory) =>
            EMERGENCY_SLUGS.some((slug) => c.slug === slug || c.slug.includes(slug.split("-")[0]))
          );
          setCategories(emergencyCats.length > 0 ? emergencyCats : categoriesData.categories.slice(0, 4));
        }
      } catch {
        // Errors handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEmergencyRequest = async (categoryId: string, categoryName: string) => {
    if (!session?.user?.id) {
      window.location.href = `/${locale}/login?redirect=/${locale}/emergency`;
      return;
    }

    setRequesting(categoryId);
    setRequestError("");

    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: `Emergency ${categoryName} Service`,
          titleAr: `خدمة طوارئ ${categoryName}`,
          description: "Emergency service request — immediate assistance required.",
          descriptionAr: "طلب خدمة طارئة — مساعدة فورية مطلوبة.",
          urgency: "EMERGENCY",
          city: "Amman",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create request");
      }

      setRequestSuccess(categoryId);
      setTimeout(() => setRequestSuccess(null), 3000);
    } catch {
      setRequestError(isAr ? "فشل إرسال الطلب. حاول مرة أخرى." : "Failed to send request. Please try again.");
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 animate-pulse-emergency">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-red-900 mb-2">{t("title")}</h1>
        <p className="text-red-700">{t("subtitle")}</p>
      </div>

      {/* Emergency Category Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-[12px] bg-warm-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {categories.map((cat) => (
            <Card key={cat.id} className="hover:shadow-medium transition-all hover:-translate-y-1 cursor-pointer border-red-100">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="font-heading font-semibold text-warm-900 mb-1">
                  {isAr ? cat.nameAr : cat.name}
                </h3>
                <p className="text-sm text-warm-500 mb-3">
                  {isAr ? "متاح الآن" : "Available now"}
                </p>
                {requestSuccess === cat.id ? (
                  <Badge variant="success" className="w-full justify-center py-2">
                    {isAr ? "تم إرسال الطلب!" : "Request sent!"}
                  </Badge>
                ) : (
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={requesting === cat.id}
                    onClick={() => handleEmergencyRequest(cat.id, isAr ? cat.nameAr : cat.name)}
                  >
                    {requesting === cat.id ? (
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                    ) : null}
                    {t("requestEmergency")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {requestError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-[8px] mb-4 text-center">{requestError}</p>
      )}

      {/* Available Emergency Providers */}
      {!loading && providers.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading font-semibold text-warm-900 mb-4">
            {isAr ? "مزودو الخدمة المتاحون الآن" : "Available Providers Now"}
          </h2>
          <div className="space-y-3">
            {providers.slice(0, 4).map((provider) => {
              const providerName = isAr
                ? `${provider.user.firstNameAr} ${provider.user.lastNameAr}`
                : `${provider.user.firstName} ${provider.user.lastName}`;
              const businessName = isAr ? provider.businessNameAr : provider.businessName;
              const initials = `${provider.user.firstName[0] ?? ""}${provider.user.lastName[0] ?? ""}`.toUpperCase();

              return (
                <Card key={provider.id} className="border-warm-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {provider.user.avatar && (
                          <AvatarImage src={provider.user.avatar} alt={providerName} />
                        )}
                        <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-warm-900 truncate">{businessName}</p>
                        <div className="flex items-center gap-3 text-xs text-warm-500 mt-0.5">
                          {provider.user.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {provider.user.city}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            &lt;{provider.responseTime} {isAr ? "دقيقة" : "min"}
                          </span>
                          {provider.averageRating > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {provider.averageRating.toFixed(1)}
                            </span>
                          )}
                          {provider.identityVerified && (
                            <span className="flex items-center gap-0.5 text-green-600">
                              <Shield className="h-3 w-3" />
                              {isAr ? "موثق" : "Verified"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {provider.user.phone && (
                          <a href={`tel:${provider.user.phone}`}>
                            <Button size="sm" variant="destructive">
                              <Phone className="h-3.5 w-3.5 me-1" />
                              {isAr ? "اتصل" : "Call"}
                            </Button>
                          </a>
                        )}
                        <Link href={`/${locale}/pro/${provider.slug}`}>
                          <Button size="sm" variant="outline">
                            {isAr ? "الملف" : "Profile"}
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
      )}

      <div className="flex items-center gap-3 p-4 rounded-[12px] bg-red-50 border border-red-200 text-center justify-center mb-8">
        <Clock className="h-5 w-5 text-red-600 shrink-0" />
        <p className="text-sm text-red-800">{t("note")}</p>
      </div>

      <div className="text-center">
        <p className="text-warm-500 mb-3">
          {isAr ? "تحتاج مساعدة فورية؟" : "Need immediate help?"}
        </p>
        <a href="tel:+96265000000">
          <Button variant="destructive" size="lg" className="gap-2">
            <Phone className="h-5 w-5" />
            {t("callNow")}: +962 6 500 0000
          </Button>
        </a>
      </div>
    </div>
  );
}
