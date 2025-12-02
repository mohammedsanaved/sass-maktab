import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // FIX: Use a more explicit import pattern or handle the dynamic string better.
  // The error happens because Turbopack/Webpack can't find the folder.
  // Ensure your folder is exactly at "src/messages".

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
