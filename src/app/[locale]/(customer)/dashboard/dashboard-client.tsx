"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Calendar, MessageSquare, Heart, Star, Wallet, Settings,
  Clock, CheckCircle, Plus,
  MapPin, DollarSign, Eye, Send, Home, User, X as XIcon,
  Share2, Copy, Users, Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { LiveTracker } from "@/components/booking/live-tracker";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  QUOTED: "bg-blue-100 text-blue-800",
  BOOKED: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-warm-100 text-warm-800",
  CANCELLED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED_BY_CUSTOMER: "bg-red-100 text-red-800",
  CANCELLED_BY_PROVIDER: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, Record<string, string>> = {
  en: {
    OPEN: "Open",
    QUOTED: "Quoted",
    BOOKED: "Booked",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    CONFIRMED: "Confirmed",
    CANCELLED_BY_CUSTOMER: "Cancelled",
    CANCELLED_BY_PROVIDER: "Provider Cancelled",
    NO_SHOW: "No Show",
  },
  ar: {
    OPEN: "مفتوح",
    QUOTED: "تم التسعير",
    BOOKED: "محجوز",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    CONFIRMED: "مؤكد",
    CANCELLED_BY_CUSTOMER: "ملغي",
    CANCELLED_BY_PROVIDER: "ألغى المزود",
    NO_SHOW: "لم يحضر",
  },
};

const quoteStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  EXPIRED: "bg-warm-100 text-warm-700",
  WITHDRAWN: "bg-warm-100 text-warm-700",
};

type DashboardData = {
  user: Record<string, unknown> | null;
  requests: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  favorites: Record<string, unknown>[];
  favoriteProviders: Record<string, unknown>[];
  wallet: Record<string, unknown> | null;
  walletTransactions: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  locale: string;
};

