let isRegistered = false;

export async function ensureWorkersRegistered() {
  if (isRegistered) return;

  await import('@/workers/students-export.worker');
  isRegistered = true;
}
