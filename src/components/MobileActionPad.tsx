import React from 'react';
import { AcquiredSkill } from '../types/game';
import { Sword, Bomb, Sparkles, Zap, ShieldCheck, HeartHandshake, Syringe, Wind } from 'lucide-react';

interface MobileActionPadProps {
  acquiredSkills: AcquiredSkill[];
  onUseSkill: (skillId: string) => void;
  isAttackPressed?: boolean;
  onSetAttackPressed?: (pressed: boolean) => void;
  attackCdRemaining?: number;
  attackCdTotal?: number;
  onDash?: () => void;
  dashCdRemaining?: number;
  dashCdTotal?: number;
}

export const MobileActionPad: React.FC<MobileActionPadProps> = ({
  acquiredSkills,
  onUseSkill,
  isAttackPressed,
  onSetAttackPressed,
  attackCdRemaining = 0,
  attackCdTotal = 0,
  onDash,
  dashCdRemaining = 0,
  dashCdTotal = 2.5,
}) => {
  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bomb': return Bomb;
      case 'Sword': return Sword;
      case 'Sparkles': return Sparkles;
      case 'ShieldCheck': return ShieldCheck;
      case 'HeartHandshake': return HeartHandshake;
      case 'Syringe': return Syringe;
      default: return Zap;
    }
  };

  const activeSkills = acquiredSkills.filter((s) => s.definition.type === 'ACTIVE');

  return (
    <div className="flex items-end gap-3 pointer-events-auto select-none touch-none">
      {/* 액티브 스킬 버튼들 (가로로 배치하여 메인 공격 조작키와 같은 높이로 유지) */}
      {activeSkills.length > 0 && (
        <div className="flex flex-row-reverse gap-2 mb-1.5 items-end">
          {activeSkills.map((skill, idx) => {
            const Icon = getSkillIcon(skill.definition.icon);
            const isReady = skill.currentCooldown <= 0;
            const keyShortcut = idx === 0 ? 'E' : idx === 1 ? 'Q' : 'R';

            return (
              <button
                key={skill.id}
                disabled={!isReady}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (isReady) onUseSkill(skill.id);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (isReady) onUseSkill(skill.id);
                }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all shadow-xl active:scale-90 ${
                  isReady
                    ? 'bg-slate-900/90 border-amber-400 shadow-amber-500/20 text-white'
                    : 'bg-slate-950/80 border-slate-800 opacity-60 text-slate-500'
                }`}
              >
                <span className="absolute top-1 right-1.5 text-[9px] font-mono font-black bg-slate-900/90 px-1 rounded text-slate-300 border border-slate-700">
                  [{keyShortcut}]
                </span>
                <Icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${isReady ? 'animate-pulse' : 'scale-90'}`}
                  style={{ color: skill.definition.color }}
                />
                <span className="text-[10px] font-black truncate max-w-[50px]">
                  {skill.definition.name.split(' ')[0]}
                </span>

                {!isReady && (
                  <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-sm font-black font-mono text-amber-400">
                      {Math.ceil(skill.currentCooldown)}s
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 대시 (회피 기동) 버튼 */}
      {onDash && (
        <div className="flex flex-col items-center gap-1.5 mb-1">
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              if (dashCdRemaining <= 0) onDash();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (dashCdRemaining <= 0) onDash();
            }}
            disabled={dashCdRemaining > 0}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-black text-white flex flex-col items-center justify-center shadow-xl border-2 transition-transform select-none relative overflow-hidden active:scale-95 ${
              dashCdRemaining <= 0
                ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-400 shadow-cyan-500/30'
                : 'bg-slate-900 border-slate-800 opacity-60'
            }`}
            title="대시 회피 기동 (Space / Shift)"
          >
            <Wind className={`w-6 h-6 ${dashCdRemaining <= 0 ? 'text-cyan-200 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[10px] font-black tracking-tight mt-0.5">대시</span>

            {dashCdRemaining > 0 && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-[1px] z-10">
                <span className="text-xs font-black font-mono text-cyan-300">
                  {dashCdRemaining.toFixed(1)}s
                </span>
              </div>
            )}
          </button>
          <span className="text-[9px] font-bold text-cyan-400">회피</span>
        </div>
      )}

      {/* 메인 공격 (30도 참격) 대형 버튼 */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onSetAttackPressed && onSetAttackPressed(true);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onSetAttackPressed && onSetAttackPressed(false);
          }}
          onTouchCancel={(e) => {
            e.stopPropagation();
            onSetAttackPressed && onSetAttackPressed(false);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onSetAttackPressed && onSetAttackPressed(true);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onSetAttackPressed && onSetAttackPressed(false);
          }}
          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl font-black text-white flex flex-col items-center justify-center shadow-2xl border-2 transition-transform select-none relative overflow-hidden ${
            isAttackPressed
              ? 'bg-gradient-to-br from-amber-600 to-red-700 border-amber-300 scale-95 shadow-amber-500/50'
              : 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 border-amber-400/80 shadow-orange-500/30 hover:scale-105'
          }`}
        >
          <Sword className="w-9 h-9 sm:w-11 sm:h-11 mb-1 drop-shadow" />
          <span className="text-xs sm:text-sm font-black tracking-tight drop-shadow">공격 (30°)</span>
          <span className="text-[9px] sm:text-[10px] text-amber-200 opacity-90">터치 유지 연속</span>

          {attackCdRemaining > 0 && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-[1px] z-10">
              <span className="text-lg font-black font-mono text-rose-400 tracking-wide drop-shadow">
                {attackCdRemaining.toFixed(1)}s
              </span>
              <span className="text-[8px] font-bold text-slate-400 tracking-tighter uppercase">COOL DOWN</span>
              <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div 
                  className="h-full bg-rose-500 transition-all duration-100" 
                  style={{ width: `${((attackCdTotal - attackCdRemaining) / attackCdTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
        </button>
        <span className="text-[11px] font-black tracking-wider text-amber-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800 shadow">
          기본 참격
        </span>
      </div>
    </div>
  );
};
