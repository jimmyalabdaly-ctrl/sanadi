import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  firstNameAr: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "Last name is required"),
  lastNameAr: z.string().min(2, "اسم العائلة مطلوب"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+962[0-9]{8,9}$/, "Invalid Jordanian phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  city: z.string().min(1, "City is required"),
  role: z.enum(["CUSTOMER", "PROVIDER"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const serviceRequestSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  titleAr: z.string().min(5, "العنوان مطلوب"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  descriptionAr: z.string().min(20, "الوصف مطلوب"),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  urgency: z.enum(["FLEXIBLE", "WITHIN_WEEK", "WITHIN_3_DAYS", "URGENT_24H", "EMERGENCY"]),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  address: z.string().optional(),
  isGroupRequest: z.boolean().optional(),
  groupSize: z.number().min(2).optional(),
});

export const quoteSchema = z.object({
  serviceRequestId: z.string(),
  priceQuote: z.number().min(1, "Price must be at least 1 JOD"),
  estimatedDuration: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  messageAr: z.string().optional(),
  availableDate: z.string().optional(),
  includesItems: z.array(z.object({
    item: z.string(),
    price: z.number(),
  })).optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  titleAr: z.string().optional(),
  comment: z.string().min(10, "Review must be at least 10 characters"),
  commentAr: z.string().optional(),
  categories: z.object({
    punctuality: z.number().min(1).max(5),
    quality: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
  }).optional(),
});

export const providerProfileSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessNameAr: z.string().min(2, "اسم العمل مطلوب"),
  businessDescription: z.string().min(20, "Description must be at least 20 characters"),
  businessDescriptionAr: z.string().min(20, "الوصف مطلوب"),
  yearsOfExperience: z.number().min(0).max(50),
  services: z.array(z.object({
    categoryId: z.string(),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
  })).min(1, "Select at least one service"),
  serviceAreas: z.array(z.object({
    city: z.string(),
    area: z.string().optional(),
  })).min(1, "Select at least one service area"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
