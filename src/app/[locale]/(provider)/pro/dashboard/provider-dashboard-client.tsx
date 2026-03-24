"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, FileText, Send, Calendar, Star, DollarSign,
  User, BarChart3, Award, Clock, CheckCircle, XCircle, AlertCircle,
  MapPin, ArrowUpRight, ChevronRight, ChevronLeft, Plus,
} from "lucide-react";
import { TrackingControls } from "@/components/booking/live-tracker";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/ui/countdown-timer";

const quoteStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  EXPIRED: "bg-warm-100 text-warm-700",
  WITHDRAWN: "bg-warm-100 text-warm-700",
};

const urgencyColors: Record<string, string> = {
  FLEXIBLE: "bg-green-100 text-green-700",
  WITHIN_WEEK: "bg-blue-100 text-blue-700",
  WITHIN_3_DAYS: "bg-yellow-100 text-yellow-700",
  URGENT_24H: "bg-orange-100 text-orange-700",
  EMERGENCY: "bg-red-100 text-red-700",
};

const tierColors: Record<string, string> = {
  STANDARD: "from-gray-400 to-gray-600",
  SILVER: "from-gray-300 to-gray-500",
  GOLD: "from-amber-400 to-amber-600",
  PLATINUM: "from-cyan-400 to-cyan-700",
};

const tierProgress: Record<string, number> = {
  STANDARD: 20,
  SILVER: 45,
  GOLD: 70,
  PLATINUM: 100,
};

const tierNextLabel: Record<string, Record<string, string>> = {
  en: { STANDARD: "Silver", SILVER: "Gold", GOLD: "Platinum", PLATINUM: "Platinum" },
  ar: { STANDARD: "فضي", SILVER: "ذهبي", GOLD: "بلاتيني", PLATINUM: "بلاتيني" },
};

type ProviderDashboardProps = {
  provider: Record<string, unknown>;
  leads: Record<string, unknown>[];
  myQuotes: Record<string, unknown>[];
  upcomingBookings: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  recentActivity: Record<string, unknown>[];
  earningsChart: Record<string, number>;
  stats: {
    earningsThisMonth: number;
    jobsThisMonth: number;
    newLeads: number;
    averageRating: number;
    totalEarnings: number;
    platformFees: number;
  };
  locale: string;
};

