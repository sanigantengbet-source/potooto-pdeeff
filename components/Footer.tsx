'use client';

import React from 'react';
import Image from 'next/image';
import { Shield, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  onOpenHowItWorks?: () => void;
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHowItWorks,
  onOpenPrivacy,
}) => {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white dark:border-zinc-800/80 dark:bg-[#09090b] transition-colors mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1.5 sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-2">
            {/* Light mode logo */}
            <Image
              src="/planner-logo.png"
              alt="Planner"
              width={90}
              height={24}
              className="h-6 w-auto object-contain block dark:hidden"
              referrerPolicy="no-referrer"
            />
            {/* Dark mode logo */}
            <Image
              src="/planner-logo-dark.png"
              alt="Planner"
              width={90}
              height={24}
              className="h-6 w-auto object-contain hidden dark:block"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Fast, simple, and private image to PDF conversion in your browser.
          </p>
        </div>

        {/* Links and Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            How it works
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Privacy
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            GitHub
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-zinc-400 dark:text-zinc-500">
            © 2026 Photo to PDF
          </span>
        </div>
      </div>

      {/* Attribution at the very bottom */}
      <div className="border-t border-zinc-100 py-3 text-center dark:border-zinc-800/60" id="footer-power-by">
        <p className="text-[11px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          POWER BY SANN404 FORUM GROUP
        </p>
      </div>
    </footer>
  );
};
