'use client';

import React from 'react';

/**
 * BrandLogo:
 * Renders the exact user-provided logo image (/logo-user-transparent.png)
 * and the company name underneath in Tangerine cursive font (.tangerine-bold)
 */
export default function BrandLogo({
  size = 'nav', // 'nav' | 'lg' | 'sidebar' | 'compact'
  showText = true,
  theme = 'auto', // 'auto' | 'dark' | 'light'
  className = '',
}) {
  const isDark = theme === 'dark' || (theme === 'auto' && size === 'nav');

  const styles = {
    nav: {
      imgH: 'h-10 sm:h-11 desk:h-12',
      text: 'text-2xl sm:text-[26px] desk:text-[28px]',
      titleColor: isDark ? 'text-[#38bdf8]' : 'text-[#0f2b6e]',
      pvtColor: isDark ? 'text-[#4ade80]' : 'text-[#16a34a]',
    },
    lg: {
      imgH: 'h-13 sm:h-15 desk:h-16',
      text: 'text-3xl sm:text-4xl desk:text-[42px]',
      titleColor: 'text-[#0f2b6e] dark:text-[#38bdf8]',
      pvtColor: 'text-[#16a34a] dark:text-[#4ade80]',
    },
    sidebar: {
      imgH: 'h-8 sm:h-9',
      text: 'text-xl sm:text-2xl',
      titleColor: 'text-[#0f2b6e] dark:text-[#38bdf8]',
      pvtColor: 'text-[#16a34a] dark:text-[#4ade80]',
    },
    compact: {
      imgH: 'h-6 sm:h-7',
      text: 'text-lg',
      titleColor: 'text-[#0f2b6e] dark:text-[#38bdf8]',
      pvtColor: 'text-[#16a34a] dark:text-[#4ade80]',
    },
  }[size] || {
    imgH: 'h-10 sm:h-11',
    text: 'text-2xl sm:text-[26px]',
    titleColor: isDark ? 'text-[#38bdf8]' : 'text-[#0f2b6e]',
    pvtColor: isDark ? 'text-[#4ade80]' : 'text-[#16a34a]',
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      {/* Exact User Uploaded Logo Image */}
      <img
        src="/logo-user-transparent.png"
        alt="Speedy GO EV | BSG Group"
        className={`${styles.imgH} w-auto object-contain shrink-0 drop-shadow-sm`}
      />

      {/* Subtitle Text in Tangerine Font */}
      {showText && (
        <div
          className="tangerine-bold mt-0.5 flex items-center justify-center gap-1.5 leading-none text-center whitespace-nowrap"
          style={{ fontFamily: '"Tangerine", cursive', fontWeight: 700, fontStyle: 'normal' }}
        >
          <span className={`${styles.text} ${styles.titleColor} drop-shadow-sm`}>
            Go Speedy EV
          </span>
          <span className={`${styles.text} ${styles.pvtColor} drop-shadow-sm`}>
            Pvt. Ltd.
          </span>
        </div>
      )}
    </div>
  );
}
