'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Moon,
  Sun,
  Laptop,
  Github,
  Download,
  HelpCircle,
  ShieldCheck,
  Menu,
  X,
  Users,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

interface NavbarProps {
  onOpenHowItWorks?: () => void;
  onOpenPrivacy?: () => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    mql.removeEventListener('change', callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  return (localStorage.getItem('photo_to_pdf_theme') as ThemeMode) || 'dark';
}

function getThemeServerSnapshot(): ThemeMode {
  return 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHowItWorks,
  onOpenPrivacy,
}) => {
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isIOS, install } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const applyTheme = (selectedTheme: ThemeMode) => {
    const isDark =
      selectedTheme === 'dark' ||
      (selectedTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    localStorage.setItem('photo_to_pdf_theme', newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new Event('storage'));
  };

  const cycleTheme = () => {
    if (theme === 'dark') handleThemeChange('light');
    else if (theme === 'light') handleThemeChange('system');
    else handleThemeChange('dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#09090b]/90 transition-colors">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center transition-opacity hover:opacity-85 py-1"
            id="nav-brand-link"
          >
            {/* Light theme logo */}
            <Image
              src="/planner-logo.png"
              alt="Planner"
              width={140}
              height={38}
              className="h-8 sm:h-9 w-auto object-contain block dark:hidden transition-transform group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
              priority
            />
            {/* Dark theme logo */}
            <Image
              src="/planner-logo-dark.png"
              alt="Planner"
              width={140}
              height={38}
              className="h-8 sm:h-9 w-auto object-contain hidden dark:block transition-transform group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
              priority
            />
          </Link>
        </div>

        {/* Center navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            id="nav-link-photo-to-pdf"
          >
            Photo to PDF
          </Link>
          <Link
            href="/convert"
            className="rounded-md px-3 py-1.5 font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            id="nav-link-convert"
          >
            PDF Converter
          </Link>
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            id="nav-link-how-it-works"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>How it works</span>
          </button>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            id="nav-link-privacy"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCommunityModal(true)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            id="nav-link-community"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Community</span>
          </button>
        </nav>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              aria-label="Install App"
              id="nav-install-btn"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIosGuide(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/60 transition-colors"
              aria-label="Install on iOS"
              id="nav-install-ios-btn"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Add to Home</span>
            </button>
          )}

          {/* GitHub Source Button */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/60 transition-colors"
            aria-label="Source on GitHub"
            id="nav-github-btn"
          >
            <Github className="h-3.5 w-3.5" />
            <span>Source</span>
          </a>

          {/* Theme Toggle Button */}
          {isClient && (
            <button
              type="button"
              onClick={cycleTheme}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              aria-label={`Theme mode: ${theme}. Click to change.`}
              title={`Theme: ${theme}`}
              id="nav-theme-toggle-btn"
            >
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Laptop className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex md:hidden h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle navigation menu"
            id="nav-mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-[#09090b] space-y-2">
          <div className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 text-left"
            >
              <FileText className="h-4 w-4" />
              <span>Photo to PDF</span>
            </Link>
            <Link
              href="/convert"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 text-left"
            >
              <FileText className="h-4 w-4 text-emerald-500" />
              <span>PDF Converter Suite</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHowItWorks?.();
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 text-left"
            >
              <HelpCircle className="h-4 w-4" />
              <span>How it works</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPrivacy?.();
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 text-left"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Privacy & Security</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCommunityModal(true);
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 text-left"
              id="mobile-nav-community"
            >
              <Users className="h-4 w-4" />
              <span>Community</span>
            </button>
            {isInstallable && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  install();
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
              >
                <Download className="h-4 w-4" />
                <span>Install Application</span>
              </button>
            )}
            {isIOS && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowIosGuide(true);
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
              >
                <Download className="h-4 w-4" />
                <span>Install on iOS Safari</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Install Planner on iOS
            </h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              1. Tap the <strong className="font-semibold text-zinc-900 dark:text-zinc-100">Share</strong> icon at the bottom of Safari.<br />
              2. Scroll down and choose <strong className="font-semibold text-zinc-900 dark:text-zinc-100">Add to Home Screen</strong>.
            </p>
            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full rounded-lg bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Community / WhatsApp Channel Recommendation Modal */}
      {showCommunityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Close button */}
            <button
              onClick={() => setShowCommunityModal(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              aria-label="Close community modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Official Channel
            </div>

            <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Join Our Community
            </h3>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              We highly recommend joining our official WhatsApp channel to receive instant updates, new feature releases, performance improvements, and announcements directly from the development team.
            </p>

            {/* Feature highlights */}
            <div className="mt-4 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/75 p-3 text-xs text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-800/40 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Instant notifications for new tools and updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Direct release notes and developer insights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Active discussions and community feedback</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col gap-2">
              <a
                href="https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#20bd5a] transition-colors"
                id="modal-join-whatsapp-btn"
              >
                <span>Join WhatsApp Channel</span>
                <ExternalLink className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => setShowCommunityModal(false)}
                className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Small attribution text requested by user */}
            <p className="mt-4 text-center text-[10px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
              POWER BY SANN404 FORUM GROUP
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
