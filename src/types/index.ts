import type { User, ProviderProfile, ServiceCategory, ServiceRequest, Quote, Booking, Review, Conversation, Message, Notification, PaymentTransaction, Wallet, Report } from "@prisma/client";

export type UserWithProfile = User & {
  providerProfile: ProviderProfile | null;
};

export type ProviderWithUser = ProviderProfile & {
  user: User;
  services: ProviderServiceWithCategory[];
  serviceAreas: { city: string; area: string | null }[];
};

export type ProviderServiceWithCategory = {
  id: string;
  categoryId: string;
  category: ServiceCategory;
  priceMin: number | null;
  priceMax: number | null;
  description: string | null;
  descriptionAr: string | null;
};

export type ServiceCategoryWithSubs = ServiceCategory & {
  subCategories: ServiceCategory[];
  parentCategory: ServiceCategory | null;
};

export type ServiceRequestWithDetails = ServiceRequest & {
  customer: User;
  category: ServiceCategory;
  quotes: QuoteWithProvider[];
  _count: { quotes: number };
};

export type QuoteWithProvider = Quote & {
  provider: User & { providerProfile: ProviderProfile | null };
};

export type BookingWithDetails = Booking & {
  customer: User;
  provider: User & { providerProfile: ProviderProfile | null };
  serviceRequest: ServiceRequest & { category: ServiceCategory };
  quote: Quote | null;
  review: Review | null;
};

export type ReviewWithUsers = Review & {
  reviewer: User;
  reviewee: User;
  booking: Booking & { serviceRequest: ServiceRequest & { category: ServiceCategory } };
};

export type ConversationWithDetails = Conversation & {
  participants: { user: User }[];
  messages: Message[];
};

export type NotificationWithData = Notification;

export type DashboardStats = {
  totalEarnings: number;
  jobsCompleted: number;
  newLeads: number;
  averageRating: number;
  monthlyEarnings: { month: string; amount: number }[];
};

export type AdminStats = {
  totalUsers: number;
  totalProviders: number;
  activeRequests: number;
  bookingsToday: number;
  totalRevenue: number;
  openDisputes: number;
  userGrowth: { date: string; count: number }[];
  revenueTrend: { date: string; amount: number }[];
  bookingsByCategory: { category: string; count: number }[];
  cityDistribution: { city: string; count: number }[];
};

export type SeasonalRecommendation = {
  season: string;
  services: {
    categoryId: string;
    name: string;
    nameAr: string;
    icon: string;
    reason: string;
    reasonAr: string;
  }[];
};

export type CostEstimate = {
  serviceType: string;
  propertyType: string;
  size: number;
  rooms: number;
  estimatedMin: number;
  estimatedMax: number;
  marketAverage: number;
};