export function CustomerDashboardClient({
  user,
  requests,
  bookings,
  favorites,
  favoriteProviders,
  wallet,
  walletTransactions,
  reviews,
  locale,
}: DashboardData) {
  const t = useTranslations("dashboard");
  const { isRtl } = useLocale();
  const [activeTab, setActiveTab] = useState("requests");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Local state for optimistic updates
  const [localBookings, setLocalBookings] = useState(bookings);

  // Referral state
  const [referralCode, setReferralCode] = useState<string | null>(
    (user as { referralCode?: string } | null)?.referralCode ?? null
  );
  const [referralStats, setReferralStats] = useState<{
    total: number;
    pending: number;
    completed: number;
    totalEarned: number;
  } | null>(null);
  const [referrals, setReferrals] = useState<
    { id: string; referredEmail: string; status: string; createdAt: string }[]
  >([]);
  const [referralEmail, setReferralEmail] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMsg, setReferralMsg] = useState("");
  const [referralDataLoaded, setReferralDataLoaded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  async function loadReferralData() {
    if (referralDataLoaded) return;
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) {
        const data = await res.json();
        if (data.referralCode) setReferralCode(data.referralCode);
        setReferralStats(data.stats);
        setReferrals(data.referrals ?? []);
      }
    } finally {
      setReferralDataLoaded(true);
    }
  }

  async function generateCode() {
    setReferralLoading(true);
    try {
      const res = await fetch("/api/referrals/generate-code", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
      }
    } finally {
      setReferralLoading(false);
    }
  }

  async function sendReferral() {
    if (!referralEmail.trim()) return;
    setReferralLoading(true);
    setReferralMsg("");
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: referralEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReferralMsg(locale === "ar" ? "تم إرسال الدعوة بنجاح!" : "Invitation sent successfully!");
        setReferralEmail("");
        setReferralDataLoaded(false);
        loadReferralData();
      } else {
        setReferralMsg(data.error ?? (locale === "ar" ? "حدث خطأ" : "An error occurred"));
      }
    } finally {
      setReferralLoading(false);
    }
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    if (!referralCode) return;
    const message = locale === "ar"
      ? `انضم إلى سَنَدي — منصة خدمات المنازل الأولى في الأردن! استخدم رمز الإحالة الخاص بي: ${referralCode} وسنحصل كلانا على مكافأة عند إتمام أول حجز. سجّل هنا: ${window.location.origin}/${locale}/register?ref=${referralCode}`
      : `Join Sanadi — Jordan's #1 home services platform! Use my referral code: ${referralCode} and we both earn a reward after your first booking. Register here: ${window.location.origin}/${locale}/register?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  const sidebarItems = [
    { key: "requests", icon: FileText, label: t("myRequests") },
    { key: "bookings", icon: Calendar, label: t("myBookings") },
    { key: "messages", icon: MessageSquare, label: t("messages") },
    { key: "favorites", icon: Heart, label: t("favorites") },
    { key: "reviews", icon: Star, label: t("myReviews") },
    { key: "wallet", icon: Wallet, label: t("wallet") },
    { key: "referrals", icon: Share2, label: locale === "ar" ? "الإحالات" : "Referrals" },
    { key: "home-profile", icon: Home, label: t("homeProfile") },
    { key: "settings", icon: Settings, label: t("settings") },
  ];

  function getInitials(firstName: string, lastName: string) {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function handleQuoteAction(quoteId: string, status: "ACCEPTED" | "DECLINED") {
    setLoadingAction(`quote-${quoteId}-${status}`);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Refresh the page data by reloading
        window.location.reload();
      }
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm(locale === "ar" ? "هل تريد إلغاء الحجز؟" : "Cancel this booking?")) return;
    setLoadingAction(`booking-cancel-${bookingId}`);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED_BY_CUSTOMER" }),
      });
      if (res.ok) {
        setLocalBookings((prev) =>
          prev.map((b) =>
            (b as { id: string }).id === bookingId
              ? { ...b, status: "CANCELLED_BY_CUSTOMER" }
              : b
          )
        );
      }
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-warm-900">{t("title")}</h1>
        <Link href={`/${locale}/post-job`}>
          <Button variant="secondary" size="sm">
            <Plus className="h-4 w-4 me-1" /> {locale === "ar" ? "انشر طلب" : "Post a Job"}
          </Button>
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); if (item.key === "referrals") loadReferralData(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors",
                  activeTab === item.key
                    ? "bg-brand-50 text-brand-600"
                    : "text-warm-600 hover:bg-warm-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden w-full">
          <div className="flex overflow-x-auto gap-1 pb-4 -mx-4 px-4 scrollbar-none">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); if (item.key === "referrals") loadReferralData(); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  activeTab === item.key ? "bg-brand-500 text-white" : "bg-warm-100 text-warm-600"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg text-warm-900">{t("activeRequests")}</h2>
              </div>
              {requests.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">{t("noRequests")}</p>
                    <Link href={`/${locale}/post-job`}>
                      <Button className="mt-4" size="sm">
                        <Plus className="h-4 w-4 me-1" />
                        {locale === "ar" ? "انشر طلبك الأول" : "Post Your First Job"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
              {requests.map((req) => {
                const r = req as {
                  id: string;
                  title: string;
                  titleAr: string;
                  city: string;
                  status: string;
                  budgetMin?: number;
                  budgetMax?: number;
                  createdAt: string;
                  expiresAt?: string | null;
                  category: { name: string; nameAr: string };
                  quotes: { id: string; priceQuote: number; status: string; message?: string; provider: { firstName: string; firstNameAr: string; lastName: string; lastNameAr: string; providerProfile?: { averageRating: number } } }[];
                };
                const pendingQuotes = r.quotes.filter((q) => q.status === "PENDING");
                return (
                  <Card key={r.id} className="hover:shadow-medium transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-warm-900">
                            {locale === "ar" ? r.titleAr : r.title}
                          </h3>
                          <p className="text-sm text-warm-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {r.city} • {locale === "ar" ? r.category.nameAr : r.category.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status === "OPEN" && r.expiresAt && (
                            <CountdownTimer expiresAt={r.expiresAt} locale={locale} />
                          )}
                          <Badge className={statusColors[r.status]}>
                            {statusLabels[locale]?.[r.status] || r.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-warm-500">
                        <span className="flex items-center gap-1">
                          <Send className="h-3.5 w-3.5" /> {r.quotes.length} {locale === "ar" ? "عروض" : "quotes"}
                        </span>
                        {(r.budgetMin || r.budgetMax) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {r.budgetMin ?? 0}–{r.budgetMax ?? "?"} {locale === "ar" ? "د.ا" : "JOD"}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {formatDate(r.createdAt)}
                        </span>
                      </div>

                      {/* Pending quotes inline */}
                      {pendingQuotes.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <Separator />
                          <p className="text-sm font-medium text-warm-700">
                            {locale === "ar" ? "عروض الأسعار" : "Quotes"} ({pendingQuotes.length})
                          </p>
                          {pendingQuotes.map((q) => (
                            <div key={q.id} className="flex items-center justify-between bg-warm-50 rounded-[10px] p-3">
                              <div>
                                <p className="text-sm font-semibold text-warm-900">
                                  {locale === "ar"
                                    ? `${q.provider.firstNameAr} ${q.provider.lastName}`
                                    : `${q.provider.firstName} ${q.provider.lastName}`}
                                </p>
                                <p className="text-sm text-warm-500">
                                  {q.priceQuote} {locale === "ar" ? "د.ا" : "JOD"}
                                  {q.provider.providerProfile && (
                                    <span className="ms-2 text-yellow-600">
                                      ★ {q.provider.providerProfile.averageRating.toFixed(1)}
                                    </span>
                                  )}
                                </p>
                                {q.message && <p className="text-xs text-warm-400 mt-0.5 line-clamp-1">{q.message}</p>}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={loadingAction === `quote-${q.id}-ACCEPTED`}
                                  onClick={() => handleQuoteAction(q.id, "ACCEPTED")}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 me-1" />
                                  {locale === "ar" ? "قبول" : "Accept"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500"
                                  disabled={loadingAction === `quote-${q.id}-DECLINED`}
                                  onClick={() => handleQuoteAction(q.id, "DECLINED")}
                                >
                                  <XIcon className="h-3.5 w-3.5 me-1" />
                                  {locale === "ar" ? "رفض" : "Decline"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          {t("viewQuotes")} ({r.quotes.length})
                        </Button>
                        <Button size="sm" variant="ghost" className="text-warm-500">
                          <Eye className="h-4 w-4 me-1" /> {locale === "ar" ? "عرض" : "View"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">{t("upcomingBookings")}</h2>
              {localBookings.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">{locale === "ar" ? "لا توجد حجوزات بعد" : "No bookings yet"}</p>
                  </CardContent>
                </Card>
              )}
              {localBookings.map((booking) => {
                const b = booking as {
                  id: string;
                  status: string;
                  trackingStatus?: string;
                  scheduledDate: string;
                  scheduledTime?: string;
                  totalPrice: number;
                  review: unknown;
                  provider: { firstName: string; firstNameAr: string; lastName: string; lastNameAr: string; avatar?: string };
                  serviceRequest: { title: string; titleAr: string; category: { name: string; nameAr: string } };
                };
                const initials = getInitials(b.provider.firstName, b.provider.lastName);
                const isCancelled = b.status.startsWith("CANCELLED");
                const showTracker = b.status === "CONFIRMED" || b.status === "IN_PROGRESS";
                return (
                  <Card key={b.id} className="hover:shadow-medium transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-warm-900">
                                {locale === "ar"
                                  ? `${b.provider.firstNameAr} ${b.provider.lastName}`
                                  : `${b.provider.firstName} ${b.provider.lastName}`}
                              </h3>
                              <p className="text-sm text-warm-500">
                                {locale === "ar"
                                  ? b.serviceRequest.category.nameAr
                                  : b.serviceRequest.category.name}
                              </p>
                            </div>
                            <Badge className={statusColors[b.status] ?? "bg-warm-100 text-warm-700"}>
                              {statusLabels[locale]?.[b.status] ?? b.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-warm-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> {formatDate(b.scheduledDate)}
                            </span>
                            {b.scheduledTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {b.scheduledTime}
                              </span>
                            )}
                            <span className="font-semibold text-warm-900">
                              {b.totalPrice} {locale === "ar" ? "د.ا" : "JOD"}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Link href={`/${locale}/dashboard/messages`}>
                              <Button size="sm" variant="outline">{t("messageProvider")}</Button>
                            </Link>
                            {b.status === "CONFIRMED" && !isCancelled && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500"
                                disabled={loadingAction === `booking-cancel-${b.id}`}
                                onClick={() => handleCancelBooking(b.id)}
                              >
                                {t("cancelBooking")}
                              </Button>
                            )}
                            {b.status === "COMPLETED" && !b.review && (
                              <Link href={`/${locale}/review/${b.id}`}>
                                <Button size="sm">{t("leaveReview")}</Button>
                              </Link>
                            )}
                            {b.status === "COMPLETED" && b.review && (
                              <Badge className="bg-green-100 text-green-800">
                                <Star className="h-3 w-3 me-1" />
                                {locale === "ar" ? "تم التقييم" : "Reviewed"}
                              </Badge>
                            )}
                          </div>

                          {/* Live Tracker for active bookings */}
                          {showTracker && (
                            <div className="mt-4 pt-4 border-t border-warm-100">
                              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">
                                {locale === "ar" ? "تتبع مباشر" : "Live Tracking"}
                              </p>
                              <LiveTracker
                                bookingId={b.id}
                                initialTrackingStatus={b.trackingStatus ?? "confirmed"}
                                locale={locale}
                                reviewUrl={`/${locale}/review/${b.id}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                <p className="text-warm-500">{t("noMessages")}</p>
                <Link href={`/${locale}/dashboard/messages`}>
                  <Button className="mt-4" variant="outline">
                    {locale === "ar" ? "فتح المحادثات" : "Open Conversations"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">{t("favorites")}</h2>
              {favoriteProviders.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">{t("noFavorites")}</p>
                  </CardContent>
                </Card>
              )}
              {favoriteProviders.map((fp) => {
                const p = fp as {
                  id: string;
                  businessName: string;
                  businessNameAr: string;
                  averageRating: number;
                  totalReviews: number;
                  slug: string;
                  user: { firstName: string; firstNameAr: string; lastName: string; lastNameAr: string; city?: string };
                };
                return (
                  <Card key={p.id} className="hover:shadow-medium transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                            {getInitials(p.user.firstName, p.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-warm-900">
                            {locale === "ar" ? p.businessNameAr : p.businessName}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-warm-500">
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500" />
                              {p.averageRating.toFixed(1)} ({p.totalReviews})
                            </span>
                            {p.user.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {p.user.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link href={`/${locale}/pro/${p.slug}`}>
                          <Button size="sm" variant="outline">
                            {locale === "ar" ? "عرض الملف" : "View Profile"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">
                {locale === "ar" ? "تقييماتي" : "My Reviews"}
              </h2>
              {reviews.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">
                      {locale === "ar" ? "لم تكتب أي تقييمات بعد" : "You haven't written any reviews yet"}
                    </p>
                  </CardContent>
                </Card>
              )}
              {reviews.map((review) => {
                const rv = review as {
                  id: string;
                  rating: number;
                  comment?: string;
                  commentAr?: string;
                  createdAt: string;
                  reviewee: { firstName: string; firstNameAr: string; lastName: string; lastNameAr: string };
                  booking: { serviceRequest: { title: string; titleAr: string } };
                };
                return (
                  <Card key={rv.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-warm-900">
                            {locale === "ar"
                              ? rv.booking.serviceRequest.titleAr
                              : rv.booking.serviceRequest.title}
                          </h3>
                          <p className="text-sm text-warm-500">
                            {locale === "ar"
                              ? `${rv.reviewee.firstNameAr} ${rv.reviewee.lastName}`
                              : `${rv.reviewee.firstName} ${rv.reviewee.lastName}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < rv.rating ? "text-yellow-400 fill-yellow-400" : "text-warm-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      {(rv.comment || rv.commentAr) && (
                        <p className="text-sm text-warm-600">
                          {locale === "ar" ? rv.commentAr : rv.comment}
                        </p>
                      )}
                      <p className="text-xs text-warm-400 mt-2">{formatDate(rv.createdAt)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <CardContent className="p-6">
                  <p className="text-brand-200 text-sm mb-1">{t("walletBalance")}</p>
                  <p className="text-3xl font-heading font-bold">
                    {wallet ? (wallet as { balance: number }).balance.toFixed(2) : "0.00"}{" "}
                    {locale === "ar" ? "د.ا" : "JOD"}
                  </p>
                  <Button variant="secondary" size="sm" className="mt-4">{t("addFunds")}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">{t("transactionHistory")}</CardTitle></CardHeader>
                <CardContent>
                  {walletTransactions.length === 0 ? (
                    <p className="text-center text-warm-500 pb-4">
                      {locale === "ar" ? "لا توجد معاملات بعد" : "No transactions yet"}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {walletTransactions.map((tx) => {
                        const t = tx as {
                          id: string;
                          amount: number;
                          type: string;
                          status: string;
                          createdAt: string;
                          currency: string;
                        };
                        return (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-warm-50 rounded-[10px]">
                            <div>
                              <p className="text-sm font-medium text-warm-900">{t.type.replace(/_/g, " ")}</p>
                              <p className="text-xs text-warm-400">{formatDate(t.createdAt)}</p>
                            </div>
                            <span className={cn("font-semibold", t.type === "WALLET_TOPUP" || t.type === "REFUND" ? "text-green-600" : "text-warm-900")}>
                              {t.type === "WALLET_TOPUP" || t.type === "REFUND" ? "+" : "-"}
                              {t.amount.toFixed(2)} {t.currency}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-amber-900 mb-1">{t("referralCode")}</h3>
                  <p className="text-sm text-amber-700 mb-3">{t("referralText")}</p>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-white rounded-[8px] text-sm font-mono text-warm-900 border border-amber-200">
                      {user && (user as { referralCode?: string }).referralCode
                        ? (user as { referralCode: string }).referralCode
                        : "SANADI-" + ((user as { id?: string })?.id?.slice(-6) ?? "??????").toUpperCase()}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700"
                      onClick={() => {
                        const code = (user as { referralCode?: string })?.referralCode ?? "";
                        navigator.clipboard.writeText(code);
                      }}
                    >
                      {locale === "ar" ? "نسخ" : "Copy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg text-warm-900">
                  {locale === "ar" ? "برنامج الإحالات" : "Referral Program"}
                </h2>
                <Badge className="bg-amber-100 text-amber-800">
                  <Gift className="h-3 w-3 me-1" />
                  {locale === "ar" ? "5 د.ا لكل إحالة" : "5 JOD per referral"}
                </Badge>
              </div>

              {/* Code card */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <p className="text-sm text-amber-700 mb-3">
                    {locale === "ar"
                      ? "شارك رمزك الخاص وادعُ أصدقاءك. ستحصل أنت وصديقك على 5 دينار أردني عند إتمام أول حجز."
                      : "Share your unique code and invite friends. You and your friend both earn 5 JOD after their first completed booking."}
                  </p>

                  {referralCode ? (
                    <div className="flex gap-2 mb-1">
                      <code className="flex-1 px-4 py-2.5 bg-white rounded-[10px] text-base font-mono font-bold text-warm-900 border border-amber-200 tracking-wider">
                        {referralCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                        onClick={copyCode}
                      >
                        {codeCopied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ms-1">
                          {codeCopied
                            ? (locale === "ar" ? "تم!" : "Copied!")
                            : (locale === "ar" ? "نسخ" : "Copy")}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                        onClick={shareWhatsApp}
                      >
                        <Share2 className="h-4 w-4 me-1" />
                        {locale === "ar" ? "واتساب" : "WhatsApp"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={generateCode}
                      disabled={referralLoading}
                      className="w-full"
                    >
                      {referralLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {locale === "ar" ? "جاري الإنشاء..." : "Generating..."}
                        </span>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 me-2" />
                          {locale === "ar" ? "إنشاء رمز الإحالة" : "Generate My Referral Code"}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              {referralStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: locale === "ar" ? "إجمالي الإحالات" : "Total Referrals",
                      value: referralStats.total,
                      icon: Users,
                      color: "text-blue-600 bg-blue-50",
                    },
                    {
                      label: locale === "ar" ? "قيد الانتظار" : "Pending",
                      value: referralStats.pending,
                      icon: Clock,
                      color: "text-amber-600 bg-amber-50",
                    },
                    {
                      label: locale === "ar" ? "مكتملة" : "Completed",
                      value: referralStats.completed,
                      icon: CheckCircle,
                      color: "text-green-600 bg-green-50",
                    },
                    {
                      label: locale === "ar" ? "المكافآت المكتسبة" : "Earned",
                      value: `${referralStats.totalEarned} ${locale === "ar" ? "د.ا" : "JOD"}`,
                      icon: Gift,
                      color: "text-brand-600 bg-brand-50",
                    },
                  ].map((stat) => (
                    <Card key={stat.label}>
                      <CardContent className="p-4 text-center">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2", stat.color)}>
                          <stat.icon className="h-4 w-4" />
                        </div>
                        <p className="font-bold text-warm-900">{stat.value}</p>
                        <p className="text-xs text-warm-500 mt-0.5">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Invite by email */}
              {referralCode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {locale === "ar" ? "دعوة صديق عبر البريد الإلكتروني" : "Invite a Friend by Email"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={referralEmail}
                        onChange={(e) => setReferralEmail(e.target.value)}
                        placeholder={locale === "ar" ? "البريد الإلكتروني للصديق" : "Friend's email address"}
                        className="flex-1 px-3 py-2 text-sm rounded-[10px] border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                        dir={locale === "ar" ? "rtl" : "ltr"}
                      />
                      <Button
                        onClick={sendReferral}
                        disabled={referralLoading || !referralEmail.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4 me-1" />
                        {locale === "ar" ? "دعوة" : "Invite"}
                      </Button>
                    </div>
                    {referralMsg && (
                      <p className={cn(
                        "text-sm mt-2",
                        referralMsg.includes("نجاح") || referralMsg.toLowerCase().includes("success")
                          ? "text-green-600"
                          : "text-red-600"
                      )}>
                        {referralMsg}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Referral list */}
              {referrals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {locale === "ar" ? "قائمة الإحالات" : "Referred Users"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {referrals.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-warm-50 rounded-[10px]">
                          <div>
                            <p className="text-sm font-medium text-warm-900">{r.referredEmail}</p>
                            <p className="text-xs text-warm-400">
                              {new Date(r.createdAt).toLocaleDateString(
                                locale === "ar" ? "ar-JO" : "en-GB",
                                { year: "numeric", month: "short", day: "numeric" }
                              )}
                            </p>
                          </div>
                          <Badge
                            className={
                              r.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          >
                            {r.status === "COMPLETED"
                              ? (locale === "ar" ? "مكتمل" : "Completed")
                              : (locale === "ar" ? "قيد الانتظار" : "Pending")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Home Profile Tab */}
          {activeTab === "home-profile" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("homeProfile")}</CardTitle>
                <p className="text-sm text-warm-500">{t("homeProfileSubtitle")}</p>
              </CardHeader>
              <CardContent className="text-center text-warm-500 pb-8">
                <Home className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                <p>
                  {locale === "ar"
                    ? "أنشئ ملف منزلك للحصول على توصيات مخصصة لتذكيرات الصيانة الموسمية"
                    : "Create your home profile for personalized seasonal maintenance reminders"}
                </p>
                <Link href={`/${locale}/dashboard/home-profile`}>
                  <Button className="mt-4">
                    {locale === "ar" ? "إدارة ملف المنزل" : "Manage Home Profile"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <Card>
              <CardHeader><CardTitle>{t("settings")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 pb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-brand-100 text-brand-700 text-lg font-semibold">
                          {getInitials(
                            (user as { firstName: string }).firstName,
                            (user as { lastName: string }).lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-warm-900">
                          {locale === "ar"
                            ? `${(user as { firstNameAr: string }).firstNameAr} ${(user as { lastName: string }).lastName}`
                            : `${(user as { firstName: string }).firstName} ${(user as { lastName: string }).lastName}`}
                        </p>
                        <p className="text-sm text-warm-500">{(user as { email: string }).email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-warm-400 mb-0.5">{locale === "ar" ? "الاسم الأول" : "First Name"}</p>
                        <p className="font-medium text-warm-900">
                          {locale === "ar"
                            ? (user as { firstNameAr: string }).firstNameAr
                            : (user as { firstName: string }).firstName}
                        </p>
                      </div>
                      <div>
                        <p className="text-warm-400 mb-0.5">{locale === "ar" ? "اسم العائلة" : "Last Name"}</p>
                        <p className="font-medium text-warm-900">{(user as { lastName: string }).lastName}</p>
                      </div>
                      <div>
                        <p className="text-warm-400 mb-0.5">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</p>
                        <p className="font-medium text-warm-900">{(user as { email: string }).email}</p>
                      </div>
                      <div>
                        <p className="text-warm-400 mb-0.5">{locale === "ar" ? "الهاتف" : "Phone"}</p>
                        <p className="font-medium text-warm-900">
                          {(user as { phone?: string }).phone ?? (locale === "ar" ? "غير مضاف" : "Not added")}
                        </p>
                      </div>
                      <div>
                        <p className="text-warm-400 mb-0.5">{locale === "ar" ? "المدينة" : "City"}</p>
                        <p className="font-medium text-warm-900">
                          {(user as { city?: string }).city ?? (locale === "ar" ? "غير محدد" : "Not set")}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 me-2" />
                      {locale === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
