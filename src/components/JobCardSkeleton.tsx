export default function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-0 sm:overflow-hidden animate-pulse" aria-hidden="true">
      {/* Celular: fila */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className="w-16 h-16 rounded-lg bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="w-16 h-12 rounded-xl bg-gray-100" />
      </div>
      {/* Compu: tarjeta con foto arriba */}
      <div className="hidden sm:block">
        <div className="aspect-square bg-gray-100" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
          <div className="pt-3 flex gap-2">
            <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
            <div className="h-10 w-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
