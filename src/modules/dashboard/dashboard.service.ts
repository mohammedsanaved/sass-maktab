import { getCache, setCache } from '@/lib/cache/cache';
import { logger } from '@/lib/observability/logger';
import {
  fetchDashboardOverview,
  type DashboardOverviewEntity,
} from '@/modules/dashboard/dashboard.repository';

const DASHBOARD_OVERVIEW_CACHE_TTL_SECONDS = 60;

function getOverviewCacheKey(year: number, month: number) {
  return `dashboard:overview:${year}:${month}`;
}

export async function getDashboardOverview(
  year: number,
  month: number
): Promise<DashboardOverviewEntity> {
  const cacheKey = getOverviewCacheKey(year, month);
  const cached = await getCache(cacheKey);

  if (cached) {
    return JSON.parse(cached) as DashboardOverviewEntity;
  }

  const overview = await fetchDashboardOverview(year, month);

  await setCache(
    cacheKey,
    JSON.stringify(overview),
    DASHBOARD_OVERVIEW_CACHE_TTL_SECONDS
  );

  logger.info('Dashboard overview cache refreshed', {
    year,
    month,
    cacheKey,
  });

  return overview;
}
