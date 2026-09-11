'use client';

import React, { useState, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { InfoModal } from '@/components/InfoModal';
import { PdfToolsHub } from '@/components/pdf-tools/PdfToolsHub';

export default function PdfToolsPage() {
  const [infoModalType, setInfoModalType] = useState<'how-it-works' | 'privacy' | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-50 transition-colors">
      <Navbar
        onOpenHowItWorks={() => setInfoModalType('how-it-works')}
        onOpenPrivacy={() => setInfoModalType('privacy')}
      />

      <main className="flex-1 w-full py-8 sm:py-10">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="text-xs text-zinc-400">Memuat PDF Tools...</div>
            </div>
          }
        >
          <PdfToolsHub />
        </Suspense>
      </main>

      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      <Footer
        onOpenHowItWorks={() => setInfoModalType('how-it-works')}
        onOpenPrivacy={() => setInfoModalType('privacy')}
      />
    </div>
  );
}
