import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Planner — Photo & Document PDF Converter',
  description: 'All-in-one private PDF toolkit: Photo to PDF, PDF Converter Suite, and 16 client-side PDF Tools (Merge, Split, Compress, Organize, Sign, Watermark, Protect, Unlock, Edit, Repair).',
  applicationName: 'Planner',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Planner',
  },
  icons: {
    icon: [
      { url: '/planner-icon.jpg' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/planner-icon.jpg',
  },
  openGraph: {
    title: 'Planner — Photo & Document PDF Converter',
    description: 'All-in-one private PDF toolkit: Photo to PDF, PDF Converter Suite, and 16 client-side PDF Tools (Merge, Split, Compress, Organize, Sign, Watermark, Protect, Unlock, Edit, Repair).',
    type: 'website',
    siteName: 'Planner',
  },
  twitter: {
    card: 'summary',
    title: 'Planner — Photo & Document PDF Converter',
    description: 'All-in-one private PDF toolkit: Photo to PDF, PDF Converter Suite, and 16 client-side PDF Tools (Merge, Split, Compress, Organize, Sign, Watermark, Protect, Unlock, Edit, Repair).',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('photo_to_pdf_theme');
                // Default theme is dark unless explicitly set to light
                if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  if (!storedTheme) {
                    localStorage.setItem('photo_to_pdf_theme', 'dark');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white dark:bg-[#09090b] dark:text-zinc-100 dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors duration-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

