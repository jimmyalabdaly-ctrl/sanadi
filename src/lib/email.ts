import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM_ADDRESS = "Sanadi <noreply@sanadi.jo>";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: string
) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`;

  const isAr = locale === "ar";

  const subject = isAr
    ? "تحقق من بريدك الإلكتروني - سَنَدي"
    : "Verify your email - Sanadi";

  const html = isAr
    ? `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">مرحباً بك في سَنَدي</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        شكراً لتسجيلك. يرجى النقر على الزر أدناه لتأكيد عنوان بريدك الإلكتروني.
      </p>
      <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        تحقق من البريد الإلكتروني
      </a>
      <p style="color: #888; font-size: 14px;">
        إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد الإلكتروني.
      </p>
      <p style="color: #888; font-size: 14px;">
        ينتهي هذا الرابط خلال 24 ساعة.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">سَنَدي — منصة خدمات المنازل الأولى في الأردن</p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">Welcome to Sanadi</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Thanks for signing up! Please click the button below to verify your email address.
      </p>
      <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Verify Email Address
      </a>
      <p style="color: #888; font-size: 14px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
      <p style="color: #888; font-size: 14px;">
        This link will expire in 24 hours.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">Sanadi — Jordan's #1 Home Services Platform</p>
    </div>
  `;

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: string
) {
  const resetUrl = `${APP_URL}/${locale}/reset-password?token=${token}`;

  const isAr = locale === "ar";

  const subject = isAr
    ? "إعادة تعيين كلمة المرور - سَنَدي"
    : "Reset your password - Sanadi";

  const html = isAr
    ? `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">إعادة تعيين كلمة المرور</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        تلقينا طلباً لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه للمتابعة.
      </p>
      <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        إعادة تعيين كلمة المرور
      </a>
      <p style="color: #888; font-size: 14px;">
        إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
      </p>
      <p style="color: #888; font-size: 14px;">
        ينتهي هذا الرابط خلال ساعة واحدة.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">سَنَدي — منصة خدمات المنازل الأولى في الأردن</p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">Reset Your Password</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to proceed.
      </p>
      <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Reset Password
      </a>
      <p style="color: #888; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #888; font-size: 14px;">
        This link will expire in 1 hour.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">Sanadi — Jordan's #1 Home Services Platform</p>
    </div>
  `;

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject,
    html,
  });
}

export async function sendReferralEmail(
  referrerName: string,
  recipientEmail: string,
  referralCode: string,
  locale: string
) {
  const isAr = locale === "ar";
  const registerUrl = `${APP_URL}/${locale}/register?ref=${referralCode}`;

  const subject = isAr
    ? `${referrerName} دعوك للانضمام إلى سَنَدي`
    : `${referrerName} invited you to join Sanadi`;

  const html = isAr
    ? `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">دعوة للانضمام إلى سَنَدي</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        دعوك <strong>${referrerName}</strong> للانضمام إلى منصة سَنَدي لخدمات المنازل في الأردن.
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        سجّل باستخدام رمز الإحالة وستحصل على مكافأة عند إتمام أول حجز لك.
      </p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 8px;">رمز الإحالة</p>
        <p style="color: #92400e; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0;">${referralCode}</p>
      </div>
      <a href="${registerUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        سجّل الآن
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">سَنَدي — منصة خدمات المنازل الأولى في الأردن</p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">You're invited to Sanadi!</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        <strong>${referrerName}</strong> invited you to join Sanadi — Jordan's #1 home services platform.
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Register with this referral code and earn a reward after your first booking.
      </p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 8px;">Your referral code</p>
        <p style="color: #92400e; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0;">${referralCode}</p>
      </div>
      <a href="${registerUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Register Now
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">Sanadi — Jordan's #1 Home Services Platform</p>
    </div>
  `;

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: recipientEmail,
    subject,
    html,
  });
}

export async function sendBookingConfirmation(
  email: string,
  booking: {
    id: string;
    providerName: string;
    scheduledDate: string;
    totalPrice: number;
    serviceName?: string;
  },
  locale: string
) {
  const dashboardUrl = `${APP_URL}/${locale}/dashboard`;
  const isAr = locale === "ar";

  const subject = isAr
    ? `تأكيد الحجز #${booking.id.slice(-8).toUpperCase()} - سَنَدي`
    : `Booking Confirmed #${booking.id.slice(-8).toUpperCase()} - Sanadi`;

  const html = isAr
    ? `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">تم تأكيد حجزك</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        تم تأكيد حجزك مع <strong>${booking.providerName}</strong>.
      </p>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #333;"><strong>رقم الحجز:</strong> #${booking.id.slice(-8).toUpperCase()}</p>
        ${booking.serviceName ? `<p style="margin: 0 0 8px; color: #333;"><strong>الخدمة:</strong> ${booking.serviceName}</p>` : ""}
        <p style="margin: 0 0 8px; color: #333;"><strong>الموعد:</strong> ${booking.scheduledDate}</p>
        <p style="margin: 0; color: #333;"><strong>السعر الإجمالي:</strong> ${booking.totalPrice} دينار أردني</p>
      </div>
      <a href="${dashboardUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        عرض حجوزاتي
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">سَنَدي — منصة خدمات المنازل الأولى في الأردن</p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">Booking Confirmed</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Your booking with <strong>${booking.providerName}</strong> has been confirmed.
      </p>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #333;"><strong>Booking ID:</strong> #${booking.id.slice(-8).toUpperCase()}</p>
        ${booking.serviceName ? `<p style="margin: 0 0 8px; color: #333;"><strong>Service:</strong> ${booking.serviceName}</p>` : ""}
        <p style="margin: 0 0 8px; color: #333;"><strong>Scheduled:</strong> ${booking.scheduledDate}</p>
        <p style="margin: 0; color: #333;"><strong>Total Price:</strong> ${booking.totalPrice} JOD</p>
      </div>
      <a href="${dashboardUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        View My Bookings
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">Sanadi — Jordan's #1 Home Services Platform</p>
    </div>
  `;

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject,
    html,
  });
}
