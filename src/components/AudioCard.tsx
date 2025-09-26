import React from 'react';

interface AudioCardProps {
  href: string;
  title: string;
  status: string;
  date: string;
  duration: string;
}

const AudioCard: React.FC<AudioCardProps> = ({ href, title, status, date, duration }) => {
  return (
    <div className="card w-full bg-gradient-to-br from-white/90 via-pink-50/70 to-blue-50/80 backdrop-blur-sm rounded-3xl shadow-lg border border-neutral/10 group hover:scale-[1.02] transition-all duration-300">
      <div className="card-body flex-row gap-4 items-center">
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-400/90 to-purple-400/90 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <button className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/40 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <a href={href}>
            <h3 className="card-title text-lg font-semibold text-gray-900 mb-1 truncate">{title}</h3>
          </a>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100/80 to-purple-100/60 rounded-lg text-indigo-600">{status}</span>
            <span className="text-xs text-gray-500">{date}</span>
            <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-emerald-100/80 to-teal-100/60 rounded-lg text-emerald-600">{duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioCard;
