"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const { locale, isRtl } = useLocale();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(locale === "ar" ? "يرجى إدخال بريدك الإلكتروني" : "Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
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

      setSubmitted(true);
    } catch {
      setError(
        locale === "ar"
          ? "حدث خطأ في الشبكة. يرجى المحاولة مجدداً."
          : "A network error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  if (submitted) {
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
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-warm-900 mb-3">
              {locale === "ar" ? "تحقق من بريدك الإلكتروني" : "Check Your Email"}
            </h2>
            <p className="text-warm-600 text-sm leading-relaxed mb-6">
              {locale === "ar"
                ? "إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، فسنرسل لك رابط إعادة تعيين كلمة المرور خلال دقائق."
                : "If an account exists with that email, we've sent a password reset link. Check your inbox and spam folder."}
            </p>
            <Link href={`/${locale}/login`}>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {locale === "ar" ? "العودة إلى تسجيل الدخول" : "Back to Login"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl">
            {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور."
              : "Enter your email and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email Address"}
              </Label>
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

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? (locale === "ar" ? "جاري الإرسال..." : "Sending...")
                : (locale === "ar" ? "إرسال رابط إعادة التعيين" : "Send Reset Link")}
            </Button>
          </form>

          <p className="text-center text-sm text-warm-500 mt-5">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-1 text-brand-500 hover:underline"
            >
              {isRtl ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
              {locale === "ar" ? "العودة إلى تسجيل الدخول" : "Back to Login"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
