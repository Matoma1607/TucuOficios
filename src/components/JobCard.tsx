import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, MapPin, User } from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  key?: React.Key;
}

export default function JobCard({ job }: JobCardProps) {
  const whatsappUrl = `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(
    `Hola ${job.professionalName}, vi tu trabajo "${job.title}" en TucuOficios y me gustaría consultarte.`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col bg-white/70 backdrop-blur-md border border-white/40 rounded-[2rem] overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(79,70,229,0.15)] transition-all duration-500"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={job.imageUrl}
          alt={job.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 rounded-full shadow-sm">
            {job.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">
          {job.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate">{job.zone}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <User className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate">{job.professionalName}</span>
          </div>
        </div>

        <div className="mt-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 px-4 bg-brand-primary hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </motion.div>
  );
}
