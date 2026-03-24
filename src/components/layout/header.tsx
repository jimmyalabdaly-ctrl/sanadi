"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Home,
  Search,
  Wrench,
  Globe,
  Menu,
  X,
  AlertTriangle,
  User,
  LogOut,
  Settings,
  MessageSquare,
  Heart,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const { locale, isRtl, switchLocale } = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user as { name?: string; image?: string; role?: string } | undefined;

  function getInitials(name?: string | null): string {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  const isDashboardProvider = user?.role === "PROVIDER";
  const dashboardHref = isDashboardProvider
    ? `/${locale}/pro/dashboard`
    : `/${locale}/dashboard`;

  const navLinks = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}/services`, label: t("services"), icon: Wrench },
    { href: `/${locale}/become-a-pro`, label: t("becomePro"), icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-warm-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-brand-500 text-white font-heading font-bold text-lg">
            S
          </div>
          <span className="font-heading font-bold text-xl text-warm-900">
            {locale === "ar" ? "سَنَدي" : "Sanadi"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-[8px] text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-brand-50 text-brand-600"
                  : "text-warm-600 hover:text-brand-600 hover:bg-warm-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Emergency Button */}
          <Link href={`/${locale}/emergency`}>
            <Button
              variant="destructive"
              size="sm"
              className="hidden sm:flex items-center gap-1 animate-pulse-emergency bg-red-500 hover:bg-red-600 rounded-full px-3"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">{t("emergency")}</span>
            </Button>
          </Link>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => switchLocale(locale === "ar" ? "en" : "ar")}
            className="rounded-full"
            aria-label="Switch language"
          >
            <Globe className="h-5 w-5 text-warm-600" />
          </Button>

          {/* Notification Bell — only when authenticated */}
          {isLoggedIn && <NotificationBell />}

          {/* Auth Buttons / User Menu */}
          {isLoggedIn ? (
            <>
              <Link href={`/${locale}/dashboard/messages`}>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <MessageSquare className="h-5 w-5 text-warm-600" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      {user?.image && <AvatarImage src={user.image} alt={user?.name ?? ""} />}
                      <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56">
                  <DropdownMenuLabel>{user?.name ?? "My Account"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref}>
                      <LayoutDashboard className="me-2 h-4 w-4" /> {t("dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/dashboard/messages`}>
                      <MessageSquare className="me-2 h-4 w-4" /> {t("messages")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/dashboard/favorites`}>
                      <Heart className="me-2 h-4 w-4" /> {locale === "ar" ? "المفضلة" : "Favorites"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/dashboard/settings`}>
                      <Settings className="me-2 h-4 w-4" /> {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" asChild>
                    <Link href="/api/auth/signout">
                      <LogOut className="me-2 h-4 w-4" /> {t("logout")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">{t("login")}</Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button size="sm">{t("signup")}</Button>
              </Link>
            </div>
          )}

          {/* Post a Job Button */}
          <Link href={`/${locale}/post-job`} className="hidden lg:block">
            <Button variant="secondary" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {t("postJob")}
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-warm-100 bg-white animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm font-medium transition-colors",
                  isActive(link.href) ? "bg-brand-50 text-brand-600" : "text-warm-600 hover:bg-warm-50"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/post-job`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm font-medium text-amber-600 bg-amber-50"
            >
              <Plus className="h-5 w-5" />
              {t("postJob")}
            </Link>
            <Link
              href={`/${locale}/emergency`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm font-medium text-red-600 bg-red-50"
            >
              <AlertTriangle className="h-5 w-5" />
              {t("emergency")}
            </Link>
            {!isLoggedIn && (
              <div className="flex gap-2 mt-2 pt-3 border-t border-warm-100">
                <Link href={`/${locale}/login`} className="flex-1">
                  <Button variant="outline" className="w-full">{t("login")}</Button>
                </Link>
                <Link href={`/${locale}/register`} className="flex-1">
                  <Button className="w-full">{t("signup")}</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
