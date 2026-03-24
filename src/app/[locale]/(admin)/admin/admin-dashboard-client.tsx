"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutDashboard, Users, Shield, Layers, Calendar, DollarSign,
  AlertTriangle, FileText, BarChart3, Search, CheckCircle, Eye, Ban,
  UserCheck, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  totalUsers: number;
  totalProviders: number;
  activeRequests: number;
  bookingsToday: number;
  totalRevenue: number;
  openDisputes: number;
};

type AdminUser = {
  id: string;
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  email: string;
  role: string;
  city?: string;
  isVerified: boolean;
  createdAt: string;
  providerProfile?: {
    id: string;
    businessName: string;
    identityVerified: boolean;
    isActive: boolean;
    isSuspended: boolean;
    tier: string;
  } | null;
};

type Dispute = {
  id: string;
  reason: string;
  status: string;
  description?: string;
  createdAt: string;
  reporter: { id: string; firstName: string; firstNameAr: string; lastName: string; email: string };
  reported: { id: string; firstName: string; firstNameAr: string; lastName: string; email: string };
  booking?: { id: string; totalPrice: number } | null;
};

type CategoryStat = {
  name: string;
  nameAr: string;
  count: number;
  pct: number;
};

type AdminDashboardProps = {
  stats: Stats;
  users: AdminUser[];
  disputes: Dispute[];
  monthlyGrowth: Record<string, number>;
  bookingsByCategory: CategoryStat[];
  locale: string;
};

