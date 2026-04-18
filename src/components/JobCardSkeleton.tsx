import React from 'react';

export default function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      {/* Skeleton Image */}
      <div className="w-full h-72 bg-gray-100" />
      
      {/* Skeleton Content */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded-full w-3/4" />
          <div className="h-4 bg-gray-100 rounded-full w-1/2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded-full" />
            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded-full" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
          </div>
        </div>

        <div className="pt-2">
          <div className="h-10 bg-gray-100 rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}
