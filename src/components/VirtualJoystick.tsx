import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (dir: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 45; // 조이스틱 최대 이동 반경 (px)

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });

    // 정규화된 방향 벡터 계산 (dead zone 10px 설정)
    if (dist > 10) {
      onMove({ x: dx / maxRadius, y: dy / maxRadius });
    } else {
      onMove({ x: 0, y: 0 });
    }
  };

  const handleEnd = () => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    touchIdRef.current = null;
    onMove({ x: 0, y: 0 });
  };

  // 마우스 및 글로벌 터치 종료 처리
  useEffect(() => {
    const onWindowMouseUp = () => {
      if (active && touchIdRef.current === null) {
        handleEnd();
      }
    };
    const onWindowTouchEnd = (e: TouchEvent) => {
      if (touchIdRef.current !== null) {
        let found = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            found = true;
            break;
          }
        }
        if (!found) handleEnd();
      }
    };

    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);
    return () => {
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, [active]);

  // Bind local touch events manually with passive: false to prevent scrolling/gestures from cancelling the joystick drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (touchIdRef.current === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        touchIdRef.current = touch.identifier;
        setActive(true);
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === touchIdRef.current) {
            handleMove(touch.clientX, touch.clientY);
            break;
          }
        }
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-auto select-none touch-none">
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          e.stopPropagation();
          setActive(true);
          touchIdRef.current = null;
          handleMove(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (active && touchIdRef.current === null) {
            e.stopPropagation();
            handleMove(e.clientX, e.clientY);
          }
        }}
        className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-900/80 border-2 border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center justify-center active:border-indigo-500 transition-colors"
      >
        {/* 방향 화살표 배경 데코레이션 */}
        <div className="absolute inset-2 rounded-full border border-slate-800/60 pointer-events-none flex items-center justify-center">
          <span className="absolute top-1 text-[10px] text-slate-600 font-bold">▲</span>
          <span className="absolute bottom-1 text-[10px] text-slate-600 font-bold">▼</span>
          <span className="absolute left-2 text-[10px] text-slate-600 font-bold">◀</span>
          <span className="absolute right-2 text-[10px] text-slate-600 font-bold">▶</span>
        </div>

        {/* 조이스틱 엄지 스틱 (Knob) */}
        <div
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 ${
            active
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-105 shadow-indigo-500/50'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30" />
        </div>
      </div>
      <span className="text-[11px] font-black tracking-wider text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800 shadow">
        이동 조이스틱
      </span>
    </div>
  );
};
