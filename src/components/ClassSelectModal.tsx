import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Swords, Target, Heart, Flame, Sparkles, Hourglass } from 'lucide-react';
import { sound } from '../utils/sound';
import { PlayerClassType, CLASS_BASE_STATS } from '../types/game';

interface ClassSelectModalProps {
  isOpen: boolean;
  onSelect: (chosenClass: PlayerClassType) => void;
}

export const ClassSelectModal: React.FC<ClassSelectModalProps> = ({ isOpen, onSelect }) => {
  const [selected, setSelected] = useState<PlayerClassType | null>(null);
  const [storyStep, setStoryStep] = useState<number>(4); // Default to 4 (instant class selection, no blocking black screens)

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selected) {
      sound.playLevelUp();
      onSelect(selected);
    }
  };

  const classesConfig = [
    {
      id: 'ASSASSIN' as PlayerClassType,
      title: '암살자 (Assassin)',
      sub: '극한의 속도 & 날카로운 참격',
      desc: '매우 날렵한 움직임으로 적들의 약점을 정확하게 찌릅니다. 공격 각도는 좁지만 빠른 속도로 치고 빠질 수 있습니다.',
      icon: <Swords className="w-4 h-4 text-rose-400" />,
      stats: CLASS_BASE_STATS.ASSASSIN,
      colorClass: 'border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.12)]',
      textColor: 'text-rose-400',
    },
    {
      id: 'TANKER' as PlayerClassType,
      title: '탱커 (Tanker)',
      sub: '강인한 체력 & 광역 휩쓸기',
      desc: '이동 속도는 느리지만 압도적인 파괴력과 넓은 범위를 커버하는 참격으로 다가오는 버그들을 가볍게 쓸어버립니다.',
      icon: <Shield className="w-4 h-4 text-indigo-400" />,
      stats: CLASS_BASE_STATS.TANKER,
      colorClass: 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.12)]',
      textColor: 'text-indigo-400',
    },
    {
      id: 'BERSERKER' as PlayerClassType,
      title: '버서커 (Berserker)',
      sub: '광폭한 연사 & 끊임없는 복구',
      desc: '공격력 자체는 낮지만 빠른 공격 속도와 균형 잡힌 속도를 지녔습니다. 10초마다 빠른 회복을 통해 꾸준한 지속 전투를 이어갑니다.',
      icon: <Flame className="w-4 h-4 text-amber-500" />,
      stats: CLASS_BASE_STATS.BERSERKER,
      colorClass: 'border-amber-500 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.12)]',
      textColor: 'text-amber-400',
    },
    {
      id: 'MAGE' as PlayerClassType,
      title: '마법사 (Mage)',
      sub: '180도 전방위 제어 & 강력한 마력',
      desc: '강력한 마력으로 자신의 전방 및 양측면 180도에 이르는 거대한 참격 범위와 준수한 공격력, 빠른 생명 회복력을 지닌 클래스입니다.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      stats: CLASS_BASE_STATS.MAGE,
      colorClass: 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.12)]',
      textColor: 'text-emerald-400',
    },
  ];

  if (storyStep < 4) {
    const stories = [
      {
        speaker: '이장 (마을 대표)',
        avatar: '👴',
        avatarBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        content: '별빛이라는 녀석 때문에 이 평화로운 마을에 몬스터가 나왔잖아!!!',
        action: '마을 광장에서 빗자루를 내던지며 버럭 화를 낸다.',
      },
      {
        speaker: '이장 (마을 대표)',
        avatar: '👴👉',
        avatarBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        content: '야!! 너!!! 너가 몬스터 잡아!!!!',
        action: '눈을 가늘게 뜨고 억지로 손가락으로 당신을 가리킨다.',
      },
      {
        speaker: '용사 (당신)',
        avatar: '😐...❓',
        avatarBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]',
        content: '...?',
        action: '지나 가다가 영문도 모른 채 어리둥절하게 쳐다본다.',
      },
      {
        speaker: '이장 (마을 대표)',
        avatar: '🏃‍♂️💨',
        avatarBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
        content: 'ㅅㄱ염',
        action: '귓가에 한마디를 남기더니 비정상적인 속도로 줄행랑을 친다.',
      }
    ];

    const cur = stories[storyStep];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={() => {
            sound.playHit && sound.playHit();
            setStoryStep((prev) => prev + 1);
          }}
          className="w-full max-w-xl bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 relative my-auto cursor-pointer select-none hover:border-slate-700 transition-all duration-300"
        >
          {/* Background glowing effects */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px]" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-[60px]" />

          <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-amber-500/80 font-bold tracking-wider">
                [ EPISODE #01: 황당한 이장님 ]
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playLevelUp && sound.playLevelUp();
                  setStoryStep(4);
                }}
                className="text-[10px] text-left hover:text-amber-400 text-slate-500 font-extrabold cursor-pointer transition-all active:scale-95 flex items-center gap-1 mt-1"
              >
                스토리 건너뛰기 ⏩
              </button>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === storyStep ? 'w-6 bg-amber-400' : 'w-2 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.div
            key={storyStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center text-center py-4"
          >
            {/* Speaker Avatar */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl border-2 mb-4 ${cur.avatarBg} animate-bounce`}>
              {cur.avatar}
            </div>

            <div className="text-sm font-extrabold text-amber-400 mb-1 font-sans">
              {cur.speaker}
            </div>

            <div className="text-xs text-slate-500 italic mb-6">
              * {cur.action} *
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 w-full min-h-[120px] flex items-center justify-center shadow-inner relative">
              <span className="absolute top-3 left-3 text-2xl text-slate-700 font-serif">“</span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-100 leading-relaxed font-sans select-none font-sans">
                {cur.content}
              </p>
              <span className="absolute bottom-1 right-3 text-2xl text-slate-700 font-serif">”</span>
            </div>
          </motion.div>

          <div className="mt-8 flex justify-between items-center">
            <span className="text-[11px] text-slate-500 italic animate-pulse">
              💡 카드 아무 곳이나 클릭해도 넘어갑니다
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playHit && sound.playHit();
                setStoryStep((prev) => prev + 1);
              }}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {storyStep === 3 ? '클래스 선택하기 →' : '다음 대화로 →'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl relative my-2"
      >
        {/* Background glowing gradients based on selected class, or default */}
        <div className="absolute top-0 left-1/4 w-36 h-36 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-36 h-36 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="p-3.5 sm:p-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="inline-block px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[9px] font-semibold uppercase tracking-wider">
              Character Class System
            </span>
            <button
              onClick={() => setStoryStep(0)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-400/80 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer"
            >
              📜 오프닝 스토리 보기
            </button>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight mb-0.5">
            모험을 시작할 클래스를 선택하세요
          </h2>
          <p className="text-[10px] text-slate-400 max-w-lg mx-auto mb-3">
            클래스마다 고유 능력치 및 <span className="text-amber-400 font-semibold">참격 공격 범위 각도</span>와 <span className="text-emerald-400 font-semibold">자동 자연 치유 주기</span>를 가집니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
            {classesConfig.map((cls) => {
              const isSelected = selected === cls.id;
              return (
                <motion.div
                  key={cls.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    setSelected(cls.id);
                    sound.playHit && sound.playHit();
                  }}
                  className={`relative cursor-pointer rounded-xl border p-2.5 text-left transition-all overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? cls.colorClass
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-bl-md tracking-wider uppercase">
                      SELECTED
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 bg-slate-800/80 rounded border border-slate-700/50 flex items-center justify-center">
                        {cls.icon}
                      </div>
                      <div>
                        <h3 className="text-[11px] font-extrabold text-slate-100">{cls.title}</h3>
                        <p className={`text-[9px] ${cls.textColor} font-semibold leading-none`}>{cls.sub}</p>
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-400 leading-normal mb-1.5 h-11 sm:h-12 overflow-hidden">
                      {cls.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-x-1.5 gap-y-0.5 pt-1.5 border-t border-slate-800/80">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                        <Zap className="w-2 h-2 text-amber-400" /> 이동 속도
                      </span>
                      <span className={`font-bold ${isSelected ? cls.textColor : 'text-slate-300'} text-[9px]`}>
                        {cls.stats.moveSpeed}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                        <Swords className="w-2 h-2 text-rose-400" /> 공격력
                      </span>
                      <span className={`font-bold ${isSelected ? cls.textColor : 'text-slate-300'} text-[9px]`}>
                        {cls.stats.attack}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                        <Zap className="w-2 h-2 text-cyan-400" /> 공격 속도
                      </span>
                      <span className={`font-bold ${isSelected ? cls.textColor : 'text-slate-300'} text-[9px]`}>
                        {cls.stats.attackSpeed}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                        <Heart className="w-2 h-2 text-emerald-400" /> 시작 체력
                      </span>
                      <span className={`font-bold ${isSelected ? cls.textColor : 'text-slate-300'} text-[9px]`}>
                        {cls.stats.maxHp}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                        <Target className="w-2 h-2 text-indigo-400" /> 공격 각도
                      </span>
                      <span className={`font-bold ${isSelected ? cls.textColor : 'text-slate-300'} text-[9px]`}>
                        {cls.stats.attackAngle}°
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                        <Hourglass className="w-2 h-2 text-teal-400" /> 자연 회복
                      </span>
                      <span className={`font-bold ${isSelected ? cls.textColor : 'text-slate-300'} text-[9px]`}>
                        {cls.stats.regenSeconds}초당 1칸
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleConfirm}
              disabled={selected === null}
              className={`w-full max-w-xs py-2 px-3 rounded-lg text-slate-950 font-extrabold text-[11px] tracking-wide transition-all ${
                selected !== null
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 cursor-pointer shadow-[0_3px_10px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              선택한 클래스로 게임 시작하기
            </button>
            <p className="text-[8px] text-slate-500">
              언제든지 네비게이션 바의 재시작(🔄) 버튼을 눌러 다시 클래스를 선택할 수 있습니다.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
