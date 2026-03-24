"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, User, Wrench, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { JORDANIAN_CITIES, cn } from "@/lib/utils";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const { locale } = useLocale();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER">("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form field state
  const [firstName, setFirstName] = useState("");
  const [firstNameAr, setFirstNameAr] = useState("");
  const [lastName, setLastName] = useState("");
  const [lastNameAr, setLastNameAr] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError(
        locale === "ar"
          ? "كلمتا المرور غير متطابقتين"
          : "Passwords do not match"
      );
      return;
    }

    if (password.length < 8) {
      setError(
        locale === "ar"
          ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل"
          : "Password must be at least 8 characters"
      );
      return;
    }

    if (!termsAccepted) {
      setError(
        locale === "ar"
          ? "يجب الموافقة على شروط الخدمة وسياسة الخصوصية"
          : "You must agree to the Terms of Service and Privacy Policy"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          firstName: firstName.trim(),
          firstNameAr: firstNameAr.trim(),
          lastName: lastName.trim(),
          lastNameAr: lastNameAr.trim(),
          phone: phone.trim() || undefined,
          city: city || undefined,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (locale === "ar" ? "حدث خطأ. يرجى المحاولة مجدداً." : "Something went wrong. Please try again."));
        setLoading(false);
        return;
      }

      // Success — show confirmation, then redirect to login after 3 seconds
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 3000);
    } catch {
      setError(
        locale === "ar"
          ? "حدث خطأ في الشبكة. يرجى المحاولة مجدداً."
          : "A network error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  // Show success state after registration
  if (success) {
    return (
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-brand-500 text-white font-heading font-bold text-xl flex items-center justify-center">S</div>
            <span className="font-heading font-bold text-2xl text-warm-900">{locale === "ar" ? "سَنَدي" : "Sanadi"}</span>
          </Link>
        </div>
        <Card className="shadow-medium border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-warm-900 mb-2">
              {locale === "ar" ? "تم إنشاء حسابك!" : "Account Created!"}
            </h2>
            <p className="text-warm-600 mb-4">
              {locale === "ar"
                ? "تحقق من بريدك الإلكتروني وانقر على رابط التحقق لتفعيل حسابك."
                : "Check your email and click the verification link to activate your account."}
            </p>
            <p className="text-sm text-warm-400">
              {locale === "ar"
                ? "سيتم تحويلك إلى صفحة تسجيل الدخول..."
                : "Redirecting you to login..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-6">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-brand-500 text-white font-heading font-bold text-xl flex items-center justify-center">S</div>
          <span className="font-heading font-bold text-2xl text-warm-900">{locale === "ar" ? "سَنَدي" : "Sanadi"}</span>
        </Link>
      </div>

      <Card className="shadow-medium border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
          <CardDescription>{t("registerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={cn(
                "p-4 rounded-[12px] border-2 text-center transition-all",
                role === "CUSTOMER" ? "border-brand-500 bg-brand-50" : "border-warm-200 hover:border-warm-300"
              )}
            >
              <User className={cn("h-6 w-6 mx-auto mb-2", role === "CUSTOMER" ? "text-brand-500" : "text-warm-400")} />
              <p className={cn("text-sm font-medium", role === "CUSTOMER" ? "text-brand-700" : "text-warm-600")}>
                {t("registerAsCustomer")}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole("PROVIDER")}
              className={cn(
                "p-4 rounded-[12px] border-2 text-center transition-all",
                role === "PROVIDER" ? "border-brand-500 bg-brand-50" : "border-warm-200 hover:border-warm-300"
              )}
            >
              <Wrench className={cn("h-6 w-6 mx-auto mb-2", role === "PROVIDER" ? "text-brand-500" : "text-warm-400")} />
              <p className={cn("text-sm font-medium", role === "PROVIDER" ? "text-brand-700" : "text-warm-600")}>
                {t("registerAsProvider")}
              </p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("firstName")}</Label>
                <Input
                  placeholder="Ahmad"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("firstNameAr")}</Label>
                <Input
                  placeholder="أحمد"
                  dir="rtl"
                  value={firstNameAr}
                  onChange={(e) => setFirstNameAr(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("lastName")}</Label>
                <Input
                  placeholder="Al-Khalidi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("lastNameAr")}</Label>
                <Input
                  placeholder="الخالدي"
                  dir="rtl"
                  value={lastNameAr}
                  onChange={(e) => setLastNameAr(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="ps-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <Input
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  className="ps-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("city")}</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <MapPin className="h-4 w-4 text-warm-400 me-1" />
                  <SelectValue placeholder={t("selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {JORDANIAN_CITIES.map((c) => (
                    <SelectItem key={c.en} value={c.en}>
                      {locale === "ar" ? c.ar : c.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("password")}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="ps-10 pe-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="ps-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                className="mt-1"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm font-normal text-warm-600 leading-relaxed">
                {t("agreeToTerms")}{" "}
                <Link href="#" className="text-brand-500 hover:underline">{t("termsOfService")}</Link>
                {" "}{t("and")}{" "}
                <Link href="#" className="text-brand-500 hover:underline">{t("privacyPolicy")}</Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (locale === "ar" ? "جاري التحميل..." : "Loading...") : t("registerButton")}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-warm-400">
              {t("orContinueWith")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">
              <svg className="h-4 w-4 me-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("google")}
            </Button>
            <Button variant="outline" type="button">
              <svg className="h-4 w-4 me-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {t("apple")}
            </Button>
          </div>

          <p className="text-center text-sm text-warm-500 mt-6">
            {t("hasAccount")}{" "}
            <Link href={`/${locale}/login`} className="text-brand-500 font-semibold hover:underline">{t("loginButton")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
