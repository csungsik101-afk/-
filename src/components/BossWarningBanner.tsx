import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, AlertTriangle, ShieldAlert, Flame } from 'lucide-react';
import { sound } from '../utils/sound';

interface BossWarningBannerProps {
  visible: boolean;
  bossName?: string;
  subtitle?: string;
  onDismiss?: () => void;
}

export const BossWarningBanner: React.FC<BossWarningBannerProps> = ({
  visible,
  bossName = '최종 보스 별빛',
  subtitle = '치명적인 보스전이 시작되었습니다. 모든 공격 패턴에 대비하십시오!',
  onDismiss,
}) => {
  useEffect(() => {
    if (visible) {
      sound.playBossWarning();
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          {/* Full Screen Emergency Red Vignette & Flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0.4, 0.75, 0.45] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.18)_0%,rgba(153,27,27,0.55)_70%,rgba(69,10,10,0.85)_100%)]"
          />

          {/* Cinematic Scanning Line */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '200%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-red-500/20 to-transparent blur-sm"
          />

          {/* Top Moving Hazard Warning Tape */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 -translate-y-28 sm:-translate-y-36 inset-x-0 bg-amber-500 text-slate-950 font-black text-xs sm:text-sm py-1 shadow-lg shadow-amber-500/40 border-y-2 border-slate-950 overflow-hidden flex whitespace-nowrap"
          >
            <motion.div
              animate={{ x: [0, -400] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="flex items-center gap-8 font-mono tracking-widest uppercase shrink-0"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 fill-slate-950 inline" />
                  <span>CRITICAL WARNING</span>
                  <span className="text-red-700 font-bold">///</span>
                  <span>BOSS INVASION DETECTED</span>
                  <span className="text-red-700 font-bold">///</span>
                  <span>EMERGENCY OVERRIDE</span>
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom Moving Hazard Warning Tape */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 translate-y-28 sm:translate-y-36 inset-x-0 bg-red-600 text-white font-black text-xs sm:text-sm py-1 shadow-lg shadow-red-600/50 border-y-2 border-slate-950 overflow-hidden flex whitespace-nowrap"
          >
            <motion.div
              animate={{ x: [-400, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="flex items-center gap-8 font-mono tracking-widest uppercase shrink-0"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="flex items-center gap-2">
                  <Skull className="w-4 h-4 fill-white inline" />
                  <span>DANGER</span>
                  <span className="text-slate-950 font-bold">///</span>
                  <span>MAXIMUM THREAT LEVEL</span>
                  <span className="text-slate-950 font-bold">///</span>
                  <span>PREPARE FOR BATTLE</span>
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Center Main Warning Plaque */}
          <motion.div
            initial={{ scale: 2.2, opacity: 0, filter: 'blur(10px)' }}
            animate={{
              scale: [2.2, 0.96, 1.02, 1.0],
              opacity: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              scale: 1.15,
              opacity: 0,
              filter: 'blur(8px)',
              transition: { duration: 0.4 },
            }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative w-full max-w-4xl px-4 z-10"
          >
            <div className="relative bg-gradient-to-r from-red-950/90 via-slate-950/95 to-red-950/90 border-y-4 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.85)] py-6 sm:py-8 px-6 text-center backdrop-blur-md overflow-hidden">
              {/* Corner Accents */}
              <div className="absolute top-1 left-2 text-[10px] font-mono text-red-400 font-bold tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                SYSTEM ALERT :: 0x9F_BOSS
              </div>
              <div className="absolute bottom-1 right-2 text-[10px] font-mono text-red-400 font-bold tracking-widest">
                STAGE_THREAT_MAX
              </div>

              {/* Threat Sub-Header */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Skull className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-bounce" />
                <span className="px-3 py-0.5 rounded-full text-xs sm:text-sm font-black tracking-widest bg-red-600/30 text-red-300 border border-red-500/60 uppercase animate-pulse">
                  ⚠ CRITICAL THREAT : EXTREME ⚠
                </span>
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-bounce" />
              </div>

              {/* MAIN TEXT: BOSS APPEARED! */}
              <div className="relative my-2 sm:my-3">
                {/* Glow underlay */}
                <h1 className="absolute inset-0 font-black tracking-[0.2em] sm:tracking-[0.28em] text-4xl sm:text-6xl md:text-7xl font-mono uppercase text-red-600 blur-md opacity-80 select-none">
                  BOSS APPEARED!
                </h1>

                {/* Front crisp typography */}
                <h1 className="relative font-black tracking-[0.2em] sm:tracking-[0.28em] text-4xl sm:text-6xl md:text-7xl font-mono uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-red-200 to-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]">
                  BOSS APPEARED!
                </h1>
              </div>

              {/* Dividing Glowing Line */}
              <div className="mx-auto w-48 sm:w-80 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent my-3 shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse" />

              {/* Boss Identification & Warning */}
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <div className="inline-flex items-center gap-2 bg-red-950/80 border border-red-500/50 px-4 py-1 rounded-full shadow-inner">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-sm sm:text-lg font-black text-amber-300 tracking-wider">
                    {bossName}
                  </span>
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <p className="text-xs sm:text-sm text-red-200/90 font-medium tracking-wide max-w-xl mx-auto drop-shadow">
                  {subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
