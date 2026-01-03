'use client';

export default function ColorTestPage() {
  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Color Test Page</h1>
      
      <div className="flex flex-col gap-2">
        <p>bg-primary (should not work if not defined as DEFAULT):</p>
        <div className="w-20 h-20 bg-primary border border-gray-400 flex items-center justify-center text-xs">bg-primary</div>
      </div>

      <div className="flex flex-col gap-2">
        <p>bg-primary-50 (var(--primary-50)):</p>
        <div className="w-20 h-20 bg-primary-50 border border-gray-400 flex items-center justify-center text-xs text-black">bg-primary-50</div>
      </div>

      <div className="flex flex-col gap-2">
        <p>bg-primary-100 (var(--primary-100)):</p>
        <div className="w-20 h-20 bg-primary-100 border border-gray-400 flex items-center justify-center text-xs text-black">bg-primary-100</div>
      </div>

      <div className="flex flex-col gap-2">
        <p>bg-primary-500 (var(--primary-500)):</p>
        <div className="w-20 h-20 bg-primary-500 border border-gray-400 flex items-center justify-center text-xs text-white">bg-primary-500</div>
      </div>

      <div className="flex flex-col gap-2">
        <p>bg-blue-500 (standard tailwind):</p>
        <div className="w-20 h-20 bg-blue-500 border border-gray-400 flex items-center justify-center text-xs text-white">bg-blue-500</div>
      </div>
    </div>
  );
}
