import React from 'react';
import { SkillDefinition } from '../types/game';
import { Sparkles, Bomb, Sword, ShieldCheck, HeartHandshake, Syringe, Zap, Star } from 'lucide-react';

interface SkillSelectModalProps {
  isOpen: boolean;
  choices: SkillDefinition[];
  onSelectSkill: (skill: SkillDefinition) => void;
  remainingPicks?: number;
}

export const SkillSelectModal: React.FC<SkillSelectModalProps> = ({
  isOpen,
  choices = [],
  onSelectSkill,
  remainingPicks = 1,
}) => {
  if (!isOpen || !choices || choices.length === 0) return null;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Bomb': return Bomb;
      case 'Sword': return Sword;
      case 'Sparkles': return Sparkles;
      case 'ShieldCheck': return ShieldCheck;
      case 'HeartHandshake': return HeartHandshake;
      case 'Syringe': return Syringe;
      case 'Zap': return Zap;
      case 'Star': return Star;
      default: return Sparkles;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-xl max-w-lg w-full p-3.5 shadow-2xl flex flex-col items-center">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-1 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-rose-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
          <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider">
            {remainingPicks > 1 ? `스킬 뽑기 가챠 (${remainingPicks}회 남음)` : '누적 XP 100 달성 특수 보상'}
          </span>
        </div>
        <h2 className="text-sm font-black text-white text-center mb-0.5">
          별빛 마을 유물 스킬 선택 {remainingPicks > 1 && <span className="text-amber-400 font-mono">[{remainingPicks}회 남음]</span>}
        </h2>
        <p className="text-[9px] text-slate-400 text-center mb-2.5 max-w-sm">
          {remainingPicks > 1
            ? `하드코어 특별 보급으로 강력한 스킬을 총 20회 선택할 수 있습니다! (남은 횟수: ${remainingPicks}회)`
            : '별빛 마을의 고대 유물 중 3개가 랜덤으로 나타났습니다! 유물을 선택하세요.'}
        </p>

        {/* 3 Skill Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full mb-1">
          {choices.map((skill) => {
            const Icon = getIconComponent(skill.icon);
            const isEasterEgg = skill.code === '10-8';

            return (
              <button
                key={skill.id}
                onClick={() => onSelectSkill(skill)}
                className={`group relative flex flex-col items-center text-center p-2.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm ${
                  isEasterEgg
                    ? 'bg-gradient-to-b from-amber-950/80 to-yellow-950/80 border-amber-400 shadow-amber-500/30 animate-pulse'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-amber-500'
                }`}
              >
                {/* Badge */}
                <div className="flex items-center gap-1 mb-1 w-full justify-between">
                  <span
                    className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                      skill.type === 'ACTIVE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : skill.type === 'PASSIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/30 text-amber-300 border border-amber-400'
                    }`}
                  >
                    {skill.type === 'ACTIVE' ? '액티브' : skill.type === 'PASSIVE' ? '패시브' : '일회성'}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-slate-400">
                    [{skill.code}]
                  </span>
                </div>

                {/* Icon */}
                <div
                  className="w-7 h-7 rounded flex items-center justify-center mb-1 shadow-inner border border-slate-700/50 transition-transform group-hover:rotate-6"
                  style={{
                    backgroundColor: `${skill.color}20`,
                    borderColor: `${skill.color}50`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: skill.color }} />
                </div>

                {/* Name */}
                <h3 className="font-extrabold text-[10px] text-white mb-0.5 group-hover:text-amber-300 transition-colors leading-tight">
                  {skill.name}
                </h3>

                {/* Description */}
                <p className="text-[9px] text-slate-300 leading-tight mb-1.5 flex-grow overflow-hidden h-[45px]">
                  {skill.description}
                </p>

                {/* Action CTA */}
                <div className="w-full mt-auto pt-1 border-t border-slate-700/60 flex items-center justify-center gap-0.5 text-[9px] font-bold text-amber-400 group-hover:text-amber-300">
                  <span>스킬 획득</span>
                  <span className="text-xs leading-none">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