export function AdminDashboardClient({
  stats,
  users: initialUsers,
  disputes: initialDisputes,
  monthlyGrowth,
  bookingsByCategory,
  locale,
}: AdminDashboardProps) {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState(initialUsers);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dispute resolve modal
  const [resolveModal, setResolveModal] = useState<Dispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [resolveStatus, setResolveStatus] = useState("RESOLVED");
  const [resolvingLoading, setResolvingLoading] = useState(false);

  const sidebarItems = [
    { key: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { key: "users", icon: Users, label: t("users") },
    { key: "providers", icon: Shield, label: t("providers") },
    { key: "categories", icon: Layers, label: t("categories") },
    { key: "bookings", icon: Calendar, label: t("bookings") },
    { key: "transactions", icon: DollarSign, label: t("transactions") },
    { key: "disputes", icon: AlertTriangle, label: t("disputes"), badge: stats.openDisputes },
    { key: "content", icon: FileText, label: t("content") },
    { key: "analytics", icon: BarChart3, label: t("analytics") },
  ];

  const growthEntries = Object.entries(monthlyGrowth);
  const maxGrowth = Math.max(...growthEntries.map(([, v]) => v), 1);

  const monthLabels: Record<string, Record<number, string>> = {
    en: { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" },
    ar: { 1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس", 9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر" },
  };

  const filteredUsers = users.filter((u) => {
    const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
    const matchSearch = !userSearch || name.includes(userSearch.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function handleUserAction(userId: string, action: string) {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            if (action === "verify_provider") {
              return {
                ...u,
                isVerified: true,
                providerProfile: u.providerProfile
                  ? { ...u.providerProfile, identityVerified: true }
                  : u.providerProfile,
              };
            }
            if (action === "suspend") {
              return {
                ...u,
                isVerified: false,
                providerProfile: u.providerProfile
                  ? { ...u.providerProfile, isSuspended: true, isActive: false }
                  : u.providerProfile,
              };
            }
            if (action === "unsuspend") {
              return {
                ...u,
                isVerified: true,
                providerProfile: u.providerProfile
                  ? { ...u.providerProfile, isSuspended: false, isActive: true }
                  : u.providerProfile,
              };
            }
            return u;
          })
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolveDispute() {
    if (!resolveModal) return;
    setResolvingLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${resolveModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolveStatus, adminNotes, resolution }),
      });
      if (res.ok) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === resolveModal.id
              ? { ...d, status: resolveStatus }
              : d
          )
        );
        setResolveModal(null);
        setAdminNotes("");
        setResolution("");
      }
    } finally {
      setResolvingLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold text-warm-900 mb-6">{t("title")}</h1>

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
        <div className="lg:hidden w-full mb-4">
          <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-none">
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

          {/* Dashboard Overview */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: t("totalUsers"), value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-500" },
                  { label: t("totalProviders"), value: stats.totalProviders.toLocaleString(), icon: Shield, color: "text-brand-500" },
                  { label: t("activeRequests"), value: stats.activeRequests.toLocaleString(), icon: FileText, color: "text-amber-500" },
                  { label: t("bookingsToday"), value: stats.bookingsToday.toLocaleString(), icon: Calendar, color: "text-green-500" },
                  { label: t("revenue"), value: `${stats.totalRevenue.toFixed(0)} ${locale === "ar" ? "د.ا" : "JOD"}`, icon: DollarSign, color: "text-purple-500" },
                  { label: t("openDisputes"), value: String(stats.openDisputes), icon: AlertTriangle, color: "text-red-500" },
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
                      <div className="text-xl font-heading font-bold text-warm-900">{stat.value}</div>
                      <div className="text-xs text-warm-500">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {locale === "ar" ? "نمو المستخدمين (12 شهر)" : "User Growth (12 Months)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 flex items-end gap-1 px-2">
                      {growthEntries.map(([key, value]) => {
                        const month = parseInt(key.split("-")[1], 10);
                        return (
                          <div key={key} className="flex-1 flex flex-col items-center gap-0.5" title={`${key}: ${value}`}>
                            <div
                              className="w-full bg-brand-500 rounded-t-[3px] min-h-[2px] transition-all"
                              style={{ height: `${Math.max((value / maxGrowth) * 140, 2)}px` }}
                            />
                            <span className="text-[8px] text-warm-400">
                              {(monthLabels[locale]?.[month] ?? "").slice(0, 1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {locale === "ar" ? "الحجوزات حسب الفئة" : "Bookings by Category"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingsByCategory.length === 0 ? (
                      <p className="text-warm-400 text-sm text-center py-4">
                        {locale === "ar" ? "لا بيانات" : "No data"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {bookingsByCategory.map((c) => (
                          <div key={c.name} className="flex items-center gap-2">
                            <span className="text-xs text-warm-600 w-20 truncate">
                              {locale === "ar" ? c.nameAr : c.name}
                            </span>
                            <div className="flex-1 h-3 bg-warm-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500 rounded-full"
                                style={{ width: `${c.pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-warm-500 w-8 text-end">{c.pct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={locale === "ar" ? "بحث عن مستخدم..." : "Search users..."}
                    className="ps-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={locale === "ar" ? "الدور" : "Role"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{locale === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="CUSTOMER">{locale === "ar" ? "عميل" : "Customer"}</SelectItem>
                    <SelectItem value="PROVIDER">{locale === "ar" ? "محترف" : "Provider"}</SelectItem>
                    <SelectItem value="ADMIN">{locale === "ar" ? "مشرف" : "Admin"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 me-1" />{t("exportCSV")}
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-warm-100">
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "المستخدم" : "User"}
                          </th>
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "البريد" : "Email"}
                          </th>
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "الدور" : "Role"}
                          </th>
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "المدينة" : "City"}
                          </th>
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "الحالة" : "Status"}
                          </th>
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "تاريخ الانضمام" : "Joined"}
                          </th>
                          <th className="text-start p-3 text-warm-500 font-medium">
                            {locale === "ar" ? "إجراءات" : "Actions"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => {
                          const displayName = locale === "ar"
                            ? `${user.firstNameAr || user.firstName} ${user.lastName}`
                            : `${user.firstName} ${user.lastName}`;
                          const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
                          const isSuspended = user.providerProfile?.isSuspended ?? false;

                          return (
                            <tr key={user.id} className="border-b border-warm-50 hover:bg-warm-50">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-warm-900">{displayName}</span>
                                </div>
                              </td>
                              <td className="p-3 text-warm-500">{user.email}</td>
                              <td className="p-3">
                                <Badge variant={user.role === "PROVIDER" ? "default" : user.role === "ADMIN" ? "destructive" : "outline"}>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="p-3 text-warm-500">{user.city ?? "—"}</td>
                              <td className="p-3">
                                {isSuspended ? (
                                  <Badge variant="destructive">
                                    {locale === "ar" ? "موقوف" : "Suspended"}
                                  </Badge>
                                ) : user.isVerified ? (
                                  <Badge variant="success">
                                    <CheckCircle className="h-3 w-3 me-0.5" />
                                    {locale === "ar" ? "موثّق" : "Verified"}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    {locale === "ar" ? "غير موثّق" : "Unverified"}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-warm-500 text-xs">{formatDate(user.createdAt)}</td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" title="View">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {user.role === "PROVIDER" &&
                                    user.providerProfile &&
                                    !user.providerProfile.identityVerified && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600"
                                        title={locale === "ar" ? "توثيق" : "Verify"}
                                        disabled={actionLoading === `${user.id}-verify_provider`}
                                        onClick={() => handleUserAction(user.id, "verify_provider")}
                                      >
                                        <UserCheck className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  {!isSuspended ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500"
                                      title={locale === "ar" ? "إيقاف" : "Suspend"}
                                      disabled={actionLoading === `${user.id}-suspend`}
                                      onClick={() => handleUserAction(user.id, "suspend")}
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600"
                                      title={locale === "ar" ? "رفع الإيقاف" : "Unsuspend"}
                                      disabled={actionLoading === `${user.id}-unsuspend`}
                                      onClick={() => handleUserAction(user.id, "unsuspend")}
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-warm-400">
                              {locale === "ar" ? "لا نتائج" : "No results found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Disputes */}
          {activeTab === "disputes" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-warm-900">{t("disputes")}</h2>
              {disputes.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                    <p className="text-warm-500">
                      {locale === "ar" ? "لا توجد نزاعات مفتوحة" : "No open disputes"}
                    </p>
                  </CardContent>
                </Card>
              )}
              {disputes.map((d) => {
                const reporterName = locale === "ar"
                  ? `${d.reporter.firstNameAr || d.reporter.firstName} ${d.reporter.lastName}`
                  : `${d.reporter.firstName} ${d.reporter.lastName}`;
                const reportedName = locale === "ar"
                  ? `${d.reported.firstNameAr || d.reported.firstName} ${d.reported.lastName}`
                  : `${d.reported.firstName} ${d.reported.lastName}`;

                return (
                  <Card key={d.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-warm-900">
                            {reporterName} → {reportedName}
                          </p>
                          <p className="text-sm text-warm-500 mt-0.5">
                            {d.reason.replace(/_/g, " ")} • {formatDate(d.createdAt)}
                          </p>
                          {d.description && (
                            <p className="text-sm text-warm-600 mt-1 line-clamp-2">{d.description}</p>
                          )}
                          {d.booking && (
                            <p className="text-xs text-warm-400 mt-1">
                              {locale === "ar" ? "الحجز:" : "Booking:"} {d.booking.totalPrice} {locale === "ar" ? "د.ا" : "JOD"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ms-4">
                          <Badge
                            className={
                              d.status === "OPEN"
                                ? "bg-red-100 text-red-800"
                                : d.status === "UNDER_REVIEW"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {d.status}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setResolveModal(d);
                              setAdminNotes("");
                              setResolution("");
                              setResolveStatus("RESOLVED");
                            }}
                          >
                            {t("resolveDispute")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Other admin tabs */}
          {["providers", "categories", "bookings", "transactions", "content", "analytics"].includes(activeTab) && (
            <Card>
              <CardContent className="p-12 text-center text-warm-500">
                {sidebarItems.find((s) => s.key === activeTab)?.label}{" "}
                {locale === "ar" ? "- قسم الإدارة" : "management section"}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resolve Dispute Modal */}
      <Dialog open={resolveModal !== null} onOpenChange={(open) => !open && setResolveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "حل النزاع" : "Resolve Dispute"}
            </DialogTitle>
          </DialogHeader>
          {resolveModal && (
            <div className="space-y-4">
              <p className="text-sm text-warm-600">
                {locale === "ar"
                  ? `${resolveModal.reporter.firstNameAr || resolveModal.reporter.firstName} → ${resolveModal.reported.firstNameAr || resolveModal.reported.firstName}`
                  : `${resolveModal.reporter.firstName} → ${resolveModal.reported.firstName}`}
                {" "}&bull;{" "}
                {resolveModal.reason.replace(/_/g, " ")}
              </p>
              <div>
                <label className="text-sm font-medium text-warm-700 mb-1 block">
                  {locale === "ar" ? "الحالة الجديدة" : "New Status"}
                </label>
                <Select value={resolveStatus} onValueChange={setResolveStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDER_REVIEW">{locale === "ar" ? "قيد المراجعة" : "Under Review"}</SelectItem>
                    <SelectItem value="RESOLVED">{locale === "ar" ? "تم الحل" : "Resolved"}</SelectItem>
                    <SelectItem value="DISMISSED">{locale === "ar" ? "مرفوض" : "Dismissed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700 mb-1 block">
                  {locale === "ar" ? "ملاحظات المشرف" : "Admin Notes"}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={locale === "ar" ? "أضف ملاحظاتك..." : "Add your notes..."}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700 mb-1 block">
                  {locale === "ar" ? "القرار" : "Resolution"}
                </label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder={locale === "ar" ? "اكتب القرار النهائي..." : "Write the final resolution..."}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setResolveModal(null)}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleResolveDispute} disabled={resolvingLoading}>
                  {resolvingLoading
                    ? locale === "ar" ? "جاري الحفظ..." : "Saving..."
                    : locale === "ar" ? "حفظ القرار" : "Save Decision"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
