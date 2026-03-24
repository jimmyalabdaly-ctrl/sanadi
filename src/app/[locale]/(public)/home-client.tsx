"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Star, Clock, CheckCircle, Shield, ArrowRight, ArrowLeft,
  Droplets, Zap, Paintbrush, Wind, Sparkles, Hammer, Grid3X3, Umbrella,
  Truck, TreePine, Square, Wifi, AlertTriangle, ChevronRight, ChevronLeft,
  Phone, Award, Users, Building2, Calendar, Wrench, Calculator,
} from "lucide-react";
import { JORDANIAN_CITIES } from "@/lib/utils";

const serviceIcons: Record<string, React.ElementType> = {
  plumbing: Droplets, electrical: Zap, painting: Paintbrush, "ac-repair": Wind,
  cleaning: Sparkles, carpentry: Hammer, tiling: Grid3X3, waterproofing: Umbrella,
  moving: Truck, gardening: TreePine, aluminum: Square, satellite: Wifi,
};

const serviceColors = [
  "bg-blue-50 text-blue-600", "bg-yellow-50 text-yellow-600", "bg-orange-50 text-orange-600",
  "bg-cyan-50 text-cyan-600", "bg-pink-50 text-pink-600", "bg-amber-50 text-amber-700",
  "bg-indigo-50 text-indigo-600", "bg-teal-50 text-teal-600", "bg-violet-50 text-violet-600",
  "bg-green-50 text-green-600", "bg-slate-50 text-slate-600", "bg-sky-50 text-sky-600",
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export interface CategoryData {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  averagePriceMin: number | null;
  averagePriceMax: number | null;
  _count: { providerServices: number };
}

export interface ProviderData {
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
  services: Array<{
    category: { name: string; nameAr: string; slug: string };
  }>;
}

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  commentAr: string | null;
  createdAt: string;
  reviewer: {
    firstName: string;
    firstNameAr: string;
    lastName: string;
    lastNameAr: string;
    city: string | null;
    avatar: string | null;
  };
  reviewee: {
    firstName: string;
    firstNameAr: string;
  };
}

export interface StatsData {
  users: number;
  providers: number;
  completedBookings: number;
  cities: number;
}

interface HomeClientProps {
  categories: CategoryData[];
  providers: ProviderData[];
  reviews: ReviewData[];
  stats: StatsData;
}

