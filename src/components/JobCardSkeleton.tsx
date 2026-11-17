export default function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 animate-pulse" aria-hidden="true">
      {/* Celular: fila */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className="w-16 h-16 rounded-lg bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="w-11 h-11 rounded-full bg-gray-100" />
      </div>
      {/* Compu: tarjeta */}
      <div className="hidden sm:block">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
        <div className="mt-3 h-3 bg-gray-100 rounded w-2/5" />
        <div className="mt-3 aspect-[16/10] rounded-xl bg-gray-100" />
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
        </div>
        <div className="mt-4 h-10 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}
