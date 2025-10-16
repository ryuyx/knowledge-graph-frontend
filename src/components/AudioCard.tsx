import React from 'react';

interface AudioCardProps {
  href: string;
  title: string;
  status: string;
  date: string;
  duration: string;
  progress?: number | null;
}

const AudioCard: React.FC<AudioCardProps> = ({ href, title, status, date, duration, progress }) => {
  // 根据状态返回样式配置
  const getStatusStyle = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'COMPLETED':
        return {
          badge: 'bg-gradient-to-r from-green-100/80 to-emerald-100/60 text-green-700',
          icon: 'bg-gradient-to-br from-green-400/90 to-emerald-400/90',
          label: 'Completed'
        };
      case 'GENERATING':
        return {
          badge: 'bg-gradient-to-r from-blue-100/80 to-cyan-100/60 text-blue-700',
          icon: 'bg-gradient-to-br from-blue-400/90 to-cyan-400/90',
          label: 'Generating'
        };
      case 'PENDING':
        return {
          badge: 'bg-gradient-to-r from-yellow-100/80 to-amber-100/60 text-yellow-700',
          icon: 'bg-gradient-to-br from-yellow-400/90 to-amber-400/90',
          label: 'Pending'
        };
      case 'FAILED':
        return {
          badge: 'bg-gradient-to-r from-red-100/80 to-rose-100/60 text-red-700',
          icon: 'bg-gradient-to-br from-red-400/90 to-rose-400/90',
          label: 'Failed'
        };
      default:
        return {
          badge: 'bg-gradient-to-r from-gray-100/80 to-slate-100/60 text-gray-700',
          icon: 'bg-gradient-to-br from-gray-400/90 to-slate-400/90',
          label: status
        };
    }
  };

  const statusStyle = getStatusStyle(status);
  const showProgress = status.toUpperCase() === 'GENERATING' && progress !== null && progress !== undefined;

  return (
    <div className="card w-full bg-gradient-to-br from-white/90 via-pink-50/70 to-blue-50/80 backdrop-blur-sm rounded-3xl shadow-lg border border-neutral/10 group hover:scale-[1.02] transition-all duration-300">
      <div className="card-body flex-row gap-4 items-center">
        <div className={`flex-shrink-0 w-16 h-16 ${statusStyle.icon} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {status.toUpperCase() === 'GENERATING' ? (
            <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="loading loading-spinner loading-md text-white"></span>
            </div>
          ) : status.toUpperCase() === 'FAILED' ? (
            <button className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
              </svg>
            </button>
          ) : status.toUpperCase() === 'PENDING' ? (
            <button className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd"></path>
              </svg>
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <a href={href}>
            <h3 className="card-title text-lg font-semibold text-gray-900 mb-1 truncate">{title}</h3>
          </a>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs font-medium rounded-lg ${statusStyle.badge}`}>
              {statusStyle.label}
            </span>
            <span className="text-xs text-gray-500">{date}</span>
            <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-emerald-100/80 to-teal-100/60 rounded-lg text-emerald-600">{duration}</span>
          </div>
          {/* 进度条 - 仅在 GENERATING 状态显示 */}
          {showProgress && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <progress className="progress progress-primary w-full h-2" value={progress} max="100"></progress>
                <span className="text-xs font-medium text-blue-600 whitespace-nowrap">{progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioCard;
