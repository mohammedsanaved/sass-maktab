import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  // swcMinify: true
  /* config options here */
};

export default withNextIntl(nextConfig);
