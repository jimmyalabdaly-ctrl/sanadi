"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Star, MapPin, Clock, CheckCircle, Shield, Heart, Share2,
  MessageSquare, Phone, Calendar, Briefcase, Award, Zap,
  Image as ImageIcon, FileText, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MapWrapper } from "@/components/maps/map-wrapper";
import type { MapProvider } from "@/components/maps/provider-map";

interface ProviderUser {
  id: string;
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  avatar: string | null;
  bio: string | null;
  bioAr: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  isVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
}

interface ProviderService {
  id: string;
  priceMin: number | null;
  priceMax: number | null;
  description: string | null;
  descriptionAr: string | null;
  category: ServiceCategory;
}

interface ServiceArea {
  id: string;
  city: string;
  area: string | null;
}

interface Provider {
  id: string;
  userId: string;
  slug: string;
  businessName: string;
  businessNameAr: string;
  businessDescription: string | null;
  businessDescriptionAr: string | null;
  yearsOfExperience: number;
  identityVerified: boolean;
  backgroundCheckPassed: boolean;
  portfolioImages: string[];
  certificates: string[];
  averageRating: number;
  totalReviews: number;
  totalJobsCompleted: number;
  responseTime: number;
  instantBookEnabled: boolean;
  tier: string;
  coverImage: string | null;
  createdAt: string;
  availabilitySchedule: Record<string, { open: string; close: string }> | null;
  user: ProviderUser;
  services: ProviderService[];
  serviceAreas: ServiceArea[];
}

interface Reviewer {
  id: string;
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  avatar: string | null;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  titleAr: string | null;
  comment: string | null;
  commentAr: string | null;
  images: string[];
  categories: Record<string, number> | null;
  createdAt: string;
  reviewer: Reviewer;
}

interface RatingDistribution {
  stars: number;
  count: number;
  pct: number;
}

interface CategoryAverages {
  punctuality: number;
  quality: number;
  communication: number;
  value: number;
}

interface Props {
  provider: Provider;
  reviews: Review[];
  ratingDistribution: RatingDistribution[];
  categoryAverages: CategoryAverages;
  locale: string;
}

