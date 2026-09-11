'use client';

import React, { useState, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { InfoModal } from '@/components/InfoModal';
import { ConverterHub } from '@/components/converter/ConverterHub';

export default function ConvertPage() {
  const [infoModalType, setInfoModalType] = useState<'how-it-works' | 'privacy' | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-50 transition-colors">
      <Navbar
        onOpenHowItWorks={() => setInfoModalType('how-it-works')}
        onOpenPrivacy={() => setInfoModalType('privacy')}
      />

      <main className="flex-1 w-full pb-16">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="text-xs text-zinc-400">Loading PDF Converter Suite...</div>
            </div>
          }
        >
          <ConverterHub />
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
