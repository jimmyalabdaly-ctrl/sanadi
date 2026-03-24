"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Globe, Shield, ExternalLink, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const { locale, switchLocale } = useLocale();

  const footerSections = [
    {
      title: t("company"),
      links: [
        { label: t("aboutUs"), href: "#" },
        { label: t("careers"), href: "#" },
        { label: t("press"), href: "#" },
        { label: t("blog"), href: "#" },
      ],
    },
    {
      title: t("support"),
      links: [
        { label: t("helpCenter"), href: "#" },
        { label: t("contactUs"), href: "#" },
        { label: t("safety"), href: "#" },
        { label: t("community"), href: "#" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("terms"), href: "#" },
        { label: t("privacy"), href: "#" },
        { label: t("cookies"), href: "#" },
      ],
    },
    {
      title: t("forPros"),
      links: [
        { label: t("proResources"), href: "#" },
        { label: t("successStories"), href: "#" },
        { label: t("proApp"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-warm-900 text-warm-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* About */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-brand-500 text-white font-heading font-bold text-lg">
                S
              </div>
              <span className="font-heading font-bold text-xl text-white">
                {locale === "ar" ? "سَنَدي" : "Sanadi"}
              </span>
            </Link>
            <p className="text-sm text-warm-400 mb-4 max-w-xs">
              {t("aboutText")}
            </p>

            {/* Sanadi Guarantee */}
            <div className="flex items-start gap-3 p-3 rounded-[12px] bg-warm-800 mb-4">
              <Shield className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">{t("sanadiGuarantee")}</p>
                <p className="text-xs text-warm-400">{t("guaranteeText")}</p>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-full bg-warm-800 hover:bg-warm-700 transition-colors" aria-label="Facebook">
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-warm-800 hover:bg-warm-700 transition-colors" aria-label="Instagram">
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-warm-800 hover:bg-warm-700 transition-colors" aria-label="Twitter">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-heading font-semibold text-white mb-3 text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-warm-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-warm-800" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-warm-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{t("address")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              <span>+962 6 XXX XXXX</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              <span>hello@sanadi.jo</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => switchLocale(locale === "ar" ? "en" : "ar")}
              className="text-warm-400 hover:text-white"
            >
              <Globe className="h-4 w-4 me-1" />
              {locale === "ar" ? "English" : "العربية"}
            </Button>
            <p className="text-xs text-warm-500">
              © {new Date().getFullYear()} Sanadi. {t("rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
