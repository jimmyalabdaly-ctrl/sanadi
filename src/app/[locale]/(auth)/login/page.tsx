"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show success message after email verification redirect
  const isVerified = searchParams.get("verified") === "1";
  // Show success message after password reset
  const isReset = searchParams.get("reset") === "1";

  const getErrorMessage = (errorCode: string | null): string => {
    if (!errorCode) return "";
    const messages: Record<string, string> = {
      missing_token: locale === "ar" ? "رابط التحقق مفقود" : "Verification link is missing",
      invalid_token: locale === "ar" ? "رابط التحقق غير صالح" : "Verification link is invalid",
      token_expired: locale === "ar" ? "انتهت صلاحية رابط التحقق. يرجى التسجيل مجدداً." : "Verification link has expired. Please register again.",
      server_error: locale === "ar" ? "حدث خطأ في الخادم" : "A server error occurred",
      CredentialsSignin: locale === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Incorrect email or password",
    };
    return messages[errorCode] || (locale === "ar" ? "حدث خطأ. يرجى المحاولة مجدداً." : "Something went wrong. Please try again.");
  };

  // Show URL-level error (e.g. from email verify redirect)
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(getErrorMessage(result.error));
        setLoading(false);
        return;
      }

      // Fetch session to determine role-based redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role === "PROVIDER") {
        router.push(`/${locale}/pro/dashboard`);
      } else if (role === "ADMIN") {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch {
      setError(
        locale === "ar"
          ? "حدث خطأ في الشبكة. يرجى المحاولة مجدداً."
          : "A network error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-brand-500 text-white font-heading font-bold text-xl flex items-center justify-center">
            S
          </div>
          <span className="font-heading font-bold text-2xl text-warm-900">
            {locale === "ar" ? "سَنَدي" : "Sanadi"}
          </span>
        </Link>
      </div>

      <Card className="shadow-medium border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Password reset success banner */}
          {isReset && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {locale === "ar"
                  ? "تمت إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
                  : "Your password has been reset successfully. You can now log in."}
              </span>
            </div>
          )}

          {/* Email verified success banner */}
          {isVerified && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {locale === "ar"
                  ? "تم التحقق من بريدك الإلكتروني بنجاح. يمكنك تسجيل الدخول الآن."
                  : "Your email has been verified. You can now log in."}
              </span>
            </div>
          )}

          {/* URL-level error (from verification redirect) */}
          {urlError && !isVerified && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{getErrorMessage(urlError)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="ps-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("password")}</Label>
                <Link href={`/${locale}/forgot-password`} className="text-xs text-brand-500 hover:underline">
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ps-10 pe-10"
                  required
                  autoComplete="current-password"
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

            {/* Sign-in error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal text-warm-600">
                {t("rememberMe")}
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (locale === "ar" ? "جاري التحميل..." : "Loading...") : t("loginButton")}
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
            {t("noAccount")}{" "}
            <Link href={`/${locale}/register`} className="text-brand-500 font-semibold hover:underline">
              {t("registerButton")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
