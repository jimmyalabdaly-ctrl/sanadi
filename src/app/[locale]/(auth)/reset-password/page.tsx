"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        locale === "ar"
          ? "رابط إعادة التعيين مفقود أو غير صالح."
          : "Reset link is missing or invalid."
      );
    }
  }, [token, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(locale === "ar" ? "رابط التعيين غير صالح." : "Invalid reset link.");
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

    if (password !== confirmPassword) {
      setError(
        locale === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            (locale === "ar"
              ? "حدث خطأ. يرجى المحاولة مجدداً."
              : "Something went wrong. Please try again.")
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login?reset=1`);
      }, 2000);
    } catch {
      setError(
        locale === "ar"
          ? "حدث خطأ في الشبكة. يرجى المحاولة مجدداً."
          : "A network error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <BrandHeader locale={locale} />
        <Card className="shadow-medium border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-warm-900 mb-2">
              {locale === "ar" ? "تمت إعادة التعيين بنجاح!" : "Password Reset Successful!"}
            </h2>
            <p className="text-warm-600 text-sm">
              {locale === "ar"
                ? "تم تغيير كلمة مرورك. سيتم تحويلك إلى صفحة تسجيل الدخول..."
                : "Your password has been changed. Redirecting you to login..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <BrandHeader locale={locale} />

      <Card className="shadow-medium border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Your Password"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أدخل كلمة المرور الجديدة أدناه"
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!token && error ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                </Label>
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
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-warm-400">
                  {locale === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">
                  {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ps-10 pe-10"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    password === confirmPassword ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {password === confirmPassword ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {password === confirmPassword
                    ? (locale === "ar" ? "كلمتا المرور متطابقتان" : "Passwords match")
                    : (locale === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match")}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? (locale === "ar" ? "جاري الحفظ..." : "Saving...")
                  : (locale === "ar" ? "حفظ كلمة المرور الجديدة" : "Save New Password")}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-warm-500 mt-5">
            <Link href={`/${locale}/forgot-password`} className="text-brand-500 hover:underline">
              {locale === "ar" ? "طلب رابط جديد" : "Request a new link"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BrandHeader({ locale }: { locale: string }) {
  return (
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
  );
}
