import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/custom/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'TECHPROJECT - Hệ thống quản lý dự án kỹ thuật chuyên nghiệp',
  description: 'Quản lý khảo sát, triển khai thi công, nghiệm thu vật tư và tối ưu hóa tiền thưởng ảo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton toastOptions={{ style: { borderRadius: '1.25rem' } }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
