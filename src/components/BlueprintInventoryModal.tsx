import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Sword, Wrench, Shield, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { BlueprintItem, BlueprintSynergy } from '../types/game';
import { BLUEPRINT_LIST, checkSatisfiedSynergies } from '../data/blueprints';
import { sound } from '../utils/sound';

interface BlueprintInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryIds?: string[]; // array of acquired blueprint IDs
  ownedBlueprints?: string[]; // alias for compatibility
  coupons: number;
  onOpenCouponShop?: () => void;
  onOpenSelection?: () => void; // alias for compatibility
}

export const BlueprintInventoryModal: React.FC<BlueprintInventoryModalProps> = ({
  isOpen,
  onClose,
  inventoryIds,
  ownedBlueprints: ownedBlueprintsProp,
  coupons,
  onOpenCouponShop,
  onOpenSelection,
}) => {
  if (!isOpen) return null;

  const currentIds = ownedBlueprintsProp || inventoryIds || [];
  const handleOpenShop = onOpenCouponShop || onOpenSelection || (() => {});

  // Group acquired blueprints and count them
  const countMap: Record<string, number> = {};
  currentIds.forEach((id) => {
    countMap[id] = (countMap[id] || 0) + 1;
  });

  const ownedBlueprints = BLUEPRINT_LIST.filter((bp) => (countMap[bp.id] || 0) > 0);

  // Calculate satisfied synergies
  const activeSynergies = checkSatisfiedSynergies(currentIds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl max-h-[88vh] bg-slate-900 border-2 border-slate-700/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xl">
              🎒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  설계도 인벤토리
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-800 text-amber-300 border border-slate-700">
                  총 {inventoryIds.length}개 보관 중
                </span>
              </div>
              <p className="text-xs text-slate-400">
                보관 중인 설계도 목록과 적용 효과를 확인합니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playHit && sound.playHit();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupons Banner (If coupons remain) */}
        {coupons > 0 && (
          <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-amber-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-amber-200">
                사용 가능한 선택 설계도 쿠폰이 <span className="text-amber-400 font-mono font-black">{coupons}장</span> 남아있습니다!
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                handleOpenShop();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>쿠폰 사용하기</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Discovered Synergies Section (Hidden until formed) */}
          {activeSynergies.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/40 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-bounce" />
                <h3 className="text-sm font-black text-indigo-200 uppercase tracking-wider">
                  발견된 숨겨진 조합 ({activeSynergies.length}/6 발견)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeSynergies.map((syn) => (
                  <div
                    key={syn.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-black text-white">{syn.name}</div>
                        <div className="text-[11px] font-bold text-emerald-400">{syn.effectDescription}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      발동 중
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owned Blueprints List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-300">
                보유 설계도 목록
              </h3>
              {coupons > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCouponShop();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  + 설계도 추가 선택 (쿠폰 {coupons}장)
                </button>
              )}
            </div>

            {ownedBlueprints.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-bold">보관 중인 설계도가 없습니다.</p>
                {coupons > 0 && (
                  <p className="text-xs text-amber-400 mt-1">
                    쿠폰을 사용하여 설계도를 선택해보세요!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ownedBlueprints.map((bp) => {
                  const count = countMap[bp.id] || 0;
                  const isWeapon = bp.type === 'WEAPON';
                  const isTool = bp.type === 'SUB_TOOL';

                  const badgeColor = isWeapon
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : isTool
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                  return (
                    <div
                      key={bp.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <h4 className="text-sm font-black text-white">
                            {bp.name}
                          </h4>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${badgeColor}`}>
                            {bp.typeLabel}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 mb-2.5">
                          <p className="text-[11px] font-semibold text-slate-300 leading-snug">
                            {bp.effectDescription}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800 text-slate-400 font-bold">
                        <span>보관 수량</span>
                        <span className="text-amber-400 font-mono font-black">{count}개</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            총 15종의 설계도를 조합하여 최적의 빌드를 구성할 수 있습니다.
          </div>
          <button
            onClick={() => {
              sound.playHit && sound.playHit();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
