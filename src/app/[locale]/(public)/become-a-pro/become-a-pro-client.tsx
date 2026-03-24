"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award, DollarSign, Users, TrendingUp, Shield, Clock, Zap,
  ArrowRight, ArrowLeft,
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Stats {
  providerCount: number;
  activeRequestCount: number;
  avgMonthlyEarnings: number;
}

interface Props {
  stats: Stats;
  locale: string;
}

export default function BecomeAProClient({ stats, locale }: Props) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const benefits = [
    {
      icon: DollarSign,
      title: isAr ? "اكسب أكثر" : "Earn More",
      desc: isAr
        ? `متوسط أرباح المحترف ${stats.avgMonthlyEarnings}+ د.ا شهرياً`
        : `Average pro earns ${stats.avgMonthlyEarnings}+ JOD/month`,
    },
    {
      icon: Users,
      title: isAr ? "آلاف العملاء" : "1000s of Customers",
      desc: isAr
        ? `${formatNumber(stats.activeRequestCount)} طلب نشط الآن`
        : `${formatNumber(stats.activeRequestCount)} active requests right now`,
    },
    {
      icon: Shield,
      title: isAr ? "ضمان سَنَدي" : "Sanadi Guarantee",
      desc: isAr ? "حماية تصل إلى 200 د.ا" : "Up to 200 JOD protection coverage",
    },
    {
      icon: Clock,
      title: isAr ? "جدول مرن" : "Flexible Schedule",
      desc: isAr ? "اعمل بالأوقات التي تناسبك" : "Work when it suits you",
    },
    {
      icon: TrendingUp,
      title: isAr ? "طوّر عملك" : "Grow Your Business",
      desc: isAr
        ? "أدوات تحليلية وتقارير أداء"
        : "Analytics tools and performance reports",
    },
    {
      icon: Zap,
      title: isAr ? "حجز فوري" : "Instant Booking",
      desc: isAr
        ? "فعّل الحجز الفوري وزد حجوزاتك"
        : "Enable instant booking for more jobs",
    },
  ];

  const steps = [
    {
      num: 1,
      title: isAr ? "أنشئ ملفك" : "Create Your Profile",
      desc: isAr
        ? "أضف معلوماتك وخدماتك وأسعارك"
        : "Add your info, services, and pricing",
    },
    {
      num: 2,
      title: isAr ? "أكمل التوثيق" : "Get Verified",
      desc: isAr
        ? "ارفع هويتك وشهاداتك"
        : "Upload your ID and certificates",
    },
    {
      num: 3,
      title: isAr ? "ابدأ بالعمل" : "Start Earning",
      desc: isAr
        ? "استلم طلبات وأرسل عروض أسعار"
        : "Receive leads and send quotes",
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="bg-gradient-to-br from-warm-900 to-warm-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">
              {isAr
                ? `انضم لأكثر من ${formatNumber(stats.providerCount)} محترف`
                : `Join ${formatNumber(stats.providerCount)}+ Professionals`}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              {isAr ? "طوّر عملك مع سَنَدي" : "Grow Your Business with Sanadi"}
            </h1>
            <p className="text-lg text-warm-400 mb-8">
              {isAr
                ? "انضم لآلاف المحترفين الذين يكسبون أكثر ويبنون سمعتهم مع سَنَدي"
                : "Join thousands of professionals earning more and building their reputation with Sanadi"}
            </p>
            <Link href={`/${locale}/register?role=PROVIDER`}>
              <Button variant="secondary" size="lg" className="text-lg px-8">
                {isAr ? "انضم الآن" : "Join Now"}
                <Arrow className="h-5 w-5 ms-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand-500 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center max-w-2xl mx-auto">
            {[
              {
                value: `${formatNumber(stats.providerCount)}+`,
                label: isAr ? "محترف نشط" : "Active Professionals",
              },
              {
                value: `${formatNumber(stats.activeRequestCount)}+`,
                label: isAr ? "طلب مفتوح" : "Open Requests",
              },
              {
                value: `${stats.avgMonthlyEarnings}+ JOD`,
                label: isAr ? "متوسط الأرباح الشهرية" : "Avg. Monthly Earnings",
              },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-heading font-bold">{stat.value}</div>
                <div className="text-sm text-brand-100 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center text-warm-900 mb-10">
            {isAr ? "لماذا سَنَدي؟" : "Why Sanadi?"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-medium transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-[12px] bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
                      <b.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-semibold text-warm-900 mb-1">{b.title}</h3>
                    <p className="text-sm text-warm-500">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-warm-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center text-warm-900 mb-10">
            {isAr ? "كيف تبدأ؟" : "How to Get Started"}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-brand-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-heading font-semibold text-warm-900 mb-1">{s.title}</h3>
                <p className="text-sm text-warm-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-500 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
            {isAr ? "جاهز للبدء؟" : "Ready to Get Started?"}
          </h2>
          <p className="text-brand-100 mb-6 max-w-lg mx-auto">
            {isAr
              ? "التسجيل مجاني وسريع. ابدأ باستقبال الطلبات اليوم."
              : "Registration is free and quick. Start receiving leads today."}
          </p>
          <Link href={`/${locale}/register?role=PROVIDER`}>
            <Button variant="secondary" size="lg">
              {isAr ? "سجّل الآن" : "Register Now"}{" "}
              <Arrow className="h-4 w-4 ms-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
