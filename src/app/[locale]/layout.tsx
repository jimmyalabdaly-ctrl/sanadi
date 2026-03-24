import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans, DM_Sans, IBM_Plex_Sans_Arabic, Noto_Sans_Arabic } from "next/font/google";
import { locales, type Locale } from "@/lib/i18n";
import { SessionProvider } from "@/components/providers/session-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading-ar",
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-body-ar",
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${dmSans.variable} ${ibmPlexArabic.variable} ${notoSansArabic.variable} font-body antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider>
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
