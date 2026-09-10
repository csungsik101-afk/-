import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scroll, Sword, Wrench, Shield, Check, Plus, Minus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BlueprintItem, BlueprintType } from '../types/game';
import { BLUEPRINT_LIST, checkSatisfiedSynergies } from '../data/blueprints';
import { sound } from '../utils/sound';

interface BlueprintSelectionModalProps {
  isOpen: boolean;
  coupons: number;
  initialSelected?: string[]; // array of blueprint IDs
  ownedBlueprints?: string[];
  onConfirm: (selectedBlueprintIds: string[], remainingCoupons: number) => void;
  onClose?: () => void;
}

const EMPTY_INITIAL_SELECTED: string[] = [];
const EMPTY_OWNED_BLUEPRINTS: string[] = [];

export const BlueprintSelectionModal: React.FC<BlueprintSelectionModalProps> = ({
  isOpen,
  coupons,
  initialSelected = EMPTY_INITIAL_SELECTED,
  ownedBlueprints = EMPTY_OWNED_BLUEPRINTS,
  onConfirm,
  onClose,
}) => {
  // Map of blueprint id -> count selected
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    initialSelected.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  });

  const [activeTab, setActiveTab] = useState<BlueprintType | 'ALL'>('ALL');
  const prevIsOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const counts: Record<string, number> = {};
      initialSelected.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
      setSelectedCounts(counts);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialSelected]);

  const totalUsed = (Object.values(selectedCounts) as number[]).reduce((a, b) => a + b, 0);
  const remainingCoupons = Math.max(0, coupons - totalUsed);

  const selectedBlueprintIds = useMemo(() => {
    const ids: string[] = [];
    (Object.entries(selectedCounts) as [string, number][]).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) {
        ids.push(id);
      }
    });
    return ids;
  }, [selectedCounts]);

  // Combined owned blueprints + newly selected blueprints for accurate synergy preview
  const allCurrentBlueprintIds = useMemo(() => {
    return [...ownedBlueprints, ...selectedBlueprintIds];
  }, [ownedBlueprints, selectedBlueprintIds]);

  // Calculate satisfied synergies in real-time
  const activeSynergies = useMemo(() => {
    return checkSatisfiedSynergies(allCurrentBlueprintIds);
  }, [allCurrentBlueprintIds]);

  if (!isOpen) return null;

  const handleIncrement = (id: string) => {
    if (remainingCoupons <= 0) {
      sound.playWarning && sound.playWarning();
      return;
    }
    sound.playHit && sound.playHit();
    setSelectedCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleDecrement = (id: string) => {
    const current = selectedCounts[id] || 0;
    if (current <= 0) return;
    sound.playHit && sound.playHit();
    setSelectedCounts((prev) => {
      const next = { ...prev };
      if (current === 1) {
        delete next[id];
      } else {
        next[id] = current - 1;
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedIds: string[] = [];
    (Object.entries(selectedCounts) as [string, number][]).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) {
        selectedIds.push(id);
      }
    });
    sound.playLevelUp && sound.playLevelUp();
    onConfirm(selectedIds, remainingCoupons);
  };

  const filteredBlueprints =
    activeTab === 'ALL'
      ? BLUEPRINT_LIST
      : BLUEPRINT_LIST.filter((bp) => bp.type === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Scroll className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  설계도 빌드 구성소
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-red-950 text-red-300 border border-red-800/80">
                  💀 하드코어
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                지급된 선택 설계도 쿠폰으로 원하는 장비를 선택하여 전장에 진입하세요.
              </p>
            </div>
          </div>

          {/* Coupon Gauge Badge */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            <div>
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300/80">
                선택 설계도 쿠폰
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                {remainingCoupons} <span className="text-xs text-amber-400/70 font-sans">/ {coupons}장 남음</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-100 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            전체 보기 (15종)
          </button>
          <button
            onClick={() => setActiveTab('WEAPON')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'WEAPON'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sword className="w-3.5 h-3.5" />
            무기 (5종)
          </button>
          <button
            onClick={() => setActiveTab('SUB_TOOL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'SUB_TOOL'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            보조도구 (5종)
          </button>
          <button
            onClick={() => setActiveTab('SUB_ARMOR')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'SUB_ARMOR'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            보조 장비 (5종)
          </button>
        </div>

        {/* Real-time Synergies Active Status Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/80">
          {activeSynergies.length > 0 ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-900 border border-emerald-500/50 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                  내가 선택하여 완성된 조합 ({activeSynergies.length}개 활성화):
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSynergies.map((syn) => (
                  <div
                    key={syn.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-400/60 shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-white">{syn.name}</span>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {syn.effectDescription}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                      적용됨
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">💡 빌드 안내:</span>
                <span>
                  원하는 설계도를 자유롭게 선택하여 능력치를 강화하세요.
                </span>
              </div>
              <span className="text-slate-500 font-bold hidden md:inline">활성 세트: 0개</span>
            </div>
          )}
        </div>

        {/* Blueprint Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBlueprints.map((bp) => {
            const count = selectedCounts[bp.id] || 0;
            const isWeapon = bp.type === 'WEAPON';
            const isTool = bp.type === 'SUB_TOOL';
            const isArmor = bp.type === 'SUB_ARMOR';

            const badgeColor = isWeapon
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : isTool
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

            const isContributingToSynergy =
              count > 0 &&
              activeSynergies.some((syn) => {
                const [wIdx, tIdx, aIdx] = syn.recipe;
                if (bp.type === 'WEAPON' && wIdx === bp.index) return true;
                if (bp.type === 'SUB_TOOL' && tIdx === bp.index) return true;
                if (bp.type === 'SUB_ARMOR' && aIdx === bp.index) return true;
                return false;
              });

            return (
              <div
                key={bp.id}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isContributingToSynergy
                    ? 'bg-slate-800/95 border-emerald-400/90 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400/30'
                    : count > 0
                    ? 'bg-slate-800/90 border-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-slate-400">
                        #{bp.index}
                      </span>
                      <h3 className="text-base font-black text-white">
                        {bp.name}
                      </h3>
                      {isContributingToSynergy && (
                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/40 animate-pulse">
                          ✨ 조합 발동 중
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${badgeColor}`}>
                      {bp.typeLabel}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl min-h-[52px] flex items-center mb-3">
                    <p className="text-xs font-semibold text-slate-300 leading-snug">
                      {bp.effectDescription}
                    </p>
                  </div>
                </div>

                {/* Selection Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-bold">
                    보관 수량:{' '}
                    <span className={count > 0 ? 'text-amber-400 font-black font-mono' : 'text-slate-500 font-mono'}>
                      {count}개
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDecrement(bp.id)}
                      disabled={count === 0}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 flex items-center justify-center text-slate-200 cursor-pointer active:scale-95 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono font-black text-sm text-white">
                      {count}
                    </span>
                    <button
                      onClick={() => handleIncrement(bp.id)}
                      disabled={remainingCoupons <= 0}
                      className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              선택한 설계도는 인벤토리에 보관되며, 게임 중에도 언제든 확인할 수 있습니다.
            </span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                닫기
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black tracking-wide text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>설계도 빌드 확정 및 전장 진입</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
