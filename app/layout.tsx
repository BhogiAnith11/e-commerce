import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ShopEZ — AI-Powered Marketplace',
  description:
    'ShopEZ is an AI-driven e-commerce platform where sellers list products from a single image and buyers shop with a conversational AI agent.',
  keywords: 'e-commerce, AI shopping, marketplace, ShopEZ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 72px)' }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
