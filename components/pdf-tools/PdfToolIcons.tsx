'use client';

import React from 'react';
import { PdfToolId } from '@/lib/pdf-tools/types';

interface PdfToolIconProps {
  toolId: PdfToolId | string;
  className?: string;
  size?: number;
}

export const PdfToolIcon: React.FC<PdfToolIconProps> = ({
  toolId,
  className = 'w-6 h-6',
  size = 24,
}) => {
  switch (toolId) {
    case 'merge':
      // Gabungkan PDF: multiple PDF documents converging with an arrow/merge symbol
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Back document */}
          <path d="M4 3h7l3 3v5H4V3z" className="text-blue-500/50 dark:text-blue-400/50" fill="currentColor" stroke="none" />
          <path d="M4 3h7l3 3v5H4V3z" className="text-zinc-600 dark:text-zinc-400" />
          {/* Front merged document */}
          <path d="M9 8h8l3 3v10H9V8z" className="text-blue-600 dark:text-blue-500" stroke="currentColor" fill="currentColor" fillOpacity="0.12" />
          <path d="M17 8v3h3" />
          {/* Inward merge arrows */}
          <path d="M11 14h6" className="text-blue-600 dark:text-blue-400" strokeWidth="2" />
          <path d="M14 11.5l2.5 2.5-2.5 2.5" className="text-blue-600 dark:text-blue-400" strokeWidth="2" />
        </svg>
      );

    case 'split':
      // Pisahkan PDF: one PDF document splitting into separate parts with divider/arrows
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Left partition */}
          <path d="M3 4h6v16H3a1 1 0 01-1-1V5a1 1 0 011-1z" className="text-orange-600 dark:text-orange-500" stroke="currentColor" fill="currentColor" fillOpacity="0.15" />
          {/* Right partition */}
          <path d="M15 4h6a1 1 0 011 1v14a1 1 0 01-1 1h-6V4z" className="text-orange-600 dark:text-orange-500" stroke="currentColor" fill="currentColor" fillOpacity="0.15" />
          {/* Central split cut indicator */}
          <path d="M12 2v20" strokeDasharray="2 2" className="text-zinc-500 dark:text-zinc-400" />
          {/* Diverging arrows */}
          <path d="M8 12H5m0 0l1.5-1.5M5 12l1.5 1.5" className="text-orange-500" strokeWidth="2" />
          <path d="M16 12h3m0 0l-1.5-1.5M19 12l-1.5 1.5" className="text-orange-500" strokeWidth="2" />
        </svg>
      );

    case 'compress':
      // Kompres PDF: PDF document with inward compression arrows / clamp visual
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* PDF Outline */}
          <rect x="5" y="3" width="14" height="18" rx="2" className="text-emerald-600 dark:text-emerald-500" stroke="currentColor" fill="currentColor" fillOpacity="0.12" />
          {/* Top compress arrow */}
          <path d="M12 7v4m0 0l-2-2m2 2l2-2" className="text-emerald-600 dark:text-emerald-400" strokeWidth="2" />
          {/* Bottom compress arrow */}
          <path d="M12 17v-4m0 0l-2 2m2-2l2 2" className="text-emerald-600 dark:text-emerald-400" strokeWidth="2" />
          {/* Horizontal indicator bar */}
          <line x1="8.5" y1="12" x2="15.5" y2="12" className="text-emerald-600 dark:text-emerald-300" strokeWidth="2" />
        </svg>
      );

    case 'organize':
      // Atur PDF: page thumbnails with reorder handles / grid swap icon
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Top-left card */}
          <rect x="3" y="3" width="7.5" height="9.5" rx="1.5" className="text-purple-600 dark:text-purple-400" stroke="currentColor" fill="currentColor" fillOpacity="0.15" />
          {/* Top-right card */}
          <rect x="13.5" y="3" width="7.5" height="9.5" rx="1.5" className="text-purple-600 dark:text-purple-400" stroke="currentColor" />
          {/* Bottom card */}
          <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" className="text-purple-600 dark:text-purple-400" stroke="currentColor" />
          {/* Swap curved arrows */}
          <path d="M14 18h5m0 0l-1.5-1.5M19 18l-1.5 1.5" className="text-purple-600 dark:text-purple-400" strokeWidth="2" />
          <path d="M19 15a4 4 0 00-4-3" className="text-purple-600 dark:text-purple-400" />
        </svg>
      );

    case 'rotate':
      // Putar PDF: PDF document + circular rotation arrow
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Document rotated slightly */}
          <rect x="7" y="6" width="11" height="15" rx="1.5" className="text-sky-600 dark:text-sky-400" stroke="currentColor" fill="currentColor" fillOpacity="0.12" />
          {/* Bold circular rotation arrow */}
          <path d="M3.5 12a8 8 0 112.35 5.65" className="text-sky-600 dark:text-sky-400" strokeWidth="2" />
          <path d="M3 17.5h4v-4" className="text-sky-600 dark:text-sky-400" strokeWidth="2" />
        </svg>
      );

    case 'delete-pages':
      // Hapus Halaman PDF: document with page and minus / trash cut indicator
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Base PDF */}
          <path d="M5 3h9l4 4v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" className="text-rose-600 dark:text-rose-500" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
          <path d="M14 3v4h4" />
          {/* Trash badge / minus badge */}
          <circle cx="16" cy="16" r="5" className="text-rose-500 fill-rose-100 dark:fill-rose-950/80 stroke-rose-600 dark:stroke-rose-400" strokeWidth="1.75" />
          <line x1="13.5" y1="16" x2="18.5" y2="16" className="text-rose-600 dark:text-rose-300" strokeWidth="2" />
        </svg>
      );

    case 'extract-pages':
      // Ekstrak Halaman PDF: document with single extracted page floating out
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Base stack */}
          <rect x="3" y="6" width="11" height="15" rx="1.5" className="text-teal-600 dark:text-teal-500" stroke="currentColor" fill="currentColor" fillOpacity="0.12" />
          {/* Floating extracted page with outward arrow */}
          <rect x="10" y="3" width="11" height="14" rx="1.5" className="text-teal-500 dark:text-teal-300 fill-white dark:fill-zinc-900" strokeWidth="1.75" />
          <path d="M13 8h5M13 11h3" className="text-teal-600 dark:text-teal-400" />
          <path d="M7 16l-3 3m0 0h2.5m-2.5 0v-2.5" className="text-teal-600 dark:text-teal-400" strokeWidth="2" />
        </svg>
      );

    case 'edit':
      // Edit PDF: PDF document + precise editor pencil / drawing cursor
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Document with lines */}
          <path d="M4 4h10l4 4v3" className="text-indigo-600 dark:text-indigo-400" stroke="currentColor" />
          <path d="M4 4v16a1 1 0 001 1h8" className="text-indigo-600 dark:text-indigo-400" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
          <path d="M7 9h5M7 13h3" className="text-indigo-400 dark:text-indigo-500" />
          {/* Slanted Stylus / Pencil */}
          <path d="M18.8 11.2a1.5 1.5 0 00-2.1 0l-5.7 5.7V19h2.1l5.7-5.7a1.5 1.5 0 000-2.1z" className="text-indigo-600 dark:text-indigo-300 fill-indigo-100 dark:fill-indigo-950/70" strokeWidth="1.75" />
        </svg>
      );

    case 'watermark':
      // Tanda Air: PDF document + diagonal watermark stamp banner
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="4" y="3" width="16" height="18" rx="2" className="text-amber-600 dark:text-amber-500" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
          <path d="M7 7h10M7 17h10" strokeDasharray="2 2" className="text-zinc-400 dark:text-zinc-600" />
          {/* Diagonal Watermark Stamp */}
          <rect x="4.5" y="10" width="15" height="4" rx="1" transform="rotate(-25 12 12)" className="text-amber-500 stroke-amber-600 dark:stroke-amber-400 fill-amber-100 dark:fill-amber-950" strokeWidth="1.5" />
          <line x1="7" y1="12" x2="17" y2="12" transform="rotate(-25 12 12)" className="text-amber-600 dark:text-amber-300" strokeWidth="1.75" />
        </svg>
      );

    case 'sign':
      // Tanda Tangani PDF: document + fountain pen / signature cursive line
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 4h9l5 5v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" className="text-cyan-600 dark:text-cyan-500" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
          <path d="M13 4v5h5" />
          {/* Smooth cursive signature curve */}
          <path d="M7 16c1.5-2 2.5 1 4 0s2-2 3.5 0 2.5-1 3.5 0" className="text-cyan-600 dark:text-cyan-400" strokeWidth="2" />
          {/* Pen nib */}
          <path d="M15 9l4 4-2 2-4-4 2-2z" className="text-cyan-600 dark:text-cyan-300" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );

    case 'protect':
      // Proteksi PDF: PDF document + security padlock
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 3h8l4 4v6M5 3v18h6" className="text-red-600 dark:text-red-500" stroke="currentColor" fill="currentColor" fillOpacity="0.08" />
          <path d="M13 3v4h4" />
          {/* Solid security padlock */}
          <rect x="12" y="14" width="9" height="7" rx="1.5" className="text-red-600 dark:text-red-400 fill-red-100 dark:fill-red-950/80" strokeWidth="1.75" />
          <path d="M14 14v-2.5a2.5 2.5 0 015 0V14" className="text-red-600 dark:text-red-400" strokeWidth="2" />
          <circle cx="16.5" cy="17.5" r="0.75" fill="currentColor" className="text-red-700 dark:text-red-300" />
        </svg>
      );

    case 'unlock':
      // Buka PDF Terkunci: PDF document + unlocked open shackle padlock
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 3h8l4 4v6M5 3v18h6" className="text-green-600 dark:text-green-500" stroke="currentColor" fill="currentColor" fillOpacity="0.08" />
          <path d="M13 3v4h4" />
          {/* Unlocked lock with shackle raised */}
          <rect x="12" y="14" width="9" height="7" rx="1.5" className="text-green-600 dark:text-green-400 fill-green-100 dark:fill-green-950/80" strokeWidth="1.75" />
          <path d="M14 12V9.5a2.5 2.5 0 015 0V11" className="text-green-600 dark:text-green-400" strokeWidth="2" />
          <circle cx="16.5" cy="17.5" r="0.75" fill="currentColor" className="text-green-700 dark:text-green-300" />
        </svg>
      );

    case 'repair':
      // Perbaiki PDF: PDF document + wrench / mechanic repair tool
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 3h8l4 4v6M5 3v18h7" className="text-yellow-600 dark:text-yellow-500" stroke="currentColor" fill="currentColor" fillOpacity="0.08" />
          <path d="M13 3v4h4" />
          {/* Professional Wrench symbol */}
          <path
            d="M20.7 13.3a3 3 0 00-3.8-.4l-2.1 2.1 2.1 2.1 2.1-2.1a3 3 0 001.7-1.7zm-4.5 3.1l-4.2 4.2a1 1 0 01-1.4 0l-.7-.7a1 1 0 010-1.4l4.2-4.2"
            className="text-yellow-600 dark:text-yellow-400 fill-yellow-100 dark:fill-yellow-950/70"
            strokeWidth="1.75"
          />
        </svg>
      );

    case 'page-numbers':
      // Nomor Halaman: PDF page with numbers indicator "1 2 3"
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="4" y="3" width="16" height="18" rx="2" className="text-violet-600 dark:text-violet-500" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
          {/* Subtle page content lines */}
          <line x1="8" y1="7" x2="16" y2="7" className="text-zinc-400 dark:text-zinc-600" />
          <line x1="8" y1="10.5" x2="13" y2="10.5" className="text-zinc-400 dark:text-zinc-600" />
          {/* Number badge at bottom right */}
          <rect x="9" y="14" width="7" height="4.5" rx="1" className="text-violet-600 dark:text-violet-400 fill-violet-100 dark:fill-violet-950" strokeWidth="1.5" />
          <path d="M12.5 15.5v2" className="text-violet-700 dark:text-violet-300" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'crop':
      // Crop PDF: PDF page with crop corners / crop marks
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Crop intersecting corners */}
          <path d="M6 2v14a2 2 0 002 2h14" className="text-pink-600 dark:text-pink-400" strokeWidth="2" />
          <path d="M18 22V8a2 2 0 00-2-2H2" className="text-pink-600 dark:text-pink-400" strokeWidth="2" />
          {/* Inner cropped area box */}
          <rect x="8" y="8" width="8" height="8" strokeDasharray="2 2" className="text-pink-500 dark:text-pink-300 fill-pink-500/10" />
        </svg>
      );

    case 'compare':
      // Compare PDF: two documents side-by-side with comparison indicator
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Left doc */}
          <rect x="2.5" y="4" width="8.5" height="15" rx="1.5" className="text-emerald-600 dark:text-emerald-400" stroke="currentColor" fill="currentColor" fillOpacity="0.12" />
          <line x1="4.5" y1="8" x2="8.5" y2="8" className="text-emerald-600/70 dark:text-emerald-400/70" />
          {/* Right doc */}
          <rect x="13" y="4" width="8.5" height="15" rx="1.5" className="text-blue-600 dark:text-blue-400" stroke="currentColor" fill="currentColor" fillOpacity="0.12" />
          <line x1="15" y1="8" x2="19" y2="8" className="text-blue-600/70 dark:text-blue-400/70" />
          {/* Comparison balance/indicator symbol in center */}
          <circle cx="12" cy="11.5" r="2.5" className="text-zinc-700 dark:text-zinc-200 fill-white dark:fill-zinc-900" strokeWidth="1.5" />
          <path d="M11 11.5h2" className="text-zinc-800 dark:text-zinc-200" strokeWidth="2" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className={className}
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
        </svg>
      );
  }
};
