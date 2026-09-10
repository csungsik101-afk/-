import React, { useState } from 'react';
import { PlayerStats, AcquiredSkill, ActiveStatusEffect, PlayerClassType, CLASS_BASE_STATS, BlueprintSynergy } from '../types/game';
import { Heart, ShieldAlert, Zap, Bomb, Sword, Sparkles, ShieldCheck, HeartHandshake, Syringe, Flame, Skull, AlertOctagon, EyeOff, Ban, Lock, Smartphone, Wind, Shield } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { MobileActionPad } from './MobileActionPad';

interface HUDProps {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  currentWave: number;
  stats: PlayerStats;
  acquiredSkills: AcquiredSkill[];
  activeStatusEffects: ActiveStatusEffect[];
  bossName?: string;
  bossHp?: number;
  bossMaxHp?: number;
  onUseSkill: (skillId: string) => void;
  moveDirection: { x: number; y: number };
  onSetMoveDirection: (dir: { x: number; y: number }) => void;
  isAttackPressed?: boolean;
  onSetAttackPressed?: (pressed: boolean) => void;
  playerClass?: PlayerClassType | null;
  attackCdRemaining?: number;
  attackCdTotal?: number;
  onDash?: () => void;
  dashCdRemaining?: number;
  dashCdTotal?: number;
  gameMode?: string;
  activeSynergies?: BlueprintSynergy[];
  onOpenBlueprints?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  level,
  xp,
  nextLevelXp,
  currentWave,
  stats,
  acquiredSkills,
  activeStatusEffects,
  bossName,
  bossHp,
  bossMaxHp,
  onUseSkill,
  moveDirection,
  onSetMoveDirection,
  isAttackPressed,
  onSetAttackPressed,
  playerClass,
  attackCdRemaining = 0,
  attackCdTotal = 0,
  onDash,
  dashCdRemaining = 0,
  dashCdTotal = 2.5,
  gameMode = 'STORY',
  activeSynergies = [],
  onOpenBlueprints,
}) => {
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && (window.innerWidth <= 1024 || 'ontouchstart' in window);
  });

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
  const passiveSkills = acquiredSkills.filter((s) => s.definition.type === 'PASSIVE');

  // Render health hearts
  const heartSlots = Math.ceil(maxHp);
  const fullHearts = Math.floor(hp);
  const hasHalfHeart = hp % 1 >= 0.5;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20 overflow-hidden">
      {/* TOP ROW: HP, XP, BOSS HP */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Player HP & Level Bar */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-xl pointer-events-auto flex flex-col gap-2 min-w-[240px]">
            {/* HP Hearts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-rose-400 flex items-center gap-1 mr-1">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                HP {Math.ceil(hp)}/{maxHp}
              </span>
              {stats && stats.defense > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-950/90 text-indigo-300 border border-indigo-600 flex items-center gap-0.5 shadow-sm mr-1">
                  <Shield className="w-2.5 h-2.5 text-indigo-400" />
                  방어 {stats.defense}
                </span>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: Math.min(15, heartSlots) }).map((_, idx) => {
                  const isFull = idx < fullHearts;
                  const isHalf = idx === fullHearts && hasHalfHeart;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all ${
                        isFull
                          ? 'bg-rose-500 shadow-sm shadow-rose-500/50 scale-100'
                          : isHalf
                          ? 'bg-gradient-to-r from-rose-500 to-slate-700 scale-95'
                          : 'bg-slate-800 border border-slate-700 scale-90 opacity-60'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-300">용사 Lv.{level}</span>
                  {playerClass && (
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border font-sans"
                      style={{ 
                        color: CLASS_BASE_STATS[playerClass].color, 
                        borderColor: `${CLASS_BASE_STATS[playerClass].color}40`,
                        backgroundColor: `${CLASS_BASE_STATS[playerClass].color}15`
                      }}
                    >
                      {CLASS_BASE_STATS[playerClass].name} {
                        playerClass === 'ASSASSIN' ? '⚔️' : 
                        playerClass === 'TANKER' ? '🛡️' : 
                        playerClass === 'BERSERKER' ? '🔥' : '✨'
                      }
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-mono">
                  {xp % 50} / 50 XP (다음 레벨)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${((xp % 50) / 50) * 100}%` }}
                />
              </div>
            </div>

            {/* Passive Skills Row */}
            {passiveSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-400 mr-0.5">패시브:</span>
                {passiveSkills.map((s, idx) => {
                  const Icon = getSkillIcon(s.definition.icon);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-[9px] font-bold text-emerald-300 shadow-sm"
                      title={`${s.definition.name}: ${s.definition.description}`}
                    >
                      <Icon className="w-2.5 h-2.5" style={{ color: s.definition.color }} />
                      <span>Lv.{s.level}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Synergies (내가 선택하여 완성한 조합) */}
            {activeSynergies.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/50">
                <span className="text-[10px] font-black text-emerald-400 mr-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-300 animate-spin" style={{ animationDuration: '6s' }} />
                  선택 조합:
                </span>
                {activeSynergies.map((syn) => (
                  <button
                    key={syn.id}
                    onClick={onOpenBlueprints}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-[10px] font-black text-emerald-200 shadow-sm transition-all cursor-pointer"
                    title={`${syn.name} (${syn.effectDescription}) - 클릭하여 설계도 인벤토리 열기`}
                  >
                    <span>{syn.name}</span>
                    <span className="text-amber-300 text-[9px] font-bold">({syn.effectDescription})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Boss HP bar if active */}
          {bossName && bossHp !== undefined && bossMaxHp !== undefined && bossHp > 0 && (
            <div className="bg-slate-900/95 backdrop-blur-md border-2 border-rose-600/80 rounded-xl p-3 shadow-2xl pointer-events-auto flex-1 max-w-md animate-pulse">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Skull className="w-5 h-5 text-rose-500 animate-bounce" />
                  <span className="font-black text-xs sm:text-sm text-white truncate">{bossName}</span>
                </div>
                <span className="font-mono font-bold text-xs text-rose-400 shrink-0">
                  {Math.ceil(bossHp)} / {bossMaxHp} HP
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-rose-950">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-300 shadow-inner"
                  style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* STATUS EFFECTS WARNING ROW */}
        {activeStatusEffects.length > 0 && (
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            {activeStatusEffects.map((effect, idx) => {
              let label = '';
              let icon = AlertOctagon;
              let bg = 'bg-rose-950/90 border-rose-500 text-rose-300';

              if (effect.type === 'BLACKOUT') {
                label = `👁️ 플레이어 시야 암전 (${effect.duration.toFixed(1)}초 남음)`;
                icon = EyeOff;
                bg = 'bg-black/90 border-purple-500 text-purple-300 animate-bounce';
              } else if (effect.type === 'DISABLE_ATTACK') {
                label = `⚔️ 공격 불가능 마비 (${effect.duration.toFixed(1)}초 남음)`;
                icon = Ban;
                bg = 'bg-amber-950/90 border-amber-500 text-amber-300';
              } else if (effect.type === 'CONTROL_DISABLED') {
                label = `🔒 캐릭터 조종 불가 (${effect.duration.toFixed(1)}초 남음)`;
                icon = Lock;
                bg = 'bg-red-950/90 border-red-500 text-red-200 animate-pulse';
              } else if (effect.type === 'REVIVAL_GHOST') {
                label = `👻 유령 부활 상태! 보스 처치 시 완전 부활 (${effect.duration.toFixed(1)}초 남음)`;
                icon = HeartHandshake;
                bg = 'bg-pink-950/90 border-pink-400 text-pink-200 animate-pulse';
              }

              const Icon = icon;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black shadow-lg ${bg}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 모바일 컨트롤 모드 토글 (상단/중간에 작게 표시하여 언제든 켜고 끌 수 있음) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 pointer-events-auto z-30">
        <button
          onClick={() => setIsMobileMode(!isMobileMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black shadow-lg transition-all ${
            isMobileMode
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="휴대폰 가상 조이스틱 및 터치 패드 켜기/끄기"
        >
          <Smartphone className="w-4 h-4" />
          <span>모바일 조작 {isMobileMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* BOTTOM ROW: Skills & Mobile Controls */}
      <div className="relative w-full h-48 mt-auto pointer-events-none">
        {/* 모바일 모드: 좌측 하단 가상 조이스틱 */}
        {isMobileMode && (
          <div className="absolute bottom-4 left-4 pointer-events-auto">
            <VirtualJoystick onMove={onSetMoveDirection} />
          </div>
        )}

        {/* Passive Skills Badge Bar (데스크탑 전용 추가 배너) */}
        {!isMobileMode && passiveSkills.length > 0 && (
          <div className="absolute bottom-4 left-4 hidden md:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 pointer-events-auto max-w-xs">
            <span className="text-[10px] font-bold text-slate-400 mr-1">패시브:</span>
            {passiveSkills.map((s, idx) => {
              const Icon = getSkillIcon(s.definition.icon);
              return (
                <div
                  key={idx}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1 text-[10px] font-bold text-emerald-300"
                  title={s.definition.description}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: s.definition.color }} />
                  <span>{s.definition.name.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 모바일 모드: 우측 하단 큼직한 공격 및 액션 패드 */}
        {isMobileMode ? (
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            <MobileActionPad
              acquiredSkills={acquiredSkills}
              onUseSkill={onUseSkill}
              isAttackPressed={isAttackPressed}
              onSetAttackPressed={onSetAttackPressed}
              attackCdRemaining={attackCdRemaining}
              attackCdTotal={attackCdTotal}
              onDash={onDash}
              dashCdRemaining={dashCdRemaining}
              dashCdTotal={dashCdTotal}
            />
          </div>
        ) : (
          /* 데스크톱 모드 액티브 스킬 바 */
          <div className="absolute bottom-4 right-4 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto">
            {/* Dash Button (Space / Shift) */}
            {onDash && (
              <button
                disabled={dashCdRemaining > 0}
                onClick={onDash}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all cursor-pointer overflow-hidden ${
                  dashCdRemaining <= 0
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-cyan-400 shadow-lg shadow-cyan-500/20 active:scale-95'
                    : 'bg-slate-950/80 border-slate-800 opacity-60 cursor-not-allowed'
                }`}
                title="대시 회피 기동 (Space / Shift)"
              >
                <span className="absolute top-1 right-1.5 text-[9px] font-mono font-black bg-slate-900/90 px-1 rounded text-cyan-300 border border-slate-700">
                  [Space]
                </span>
                <Wind
                  className={`w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 ${dashCdRemaining <= 0 ? 'animate-pulse' : 'scale-90'}`}
                />
                <span className="text-[10px] font-bold text-white">대시</span>
                {dashCdRemaining > 0 && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-xs font-black font-mono text-cyan-300">
                      {dashCdRemaining.toFixed(1)}s
                    </span>
                  </div>
                )}
              </button>
            )}

            <div className="flex flex-col items-center justify-center pr-2 border-r border-slate-800 text-center min-w-[75px]">
              {attackCdRemaining > 0 ? (
                <>
                  <span className="text-[10px] font-black text-rose-400">재사용 대기</span>
                  <span className="text-xs font-black text-rose-300 font-mono tracking-tight">{attackCdRemaining.toFixed(1)}s</span>
                  <div className="w-12 h-1 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-100" 
                      style={{ width: `${((attackCdTotal - attackCdRemaining) / attackCdTotal) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-black text-amber-400">수동 공격</span>
                  <span className="text-xs font-bold text-emerald-300">30° 반경 (클릭)</span>
                </>
              )}
            </div>

            {activeSkills.length === 0 ? (
              <div className="px-3 py-2 text-xs font-bold text-slate-500">
                XP 100 달성 시 액티브 스킬 획득 가능
              </div>
            ) : (
              activeSkills.map((skill, idx) => {
                const Icon = getSkillIcon(skill.definition.icon);
                const isReady = skill.currentCooldown <= 0;
                const keyShortcut = `${idx + 1}`;

                return (
                  <button
                    key={skill.id}
                    disabled={!isReady}
                    onClick={() => onUseSkill(skill.id)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all cursor-pointer overflow-hidden ${
                      isReady
                        ? 'bg-slate-800/90 hover:bg-slate-700 border-amber-400 shadow-lg shadow-amber-500/20 active:scale-95'
                        : 'bg-slate-950/80 border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                    title={`${skill.definition.name} (${skill.definition.description})`}
                  >
                    <span className="absolute top-1 right-1.5 text-[10px] font-mono font-black bg-slate-900/90 px-1 rounded text-slate-300 border border-slate-700">
                      [{keyShortcut}]
                    </span>

                    <Icon
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform ${isReady ? 'scale-100 animate-pulse' : 'scale-90'}`}
                      style={{ color: skill.definition.color }}
                    />

                    <span className="text-[10px] font-bold text-white truncate max-w-[50px]">
                      {skill.definition.name.split(' ')[0]}
                    </span>

                    {!isReady && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-sm font-black font-mono text-amber-400">
                          {Math.ceil(skill.currentCooldown)}s
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
