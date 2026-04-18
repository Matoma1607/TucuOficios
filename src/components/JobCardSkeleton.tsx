import React from 'react';

export default function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      {/* Skeleton Image */}
      <div className="w-full h-72 bg-gray-200/50" />
      
      {/* Skeleton Content */}
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="h-5 bg-gray-100 rounded-full w-3/4" />
          <div className="h-5 bg-gray-100 rounded-full w-1/2" />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded-full w-1/3" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded-full w-1/2" />
          </div>
        </div>

        <div className="pt-2">
          <div className="h-14 bg-gray-100 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}