export function ProviderDashboardClient({
  provider,
  leads,
  myQuotes,
  upcomingBookings,
  reviews,
  recentActivity,
  earningsChart,
  stats,
  locale,
}: ProviderDashboardProps) {
  const t = useTranslations("proDashboard");
  const { isRtl } = useLocale();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAvailable, setIsAvailable] = useState(
    (provider as { isActive: boolean }).isActive
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Quote form state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Record<string, unknown> | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteDuration, setQuoteDuration] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null);

  const providerId = (provider as { id: string }).id;
  const tier = (provider as { tier: string }).tier;

  const sidebarItems = [
    { key: "overview", icon: LayoutDashboard, label: t("overview") },
    { key: "leads", icon: FileText, label: t("leads"), badge: stats.newLeads || undefined },
    { key: "quotes", icon: Send, label: t("myQuotes") },
    { key: "bookings", icon: Calendar, label: t("bookings") },
    { key: "reviews", icon: Star, label: t("reviews") },
    { key: "earnings", icon: DollarSign, label: t("earnings") },
    { key: "profile", icon: User, label: t("profileManagement") },
    { key: "analytics", icon: BarChart3, label: t("analytics") },
    { key: "rewards", icon: Award, label: t("rewards") },
  ];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function timeAgo(dateStr: string) {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return locale === "ar" ? "الآن" : "just now";
    if (mins < 60) return locale === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return locale === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
  }

  async function handleAvailabilityToggle(val: boolean) {
    setIsAvailable(val);
    setAvailabilityLoading(true);
    try {
      await fetch(`/api/providers/${providerId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: val }),
      });
    } catch {
      setIsAvailable(!val); // revert on failure
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function handleSendQuote() {
    if (!selectedLead || !quotePrice) return;
    setQuoteSending(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId: (selectedLead as { id: string }).id,
          priceQuote: parseFloat(quotePrice),
          estimatedDuration: quoteDuration || null,
          message: quoteMessage || null,
        }),
      });
      if (res.ok) {
        setQuoteSuccess((selectedLead as { id: string }).id);
        setQuoteModalOpen(false);
        setQuotePrice("");
        setQuoteDuration("");
        setQuoteMessage("");
      }
    } finally {
      setQuoteSending(false);
    }
  }

  const chartEntries = Object.entries(earningsChart);
  const maxEarning = Math.max(...chartEntries.map(([, v]) => v), 1);

  const monthLabels: Record<string, Record<number, string>> = {
    en: { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" },
    ar: { 1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس", 9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر" },
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-warm-900">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={isAvailable}
              onCheckedChange={handleAvailabilityToggle}
              disabled={availabilityLoading}
            />
            <span className={cn("text-sm font-medium", isAvailable ? "text-green-600" : "text-warm-400")}>
              {isAvailable ? t("availabilityOn") : t("availabilityOff")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors",
                  activeTab === item.key ? "bg-brand-50 text-brand-600" : "text-warm-600 hover:bg-warm-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className="ms-auto bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
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
                onClick={() => setActiveTab(item.key)}
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

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: t("earningsThisMonth"),
                    value: stats.earningsThisMonth.toFixed(0),
                    suffix: locale === "ar" ? "د.ا" : "JOD",
                    icon: DollarSign,
                    color: "text-green-500",
                    trend: locale === "ar" ? "هذا الشهر" : "This month",
                  },
                  {
                    label: t("jobsThisMonth"),
                    value: String(stats.jobsThisMonth),
                    icon: CheckCircle,
                    color: "text-brand-500",
                    trend: locale === "ar" ? "مكتملة" : "Completed",
                  },
                  {
                    label: t("newLeads"),
                    value: String(stats.newLeads),
                    icon: FileText,
                    color: "text-amber-500",
                    trend: locale === "ar" ? "جديد" : "New",
                  },
                  {
                    label: t("averageRating"),
                    value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—",
                    icon: Star,
                    color: "text-yellow-500",
                    trend: `(${(provider as { totalReviews: number }).totalReviews})`,
                  },
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                        <span className="text-xs text-warm-400 font-medium">{stat.trend}</span>
                      </div>
                      <div className="text-2xl font-heading font-bold text-warm-900">
                        {stat.value} {stat.suffix ?? ""}
                      </div>
                      <div className="text-xs text-warm-500 mt-0.5">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Earnings Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {locale === "ar" ? "الأرباح (آخر 6 أشهر)" : "Earnings (Last 6 Months)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-2 px-4">
                    {chartEntries.map(([key, value]) => {
                      const month = parseInt(key.split("-")[1], 10);
                      const label = monthLabels[locale]?.[month] ?? key;
                      return (
                        <div key={key} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-warm-600 font-medium">
                            {value > 0 ? value.toFixed(0) : ""}
                          </span>
                          <div
                            className="w-full bg-brand-500 rounded-t-[6px] transition-all min-h-[4px]"
                            style={{ height: `${Math.max((value / maxEarning) * 150, 4)}px` }}
                          />
                          <span className="text-[10px] text-warm-500">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {locale === "ar" ? "آخر النشاطات" : "Recent Activity"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.length === 0 && (
                    <p className="text-warm-400 text-sm text-center py-4">
                      {locale === "ar" ? "لا نشاطات بعد" : "No recent activity"}
                    </p>
                  )}
                  {recentActivity.map((item) => {
                    const act = item as {
                      id: string;
                      status: string;
                      createdAt: string;
                      serviceRequest: { title: string; titleAr: string };
                    };
                    const icon =
                      act.status === "ACCEPTED" ? CheckCircle
                        : act.status === "DECLINED" ? XCircle
                        : AlertCircle;
                    const color =
                      act.status === "ACCEPTED" ? "text-green-500"
                        : act.status === "DECLINED" ? "text-red-500"
                        : "text-blue-500";
                    return (
                      <div key={act.id} className="flex items-center gap-3 p-3 rounded-[10px] bg-warm-50">
                        {(() => {
                          const Icon = icon;
                          return <Icon className={cn("h-5 w-5 shrink-0", color)} />;
                        })()}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-warm-800">
                            {locale === "ar"
                              ? act.serviceRequest.titleAr
                              : act.serviceRequest.title}{" "}
                            — {act.status}
                          </p>
                          <p className="text-xs text-warm-400">{timeAgo(act.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === "leads" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">{t("leads")}</h2>
              {leads.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">
                      {locale === "ar" ? "لا توجد طلبات متاحة في منطقتك" : "No leads available in your area"}
                    </p>
                  </CardContent>
                </Card>
              )}
              {leads.map((lead) => {
                const l = lead as {
                  id: string;
                  title: string;
                  titleAr: string;
                  urgency: string;
                  budgetMin?: number;
                  budgetMax?: number;
                  city: string;
                  createdAt: string;
                  expiresAt?: string | null;
                  isGroupRequest?: boolean;
                  groupSize?: number;
                  category: { name: string; nameAr: string };
                  customer: { firstName: string; firstNameAr: string; lastName: string };
                  quotes: { id: string }[];
                };
                const alreadyQuoted = l.quotes.length > 0;
                return (
                  <Card key={l.id} className="hover:shadow-medium transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-warm-900">
                            {locale === "ar" ? l.titleAr : l.title}
                          </h3>
                          <p className="text-sm text-warm-500 flex items-center gap-1 mt-0.5">
                            <User className="h-3.5 w-3.5" />
                            {locale === "ar"
                              ? `${l.customer.firstNameAr || l.customer.firstName} ${l.customer.lastName}`
                              : `${l.customer.firstName} ${l.customer.lastName}`}
                            <span className="text-warm-300">&bull;</span>
                            <MapPin className="h-3.5 w-3.5" /> {l.city}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {l.expiresAt && (
                            <CountdownTimer expiresAt={l.expiresAt} locale={locale} />
                          )}
                          <Badge className={urgencyColors[l.urgency]}>
                            {l.urgency.replace(/_/g, " ")}
                          </Badge>
                          {l.isGroupRequest && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              {locale === "ar"
                                ? `طلب جماعي (${l.groupSize ?? "?"} وحدة)`
                                : `Group Request (${l.groupSize ?? "?"} units)`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-warm-500 mb-3">
                        {(l.budgetMin || l.budgetMax) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {l.budgetMin ?? 0}–{l.budgetMax ?? "?"} {locale === "ar" ? "د.ا" : "JOD"}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {timeAgo(l.createdAt)}
                        </span>
                        <span className="text-xs text-warm-400">
                          {locale === "ar" ? l.category.nameAr : l.category.name}
                        </span>
                      </div>
                      {alreadyQuoted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 me-1" />
                          {locale === "ar" ? "تم إرسال عرض سعر" : "Quote Sent"}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setQuoteModalOpen(true);
                          }}
                          disabled={quoteSuccess === l.id}
                        >
                          <Send className="h-4 w-4 me-1" /> {t("sendQuote")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === "quotes" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">{t("myQuotes")}</h2>
              {myQuotes.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Send className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">
                      {locale === "ar" ? "لم ترسل أي عروض أسعار بعد" : "You haven't sent any quotes yet"}
                    </p>
                  </CardContent>
                </Card>
              )}
              {myQuotes.map((quote) => {
                const q = quote as {
                  id: string;
                  priceQuote: number;
                  status: string;
                  createdAt: string;
                  serviceRequest: {
                    title: string;
                    titleAr: string;
                    category: { name: string; nameAr: string };
                    customer: { firstName: string; firstNameAr: string; lastName: string };
                  };
                };
                return (
                  <Card key={q.id}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-warm-900">
                          {locale === "ar" ? q.serviceRequest.titleAr : q.serviceRequest.title}
                        </h3>
                        <p className="text-sm text-warm-500">
                          {locale === "ar"
                            ? `${q.serviceRequest.customer.firstNameAr || q.serviceRequest.customer.firstName} ${q.serviceRequest.customer.lastName}`
                            : `${q.serviceRequest.customer.firstName} ${q.serviceRequest.customer.lastName}`}
                          {" "}&bull;{" "}
                          {locale === "ar"
                            ? q.serviceRequest.category.nameAr
                            : q.serviceRequest.category.name}
                          {" "}&bull;{" "}
                          {formatDate(q.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-warm-900">
                          {q.priceQuote} {locale === "ar" ? "د.ا" : "JOD"}
                        </span>
                        <Badge className={quoteStatusColors[q.status]}>
                          {q.status === "PENDING"
                            ? t("quotePending")
                            : q.status === "ACCEPTED"
                            ? t("quoteAccepted")
                            : q.status === "DECLINED"
                            ? t("quoteDeclined")
                            : q.status}
                        </Badge>
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
              <h2 className="font-heading font-semibold text-lg text-warm-900">
                {locale === "ar" ? "الحجوزات القادمة" : "Upcoming Bookings"}
              </h2>
              {upcomingBookings.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">
                      {locale === "ar" ? "لا توجد حجوزات قادمة" : "No upcoming bookings"}
                    </p>
                  </CardContent>
                </Card>
              )}
              {upcomingBookings.map((booking) => {
                const b = booking as {
                  id: string;
                  status: string;
                  trackingStatus?: string;
                  scheduledDate: string;
                  scheduledTime?: string;
                  totalPrice: number;
                  customer: { firstName: string; firstNameAr: string; lastName: string; lastNameAr: string };
                  serviceRequest: { title: string; titleAr: string; category: { name: string; nameAr: string }; city: string };
                };
                const isActive = b.status === "CONFIRMED" || b.status === "IN_PROGRESS";
                return (
                  <Card key={b.id} className="hover:shadow-medium transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold text-sm">
                            {`${b.customer.firstName[0] ?? ""}${b.customer.lastName[0] ?? ""}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-warm-900">
                                {locale === "ar"
                                  ? `${b.customer.firstNameAr || b.customer.firstName} ${b.customer.lastNameAr || b.customer.lastName}`
                                  : `${b.customer.firstName} ${b.customer.lastName}`}
                              </h3>
                              <p className="text-sm text-warm-500">
                                {locale === "ar"
                                  ? b.serviceRequest.titleAr
                                  : b.serviceRequest.title}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">{b.status}</Badge>
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
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {b.serviceRequest.city}
                            </span>
                            <span className="font-semibold text-warm-900">
                              {b.totalPrice} {locale === "ar" ? "د.ا" : "JOD"}
                            </span>
                          </div>

                          {/* Tracking controls for active bookings */}
                          {isActive && (
                            <div className="mt-4 pt-4 border-t border-warm-100">
                              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">
                                {locale === "ar" ? "تحديث حالة التتبع" : "Update Tracking Status"}
                              </p>
                              <TrackingControls
                                bookingId={b.id}
                                initialTrackingStatus={b.trackingStatus ?? "confirmed"}
                                locale={locale}
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

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">{t("reviews")}</h2>
              {reviews.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">
                      {locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
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
                  reviewer: { firstName: string; firstNameAr: string; lastName: string; lastNameAr: string };
                };
                return (
                  <Card key={rv.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-warm-100 text-warm-700 text-sm">
                            {`${rv.reviewer.firstName[0] ?? ""}${rv.reviewer.lastName[0] ?? ""}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-warm-900 text-sm">
                              {locale === "ar"
                                ? `${rv.reviewer.firstNameAr || rv.reviewer.firstName} ${rv.reviewer.lastNameAr || rv.reviewer.lastName}`
                                : `${rv.reviewer.firstName} ${rv.reviewer.lastName}`}
                            </p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-3.5 w-3.5",
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
                          <p className="text-xs text-warm-400 mt-1">{formatDate(rv.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === "earnings" && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-green-700">{t("totalEarnings")}</p>
                    <p className="text-2xl font-heading font-bold text-green-900">
                      {stats.totalEarnings.toFixed(2)} {locale === "ar" ? "د.ا" : "JOD"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-amber-700">{t("platformFees")}</p>
                    <p className="text-2xl font-heading font-bold text-amber-900">
                      {stats.platformFees.toFixed(2)} {locale === "ar" ? "د.ا" : "JOD"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-brand-50 border-brand-200">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-brand-700">{t("netEarnings")}</p>
                    <p className="text-2xl font-heading font-bold text-brand-900">
                      {(stats.totalEarnings - stats.platformFees).toFixed(2)} {locale === "ar" ? "د.ا" : "JOD"}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button>{t("requestPayout")}</Button>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <div className="space-y-4">
              <Card className={cn("bg-gradient-to-br text-white", tierColors[tier] ?? "from-gray-400 to-gray-600")}>
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 mx-auto mb-3" />
                  <h2 className="text-2xl font-heading font-bold mb-1">
                    {t("currentTier")}: {locale === "ar" ? tier : tier}
                  </h2>
                  <p className="text-white/80">
                    {(provider as { totalJobsCompleted: number }).totalJobsCompleted}{" "}
                    {locale === "ar" ? "وظيفة مكتملة" : "jobs completed"}
                  </p>
                  <Progress value={tierProgress[tier] ?? 20} className="mt-4 bg-white/20" />
                  {tier !== "PLATINUM" && (
                    <p className="text-xs text-white/70 mt-2">
                      {locale === "ar"
                        ? `أكمل المزيد للوصول إلى ${tierNextLabel.ar[tier]}`
                        : `Complete more jobs to reach ${tierNextLabel.en[tier]}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile, Analytics — placeholder */}
          {["profile", "analytics"].includes(activeTab) && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-warm-500">
                  {locale === "ar"
                    ? `قسم ${sidebarItems.find((s) => s.key === activeTab)?.label} قيد التطوير`
                    : `${sidebarItems.find((s) => s.key === activeTab)?.label} section`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send Quote Modal */}
      <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "إرسال عرض سعر" : "Send Quote"}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <p className="text-sm text-warm-600">
                {locale === "ar"
                  ? (selectedLead as { titleAr: string }).titleAr
                  : (selectedLead as { title: string }).title}
              </p>
              <div>
                <label className="text-sm font-medium text-warm-700 mb-1 block">
                  {locale === "ar" ? "السعر (د.ا)" : "Price (JOD)"} *
                </label>
                <Input
                  type="number"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700 mb-1 block">
                  {locale === "ar" ? "المدة المتوقعة" : "Estimated Duration"}
                </label>
                <Input
                  value={quoteDuration}
                  onChange={(e) => setQuoteDuration(e.target.value)}
                  placeholder={locale === "ar" ? "مثال: ساعتان" : "e.g. 2 hours"}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700 mb-1 block">
                  {locale === "ar" ? "رسالة للعميل" : "Message to Customer"}
                </label>
                <Textarea
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  placeholder={locale === "ar" ? "اكتب رسالتك..." : "Write your message..."}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setQuoteModalOpen(false)}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handleSendQuote}
                  disabled={!quotePrice || quoteSending}
                >
                  <Send className="h-4 w-4 me-1" />
                  {quoteSending
                    ? locale === "ar" ? "جاري الإرسال..." : "Sending..."
                    : locale === "ar" ? "إرسال العرض" : "Send Quote"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
