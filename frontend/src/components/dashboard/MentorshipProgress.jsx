import React from 'react';

export default function MentorshipProgress({ stats, completionRate }) {
  return (
    <div className="bg-white p-6 border border-gray-300 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="space-y-2 text-center md:text-left">
        <h3 className="text-xl font-bold text-gray-800">Mentorship Accomplishment</h3>
        <p className="text-xs text-gray-500">Ratio of successfully concluded student internships</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <svg className="w-36 h-36 transform -rotate-90">
            <circle cx="72" cy="72" r="60" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
            <circle cx="72" cy="72" r="60" stroke="#4f46e5" strokeWidth="12" fill="transparent"
              strokeDasharray={376.8}
              strokeDashoffset={376.8 - (376.8 * completionRate) / 100}
              strokeLinecap="square"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-black text-gray-800">{completionRate}%</span>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Finished</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 flex flex-col sm:flex-row justify-between gap-8 text-center text-xs border border-gray-300 min-w-[320px]">
        <div>
          <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Ongoing</span>
          <span className="font-extrabold text-gray-800 text-base">{stats?.ongoing || 0}</span>
        </div>
        <div className="hidden sm:block border-l border-gray-200"></div>
        <div>
          <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Completed</span>
          <span className="font-extrabold text-gray-800 text-base">{stats?.completed || 0}</span>
        </div>
      </div>
    </div>
  );
}
