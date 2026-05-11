import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ar', 'ur'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Optional: Disable strict prefix for default locale (e.g., /dashboard instead of /en/dashboard)
  // localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js' navigation APIs
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