export default function ProviderProfileClient({
  provider,
  reviews,
  ratingDistribution,
  categoryAverages,
  locale,
}: Props) {
  const t = useTranslations("provider");
  const [saved, setSaved] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [message, setMessage] = useState("");

  const isAr = locale === "ar";
  const p = provider;

  const displayName = isAr
    ? `${p.user.firstNameAr} ${p.user.lastNameAr}`
    : `${p.user.firstName} ${p.user.lastName}`;

  const businessName = isAr ? p.businessNameAr : p.businessName;
  const bio = isAr ? (p.businessDescriptionAr || p.user.bioAr) : (p.businessDescription || p.user.bio);

  const initials = `${p.user.firstName[0] ?? ""}${p.user.lastName[0] ?? ""}`.toUpperCase();

  const city = p.user.city ?? "";
  const area = p.user.area ?? "";
  const locationStr = [area, city].filter(Boolean).join(", ");

  const dayNames = isAr
    ? { sun: "الأحد", mon: "الإثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة", sat: "السبت" }
    : { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

  // Working hours from schedule JSON
  const schedule = p.availabilitySchedule;

  const profileUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://sanadi.jo/${locale}/pro/${p.slug}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    isAr
      ? `تفقد ${businessName} على صنادي: ${profileUrl}`
      : `Check out ${businessName} on Sanadi: ${profileUrl}`
  )}`;

  const handleFavorite = async () => {
    setSaved(!saved);
    try {
      await fetch("/api/favorites", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: p.id }),
      });
    } catch {
      // Fallback: keep local state
    }
  };

  const tierLabel = {
    STANDARD: isAr ? "عادي" : "Standard",
    SILVER: isAr ? "فضي" : "Silver",
    GOLD: isAr ? "ذهبي" : "Gold",
    PLATINUM: isAr ? "بلاتيني" : "Platinum",
  }[p.tier] ?? p.tier;

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-brand-500 to-brand-700 relative overflow-hidden">
        {p.coverImage && (
          <Image src={p.coverImage} alt={businessName} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Header */}
            <Card className="overflow-visible">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 -mt-16 sm:-mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    {p.user.avatar && <AvatarImage src={p.user.avatar} alt={displayName} />}
                    <AvatarFallback className="bg-brand-500 text-white text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 mt-2 sm:mt-8">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h1 className="text-2xl font-heading font-bold text-warm-900">{businessName}</h1>
                        <p className="text-warm-500 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {locationStr || (isAr ? "الأردن" : "Jordan")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleFavorite}
                          className="rounded-full"
                          aria-label={isAr ? "حفظ في المفضلة" : "Save to favorites"}
                        >
                          <Heart className={cn("h-5 w-5", saved ? "fill-red-500 text-red-500" : "text-warm-400")} />
                        </Button>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Share on WhatsApp">
                            <Share2 className="h-5 w-5 text-warm-400" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.identityVerified && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 me-1" />
                      {t("identityVerified")}
                    </Badge>
                  )}
                  {p.backgroundCheckPassed && (
                    <Badge variant="success">
                      <Shield className="h-3 w-3 me-1" />
                      {t("backgroundCheck")}
                    </Badge>
                  )}
                  {p.user.isPhoneVerified && (
                    <Badge variant="outline">
                      <Phone className="h-3 w-3 me-1" />
                      {t("phoneVerified")}
                    </Badge>
                  )}
                  {p.instantBookEnabled && (
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 me-1" />
                      {t("instantBookAvailable")}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    <Award className="h-3 w-3 me-1" />
                    {tierLabel}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Star, label: t("rating"), value: `${p.averageRating.toFixed(1)} ★`, sub: `(${p.totalReviews})` },
                    { icon: Briefcase, label: t("jobsCompleted"), value: p.totalJobsCompleted.toString() },
                    { icon: Clock, label: t("responseTime"), value: `< ${p.responseTime} ${t("minutesShort")}` },
                    { icon: Calendar, label: t("experience"), value: `${p.yearsOfExperience} ${t("yearsShort")}` },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-[12px] bg-warm-50">
                      <stat.icon className="h-5 w-5 text-brand-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-warm-900">
                        {stat.value}{" "}
                        {stat.sub && <span className="text-sm font-normal text-warm-400">{stat.sub}</span>}
                      </div>
                      <div className="text-xs text-warm-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="about">
              <TabsList className="w-full justify-start bg-white border border-warm-100 p-1">
                <TabsTrigger value="about">{t("about")}</TabsTrigger>
                <TabsTrigger value="portfolio">{t("portfolio")}</TabsTrigger>
                <TabsTrigger value="reviews">
                  {t("reviews")} ({p.totalReviews})
                </TabsTrigger>
                <TabsTrigger value="certificates">{t("certificates")}</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {bio && (
                      <div>
                        <h3 className="font-heading font-semibold text-warm-900 mb-2">
                          {isAr ? "نبذة" : "About"}
                        </h3>
                        <p className="text-warm-600 leading-relaxed">{bio}</p>
                      </div>
                    )}

                    {p.services.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-heading font-semibold text-warm-900 mb-3">{t("servicesOffered")}</h3>
                          <div className="space-y-2">
                            {p.services.map((s) => (
                              <div key={s.id} className="flex items-center justify-between p-3 rounded-[12px] bg-warm-50">
                                <span className="text-warm-800 font-medium">
                                  {isAr ? s.category.nameAr : s.category.name}
                                </span>
                                {(s.priceMin || s.priceMax) && (
                                  <span className="text-sm text-warm-600">
                                    {s.priceMin ?? 0} - {s.priceMax ?? "?"} {isAr ? "د.ا" : "JOD"}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {p.serviceAreas.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-heading font-semibold text-warm-900 mb-3">{t("serviceAreas")}</h3>
                          <div className="flex flex-wrap gap-2">
                            {p.serviceAreas.map((a) => (
                              <Badge key={a.id} variant="outline" className="text-sm">
                                <MapPin className="h-3 w-3 me-1" />
                                {a.area ? `${a.area}, ${a.city}` : a.city}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {schedule && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-heading font-semibold text-warm-900 mb-3">{t("workingHours")}</h3>
                          <div className="space-y-1.5">
                            {Object.entries(dayNames).map(([day, label]) => {
                              const hours = schedule[day];
                              return (
                                <div key={day} className="flex justify-between text-sm">
                                  <span className="text-warm-600">{label}</span>
                                  <span className={cn("font-medium", !hours || hours.open === "Closed" ? "text-red-500" : "text-warm-900")}>
                                    {!hours || hours.open === "Closed"
                                      ? (isAr ? "مغلق" : "Closed")
                                      : `${hours.open} - ${hours.close}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="text-xs text-warm-400">
                      {t("memberSince")}{" "}
                      {new Date(p.createdAt).toLocaleDateString(isAr ? "ar-JO" : "en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                <Card>
                  <CardContent className="p-6">
                    {p.portfolioImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {p.portfolioImages.map((imgUrl, i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-[12px] overflow-hidden bg-warm-200 relative hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <Image src={imgUrl} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-warm-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">{isAr ? "لا توجد صور محفظة بعد" : "No portfolio images yet"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Rating Breakdown */}
                    <div className="flex items-start gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-heading font-bold text-warm-900">
                          {p.averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-0.5 justify-center my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < Math.round(p.averageRating)
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-warm-200"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-warm-500">
                          {p.totalReviews} {isAr ? "تقييم" : "reviews"}
                        </p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {ratingDistribution.map((r) => (
                          <div key={r.stars} className="flex items-center gap-2 text-sm">
                            <span className="w-6 text-warm-600">{r.stars}★</span>
                            <Progress value={r.pct} className="h-2 flex-1" />
                            <span className="w-10 text-end text-warm-500">{r.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Category Ratings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(
                        [
                          { key: "punctuality", score: categoryAverages.punctuality },
                          { key: "quality", score: categoryAverages.quality },
                          { key: "communication", score: categoryAverages.communication },
                          { key: "value", score: categoryAverages.value },
                        ] as const
                      ).map((cat) => (
                        <div key={cat.key} className="text-center p-3 rounded-[12px] bg-warm-50">
                          <div className="text-lg font-bold text-warm-900">{cat.score || "—"}</div>
                          <div className="text-xs text-warm-500">{t(cat.key as never)}</div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Individual Reviews */}
                    {reviews.length === 0 ? (
                      <p className="text-center text-warm-400 py-8">
                        {isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => {
                          const reviewerName = isAr
                            ? `${review.reviewer.firstNameAr} ${review.reviewer.lastNameAr}`
                            : `${review.reviewer.firstName} ${review.reviewer.lastName}`;
                          const reviewText = isAr ? review.commentAr : review.comment;

                          return (
                            <div key={review.id} className="p-4 rounded-[12px] bg-warm-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    {review.reviewer.avatar && (
                                      <AvatarImage src={review.reviewer.avatar} alt={reviewerName} />
                                    )}
                                    <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                                      {reviewerName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-semibold text-warm-900">{reviewerName}</p>
                                    <p className="text-xs text-warm-400">
                                      {new Date(review.createdAt).toLocaleDateString(
                                        isAr ? "ar-JO" : "en-US"
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        i < review.rating
                                          ? "text-amber-500 fill-amber-500"
                                          : "text-warm-200"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              {reviewText && (
                                <p className="text-sm text-warm-600 leading-relaxed">{reviewText}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Certificates Tab */}
              <TabsContent value="certificates">
                <Card>
                  <CardContent className="p-6">
                    {p.certificates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {p.certificates.map((cert, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 rounded-[12px] bg-warm-50">
                            <FileText className="h-8 w-8 text-brand-500 shrink-0" />
                            <div>
                              <p className="font-medium text-warm-900 text-sm">{cert}</p>
                              <p className="text-xs text-warm-500">{isAr ? "تم التحقق" : "Verified"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-warm-400">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">{isAr ? "لا توجد شهادات بعد" : "No certificates uploaded yet"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              <Card className="shadow-medium border-brand-100">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-heading font-semibold text-lg text-warm-900">{t("getQuote")}</h3>
                  {p.services.length > 0 && (
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectService")} />
                      </SelectTrigger>
                      <SelectContent>
                        {p.services.map((s) => (
                          <SelectItem key={s.id} value={s.category.id}>
                            {isAr ? s.category.nameAr : s.category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Textarea
                    placeholder={t("writeMessage")}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Link
                    href={`/${locale}/post-job${selectedService ? `?categoryId=${selectedService}&providerId=${p.id}` : ""}`}
                  >
                    <Button className="w-full" size="lg">
                      <MessageSquare className="h-4 w-4 me-2" />
                      {t("sendRequest")}
                    </Button>
                  </Link>
                  {p.instantBookEnabled && (
                    <>
                      <Separator />
                      <Button variant="secondary" className="w-full" size="lg">
                        <Zap className="h-4 w-4 me-2" />
                        {t("instantBook")}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* WhatsApp Share */}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50">
                  <Phone className="h-4 w-4 me-2" />
                  {isAr ? "مشاركة عبر واتساب" : "Share on WhatsApp"}
                </Button>
              </a>

              {/* Location Map */}
              {city && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-warm-700 mb-3 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-brand-500" />
                      {isAr ? "الموقع" : "Location"}
                    </h3>
                    <div className="h-40 rounded-[10px] overflow-hidden">
                      <MapWrapper
                        providers={[{
                          id: p.id,
                          name: businessName,
                          slug: p.slug,
                          city: city,
                          rating: p.averageRating,
                          category: p.services[0]
                            ? (isAr ? p.services[0].category.nameAr : p.services[0].category.name)
                            : "",
                        } satisfies MapProvider]}
                        locale={locale}
                        className="h-full w-full"
                      />
                    </div>
                    <p className="text-xs text-warm-500 mt-2 text-center">{locationStr}</p>
                  </CardContent>
                </Card>
              )}

              {/* Report */}
              <Button variant="ghost" size="sm" className="w-full text-warm-400 hover:text-red-500">
                <Flag className="h-4 w-4 me-1" />
                {t("reportProvider")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
