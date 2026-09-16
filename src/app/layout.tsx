import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Blush & Rose Bakery | Artisan Cakes & Custom Bookings',
  description: 'Handcrafted celebration cakes, bespoke custom cake bookings, and artisan pastries. Order online for scheduled pickup.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;
  try {
    profile = await prisma.bakeryProfile.findUnique({
      where: { id: 'default' },
    });
  } catch (e) {
    console.error('Failed to load bakery profile for layout:', e);
  }

  const bakeryName = profile?.bakeryName || 'Blush & Rose Bakery';
  const noticeBanner = profile?.noticeBanner;

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header bakeryName={bakeryName} noticeBanner={noticeBanner} />
          <main className="page-wrapper">{children}</main>
          <Footer
            bakeryName={bakeryName}
            address={profile?.address}
            phone={profile?.phone}
            email={profile?.email}
            openingHours={profile?.openingHours}
            pickupInstructions={profile?.pickupInstructions}
            cancellationPolicy={profile?.cancellationPolicy}
          />
        </CartProvider>
      </body>
    </html>
  );
}
