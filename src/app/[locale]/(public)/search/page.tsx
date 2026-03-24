"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, List, Map, Sparkles, Clock, CheckCircle } from "lucide-react";
import { JORDANIAN_CITIES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MapWrapper } from "@/components/maps/map-wrapper";
import type { MapProvider } from "@/components/maps/provider-map";

interface SearchProvider {
  id: string;
  slug: string;
  businessName: string;
  businessNameAr: string;
  averageRating: number;
  totalReviews: number;
  totalJobsCompleted: number;
  responseTime: number;
  identityVerified: boolean;
  instantBookEnabled: boolean;
  user: {
    id: string;
    firstName: string;
    firstNameAr: string;
    lastName: string;
    lastNameAr: string;
    avatar: string | null;
    city: string | null;
  };
  services: Array<{
    category: { name: string; nameAr: string; slug: string };
  }>;
}

interface SearchCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  _count?: { providerServices: number };
}

function ResultSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCity = searchParams.get("city") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [view, setView] = useState<"list" | "map">("list");
  const [providers, setProviders] = useState<SearchProvider[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMonth = new Date().getMonth();
  const isSummer = currentMonth >= 4 && currentMonth <= 9;

  const suggestions = locale === "ar"
    ? isSummer
      ? ["صيانة تكييف", "تنظيف عميق", "عزل أسطح", "مكافحة حشرات"]
      : ["تدفئة", "سباكة", "كهرباء", "دهانات"]
    : isSummer
    ? ["AC Maintenance", "Deep Cleaning", "Roof Waterproofing", "Pest Control"]
    : ["Heating Repair", "Plumbing", "Electrical", "Painting"];

  const performSearch = useCallback(async (q: string, c: string) => {
    if (!q.trim()) {
      setProviders([]);
      setCategories([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ q });
      if (c) params.set("city", c);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setProviders(data.providers ?? []);
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error("Search error:", err);
      setProviders([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Update URL params
      const current = new URLSearchParams();
      if (query) current.set("q", query);
      if (city) current.set("city", city);
      const qs = current.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
      performSearch(query, city);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, city, performSearch, pathname, router]);

  // On mount, run initial search if URL params exist
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSuggestionClick(s: string) {
    setQuery(s);
  }

  const totalResults = providers.length + categories.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-heading font-bold text-warm-900 mb-4 text-center">
          {locale === "ar" ? "بحث عن خدمات ومحترفين" : "Search Services & Pros"}
        </h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن خدمة أو محترف..." : "Search for a service or pro..."}
              className="ps-10 h-12"
              autoFocus
            />
          </div>
          <Select value={city || "all"} onValueChange={(v) => setCity(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40 h-12">
              <MapPin className="h-4 w-4 me-1 text-warm-400" />
              <SelectValue placeholder={locale === "ar" ? "المدينة" : "City"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "ar" ? "كل المدن" : "All cities"}</SelectItem>
              {JORDANIAN_CITIES.map((c) => (
                <SelectItem key={c.en} value={c.en}>
                  {locale === "ar" ? c.ar : c.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seasonal Suggestions */}
        <div className="mt-4 p-4 rounded-[12px] bg-brand-50 border border-brand-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-brand-700">
              {locale === "ar" ? "توصيات موسمية" : "Seasonal Recommendations"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 rounded-full bg-white text-brand-600 text-sm border border-brand-200 hover:bg-brand-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        {hasSearched && !loading && (
          <p className="text-sm text-warm-500">
            {totalResults > 0
              ? locale === "ar"
                ? `${totalResults} نتيجة`
                : `${totalResults} results`
              : locale === "ar"
              ? "لا توجد نتائج"
              : "No results found"}
          </p>
        )}
        <div className="ms-auto flex rounded-[8px] border border-warm-200 overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={cn("px-3 py-1.5 text-sm", view === "list" ? "bg-brand-500 text-white" : "bg-white text-warm-600")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("map")}
            className={cn("px-3 py-1.5 text-sm", view === "map" ? "bg-brand-500 text-white" : "bg-white text-warm-600")}
          >
            <Map className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="h-[520px] rounded-[12px] overflow-hidden border border-warm-200">
          <MapWrapper
            providers={providers.map((pro): MapProvider => ({
              id: pro.id,
              name: locale === "ar"
                ? `${pro.user.firstNameAr} ${pro.user.lastNameAr}`
                : `${pro.user.firstName} ${pro.user.lastName}`,
              slug: pro.slug,
              city: pro.user.city,
              rating: pro.averageRating,
              category: pro.services[0]
                ? (locale === "ar" ? pro.services[0].category.nameAr : pro.services[0].category.name)
                : "",
            }))}
            locale={locale}
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <ResultSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !hasSearched && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500">
                {locale === "ar" ? "ابحث للعثور على محترفين" : "Search to find providers"}
              </p>
            </div>
          )}

          {!loading && hasSearched && totalResults === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-700 font-medium mb-2">
                {locale === "ar" ? "لا توجد نتائج" : "No results found"}
              </p>
              <p className="text-warm-500 text-sm">
                {locale === "ar"
                  ? `لا يوجد محترفون أو خدمات لـ "${query}"`
                  : `No providers or services found for "${query}"`}
              </p>
            </div>
          )}

          {/* Category results */}
          {!loading && categories.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wider mb-3">
                {locale === "ar" ? "فئات الخدمات" : "Service Categories"}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/${locale}/services/${cat.slug}`}>
                    <Card className="hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 text-lg font-bold">
                          {(locale === "ar" ? cat.nameAr : cat.name).charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-warm-900 text-sm">
                            {locale === "ar" ? cat.nameAr : cat.name}
                          </h3>
                          {cat._count && (
                            <p className="text-xs text-warm-500">
                              {cat._count.providerServices} {locale === "ar" ? "مزود" : "providers"}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Provider results */}
          {!loading && providers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wider mb-3">
                {locale === "ar" ? "المحترفون" : "Providers"}
              </h2>
              <div className="space-y-3">
                {providers.map((pro) => {
                  const displayName = locale === "ar"
                    ? `${pro.user.firstNameAr} ${pro.user.lastNameAr}`
                    : `${pro.user.firstName} ${pro.user.lastName}`;
                  const initials = `${pro.user.firstName[0] ?? ""}${pro.user.lastName[0] ?? ""}`.toUpperCase();
                  const categoryLabel = pro.services[0]
                    ? (locale === "ar" ? pro.services[0].category.nameAr : pro.services[0].category.name)
                    : "";
                  const cityDisplay = pro.user.city ?? "";

                  return (
                    <Card key={pro.id} className="hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5 group">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 shrink-0">
                            {pro.user.avatar && (
                              <AvatarImage src={pro.user.avatar} alt={displayName} />
                            )}
                            <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-warm-900">{displayName}</h3>
                              {pro.identityVerified && (
                                <Badge variant="default" className="text-[10px]">
                                  <CheckCircle className="h-3 w-3 me-0.5" />
                                  {locale === "ar" ? "موثّق" : "Verified"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-warm-500 truncate">{categoryLabel}</p>
                            <div className="flex items-center gap-3 text-xs text-warm-500 mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {pro.averageRating.toFixed(1)} ({pro.totalReviews})
                              </span>
                              {cityDisplay && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />{cityDisplay}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {pro.responseTime}m
                              </span>
                            </div>
                          </div>

                          <Link href={`/${locale}/pro/${pro.slug}`}>
                            <Button size="sm" variant="outline">
                              {locale === "ar" ? "عرض" : "View"}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
