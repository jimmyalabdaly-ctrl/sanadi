"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, CheckCircle, Shield, Filter, SortAsc, ChevronRight, Zap } from "lucide-react";
import { JORDANIAN_CITIES, cn } from "@/lib/utils";

interface ProviderService {
  category: { name: string; nameAr: string; slug: string };
  priceMin: number | null;
  priceMax: number | null;
}

interface ServiceArea {
  city: string;
  area: string | null;
}

interface Provider {
  id: string;
  slug: string;
  businessName: string;
  businessNameAr: string;
  averageRating: number;
  totalJobsCompleted: number;
  totalReviews: number;
  responseTime: number;
  identityVerified: boolean;
  instantBookEnabled: boolean;
  tier: string;
  user: {
    id: string;
    firstName: string;
    firstNameAr: string;
    lastName: string;
    lastNameAr: string;
    avatar: string | null;
    city: string | null;
  };
  services: ProviderService[];
  serviceAreas: ServiceArea[];
}

function ProviderCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServiceCategoryPage({ params }: { params: { category: string } }) {
  const t = useTranslations("provider");
  const ts = useTranslations("services");
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL
  const cityParam = searchParams.get("city") ?? "";
  const sortParam = searchParams.get("sort") ?? "recommended";
  const minRatingParam = searchParams.get("minRating") ?? "0";
  const verifiedParam = searchParams.get("verified") === "true";
  const instantParam = searchParams.get("instant") === "true";
  const priceMinParam = parseInt(searchParams.get("priceMin") ?? "0");
  const priceMaxParam = parseInt(searchParams.get("priceMax") ?? "500");

  const [priceRange, setPriceRange] = useState([priceMinParam, priceMaxParam]);
  const [showFilters, setShowFilters] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState(
    params.category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
  const [categoryNameAr, setCategoryNameAr] = useState("");

  // Update URL params helper
  function updateParam(key: string, value: string | null) {
    const current = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "0" || value === "false") {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    router.replace(`${pathname}?${current.toString()}`);
  }

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params_url = new URLSearchParams();
      params_url.set("category", params.category);
      if (cityParam) params_url.set("city", cityParam);
      if (sortParam && sortParam !== "recommended") params_url.set("sort", sortParam);
      if (minRatingParam && minRatingParam !== "0") params_url.set("minRating", minRatingParam);
      if (verifiedParam) params_url.set("verified", "true");
      if (instantParam) params_url.set("instant", "true");
      if (priceMinParam > 0) params_url.set("priceMin", String(priceMinParam));
      if (priceMaxParam < 500) params_url.set("priceMax", String(priceMaxParam));

      const res = await fetch(`/api/providers?${params_url.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let results: Provider[] = data.providers ?? [];

      // Client-side filter by price range (since API doesn't support price filter yet)
      if (priceMinParam > 0 || priceMaxParam < 500) {
        results = results.filter((p) => {
          const svc = p.services.find((s) => s.category.slug === params.category);
          if (!svc || svc.priceMin == null) return true;
          return svc.priceMin <= priceMaxParam && (svc.priceMax ?? svc.priceMin) >= priceMinParam;
        });
      }

      // Client-side filter by verified
      if (verifiedParam) {
        results = results.filter((p) => p.identityVerified);
      }

      // Client-side filter by instant book
      if (instantParam) {
        results = results.filter((p) => p.instantBookEnabled);
      }

      // Client-side filter by min rating
      const minRating = parseFloat(minRatingParam);
      if (minRating > 0) {
        results = results.filter((p) => p.averageRating >= minRating);
      }

      // Client-side sort by price
      if (sortParam === "price-low") {
        results = [...results].sort((a, b) => {
          const aPrice = a.services.find((s) => s.category.slug === params.category)?.priceMin ?? 0;
          const bPrice = b.services.find((s) => s.category.slug === params.category)?.priceMin ?? 0;
          return aPrice - bPrice;
        });
      } else if (sortParam === "price-high") {
        results = [...results].sort((a, b) => {
          const aPrice = a.services.find((s) => s.category.slug === params.category)?.priceMin ?? 0;
          const bPrice = b.services.find((s) => s.category.slug === params.category)?.priceMin ?? 0;
          return bPrice - aPrice;
        });
      }

      setProviders(results);
      setTotal(results.length);

      // Extract category display name from first result
      if (results.length > 0) {
        const svc = results[0].services.find((s) => s.category.slug === params.category);
        if (svc) {
          setCategoryName(svc.category.name);
          setCategoryNameAr(svc.category.nameAr);
        }
      }
    } catch (err) {
      console.error("Failed to load providers:", err);
      setProviders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [params.category, cityParam, sortParam, minRatingParam, verifiedParam, instantParam, priceMinParam, priceMaxParam]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const displayCategoryName = locale === "ar" && categoryNameAr
    ? categoryNameAr
    : categoryName;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-warm-500 mb-6">
        <Link href={`/${locale}`} className="hover:text-brand-500">
          {locale === "ar" ? "الرئيسية" : "Home"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/${locale}/services`} className="hover:text-brand-500">
          {locale === "ar" ? "الخدمات" : "Services"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-warm-900 font-medium">{displayCategoryName}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">
          {displayCategoryName}
        </h1>
        <p className="text-warm-500">
          {loading ? "..." : `${total} ${ts("providersAvailable")}`}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className={cn("w-64 shrink-0 space-y-6", showFilters ? "block" : "hidden lg:block")}>
          <Card>
            <CardContent className="p-4 space-y-5">
              {/* City filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  {locale === "ar" ? "المدينة" : "City"}
                </Label>
                <Select
                  value={cityParam || "all"}
                  onValueChange={(v) => updateParam("city", v === "all" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "ar" ? "جميع المدن" : "All cities"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{locale === "ar" ? "جميع المدن" : "All cities"}</SelectItem>
                    {JORDANIAN_CITIES.map((c) => (
                      <SelectItem key={c.en} value={c.en}>
                        {locale === "ar" ? c.ar : c.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price range filter */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {locale === "ar" ? "نطاق السعر" : "Price Range"} ({priceRange[0]} - {priceRange[1]} {locale === "ar" ? "د.ا" : "JOD"})
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  onValueCommit={(v) => {
                    updateParam("priceMin", v[0] > 0 ? String(v[0]) : null);
                    updateParam("priceMax", v[1] < 500 ? String(v[1]) : null);
                  }}
                  max={500}
                  step={5}
                />
              </div>

              {/* Min rating filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  {locale === "ar" ? "التقييم" : "Min Rating"}
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateParam("minRating", minRatingParam === String(r) ? null : String(r))}
                      className={cn(
                        "flex items-center gap-0.5 px-2 py-1 rounded-full border text-xs transition-colors",
                        minRatingParam === String(r)
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-warm-200 hover:border-brand-500"
                      )}
                    >
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />{r}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified & instant book checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="verified"
                    checked={verifiedParam}
                    onCheckedChange={(checked) => updateParam("verified", checked ? "true" : null)}
                  />
                  <Label htmlFor="verified" className="text-sm cursor-pointer">
                    {t("verified")} {locale === "ar" ? "فقط" : "only"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="instant"
                    checked={instantParam}
                    onCheckedChange={(checked) => updateParam("instant", checked ? "true" : null)}
                  />
                  <Label htmlFor="instant" className="text-sm cursor-pointer">
                    {t("instantBookAvailable")} {locale === "ar" ? "فقط" : "only"}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Providers Grid */}
        <div className="flex-1">
          {/* Sort Bar */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 me-1" /> {locale === "ar" ? "تصفية" : "Filter"}
            </Button>
            <Select
              value={sortParam}
              onValueChange={(v) => updateParam("sort", v === "recommended" ? null : v)}
            >
              <SelectTrigger className="w-48">
                <SortAsc className="h-4 w-4 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">{locale === "ar" ? "الموصى بهم" : "Recommended"}</SelectItem>
                <SelectItem value="price-low">{locale === "ar" ? "السعر: الأقل" : "Price: Low to High"}</SelectItem>
                <SelectItem value="price-high">{locale === "ar" ? "السعر: الأعلى" : "Price: High to Low"}</SelectItem>
                <SelectItem value="rating">{locale === "ar" ? "التقييم" : "Highest Rated"}</SelectItem>
                <SelectItem value="response">{locale === "ar" ? "أسرع رد" : "Fastest Response"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <ProviderCardSkeleton key={i} />)
              : providers.length === 0
              ? (
                <div className="col-span-2 text-center py-16">
                  <p className="text-warm-500 text-lg">
                    {locale === "ar" ? "لا يوجد مزودون بهذه المعايير" : "No providers match your filters"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.replace(pathname)}
                  >
                    {locale === "ar" ? "إعادة ضبط الفلاتر" : "Reset filters"}
                  </Button>
                </div>
              )
              : providers.map((pro) => {
                  const displayName = locale === "ar"
                    ? `${pro.user.firstNameAr} ${pro.user.lastNameAr}`
                    : `${pro.user.firstName} ${pro.user.lastName}`;
                  const initials = `${pro.user.firstName[0] ?? ""}${pro.user.lastName[0] ?? ""}`.toUpperCase();
                  const cityDisplay = pro.serviceAreas[0]?.city ?? pro.user.city ?? "";
                  const svc = pro.services.find((s) => s.category.slug === params.category);
                  const priceMin = svc?.priceMin ?? null;
                  const isTopPro = pro.tier === "GOLD" || pro.tier === "PLATINUM";

                  return (
                    <Card key={pro.id} className="hover:shadow-medium transition-all duration-300 group">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-12 w-12">
                            {pro.user.avatar && (
                              <AvatarImage src={pro.user.avatar} alt={displayName} />
                            )}
                            <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-warm-900 truncate">{displayName}</h3>
                            <div className="flex items-center gap-1 text-sm text-warm-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {cityDisplay}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="font-semibold">{pro.averageRating.toFixed(1)}</span>
                            <span className="text-warm-400">({pro.totalReviews})</span>
                          </div>
                          <span className="text-warm-300">|</span>
                          <div className="flex items-center gap-1 text-warm-500">
                            <Clock className="h-3.5 w-3.5" />
                            {pro.responseTime} {t("minutesShort")}
                          </div>
                          <span className="text-warm-300">|</span>
                          <span className="text-warm-500">
                            {pro.totalJobsCompleted} {locale === "ar" ? "عمل" : "jobs"}
                          </span>
                        </div>

                        <div className="flex gap-1.5 mb-3 flex-wrap">
                          {pro.identityVerified && (
                            <Badge variant="default" className="text-[10px]">
                              <CheckCircle className="h-3 w-3 me-0.5" />{t("verified")}
                            </Badge>
                          )}
                          {isTopPro && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Shield className="h-3 w-3 me-0.5" />{t("topPro")}
                            </Badge>
                          )}
                          {pro.instantBookEnabled && (
                            <Badge variant="success" className="text-[10px]">
                              <Zap className="h-3 w-3 me-0.5" />{t("instantBookAvailable")}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          {priceMin != null ? (
                            <p className="text-sm text-warm-600">
                              {t("startingFrom")} <span className="font-semibold text-warm-900">{priceMin} {locale === "ar" ? "د.ا" : "JOD"}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-warm-400">
                              {locale === "ar" ? "اتصل للسعر" : "Contact for price"}
                            </p>
                          )}
                          <Link href={`/${locale}/pro/${pro.slug}`}>
                            <Button size="sm">{t("getQuote")}</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}