export default function HomeClient({ categories, providers, reviews, stats }: HomeClientProps) {
  const t = useTranslations();
  const ts = useTranslations("services");
  const th = useTranslations("hero");
  const tw = useTranslations("howItWorks");
  const tst = useTranslations("stats");
  const tt = useTranslations("testimonials");
  const tc = useTranslations("costGuide");
  const tcta = useTranslations("cta");
  const te = useTranslations("emergency");
  const tse = useTranslations("seasonal");
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const ChevronNext = isRtl ? ChevronLeft : ChevronRight;

  const currentMonth = new Date().getMonth();
  const isSummer = currentMonth >= 4 && currentMonth <= 9;
  const isWinter = currentMonth >= 10 || currentMonth <= 2;

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCity) params.set("city", selectedCity);
    router.push(`/${locale}/search?${params.toString()}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  // Use real categories from DB, fall back to legacy service keys for icons
  const displayCategories = categories.length > 0 ? categories : [];

  // Stats values: use real data when non-zero, otherwise show at least 1
  const statValues = [
    { value: Math.max(stats.completedBookings, 0), suffix: "+", label: tst("jobsCompleted"), icon: CheckCircle },
    { value: Math.max(stats.providers, 0), suffix: "+", label: tst("verifiedPros"), icon: Award },
    { value: Math.max(stats.cities, 0), suffix: "", label: tst("citiesCovered"), icon: Building2 },
    { value: Math.max(stats.users, 0), suffix: "+", label: tst("happyCustomers"), icon: Users },
  ];

  return (
    <div className="overflow-hidden">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 start-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 end-20 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div
            initial="hidden" animate="visible" variants={fadeUpVariants}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold mb-4 leading-tight">
              {th("title")}
            </h1>
            <p className="text-lg md:text-xl text-brand-100 mb-8">
              {th("subtitle")}
            </p>

            {/* Search Bar */}
            <motion.div
              variants={fadeUpVariants}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[16px] p-2 shadow-large flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto"
            >
              <div className="flex-1 relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={th("searchPlaceholder")}
                  className="ps-10 border-0 bg-warm-50 text-warm-900 placeholder:text-warm-400 h-12"
                />
              </div>
              <div className="sm:w-48">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="border-0 bg-warm-50 text-warm-900 h-12">
                    <MapPin className="h-4 w-4 text-warm-400 me-1" />
                    <SelectValue placeholder={th("locationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {JORDANIAN_CITIES.map((city) => (
                      <SelectItem key={city.en} value={city.en}>
                        {locale === "ar" ? city.ar : city.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="lg" className="h-12 px-8" onClick={handleSearch}>
                <Search className="h-5 w-5 me-2" />
                {th("searchButton")}
              </Button>
            </motion.div>

            <p className="text-sm text-brand-200 mt-4">{th("popularSearches")}</p>
          </motion.div>
        </div>
      </section>

      {/* ==================== POPULAR SERVICES ==================== */}
      <section className="py-16 bg-warm-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">
              {ts("title")}
            </h2>
            <p className="text-warm-500">{ts("subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayCategories.map((cat, i) => {
              const Icon = serviceIcons[cat.slug] || Wrench;
              const color = serviceColors[i % serviceColors.length];
              return (
                <motion.div
                  key={cat.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUpVariants}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/${locale}/services/${cat.slug}`}>
                    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0">
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-[12px] ${color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-sm text-warm-800 mb-1">
                          {locale === "ar" ? cat.nameAr : cat.name}
                        </h3>
                        {cat.averagePriceMin != null && (
                          <p className="text-xs text-warm-500">
                            {ts("startingFrom")} {cat.averagePriceMin} {locale === "ar" ? "د.ا" : "JOD"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">
              {tw("title")}
            </h2>
            <p className="text-warm-500">{tw("subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { num: 1, title: tw("step1Title"), desc: tw("step1Desc"), icon: Calendar, color: "bg-brand-500" },
              { num: 2, title: tw("step2Title"), desc: tw("step2Desc"), icon: Users, color: "bg-amber-500" },
              { num: 3, title: tw("step3Title"), desc: tw("step3Desc"), icon: CheckCircle, color: "bg-green-500" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUpVariants} transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-warm-100 text-warm-600 font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="font-heading font-semibold text-lg text-warm-900 mb-2">{step.title}</h3>
                <p className="text-sm text-warm-500">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="py-12 bg-brand-500 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {statValues.map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUpVariants} transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-brand-200" />
                <div className="text-3xl md:text-4xl font-heading font-bold mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-brand-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TOP RATED PROS ==================== */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold text-warm-900">
                {locale === "ar" ? "أفضل المحترفين" : "Top Rated Pros"}
              </h2>
              <p className="text-warm-500 text-sm mt-1">
                {locale === "ar" ? "محترفون حصلوا على أعلى التقييمات" : "Highest rated professionals on Sanadi"}
              </p>
            </div>
            <Link href={`/${locale}/services`}>
              <Button variant="outline" size="sm">
                {t("common.seeAll")} <ChevronNext className="h-4 w-4 ms-1" />
              </Button>
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
            {providers.map((pro, i) => {
              const displayName = locale === "ar"
                ? `${pro.user.firstNameAr} ${pro.user.lastNameAr}`
                : `${pro.user.firstName} ${pro.user.lastName}`;
              const initials = `${pro.user.firstName[0] ?? ""}${pro.user.lastName[0] ?? ""}`.toUpperCase();
              const categoryLabel = pro.services[0]
                ? (locale === "ar" ? pro.services[0].category.nameAr : pro.services[0].category.name)
                : "";
              const cityDisplay = pro.user.city ?? "";

              return (
                <motion.div
                  key={pro.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUpVariants} transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="snap-start shrink-0 w-72"
                >
                  <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          {pro.user.avatar && <AvatarImage src={pro.user.avatar} alt={displayName} />}
                          <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-warm-900 truncate">{displayName}</h3>
                          <p className="text-sm text-warm-500">{categoryLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-semibold text-warm-900">{pro.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-warm-400">&bull;</span>
                        <span className="text-warm-500">{pro.totalJobsCompleted} {locale === "ar" ? "عمل" : "jobs"}</span>
                        <span className="text-warm-400">&bull;</span>
                        <span className="text-warm-500">{cityDisplay}</span>
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {pro.identityVerified && (
                          <Badge variant="default" className="text-[10px]">
                            {locale === "ar" ? "موثّق" : "Verified"}
                          </Badge>
                        )}
                        {pro.instantBookEnabled && (
                          <Badge variant="secondary" className="text-[10px]">
                            {locale === "ar" ? "حجز فوري" : "Instant Book"}
                          </Badge>
                        )}
                      </div>
                      <Link href={`/${locale}/pro/${pro.slug}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          {locale === "ar" ? "عرض الملف" : "View Profile"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="py-16 bg-warm-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">{tt("title")}</h2>
            <p className="text-warm-500">{tt("subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {reviews.map((review, i) => {
              const reviewerName = locale === "ar"
                ? `${review.reviewer.firstNameAr} ${review.reviewer.lastNameAr}`
                : `${review.reviewer.firstName} ${review.reviewer.lastName}`;
              const reviewerInitials = `${review.reviewer.firstName[0] ?? ""}${review.reviewer.lastName[0] ?? ""}`.toUpperCase();
              const reviewText = locale === "ar"
                ? (review.commentAr || review.comment || "")
                : (review.comment || review.commentAr || "");
              const city = review.reviewer.city ?? "";

              return (
                <motion.div
                  key={review.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUpVariants} transition={{ duration: 0.4, delay: i * 0.15 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`h-4 w-4 ${j < review.rating ? "text-amber-500 fill-amber-500" : "text-warm-200"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-warm-600 mb-4 leading-relaxed line-clamp-4">{reviewText}</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {review.reviewer.avatar && <AvatarImage src={review.reviewer.avatar} alt={reviewerName} />}
                          <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                            {reviewerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-warm-900">{reviewerName}</p>
                          <p className="text-xs text-warm-500">{city}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== COST GUIDE ==================== */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">{tc("title")}</h2>
            <p className="text-warm-500">{tc("subtitle")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {displayCategories.slice(0, 6).map((cat, i) => {
              const Icon = serviceIcons[cat.slug] || Wrench;
              const color = serviceColors[i % serviceColors.length];
              return (
                <Card key={cat.id} className="hover:shadow-medium transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-[10px] ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-warm-900">
                        {locale === "ar" ? cat.nameAr : cat.name}
                      </h3>
                      {cat.averagePriceMin != null && cat.averagePriceMax != null ? (
                        <p className="text-sm text-warm-500">
                          {cat.averagePriceMin} - {cat.averagePriceMax} {locale === "ar" ? "د.ا" : "JOD"}
                        </p>
                      ) : (
                        <p className="text-sm text-warm-500">{locale === "ar" ? "يتفاوت السعر" : "Price varies"}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Calculator CTA */}
          <div className="text-center mt-8">
            <Link href={`/${locale}/calculator`}>
              <Button variant="outline" size="lg" className="border-brand-300 text-brand-700 hover:bg-brand-50">
                <Calculator className="h-4 w-4 me-2" />
                {locale === "ar" ? "جرّب حاسبة التكلفة التفصيلية" : "Try the detailed cost calculator"}
                <ArrowIcon className="h-4 w-4 ms-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== EMERGENCY SERVICES ==================== */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center animate-pulse shrink-0">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-red-900">{te("title")}</h2>
                <p className="text-sm text-red-700">{te("subtitle")}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {["plumbing", "electrical", "locksmith", "glass"].map((key) => (
                <Link key={key} href={`/${locale}/emergency`}>
                  <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                    {te(key as never)}
                  </Button>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== SEASONAL RECOMMENDATIONS ==================== */}
      <section className="py-16 bg-gradient-to-br from-brand-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-warm-900 mb-2">
              {isSummer ? tse("summer") : isWinter ? tse("winter") : tse("ramadan")}
            </h2>
            <p className="text-warm-500">
              {isSummer ? tse("summerDesc") : isWinter ? tse("winterDesc") : tse("ramadanDesc")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {(isSummer
              ? [{ icon: Wind, name: locale === "ar" ? "تكييف" : "AC Repair", color: "bg-cyan-50 text-cyan-600" },
                 { icon: Droplets, name: locale === "ar" ? "تنظيف خزانات" : "Tank Cleaning", color: "bg-blue-50 text-blue-600" },
                 { icon: Sparkles, name: locale === "ar" ? "تنظيف" : "Cleaning", color: "bg-pink-50 text-pink-600" },
                 { icon: TreePine, name: locale === "ar" ? "حدائق" : "Gardening", color: "bg-green-50 text-green-600" }]
              : [{ icon: Wrench, name: locale === "ar" ? "صيانة تدفئة" : "Heating Repair", color: "bg-orange-50 text-orange-600" },
                 { icon: Umbrella, name: locale === "ar" ? "عزل مائي" : "Waterproofing", color: "bg-teal-50 text-teal-600" },
                 { icon: Paintbrush, name: locale === "ar" ? "دهانات" : "Painting", color: "bg-yellow-50 text-yellow-600" },
                 { icon: Sparkles, name: locale === "ar" ? "تنظيف" : "Cleaning", color: "bg-pink-50 text-pink-600" }]
            ).map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUpVariants} transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="hover:shadow-medium transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-5 text-center">
                    <div className={`w-12 h-12 rounded-[12px] ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-sm text-warm-800">{item.name}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BECOME A PRO CTA ==================== */}
      <section className="py-16 bg-warm-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Award className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">{tcta("becomePro")}</h2>
            <p className="text-warm-400 mb-6">{tcta("becomeProSubtitle")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/${locale}/become-a-pro`}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  {tcta("joinNow")}
                  <ArrowIcon className="h-4 w-4 ms-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== DOWNLOAD APP CTA ==================== */}
      <section className="py-16 bg-gradient-to-r from-brand-500 to-brand-700 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUpVariants} transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Phone className="h-12 w-12 mx-auto mb-4 text-brand-200" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">{tcta("downloadApp")}</h2>
            <p className="text-brand-100 mb-6">{tcta("downloadSubtitle")}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                {tcta("appStore")}
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                {tcta("googlePlay")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== POST FIRST JOB CTA ==================== */}
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <Link href={`/${locale}/post-job`}>
            <Button variant="secondary" size="lg" className="text-lg px-10 py-6 shadow-medium">
              {tcta("postFirstJob")}
              <ArrowIcon className="h-5 w-5 ms-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
