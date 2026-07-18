import React, { useState } from 'react';
import { ENEMY_DEFINITIONS, SKILL_DEFINITIONS, WAVE_CONFIGS } from '../data/encyclopedia';
import { BookOpen, Bug, ShieldAlert, Cpu, ServerCrash, Database, Eye, UserX, Flame, Copy, Skull, Bot, Bomb, Sword, Sparkles, ShieldCheck, HeartHandshake, Syringe, Zap, Star, X, Shield, Trophy } from 'lucide-react';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'ENEMIES' | 'SKILLS' | 'WAVES' | 'RULES'>('ENEMIES');

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bug': return Bug;
      case 'Cpu': return Cpu;
      case 'ServerCrash': return ServerCrash;
      case 'Database': return Database;
      case 'ShieldAlert': return ShieldAlert;
      case 'Eye': return Eye;
      case 'UserX': return UserX;
      case 'Flame': return Flame;
      case 'Copy': return Copy;
      case 'Skull': return Skull;
      case 'Bot': return Bot;
      case 'Bomb': return Bomb;
      case 'Sword': return Sword;
      case 'Sparkles': return Sparkles;
      case 'ShieldCheck': return ShieldCheck;
      case 'HeartHandshake': return HeartHandshake;
      case 'Syringe': return Syringe;
      case 'Zap': return Zap;
      case 'Star': return Star;
      default: return Shield;
    }
  };

  const enemyList = Object.values(ENEMY_DEFINITIONS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">별빛 마을 백과사전 & 규칙</h2>
              <p className="text-xs text-slate-400">침입자들의 스펙, 웨이브 특수룰 및 스킬 도감</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2 overflow-x-auto">
          {[
            { id: 'ENEMIES', label: '침입자 적 도감 (Bugs & Users)' },
            { id: 'SKILLS', label: '유물 스킬 목록 (10-1~10-12)' },
            { id: 'WAVES', label: '웨이브 정보 (9-1~9-5)' },
            { id: 'RULES', label: '스탯 및 레벨업 시스템 (6, 7, 8)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-grow space-y-4">
          {tab === 'ENEMIES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {enemyList.map((enemy) => {
                const Icon = getIcon(enemy.icon);
                return (
                  <div key={enemy.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex gap-3.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${enemy.color}20`, borderColor: `${enemy.color}60` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: enemy.color }} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                            [{enemy.code}]
                          </span>
                          <h4 className="font-bold text-sm text-white truncate">{enemy.name}</h4>
                        </div>
                        <span className="text-xs font-bold text-amber-400 shrink-0">{enemy.xp} XP</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300 mb-2 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                        <span>체력: <strong className="text-rose-400">{enemy.hp}</strong></span>
                        <span>• 속도: <strong className="text-amber-300">{enemy.speed}</strong></span>
                        <span>• 공격력: <strong className="text-orange-400">{enemy.damage}</strong></span>
                      </div>
                      <p className="text-xs font-bold text-indigo-300 mb-1">능력: {enemy.abilityName}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{enemy.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'SKILLS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {SKILL_DEFINITIONS.map((s) => {
                const Icon = getIcon(s.icon);
                return (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex gap-3.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${s.color}20`, borderColor: `${s.color}60` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: s.color }} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-400">
                            [{s.code}]
                          </span>
                          <h4 className="font-bold text-sm text-white">{s.name}</h4>
                        </div>
                        <span className="text-xs font-bold text-slate-400">출현율 {s.probability}%</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{s.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'WAVES' && (
            <div className="space-y-3">
              {WAVE_CONFIGS.map((w) => (
                <div key={w.waveNumber} className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-base text-amber-400">{w.title}</h4>
                    <span className="text-xs font-bold bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      클리어 보상: {w.rewardText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{w.description}</p>
                  {w.isSpecialRule && (
                    <div className="mt-2 text-xs font-bold text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-500/30">
                      ⚠️ [9-5-2 특수룰] 상태이상이 한 번에 1개만 적용됩니다!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'RULES' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h4 className="font-black text-amber-400 text-base mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> 6. 레벨업 & XP 규칙
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>XP 50의 배수</strong>(50, 100, 150, 200...) 달성 시마다 레벨업하며 스탯 포인트 1점이 지급됩니다.</li>
                  <li><strong>XP 100의 배수</strong>(100, 200, 300...) 누적 시 랜덤 스킬 가챠(3개 중 1개 선택) 창이 열립니다.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h4 className="font-black text-indigo-400 text-base mb-2">8. 기본 스탯 (시작치)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="bg-slate-900 p-2 rounded">공격력: <strong>1</strong></div>
                  <div className="bg-slate-900 p-2 rounded">이동 속도: <strong>0.8</strong></div>
                  <div className="bg-slate-900 p-2 rounded">체력: <strong>5칸</strong></div>
                  <div className="bg-slate-900 p-2 rounded">공격속도: <strong>1</strong></div>
                  <div className="bg-slate-900 p-2 rounded">사거리: <strong>반지름 1</strong></div>
                  <div className="bg-slate-900 p-2 rounded">재생: <strong>10초당 1칸</strong></div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h4 className="font-black text-emerald-400 text-base mb-2">7. 스탯 성장률</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>공격력 (최대 30): 1레벨당 +1.5% 증가</li>
                  <li>이동 속도 (최대 30): 1레벨당 +1.7% 증가</li>
                  <li>체력 (최대 30): 1레벨당 +1.2% 증가</li>
                  <li>공격속도 (최대 30): 1레벨당 +1.3% 증가</li>
                  <li>공격 사거리 (최대 30): 1레벨당 +1.1% 증가</li>
                  <li>재생 속도 (최대 10): 1레벨당 +1.2% 가속</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
