import React from 'react';
import { PlayerStats } from '../types/game';
import { Trophy, Sword, Zap, Heart, Flame, Target, Activity, X, Plus, RefreshCw } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  unspentPoints: number;
  stats: PlayerStats;
  onUpgradeStat: (statKey: keyof PlayerStats) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  level,
  unspentPoints,
  stats,
  onUpgradeStat,
}) => {
  if (!isOpen) return null;

  const statConfig = [
    {
      key: 'attackPoints' as keyof PlayerStats,
      name: '7-1 공격력 (Attack Power)',
      icon: Sword,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      currentPts: stats.attackPoints,
      maxPts: 30,
      bonusPerLevel: '1.5%',
      currentBonus: `+${(stats.attackPoints * 1.5).toFixed(1)}%`,
      desc: '기본 공격력 1에 포인트당 1.5%의 추가 데미지가 합산됩니다.',
    },
    {
      key: 'moveSpeedPoints' as keyof PlayerStats,
      name: '7-2 이동 속도 (Move Speed)',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      currentPts: stats.moveSpeedPoints,
      maxPts: 30,
      bonusPerLevel: '1.7%',
      currentBonus: `+${(stats.moveSpeedPoints * 1.7).toFixed(1)}%`,
      desc: '기본 이동속도 0.8에 포인트당 1.7% 빨라집니다.',
    },
    {
      key: 'maxHpPoints' as keyof PlayerStats,
      name: '7-3 최대 체력 (Max HP)',
      icon: Heart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      currentPts: stats.maxHpPoints,
      maxPts: 30,
      bonusPerLevel: '1.2%',
      currentBonus: `+${(stats.maxHpPoints * 1.2).toFixed(1)}%`,
      desc: '기본 체력 5칸에 포인트당 1.2% 증가 및 체력 보강.',
    },
    {
      key: 'attackSpeedPoints' as keyof PlayerStats,
      name: '7-4 공격 속도 (Attack Speed)',
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      currentPts: stats.attackSpeedPoints,
      maxPts: 30,
      bonusPerLevel: '1.3%',
      currentBonus: `+${(stats.attackSpeedPoints * 1.3).toFixed(1)}%`,
      desc: '기본 공격속도 1에 포인트당 1.3% 연사력이 향상됩니다.',
    },
    {
      key: 'rangePoints' as keyof PlayerStats,
      name: '7-5 공격 사거리 (Attack Range)',
      icon: Target,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      currentPts: stats.rangePoints,
      maxPts: 30,
      bonusPerLevel: '1.1%',
      currentBonus: `+${(stats.rangePoints * 1.1).toFixed(1)}%`,
      desc: '기본 사거리 반경 1에 포인트당 1.1% 공격 가능 범위가 넓어집니다.',
    },
    {
      key: 'regenSpeedPoints' as keyof PlayerStats,
      name: '7-6 재생 속도 (HP Regen)',
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      currentPts: stats.regenSpeedPoints,
      maxPts: 10,
      bonusPerLevel: '1.2%',
      currentBonus: `+${(stats.regenSpeedPoints * 1.2).toFixed(1)}%`,
      desc: '기본 10초당 1칸 재생 속도가 포인트당 1.2% 가속됩니다 (최대 10레벨).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Trophy className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">용사 스탯 강화 (Lv.{level})</h2>
              <p className="text-[9px] text-slate-400">
                XP 50 배수 달성 시 지급되는 포인트로 강화하세요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unspent points badge */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border-y border-emerald-500/30 px-3.5 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-[11px] text-emerald-200">남은 스탯 포인트:</span>
          </div>
          <span className="text-xs font-black text-white bg-emerald-700/80 px-2 py-0.5 rounded-md border border-emerald-400/40">
            {unspentPoints} Pts
          </span>
        </div>

        {/* Stats Grid */}
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {statConfig.map((item) => {
            const Icon = item.icon;
            const isMax = item.currentPts >= item.maxPts;
            const canUpgrade = unspentPoints > 0 && !isMax;

            return (
              <div
                key={item.key}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${item.bg} ${
                  canUpgrade ? 'hover:border-slate-500/80 shadow-md' : 'opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 font-bold text-[11px] text-white">
                      <Icon className={`w-3 h-3 ${item.color}`} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700">
                      {item.currentPts}/{item.maxPts}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-snug mb-1.5">{item.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                  <div className="text-[9px] font-bold">
                    <span className="text-slate-400">보너스: </span>
                    <span className={item.color}>{item.currentBonus}</span>
                  </div>
                  <button
                    disabled={!canUpgrade}
                    onClick={() => onUpgradeStat(item.key)}
                    className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] flex items-center gap-0.5 transition-all ${
                      canUpgrade
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50 active:scale-95 cursor-pointer'
                        : isMax
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{isMax ? '최고' : '강화'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors border border-slate-700"
          >
            확인 및 창고 수호 복귀
          </button>
        </div>
      </div>
    </div>
  );
};
