import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Sparkles,
  Bug,
  AlertTriangle,
  Terminal,
  Zap,
} from 'lucide-react';

interface BossHealthBarProps {
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossCode?: string;
  bossPhase?: number;
}

type BossType = 'STARLIGHT' | 'ERROR';

export const BossHealthBar: React.FC<BossHealthBarProps> = ({
  bossName,
  bossHp,
  bossMaxHp,
  bossCode,
  bossPhase,
}) => {
  // Lagging damage ghost bar
  const [ghostHp, setGhostHp] = useState<number>(bossHp);

  useEffect(() => {
    if (bossHp < ghostHp) {
      const timer = setTimeout(() => {
        setGhostHp(bossHp);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setGhostHp(bossHp);
    }
  }, [bossHp, ghostHp]);

  // Determine boss theme type (별빛과 에러만 지원)
  const getBossType = (): BossType | null => {
    if (bossCode === '3-11' || bossName.includes('별빛')) return 'STARLIGHT';
    if (bossCode === 'ERROR' || bossName.toUpperCase().includes('ERROR')) return 'ERROR';
    return null;
  };

  const bossType = getBossType();

  // 별빛이나 에러가 아니면 표시하지 않음
  if (!bossType) {
    return null;
  }

  const hpPercent = Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100));
  const ghostPercent = Math.max(0, Math.min(100, (ghostHp / bossMaxHp) * 100));

  // Determine current phase info
  const computedPhase = bossPhase || (
    bossType === 'STARLIGHT'
      ? (hpPercent > 66.6 ? 1 : hpPercent > 33.3 ? 2 : 3)
      : (hpPercent > 80 ? 1 : hpPercent > 60 ? 2 : hpPercent > 40 ? 3 : hpPercent > 20 ? 4 : 5)
  );

  // Phase transition detection and highlight burst animation
  const prevPhaseRef = useRef<number>(computedPhase);
  const [isPhaseAlert, setIsPhaseAlert] = useState<boolean>(false);
  const [alertPhaseNumber, setAlertPhaseNumber] = useState<number>(computedPhase);

  useEffect(() => {
    if (prevPhaseRef.current !== undefined && computedPhase !== prevPhaseRef.current) {
      setAlertPhaseNumber(computedPhase);
      setIsPhaseAlert(true);
      const timer = setTimeout(() => {
        setIsPhaseAlert(false);
      }, 1500); // 1.5s scale up and radiant glow highlight
      prevPhaseRef.current = computedPhase;
      return () => clearTimeout(timer);
    }
    prevPhaseRef.current = computedPhase;
  }, [computedPhase]);

  const getPhaseInfo = () => {
    if (bossType === 'STARLIGHT') {
      const p = computedPhase;
      if (p === 1) {
        return {
          phaseNum: 1,
          tag: '1페이즈: 궤도 폭격',
          desc: '7초 주기 랜덤 5개 구역에 5데미지 광역 폭격 투하',
          color: 'text-amber-300',
        };
      }
      if (p === 2) {
        return {
          phaseNum: 2,
          tag: '2페이즈: 항성 붕괴',
          desc: '8초 주기 별빛 주변 8칸 강력 자폭 폭발 (10데미지)',
          color: 'text-rose-400',
        };
      }
      return {
        phaseNum: 3,
        tag: '3페이즈: 톱날 결계',
        desc: '주변을 회전하는 톱날 칼날 방어벽 활성화 (접촉 시 4데미지)',
        color: 'text-fuchsia-300',
      };
    }

    if (bossType === 'ERROR') {
      const p = computedPhase;
      switch (p) {
        case 1:
          return {
            phaseNum: 1,
            tag: 'PHASE 1: STUN_DISRUPT',
            desc: '피격 시 2초간 플레이어 신경 마비 (공격/이동 정지)',
            color: 'text-cyan-400',
          };
        case 2:
          return {
            phaseNum: 2,
            tag: 'PHASE 2: VOID_ERASURE',
            desc: '7초 주기 필드 5개 구역 소멸 침식 (공허 즉사 구역)',
            color: 'text-red-400',
          };
        case 3:
          return {
            phaseNum: 3,
            tag: 'PHASE 3: SHADOW_CLOAK',
            desc: '9초 간격 3초 투명 은신 + 피해 50% 감소 + 공격력 대폭 증폭',
            color: 'text-purple-400',
          };
        case 4:
          return {
            phaseNum: 4,
            tag: 'PHASE 4: QUANTUM_ARMOR',
            desc: '7초 간격 4초 은신 + 피해 90% 차단 왜곡 장갑',
            color: 'text-emerald-400',
          };
        case 5:
        default:
          return {
            phaseNum: 5,
            tag: 'PHASE 5: OVERFLOW_BURST',
            desc: '5초 간격 은신 6칸 순간이동 3연속 급습 폭주!',
            color: 'text-rose-400',
          };
      }
    }

    return null;
  };

  const phaseInfo = getPhaseInfo();

  // Helper to calculate segment progress
  const getSegmentProgress = (startPct: number, endPct: number) => {
    const fill = Math.max(0, Math.min(100, ((hpPercent - startPct) / (endPct - startPct)) * 100));
    const ghostFill = Math.max(0, Math.min(100, ((ghostPercent - startPct) / (endPct - startPct)) * 100));
    return { fill, ghostFill };
  };

  // Starlight 3 segments (Phase 1: 66.6%~100%, Phase 2: 33.3%~66.6%, Phase 3: 0%~33.3%)
  const starlightSegments = [
    {
      phaseNum: 1,
      title: '1단계 : 궤도 폭격',
      shortTitle: '1단계',
      icon: '✦',
      startPct: 66.666,
      endPct: 100,
      ...getSegmentProgress(66.666, 100),
    },
    {
      phaseNum: 2,
      title: '2단계 : 항성 붕괴',
      shortTitle: '2단계',
      icon: '✦',
      startPct: 33.333,
      endPct: 66.666,
      ...getSegmentProgress(33.333, 66.666),
    },
    {
      phaseNum: 3,
      title: '3단계 : 톱날 결계',
      shortTitle: '3단계',
      icon: '★',
      startPct: 0,
      endPct: 33.333,
      ...getSegmentProgress(0, 33.333),
    },
  ];

  // ERROR 5 segments (Phase 1: 80~100%, Phase 2: 60~80%, Phase 3: 40~60%, Phase 4: 20~40%, Phase 5: 0~20%)
  const errorSegments = [
    {
      phaseNum: 1,
      tag: 'P1:STUN',
      startPct: 80,
      endPct: 100,
      ...getSegmentProgress(80, 100),
    },
    {
      phaseNum: 2,
      tag: 'P2:VOID',
      startPct: 60,
      endPct: 80,
      ...getSegmentProgress(60, 80),
    },
    {
      phaseNum: 3,
      tag: 'P3:CLOAK',
      startPct: 40,
      endPct: 60,
      ...getSegmentProgress(40, 60),
    },
    {
      phaseNum: 4,
      tag: 'P4:ARMOR',
      startPct: 20,
      endPct: 40,
      ...getSegmentProgress(20, 40),
    },
    {
      phaseNum: 5,
      tag: 'P5:BERSERK',
      startPct: 0,
      endPct: 20,
      ...getSegmentProgress(0, 20),
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* ERROR 보스 활성화 시: 화면 가장자리까지 번지는 풀스크린 글리치 효과       */}
      {/* ========================================================================= */}
      {bossType === 'ERROR' && (
        <div className="fixed inset-0 pointer-events-none z-10 animate-glitch-edge overflow-hidden">
          {/* Viewport Boundary Neon Glitch Edges */}
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-red-600 via-cyan-400 to-red-600 opacity-90 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-cyan-400 via-red-600 to-cyan-400 opacity-90 shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
          <div className="absolute top-0 bottom-0 left-0 w-1 sm:w-1.5 bg-gradient-to-b from-red-600 via-cyan-400 to-red-600 opacity-90 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
          <div className="absolute top-0 bottom-0 right-0 w-1 sm:w-1.5 bg-gradient-to-b from-cyan-400 via-red-600 to-cyan-400 opacity-90 shadow-[0_0_12px_rgba(6,182,212,0.9)]" />

          {/* Screen Edge Glitch CRT Scanlines and Matrix Artifacts */}
          <div className="absolute top-2 left-3 text-[9px] sm:text-[11px] font-mono text-cyan-400/80 font-bold drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]">
            0x8F_CRITICAL_CORRUPT
          </div>
          <div className="absolute top-2 right-3 text-[9px] sm:text-[11px] font-mono text-red-400/80 font-bold drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]">
            [KERNEL_PANIC // BUG]
          </div>
          <div className="absolute bottom-2 left-3 text-[9px] sm:text-[11px] font-mono text-red-500/70 font-bold">
            FATAL_MEM_OVERFLOW
          </div>
          <div className="absolute bottom-2 right-3 text-[9px] sm:text-[11px] font-mono text-cyan-400/70 font-bold">
            BUG_OVERRIDE_ENABLED
          </div>

          {/* Glitching Scanline Sweeping Down the Whole Screen */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 메인 보스바 컨테이너 (위치 및 크기 제어)                                    */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 select-none pointer-events-auto relative"
      >
        {/* Phase Transition Announcement Floating Banner */}
        <AnimatePresence>
          {isPhaseAlert && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.85 }}
              animate={{ opacity: 1, y: -32, scale: 1.05 }}
              exit={{ opacity: 0, y: -45, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="absolute left-1/2 -translate-x-1/2 z-40 whitespace-nowrap pointer-events-none"
            >
              {bossType === 'STARLIGHT' ? (
                <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-rose-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.95)] flex items-center gap-1.5 border border-white/60 animate-bounce">
                  <Sparkles className="w-4 h-4 fill-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>✦ {alertPhaseNumber}페이즈 돌입! 성좌 패턴 각성 ✦</span>
                  <Sparkles className="w-4 h-4 fill-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              ) : (
                <div className="px-4 py-1 rounded-md bg-red-600 text-black font-mono font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.95),0_0_15px_rgba(6,182,212,0.9)] flex items-center gap-1.5 border-2 border-cyan-400 animate-pulse">
                  <Zap className="w-4 h-4 fill-black text-cyan-300" />
                  <span>⚠️ [CRITICAL KERNEL PANIC] PHASE {alertPhaseNumber} OVERFLOW! ⚠️</span>
                  <Bug className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 1. STARLIGHT THEME (별빛 - 별장식 & 코스믹 우주 테마 + 반짝이는 오버레이) */}
        {/* ========================================================================= */}
        {bossType === 'STARLIGHT' && (
          <div
            className={`relative rounded-2xl bg-gradient-to-b from-slate-950/95 via-indigo-950/90 to-slate-950/95 border-2 border-amber-400/90 p-2.5 sm:p-3.5 backdrop-blur-xl overflow-hidden transition-all duration-300 ${
              isPhaseAlert
                ? 'animate-phase-starlight ring-4 ring-amber-300/90 shadow-[0_0_55px_rgba(251,191,36,0.8),inset_0_0_30px_rgba(251,191,36,0.4)]'
                : 'shadow-[0_0_35px_rgba(245,158,11,0.35),inset_0_0_20px_rgba(168,85,247,0.2)]'
            }`}
          >
            {/* Sparkling Starlight Overlay Effect across container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {/* Sweeping diagonal cosmic stardust shimmer sheen */}
              <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(251,191,36,0.18)_40%,rgba(255,255,255,0.35)_50%,rgba(217,70,239,0.2)_60%,transparent_80%)] bg-[length:200%_100%] animate-sparkle-sweep pointer-events-none" />

              {/* Radiant celestial gold aura at the top center */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-72 h-14 bg-amber-400/25 blur-xl rounded-full pointer-events-none" />

              {/* Twinkling ambient star ornaments floating around container */}
              <div className="absolute top-1.5 left-8 text-amber-300 text-xs animate-star-twinkle select-none pointer-events-none">✦</div>
              <div className="absolute top-2.5 right-10 text-yellow-200 text-[10px] animate-star-twinkle select-none pointer-events-none" style={{ animationDelay: '0.8s' }}>✧</div>
              <div className="absolute bottom-1.5 left-20 text-fuchsia-300 text-[10px] animate-star-twinkle select-none pointer-events-none" style={{ animationDelay: '1.4s' }}>★</div>
              <div className="absolute bottom-2 right-16 text-amber-200 text-xs animate-star-twinkle select-none pointer-events-none" style={{ animationDelay: '0.4s' }}>✦</div>
              <div className="absolute top-1/2 left-4 -translate-y-1/2 text-yellow-300 text-[9px] animate-star-twinkle select-none pointer-events-none" style={{ animationDelay: '1.1s' }}>★</div>
              <div className="absolute top-1/2 right-4 -translate-y-1/2 text-amber-100 text-[9px] animate-star-twinkle select-none pointer-events-none" style={{ animationDelay: '1.6s' }}>✦</div>
            </div>

            {/* Header Row: Left Star Ornaments + Boss Name & Titles + Right Star Ornaments */}
            <div className="relative flex items-center justify-between gap-2 mb-2 z-10">
              {/* Left Star Medallion */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center justify-center">
                  <div className="w-full h-full rounded-[10px] bg-slate-950/90 flex items-center justify-center relative overflow-hidden">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse" />
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-200 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                </div>
                <div className="hidden sm:flex flex-col text-[10px] text-amber-300 font-extrabold tracking-widest leading-none">
                  <span>✦ STARLIGHT ✦</span>
                  <span className="text-[8px] text-yellow-400/70 font-mono">COSMIC LORD</span>
                </div>
              </div>

              {/* Center Boss Name & Tag */}
              <div className="flex flex-col items-center text-center min-w-0 flex-1 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-xs sm:text-sm animate-pulse">✦</span>
                  <h3 className="text-sm sm:text-base md:text-lg font-black tracking-wider bg-gradient-to-r from-amber-200 via-yellow-300 via-rose-300 to-amber-200 bg-clip-text text-transparent truncate drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                    {bossName}
                  </h3>
                  <span className="text-amber-400 text-xs sm:text-sm animate-pulse">✦</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                  <span className="text-amber-300/90 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400 inline" />
                    최종 흑막 성좌 보스
                  </span>
                  {phaseInfo && (
                    <span
                      className={`px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-500/50 text-[10px] font-black ${
                        phaseInfo.color
                      } shadow-sm ${isPhaseAlert ? 'animate-pulse ring-2 ring-amber-400' : ''}`}
                    >
                      {phaseInfo.tag}
                    </span>
                  )}
                </div>
              </div>

              {/* Right HP Numbers & Star Medallion */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black font-mono text-amber-300 drop-shadow">
                    {Math.ceil(bossHp)} <span className="text-slate-400 text-[10px] font-normal">/ {bossMaxHp}</span>
                  </div>
                  <div className="text-[10px] font-bold text-amber-400/80 font-mono">
                    {hpPercent.toFixed(1)}%
                  </div>
                </div>
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center justify-center">
                  <div className="w-full h-full rounded-[10px] bg-slate-950/90 flex items-center justify-center relative overflow-hidden">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Zone Header (Depletion from Right to Left: Phase 1 -> Phase 2 -> Phase 3) */}
            <div className="relative z-10 w-full grid grid-cols-3 text-[10px] sm:text-xs font-bold mb-1 px-1 select-none">
              <div className={`text-left transition-all ${
                computedPhase === 3 ? 'text-rose-400 font-black' : hpPercent <= 33.33 ? 'text-slate-600 line-through' : 'text-amber-200/70'
              }`}>
                <span>{computedPhase === 3 ? '★ 3단계: 톱날 결계' : '3단계 (0~33%)'}</span>
              </div>
              <div className={`text-center transition-all ${
                computedPhase === 2 ? 'text-amber-300 font-black' : hpPercent <= 66.66 ? 'text-slate-600 line-through' : 'text-amber-200/70'
              }`}>
                <span>{computedPhase === 2 ? '✦ 2단계: 항성 붕괴' : '2단계 (33~66%)'}</span>
              </div>
              <div className={`text-right transition-all ${
                computedPhase === 1 ? 'text-yellow-300 font-black' : 'text-slate-600 line-through'
              }`}>
                <span>{computedPhase === 1 ? '✦ 1단계: 궤도 폭격' : '1단계 (66~100%)'}</span>
              </div>
            </div>

            {/* ONE Continuous Connected Starlight Health Bar Track (Depletes from Right to Left) */}
            <div className="relative w-full h-6 sm:h-7 rounded-xl bg-slate-950/95 border-2 border-amber-400/90 p-0.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)] overflow-hidden z-10 flex items-center">
              {/* Background ambient phase zone shading */}
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-25">
                <div className="border-r border-amber-400/40 bg-rose-500/10" />
                <div className="border-r border-amber-400/40 bg-amber-500/10" />
                <div className="bg-yellow-500/10" />
              </div>

              {/* Continuous Lagging Ghost Damage Bar (Pinned to Left, shrinks from Right to Left) */}
              <div
                className="absolute top-0.5 bottom-0.5 left-0.5 rounded-lg bg-amber-200/40 transition-all duration-500 ease-out"
                style={{ width: `${ghostPercent}%` }}
              />

              {/* Continuous Main Radiant Starlight Fill Bar (Pinned to Left, shrinks from Right to Left) */}
              <div
                className="absolute top-0.5 bottom-0.5 left-0.5 rounded-lg bg-gradient-to-r from-rose-600 via-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.7)] transition-all duration-200 ease-out overflow-hidden"
                style={{ width: `${hpPercent}%` }}
              >
                {/* Sweeping celestial starlight shimmer */}
                <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-shimmer" />
              </div>

              {/* Prominent Vertical Divider Grooves & Diamond Notches at 33.33% and 66.66% */}
              <div
                className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center justify-between z-20 pointer-events-none"
                style={{ left: '33.333%' }}
                title="3단계 전환선 (33%)"
              >
                <div className="w-2.5 h-1.5 bg-amber-300 rounded-b-sm shadow-sm" />
                <div className="w-1.5 h-full bg-slate-950 border-x border-amber-300/90 shadow-[0_0_6px_rgba(0,0,0,0.95)]" />
                <div className="w-2.5 h-1.5 bg-amber-300 rounded-t-sm shadow-sm" />
              </div>

              <div
                className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center justify-between z-20 pointer-events-none"
                style={{ left: '66.666%' }}
                title="2단계 전환선 (66%)"
              >
                <div className="w-2.5 h-1.5 bg-amber-300 rounded-b-sm shadow-sm" />
                <div className="w-1.5 h-full bg-slate-950 border-x border-amber-300/90 shadow-[0_0_6px_rgba(0,0,0,0.95)]" />
                <div className="w-2.5 h-1.5 bg-amber-300 rounded-t-sm shadow-sm" />
              </div>

              {/* Centered Current Phase & Total HP Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-3">
                <span className="font-black text-[11px] sm:text-xs text-white tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-1.5">
                  <span className="text-amber-300">✦</span>
                  <span>제 {computedPhase}단계 진행 중</span>
                  <span className="text-amber-300 font-mono">({hpPercent.toFixed(1)}%)</span>
                  <span className="text-amber-300">✦</span>
                </span>
              </div>
            </div>

            {/* Phase Active Ability Hint */}
            {phaseInfo && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-amber-200/80 text-center font-medium z-10 relative">
                <span className="text-amber-400 font-bold">★ 패턴 경보:</span>
                <span>{phaseInfo.desc}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ERROR THEME (에러 - 글리치 깨짐 & 버그 테마 + 화면 번짐 글리치)        */}
        {/* ========================================================================= */}
        {bossType === 'ERROR' && (
          <div
            className={`relative rounded-2xl bg-black/95 border-2 border-red-500/90 p-2.5 sm:p-3.5 backdrop-blur-xl overflow-hidden transition-all duration-300 animate-glitch-jitter ${
              isPhaseAlert
                ? 'animate-phase-error ring-4 ring-red-500 shadow-[0_0_60px_rgba(239,68,68,0.95),inset_0_0_35px_rgba(6,182,212,0.6)]'
                : 'shadow-[0_0_35px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            {/* Glitch Scanlines & Matrix Bug Pattern on Container */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px]" />
            <div className="absolute -top-10 left-0 right-0 h-1 bg-cyan-400/50 blur-xs animate-scanline pointer-events-none" />

            {/* Floating Bug and Warning Icons on Container */}
            <div className="absolute top-1 left-24 text-red-500 text-xs animate-bug-twitch pointer-events-none opacity-70">🐛</div>
            <div className="absolute top-2 right-28 text-cyan-400 text-[10px] animate-pulse pointer-events-none opacity-80">👾</div>
            <div className="absolute bottom-1 right-20 text-yellow-400 text-xs animate-bug-twitch pointer-events-none opacity-60" style={{ animationDelay: '0.6s' }}>⚠️</div>
            <div className="absolute bottom-1 left-32 text-rose-400 text-[9px] font-mono pointer-events-none opacity-70">0xDEAD</div>

            {/* Header Row: Left Glitch Box + Bug Boss Name + Right Crash Dump */}
            <div className="relative flex items-center justify-between gap-2 mb-2 z-10">
              {/* Left Bug Warning Box */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-950/90 border border-red-500 p-0.5 shadow-[0_0_15px_rgba(239,68,68,0.7)] flex items-center justify-center relative overflow-hidden">
                  <Bug className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 animate-bug-twitch" />
                  <span className="absolute bottom-0 right-0 text-[7px] font-black bg-cyan-500 text-black px-0.5">BUG</span>
                </div>
                <div className="hidden sm:flex flex-col text-[10px] text-red-400 font-mono font-bold leading-none">
                  <span className="text-cyan-400">ERR_0x8F</span>
                  <span className="text-[8px] text-red-500">CORRUPTED</span>
                </div>
              </div>

              {/* Center Boss Name & Glitch Text */}
              <div className="flex flex-col items-center text-center min-w-0 flex-1 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-500 text-xs font-mono font-black animate-pulse">[!]</span>
                  <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight font-mono text-red-400 truncate drop-shadow-[2px_0_0_rgba(6,182,212,0.8)]">
                    {bossName}
                  </h3>
                  <span className="text-cyan-400 text-xs font-mono font-black animate-pulse">[_]</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-cyan-400 inline" />
                    하드코어 치명적 시스템 버그
                  </span>
                  {phaseInfo && (
                    <span
                      className={`px-2 py-0.5 rounded bg-black/90 border border-red-600 text-[10px] font-mono font-bold ${
                        phaseInfo.color
                      } shadow-sm ${isPhaseAlert ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}
                    >
                      {phaseInfo.tag}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Glitch HP Numbers & Bug Icon */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right font-mono">
                  <div className="text-xs sm:text-sm font-black text-red-400 drop-shadow-[1px_0_0_rgba(6,182,212,0.8)]">
                    {Math.ceil(bossHp)} <span className="text-slate-500 text-[10px] font-normal">/ {bossMaxHp}</span>
                  </div>
                  <div className="text-[10px] font-bold text-cyan-400">
                    {hpPercent.toFixed(1)}% <span className="text-[8px] text-red-400">[CORRUPT]</span>
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black border border-cyan-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center relative overflow-hidden">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Phase Zone Header (Depletion from Right to Left: P1 -> P2 -> P3 -> P4 -> P5) */}
            <div className="relative z-10 w-full grid grid-cols-5 text-[9px] sm:text-[10px] font-mono font-bold mb-1 px-1 select-none">
              <div className={`text-left truncate transition-all ${
                computedPhase === 5 ? 'text-red-400 font-black' : hpPercent <= 20 ? 'text-red-950 line-through' : 'text-red-400/60'
              }`}>
                P5:BERSERK
              </div>
              <div className={`text-center truncate transition-all ${
                computedPhase === 4 ? 'text-cyan-300 font-black' : hpPercent <= 40 ? 'text-red-950 line-through' : 'text-red-400/60'
              }`}>
                P4:ARMOR
              </div>
              <div className={`text-center truncate transition-all ${
                computedPhase === 3 ? 'text-purple-300 font-black' : hpPercent <= 60 ? 'text-red-950 line-through' : 'text-red-400/60'
              }`}>
                P3:CLOAK
              </div>
              <div className={`text-center truncate transition-all ${
                computedPhase === 2 ? 'text-red-400 font-black' : hpPercent <= 80 ? 'text-red-950 line-through' : 'text-red-400/60'
              }`}>
                P2:VOID
              </div>
              <div className={`text-right truncate transition-all ${
                computedPhase === 1 ? 'text-cyan-300 font-black' : 'text-red-950 line-through'
              }`}>
                P1:STUN
              </div>
            </div>

            {/* ONE Continuous Connected ERROR Glitch Health Bar Track (Depletes from Right to Left) */}
            <div className="relative w-full h-6 sm:h-7 rounded-md bg-black border-2 border-red-600/90 p-0.5 shadow-inner overflow-hidden z-10 flex items-center">
              {/* Background cyber grid */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(239,68,68,0.12)_1px,transparent_1px)] bg-[size:10px_100%] pointer-events-none" />

              {/* Continuous Lagging Ghost Damage Bar (Pinned to Left, shrinks from Right to Left) */}
              <div
                className="absolute top-0.5 bottom-0.5 left-0.5 rounded-sm bg-red-400/35 transition-all duration-400 ease-out"
                style={{ width: `${ghostPercent}%` }}
              />

              {/* Continuous Main Glitch Neon Fill Bar (Pinned to Left, shrinks from Right to Left) */}
              <div
                className="relative h-full rounded-sm bg-gradient-to-r from-red-700 via-rose-600 via-red-500 to-cyan-500 shadow-[0_0_20px_rgba(239,68,68,0.9)] transition-all duration-150 ease-out overflow-hidden"
                style={{ width: `${hpPercent}%` }}
              >
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(6,182,212,0.45),transparent)] animate-shimmer" />
              </div>

              {/* 4 Prominent Vertical Divider Grooves & Cyan Pointer Notches at 20%, 40%, 60%, 80% */}
              {[20, 40, 60, 80].map((notch) => (
                <div
                  key={notch}
                  className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center justify-between z-20 pointer-events-none"
                  style={{ left: `${notch}%` }}
                >
                  <div className="w-2 h-1 bg-cyan-400" />
                  <div className="w-1.5 h-full bg-black border-x border-cyan-400/80 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <div className="w-2 h-1 bg-cyan-400" />
                </div>
              ))}

              {/* Centered Current Phase & Total HP Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-3">
                <span className="font-mono font-black text-[10px] sm:text-xs text-cyan-200 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  👾 [PHASE {computedPhase} / 5 ACTIVE] {hpPercent.toFixed(1)}% ({Math.ceil(bossHp)} / {bossMaxHp}) 👾
                </span>
              </div>
            </div>

            {/* Phase Bug Alert */}
            {phaseInfo && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-red-300/90 text-center font-mono font-medium z-10 relative">
                <span className="text-yellow-400 font-bold">⚠️ [FATAL PATTERN]:</span>
                <span>{phaseInfo.desc}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};
