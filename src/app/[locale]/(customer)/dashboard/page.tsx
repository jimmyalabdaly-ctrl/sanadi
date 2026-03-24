import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const userId = session.user.id as string;

  const [requests, bookings, favorites, wallet, reviews] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { customerId: userId },
      include: {
        category: true,
        quotes: {
          include: {
            provider: {
              include: {
                providerProfile: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        provider: {
          include: { providerProfile: true },
        },
        serviceRequest: {
          include: { category: true },
        },
        review: true,
      },
      orderBy: { scheduledDate: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId },
    }),
    prisma.wallet.findFirst({
      where: { userId },
    }),
    prisma.review.findMany({
      where: { reviewerId: userId },
      include: {
        reviewee: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledDate: true,
            serviceRequest: { select: { title: true, titleAr: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Fetch provider profiles for favorites (providerId is a ProviderProfile id)
  const favoriteProviderIds = favorites.map((f) => f.providerId);
  const favoriteProviders =
    favoriteProviderIds.length > 0
      ? await prisma.providerProfile.findMany({
          where: { id: { in: favoriteProviderIds } },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                firstNameAr: true,
                lastName: true,
                lastNameAr: true,
                avatar: true,
                city: true,
              },
            },
          },
        })
      : [];

  // Wallet transactions
  const walletTransactions = wallet
    ? await prisma.paymentTransaction.findMany({
        where: {
          OR: [{ payerId: userId }, { payeeId: userId }],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          createdAt: true,
          currency: true,
        },
      })
    : [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      firstNameAr: true,
      lastName: true,
      lastNameAr: true,
      email: true,
      phone: true,
      city: true,
      area: true,
      avatar: true,
      referralCode: true,
      isVerified: true,
    },
  });

  return (
    <CustomerDashboardClient
      user={user}
      requests={JSON.parse(JSON.stringify(requests))}
      bookings={JSON.parse(JSON.stringify(bookings))}
      favorites={JSON.parse(JSON.stringify(favorites))}
      favoriteProviders={JSON.parse(JSON.stringify(favoriteProviders))}
      wallet={wallet ? JSON.parse(JSON.stringify(wallet)) : null}
      walletTransactions={JSON.parse(JSON.stringify(walletTransactions))}
      reviews={JSON.parse(JSON.stringify(reviews))}
      locale={params.locale}
    />
  );
}
