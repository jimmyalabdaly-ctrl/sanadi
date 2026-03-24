import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.homeProfile.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.providerServiceArea.deleteMany();
  await prisma.providerService.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // ==================== SERVICE CATEGORIES ====================
  console.log("Creating categories...");

  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: { name: "Plumbing", nameAr: "سباكة", slug: "plumbing", icon: "Droplets", description: "All plumbing services including repairs, installations, and emergencies", descriptionAr: "جميع خدمات السباكة بما في ذلك الإصلاحات والتركيبات والطوارئ", averagePriceMin: 15, averagePriceMax: 80, sortOrder: 1 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Electrical", nameAr: "كهرباء", slug: "electrical", icon: "Zap", description: "Electrical installations, repairs, and wiring services", descriptionAr: "تركيبات كهربائية وإصلاحات وخدمات الأسلاك", averagePriceMin: 20, averagePriceMax: 100, sortOrder: 2 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Painting", nameAr: "دهان", slug: "painting", icon: "Paintbrush", description: "Interior and exterior painting services", descriptionAr: "خدمات الدهان الداخلي والخارجي", averagePriceMin: 25, averagePriceMax: 150, sortOrder: 3 },
    }),
    prisma.serviceCategory.create({
      data: { name: "AC Repair & Installation", nameAr: "تكييف وتبريد", slug: "ac-repair", icon: "Wind", description: "AC repair, installation, and maintenance", descriptionAr: "إصلاح وتركيب وصيانة أجهزة التكييف", averagePriceMin: 30, averagePriceMax: 200, sortOrder: 4 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Cleaning", nameAr: "تنظيف", slug: "cleaning", icon: "Sparkles", description: "Professional cleaning services for homes and offices", descriptionAr: "خدمات تنظيف احترافية للمنازل والمكاتب", averagePriceMin: 20, averagePriceMax: 60, sortOrder: 5 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Carpentry", nameAr: "نجارة", slug: "carpentry", icon: "Hammer", description: "Custom carpentry and woodwork services", descriptionAr: "خدمات النجارة والأعمال الخشبية المخصصة", averagePriceMin: 25, averagePriceMax: 120, sortOrder: 6 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Tiling & Flooring", nameAr: "بلاط وأرضيات", slug: "tiling", icon: "Grid3X3", description: "Tile installation and flooring services", descriptionAr: "تركيب البلاط وخدمات الأرضيات", averagePriceMin: 15, averagePriceMax: 100, sortOrder: 7 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Waterproofing", nameAr: "عزل مياه", slug: "waterproofing", icon: "Umbrella", description: "Waterproofing and insulation services", descriptionAr: "خدمات العزل المائي والحراري", averagePriceMin: 50, averagePriceMax: 300, sortOrder: 8 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Moving & Delivery", nameAr: "نقل وتوصيل", slug: "moving", icon: "Truck", description: "Moving, delivery, and transportation services", descriptionAr: "خدمات النقل والتوصيل", averagePriceMin: 30, averagePriceMax: 200, sortOrder: 9 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Gardening & Landscaping", nameAr: "حدائق وتنسيق", slug: "gardening", icon: "TreePine", description: "Garden maintenance and landscaping", descriptionAr: "صيانة الحدائق والتنسيق", averagePriceMin: 20, averagePriceMax: 80, sortOrder: 10 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Aluminum & PVC", nameAr: "ألمنيوم و PVC", slug: "aluminum", icon: "Square", description: "Aluminum and PVC windows and doors", descriptionAr: "نوافذ وأبواب ألمنيوم و PVC", averagePriceMin: 40, averagePriceMax: 250, sortOrder: 11 },
    }),
    prisma.serviceCategory.create({
      data: { name: "Satellite & Internet", nameAr: "ستلايت وانترنت", slug: "satellite", icon: "Wifi", description: "Satellite dish and internet installation", descriptionAr: "تركيب أطباق الستلايت والانترنت", averagePriceMin: 15, averagePriceMax: 60, sortOrder: 12 },
    }),
  ]);

  // Subcategories
  const subcats: { name: string; nameAr: string; slug: string; parentId: string }[] = [
    { name: "Pipe Repair", nameAr: "إصلاح أنابيب", slug: "pipe-repair", parentId: categories[0].id },
    { name: "Drain Cleaning", nameAr: "تنظيف مجاري", slug: "drain-cleaning", parentId: categories[0].id },
    { name: "Water Heater", nameAr: "سخانات مياه", slug: "water-heater", parentId: categories[0].id },
    { name: "Toilet Repair", nameAr: "إصلاح مرحاض", slug: "toilet-repair", parentId: categories[0].id },
    { name: "Wiring", nameAr: "تمديدات كهربائية", slug: "wiring", parentId: categories[1].id },
    { name: "Lighting", nameAr: "إنارة", slug: "lighting", parentId: categories[1].id },
    { name: "Circuit Breaker", nameAr: "قاطع كهربائي", slug: "circuit-breaker", parentId: categories[1].id },
    { name: "Interior Painting", nameAr: "دهان داخلي", slug: "interior-painting", parentId: categories[2].id },
    { name: "Exterior Painting", nameAr: "دهان خارجي", slug: "exterior-painting", parentId: categories[2].id },
    { name: "AC Installation", nameAr: "تركيب تكييف", slug: "ac-installation", parentId: categories[3].id },
    { name: "AC Maintenance", nameAr: "صيانة تكييف", slug: "ac-maintenance", parentId: categories[3].id },
    { name: "Deep Cleaning", nameAr: "تنظيف عميق", slug: "deep-cleaning", parentId: categories[4].id },
    { name: "Regular Cleaning", nameAr: "تنظيف دوري", slug: "regular-cleaning", parentId: categories[4].id },
  ];

  for (const sub of subcats) {
    await prisma.serviceCategory.create({
      data: { name: sub.name, nameAr: sub.nameAr, slug: sub.slug, parentCategoryId: sub.parentId, isActive: true },
    });
  }

  // ==================== ADMIN USER ====================
  console.log("Creating admin...");
  await prisma.user.create({
    data: {
      email: "admin@sanadi.jo",
      phone: "+962791000000",
      passwordHash,
      firstName: "Admin",
      firstNameAr: "مشرف",
      lastName: "Sanadi",
      lastNameAr: "سَنَدي",
      role: "ADMIN",
      city: "Amman",
      area: "Abdoun",
      isVerified: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      language: "en",
    },
  });

  // ==================== CUSTOMERS ====================
  console.log("Creating customers...");
  const customerData = [
    { fn: "Lina", fnAr: "لينا", ln: "Al-Rifai", lnAr: "الرفاعي", email: "lina@email.com", phone: "+962791000001", city: "Amman", area: "Abdoun" },
    { fn: "Nour", fnAr: "نور", ln: "Al-Abbadi", lnAr: "العبادي", email: "nour@email.com", phone: "+962791000002", city: "Irbid", area: "" },
    { fn: "Dana", fnAr: "دانا", ln: "Abu Zeid", lnAr: "أبو زيد", email: "dana@email.com", phone: "+962791000003", city: "Amman", area: "Shmeisani" },
    { fn: "Rania", fnAr: "رانيا", ln: "Mahmoud", lnAr: "محمود", email: "rania@email.com", phone: "+962791000004", city: "Zarqa", area: "" },
    { fn: "Firas", fnAr: "فراس", ln: "Al-Zoubi", lnAr: "الزعبي", email: "firas@email.com", phone: "+962791000005", city: "Amman", area: "Tlaa Al-Ali" },
    { fn: "Hala", fnAr: "هالة", ln: "Qasem", lnAr: "قاسم", email: "hala@email.com", phone: "+962791000006", city: "Amman", area: "Khalda" },
    { fn: "Tariq", fnAr: "طارق", ln: "Saleh", lnAr: "صالح", email: "tariq@email.com", phone: "+962791000007", city: "Aqaba", area: "" },
    { fn: "Yasmeen", fnAr: "ياسمين", ln: "Haddad", lnAr: "حداد", email: "yasmeen@email.com", phone: "+962791000008", city: "Madaba", area: "" },
    { fn: "Samer", fnAr: "سامر", ln: "Khoury", lnAr: "خوري", email: "samer@email.com", phone: "+962791000009", city: "Amman", area: "Sweifieh" },
    { fn: "Layla", fnAr: "ليلى", ln: "Awad", lnAr: "عوض", email: "layla@email.com", phone: "+962791000010", city: "Salt", area: "" },
    { fn: "Mazen", fnAr: "مازن", ln: "Darwish", lnAr: "درويش", email: "mazen@email.com", phone: "+962791000011", city: "Jerash", area: "" },
    { fn: "Dina", fnAr: "دينا", ln: "Nasser", lnAr: "ناصر", email: "dina@email.com", phone: "+962791000012", city: "Amman", area: "Dabouq" },
    { fn: "Hussam", fnAr: "حسام", ln: "Fawzi", lnAr: "فوزي", email: "hussam@email.com", phone: "+962791000013", city: "Amman", area: "Rabieh" },
    { fn: "Sara", fnAr: "سارة", ln: "Bakri", lnAr: "بكري", email: "sara@email.com", phone: "+962791000014", city: "Karak", area: "" },
    { fn: "Zaid", fnAr: "زيد", ln: "Hamdan", lnAr: "حمدان", email: "zaid@email.com", phone: "+962791000015", city: "Amman", area: "Jabal Amman" },
  ];

  const customers = await Promise.all(
    customerData.map((c) =>
      prisma.user.create({
        data: {
          email: c.email, phone: c.phone, passwordHash,
          firstName: c.fn, firstNameAr: c.fnAr, lastName: c.ln, lastNameAr: c.lnAr,
          role: "CUSTOMER", city: c.city, area: c.area,
          isVerified: true, isPhoneVerified: true, isEmailVerified: true, language: "ar",
          referralCode: `SANADI-${c.fn.toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 1000)}`,
        },
      })
    )
  );

  // ==================== PROVIDERS ====================
  console.log("Creating providers...");
  const providerData = [
    { fn: "Ahmad", fnAr: "أحمد", ln: "Al-Khalidi", lnAr: "الخالدي", bn: "Al-Khalidi Plumbing", bnAr: "خدمات الخالدي للسباكة", cat: 0, city: "Amman", exp: 12, rating: 4.9, reviews: 234, jobs: 312, tier: "GOLD" as const, verified: true, bg: true },
    { fn: "Mohammad", fnAr: "محمد", ln: "Al-Omari", lnAr: "العمري", bn: "Al-Omari Electric", bnAr: "الكهربائي العمري", cat: 1, city: "Irbid", exp: 8, rating: 4.8, reviews: 189, jobs: 245, tier: "SILVER" as const, verified: true, bg: true },
    { fn: "Omar", fnAr: "عمر", ln: "Hassan", lnAr: "حسن", bn: "Hassan AC Services", bnAr: "حسن لخدمات التكييف", cat: 3, city: "Amman", exp: 15, rating: 4.9, reviews: 312, jobs: 456, tier: "PLATINUM" as const, verified: true, bg: true },
    { fn: "Khaled", fnAr: "خالد", ln: "Al-Nasser", lnAr: "الناصر", bn: "Pro Paint Jordan", bnAr: "الدهان المحترف", cat: 2, city: "Zarqa", exp: 10, rating: 4.7, reviews: 156, jobs: 198, tier: "SILVER" as const, verified: true, bg: false },
    { fn: "Fadi", fnAr: "فادي", ln: "Mansour", lnAr: "منصور", bn: "Mansour Plumbing", bnAr: "سباكة منصور", cat: 0, city: "Amman", exp: 6, rating: 4.6, reviews: 87, jobs: 112, tier: "STANDARD" as const, verified: true, bg: false },
    { fn: "Ibrahim", fnAr: "إبراهيم", ln: "Al-Zoubi", lnAr: "الزعبي", bn: "Al-Zoubi Electrical", bnAr: "كهرباء الزعبي", cat: 1, city: "Irbid", exp: 20, rating: 4.8, reviews: 203, jobs: 289, tier: "GOLD" as const, verified: true, bg: true },
    { fn: "Sami", fnAr: "سامي", ln: "Al-Rousan", lnAr: "الروسان", bn: "Rousan Carpentry", bnAr: "نجارة الروسان", cat: 5, city: "Amman", exp: 18, rating: 4.5, reviews: 65, jobs: 89, tier: "STANDARD" as const, verified: false, bg: false },
    { fn: "Yousef", fnAr: "يوسف", ln: "Bader", lnAr: "بدر", bn: "Bader Cleaning Pro", bnAr: "بدر للتنظيف الاحترافي", cat: 4, city: "Amman", exp: 5, rating: 4.9, reviews: 278, jobs: 378, tier: "GOLD" as const, verified: true, bg: true },
    { fn: "Tarek", fnAr: "طارق", ln: "Al-Haj", lnAr: "الحاج", bn: "Al-Haj Moving", bnAr: "الحاج للنقل", cat: 8, city: "Amman", exp: 7, rating: 4.7, reviews: 124, jobs: 167, tier: "SILVER" as const, verified: true, bg: false },
    { fn: "Nasser", fnAr: "ناصر", ln: "Salem", lnAr: "سالم", bn: "Salem AC Tech", bnAr: "سالم تقنية التكييف", cat: 3, city: "Zarqa", exp: 9, rating: 4.8, reviews: 198, jobs: 234, tier: "SILVER" as const, verified: true, bg: true },
    { fn: "Ali", fnAr: "علي", ln: "Abu Hamda", lnAr: "أبو حمدة", bn: "Abu Hamda Tiles", bnAr: "أبو حمدة للبلاط", cat: 6, city: "Amman", exp: 14, rating: 4.6, reviews: 95, jobs: 134, tier: "STANDARD" as const, verified: true, bg: false },
    { fn: "Majed", fnAr: "ماجد", ln: "Al-Khatib", lnAr: "الخطيب", bn: "Khatib Waterproofing", bnAr: "الخطيب للعزل", cat: 7, city: "Amman", exp: 11, rating: 4.9, reviews: 321, jobs: 432, tier: "PLATINUM" as const, verified: true, bg: true },
    { fn: "Rami", fnAr: "رامي", ln: "Shawkat", lnAr: "شوكت", bn: "Shawkat Gardens", bnAr: "حدائق شوكت", cat: 9, city: "Amman", exp: 8, rating: 4.7, reviews: 67, jobs: 98, tier: "STANDARD" as const, verified: true, bg: false },
    { fn: "Basel", fnAr: "باسل", ln: "Awwad", lnAr: "عوّاد", bn: "Awwad Aluminum", bnAr: "عوّاد للألمنيوم", cat: 10, city: "Amman", exp: 16, rating: 4.8, reviews: 145, jobs: 189, tier: "GOLD" as const, verified: true, bg: true },
    { fn: "Murad", fnAr: "مراد", ln: "Issa", lnAr: "عيسى", bn: "Issa Satellite", bnAr: "عيسى للستلايت", cat: 11, city: "Amman", exp: 4, rating: 4.5, reviews: 56, jobs: 78, tier: "STANDARD" as const, verified: true, bg: false },
    // More providers
    { fn: "Hatem", fnAr: "حاتم", ln: "Barakat", lnAr: "بركات", bn: "Barakat Plumbing Pro", bnAr: "بركات السباكة المحترفة", cat: 0, city: "Aqaba", exp: 7, rating: 4.6, reviews: 78, jobs: 102, tier: "STANDARD" as const, verified: true, bg: false },
    { fn: "Waleed", fnAr: "وليد", ln: "Shami", lnAr: "شامي", bn: "Shami Electric", bnAr: "شامي للكهرباء", cat: 1, city: "Amman", exp: 13, rating: 4.7, reviews: 167, jobs: 223, tier: "SILVER" as const, verified: true, bg: true },
    { fn: "Anas", fnAr: "أنس", ln: "Jaradat", lnAr: "جرادات", bn: "Jaradat Painting", bnAr: "جرادات للدهان", cat: 2, city: "Irbid", exp: 9, rating: 4.8, reviews: 134, jobs: 178, tier: "SILVER" as const, verified: true, bg: false },
    { fn: "Hani", fnAr: "هاني", ln: "Obeidat", lnAr: "عبيدات", bn: "Obeidat Cooling", bnAr: "عبيدات للتبريد", cat: 3, city: "Amman", exp: 11, rating: 4.9, reviews: 256, jobs: 334, tier: "GOLD" as const, verified: true, bg: true },
    { fn: "Raed", fnAr: "رائد", ln: "Masri", lnAr: "المصري", bn: "Masri Cleaning", bnAr: "المصري للتنظيف", cat: 4, city: "Amman", exp: 6, rating: 4.5, reviews: 89, jobs: 123, tier: "STANDARD" as const, verified: true, bg: false },
  ];

  const providers: { userId: string; profileId: string }[] = [];

  for (let i = 0; i < providerData.length; i++) {
    const p = providerData[i];
    const slug = `${p.fn.toLowerCase()}-${p.ln.toLowerCase().replace(/\s/g, "-")}`;

    const user = await prisma.user.create({
      data: {
        email: `${p.fn.toLowerCase()}.${p.ln.toLowerCase().replace(/\s/g, "")}@email.com`,
        phone: `+96279200${String(i).padStart(4, "0")}`,
        passwordHash,
        firstName: p.fn, firstNameAr: p.fnAr, lastName: p.ln, lastNameAr: p.lnAr,
        role: "PROVIDER", city: p.city, area: p.city === "Amman" ? "Abdoun" : undefined,
        isVerified: p.verified, isPhoneVerified: true, isEmailVerified: true, language: "ar",
        bio: `Professional ${categories[p.cat].name.toLowerCase()} specialist with ${p.exp} years of experience.`,
        bioAr: `متخصص في ${categories[p.cat].nameAr} بخبرة ${p.exp} سنوات.`,
        referralCode: `PRO-${slug.toUpperCase().slice(0, 6)}${i}`,
      },
    });

    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id, slug,
        businessName: p.bn, businessNameAr: p.bnAr,
        businessDescription: `Professional ${categories[p.cat].name.toLowerCase()} services. ${p.exp} years of experience. Serving ${p.city} and surrounding areas.`,
        businessDescriptionAr: `خدمات ${categories[p.cat].nameAr} احترافية. ${p.exp} سنوات خبرة. نخدم ${p.city} والمناطق المحيطة.`,
        yearsOfExperience: p.exp,
        identityVerified: p.verified, backgroundCheckPassed: p.bg,
        averageRating: p.rating, totalReviews: p.reviews, totalJobsCompleted: p.jobs,
        responseTime: Math.floor(Math.random() * 45) + 5,
        instantBookEnabled: i % 3 === 0, tier: p.tier,
        isActive: true,
        portfolioImages: [],
        certificates: [],
        availabilitySchedule: {
          sun: { open: "08:00", close: "18:00" },
          mon: { open: "08:00", close: "18:00" },
          tue: { open: "08:00", close: "18:00" },
          wed: { open: "08:00", close: "18:00" },
          thu: { open: "08:00", close: "16:00" },
          fri: { open: "Closed", close: "" },
          sat: { open: "09:00", close: "14:00" },
        },
      },
    });

    providers.push({ userId: user.id, profileId: profile.id });

    // Add service
    await prisma.providerService.create({
      data: {
        providerId: profile.id, categoryId: categories[p.cat].id,
        priceMin: categories[p.cat].averagePriceMin, priceMax: categories[p.cat].averagePriceMax,
      },
    });

    // Add service area
    await prisma.providerServiceArea.create({
      data: { providerId: profile.id, city: p.city },
    });
    if (p.city === "Amman") {
      await prisma.providerServiceArea.create({
        data: { providerId: profile.id, city: "Amman", area: ["Abdoun", "Shmeisani", "Khalda", "Sweifieh", "Tlaa Al-Ali"][i % 5] },
      });
    }

    // Add wallet
    await prisma.wallet.create({
      data: { userId: user.id, balance: Math.floor(Math.random() * 500) },
    });
  }

  // Customer wallets
  for (const c of customers) {
    await prisma.wallet.create({ data: { userId: c.id, balance: Math.floor(Math.random() * 50) } });
  }

  // ==================== SERVICE REQUESTS ====================
  console.log("Creating service requests...");
  const urgencies = ["FLEXIBLE", "WITHIN_WEEK", "WITHIN_3_DAYS", "URGENT_24H", "EMERGENCY"] as const;
  const statuses = ["OPEN", "QUOTED", "BOOKED", "IN_PROGRESS", "COMPLETED"] as const;
  const requestTitles = [
    ["Kitchen Sink Repair", "إصلاح حوض المطبخ"], ["Bathroom Pipe Leak", "تسرب أنابيب الحمام"], ["AC Not Cooling", "التكييف لا يبرد"],
    ["Interior Painting - 3 Rooms", "دهان داخلي - 3 غرف"], ["Deep Cleaning - Apartment", "تنظيف عميق - شقة"], ["Light Fixture Installation", "تركيب إنارة"],
    ["Kitchen Cabinet Repair", "إصلاح خزائن المطبخ"], ["Roof Waterproofing", "عزل سطح"], ["Apartment Moving", "نقل شقة"],
    ["Garden Maintenance", "صيانة حديقة"], ["Window Replacement", "تبديل نوافذ"], ["Satellite Dish Install", "تركيب ستلايت"],
    ["Water Heater Replacement", "تبديل سخان مياه"], ["Electrical Panel Upgrade", "تحديث لوحة كهربائية"], ["Balcony Painting", "دهان بلكونة"],
    ["AC Installation - Split", "تركيب تكييف سبلت"], ["Office Cleaning", "تنظيف مكتب"], ["Door Lock Change", "تغيير قفل باب"],
    ["Floor Tiling - Kitchen", "بلاط أرضية مطبخ"], ["Drain Unclogging", "فتح مجاري مسدودة"],
    ["Emergency Pipe Burst", "انفجار أنبوب طوارئ"], ["Ceiling Fan Install", "تركيب مروحة سقف"], ["Exterior Painting", "دهان خارجي"],
    ["AC Maintenance Annual", "صيانة تكييف سنوية"], ["House Cleaning - Villa", "تنظيف فيلا"], ["Custom Bookshelf", "رف كتب مخصص"],
    ["Bathroom Tiling", "بلاط حمام"], ["Terrace Waterproofing", "عزل تراس"], ["Furniture Moving", "نقل أثاث"],
    ["Lawn Mowing", "قص عشب"], ["Aluminum Door Repair", "إصلاح باب ألمنيوم"], ["Internet Cable Routing", "تمديد كوابل إنترنت"],
  ];

  const serviceRequests = [];
  for (let i = 0; i < 32; i++) {
    const t = requestTitles[i % requestTitles.length];
    const catIdx = i % categories.length;
    const sr = await prisma.serviceRequest.create({
      data: {
        customerId: customers[i % customers.length].id,
        categoryId: categories[catIdx].id,
        title: t[0], titleAr: t[1],
        description: `I need ${t[0].toLowerCase()}. Looking for a reliable professional.`,
        descriptionAr: `أحتاج ${t[1]}. أبحث عن محترف موثوق.`,
        budgetMin: categories[catIdx].averagePriceMin || 20,
        budgetMax: categories[catIdx].averagePriceMax || 100,
        urgency: urgencies[i % urgencies.length],
        city: customers[i % customers.length].city || "Amman",
        area: customers[i % customers.length].area || undefined,
        status: statuses[i % statuses.length],
        preferredDate: new Date(Date.now() + (i + 1) * 86400000),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    serviceRequests.push(sr);
  }

  // ==================== QUOTES ====================
  console.log("Creating quotes...");
  const quotes = [];
  for (let i = 0; i < 60; i++) {
    const sr = serviceRequests[i % serviceRequests.length];
    const prov = providers[i % providers.length];
    const q = await prisma.quote.create({
      data: {
        providerId: prov.userId,
        serviceRequestId: sr.id,
        priceQuote: (sr.budgetMin || 20) + Math.floor(Math.random() * ((sr.budgetMax || 100) - (sr.budgetMin || 20))),
        estimatedDuration: `${Math.floor(Math.random() * 4) + 1} hours`,
        message: `I can handle this job professionally. I have extensive experience.`,
        messageAr: `يمكنني التعامل مع هذا العمل باحترافية. لدي خبرة واسعة.`,
        status: ["PENDING", "ACCEPTED", "DECLINED"][i % 3] as "PENDING" | "ACCEPTED" | "DECLINED",
        availableDate: new Date(Date.now() + (i + 1) * 86400000),
      },
    });
    quotes.push(q);
  }

  // ==================== BOOKINGS ====================
  console.log("Creating bookings...");
  const bookingStatuses = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED_BY_CUSTOMER"] as const;
  const bookings = [];
  for (let i = 0; i < 20; i++) {
    const sr = serviceRequests[i % serviceRequests.length];
    const prov = providers[i % providers.length];
    const totalPrice = 30 + Math.floor(Math.random() * 150);
    const platformFee = totalPrice * 0.1;
    const b = await prisma.booking.create({
      data: {
        customerId: customers[i % customers.length].id,
        providerId: prov.userId,
        serviceRequestId: sr.id,
        scheduledDate: new Date(Date.now() + (i - 10) * 86400000),
        scheduledTime: `${8 + (i % 8)}:00`,
        totalPrice,
        platformFee,
        providerEarnings: totalPrice - platformFee,
        paymentStatus: i < 15 ? "PAID" : "PENDING",
        paymentMethod: (["CASH", "CREDIT_CARD", "WALLET", "CLIQ"] as const)[i % 4],
        status: bookingStatuses[i % bookingStatuses.length],
        customerConfirmedCompletion: i % 3 === 0,
        providerConfirmedCompletion: i % 3 === 0,
        hasSanadiGuarantee: i < 10,
      },
    });
    bookings.push(b);
  }

  // ==================== REVIEWS ====================
  console.log("Creating reviews...");
  const reviewComments = [
    ["Excellent work! Very professional and clean.", "عمل ممتاز! محترف ونظيف جداً."],
    ["Great service, arrived on time. Highly recommended!", "خدمة رائعة، وصل بالموعد. أنصح به بشدة!"],
    ["Good quality work. Fair pricing.", "جودة عمل جيدة. أسعار عادلة."],
    ["Very skilled and experienced. Fixed the problem quickly.", "ماهر وخبير جداً. أصلح المشكلة بسرعة."],
    ["Friendly and professional. Would hire again.", "ودود ومحترف. سأوظفه مرة أخرى."],
    ["Amazing attention to detail. Left the place spotless.", "اهتمام مذهل بالتفاصيل. ترك المكان نظيفاً."],
    ["Reasonable price for excellent work. Very satisfied.", "سعر معقول لعمل ممتاز. راضٍ جداً."],
    ["Communicated well throughout the job. No surprises.", "تواصل جيد طوال العمل. بدون مفاجآت."],
    ["Fast response and fast work. Great experience!", "رد سريع وعمل سريع. تجربة رائعة!"],
    ["Transformed my bathroom completely. Incredible work!", "حوّل حمامي بالكامل. عمل لا يصدق!"],
  ];

  for (let i = 0; i < Math.min(bookings.length, 15); i++) {
    const b = bookings[i];
    if (b.status !== "COMPLETED" && b.status !== "CONFIRMED") continue;
    const rc = reviewComments[i % reviewComments.length];
    await prisma.review.create({
      data: {
        bookingId: b.id,
        reviewerId: b.customerId,
        revieweeId: b.providerId,
        rating: [5, 5, 4, 5, 5, 4, 5, 5, 5, 4][i % 10],
        title: rc[0].split(".")[0],
        titleAr: rc[1].split(".")[0],
        comment: rc[0],
        commentAr: rc[1],
        categories: { punctuality: 4 + (i % 2), quality: 4 + (i % 2), communication: 4 + (i % 2), value: 4 + (i % 2) },
        isVerifiedBooking: true,
        images: [],
      },
    });
  }

  // ==================== NOTIFICATIONS ====================
  console.log("Creating notifications...");
  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        userId: customers[i % customers.length].id,
        type: (["NEW_QUOTE", "BOOKING_CONFIRMED", "MESSAGE", "REVIEW_RECEIVED"] as const)[i % 4],
        title: "New Quote Received",
        titleAr: "عرض سعر جديد",
        body: "You've received a new quote for your service request.",
        bodyAr: "لقد استلمت عرض سعر جديد لطلبك.",
        isRead: i > 5,
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`
    📊 Seeded Data Summary:
    - 1 Admin (admin@sanadi.jo / password123)
    - ${customers.length} Customers
    - ${providers.length} Providers
    - ${categories.length} Categories + ${subcats.length} Subcategories
    - ${serviceRequests.length} Service Requests
    - ${quotes.length} Quotes
    - ${bookings.length} Bookings
    - 15+ Reviews
    - 10 Notifications
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
