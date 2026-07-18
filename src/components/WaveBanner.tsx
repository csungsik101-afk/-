import React from 'react';
import { WaveInfo } from '../types/game';
import { ShieldAlert, Trophy } from 'lucide-react';

interface WaveBannerProps {
  waveInfo: WaveInfo | null;
  visible: boolean;
}

export const WaveBanner: React.FC<WaveBannerProps> = ({ waveInfo, visible }) => {
  if (!visible || !waveInfo) return null;

  return (
    <div className="fixed top-20 inset-x-0 z-30 flex justify-center pointer-events-none px-4 animate-fade-in">
      <div className="bg-gradient-to-r from-slate-900/95 via-indigo-950/95 to-slate-900/95 border-2 border-amber-500/80 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-md max-w-xl w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
          <span className="text-sm font-black tracking-widest text-amber-400 uppercase">
            WAVE {waveInfo.waveNumber} INVASION
          </span>
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 drop-shadow">
          {waveInfo.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-2">
          {waveInfo.description}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/40 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>보스 처치 보상: {waveInfo.rewardText}</span>
        </div>
      </div>
    </div>
  );
};
