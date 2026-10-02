import React, { useRef, useEffect, useCallback } from 'react';
import {
  EnemyEntity,
  Projectile,
  VisualEffect,
  VoidZone,
  PlayerStats,
  AcquiredSkill,
  ActiveStatusEffect,
  EnemyDefinition,
  PlayerClassType,
  CLASS_BASE_STATS,
} from '../types/game';
import { ENEMY_DEFINITIONS } from '../data/encyclopedia';
import { sound } from '../utils/sound';

interface GameCanvasProps {
  currentWave: number;
  stats: PlayerStats;
  acquiredSkills: AcquiredSkill[];
  activeStatusEffects: ActiveStatusEffect[];
  onAddStatusEffect: (type: ActiveStatusEffect['type'], duration: number) => void;
  onRemoveStatusEffect: (type: ActiveStatusEffect['type']) => void;
  onEnemyKilled: (enemy: EnemyEntity) => void;
  onPlayerTakeDamage: (damage: number, isInstantDeath?: boolean) => void;
  onWaveClear: () => void;
  moveDirection: { x: number; y: number };
  isAttackPressed?: boolean;
  activeSkillTrigger: string | null;
  onSkillTriggerHandled: () => void;
  onUpdateBossStatus: (name?: string, hp?: number, maxHp?: number, code?: string, phase?: number) => void;
  onUpdateAttackCooldown?: (remainingSec: number, totalSec: number) => void;
  onTriggerNotification?: (message: string, icon?: string, colorTheme?: string) => void;
  isPaused: boolean;
  playerClass: PlayerClassType;
  killedBugCount: number;
  gameMode?: string | null;
  onUpdateBrawlTime?: (elapsed: number) => void;
  onUpdateRankTime?: (elapsed: number) => void;
  onRankCleared?: (clearTime: number) => void;
  dashTrigger?: number;
  onUpdateDashCooldown?: (remainingSec: number, totalSec: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentWave,
  stats,
  acquiredSkills,
  activeStatusEffects = [],
  onAddStatusEffect,
  onRemoveStatusEffect,
  onEnemyKilled,
  onPlayerTakeDamage,
  onWaveClear,
  moveDirection,
  isAttackPressed,
  activeSkillTrigger,
  onSkillTriggerHandled,
  onUpdateBossStatus,
  onUpdateAttackCooldown,
  onTriggerNotification,
  isPaused,
  playerClass,
  killedBugCount,
  gameMode = null,
  onUpdateBrawlTime,
  onUpdateRankTime,
  onRankCleared,
  dashTrigger = 0,
  onUpdateDashCooldown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable game simulation state stored in refs to avoid re-renders at 60fps
  const gameStateRef = useRef({
    hero: { x: 400, y: 300, vx: 0, vy: 0, radius: 20, angle: 0 },
    enemies: [] as EnemyEntity[],
    projectiles: [] as Projectile[],
    effects: [] as VisualEffect[],
    voidZones: [] as VoidZone[],
    lastAttackTime: 0,
    lastPlayerHitTime: 0,
    lastPlayerAttackActionTime: Date.now(),
    waveSpawned: false,
    waveTransitioning: true,
    waveNumber: 0,
    mousePos: { x: 400, y: 300 },
    isMouseDown: false,
    keysPressed: {} as Record<string, boolean>,
    // 별빛 보스 전용 타이머 및 상태 필드들
    bossSummonTimer: 0,
    bossPhase1Timer: 0,
    bossPhase2Timer: 0,
    bossPhase3Timer: 0,
    bossPhase3Active: true,
    starlightExplosions: [] as { x: number; y: number; delay: number; maxDelay: number; triggered: boolean }[],
    bossPhase2ExplodeWarning: false,
    bossPhase2WarningTimer: 0,
    // 랭크 모드 전용 필드들
    rankTimer: 0,
    rankCleared: false,
    // 난투 모드 전용 필드들
    brawlTimer: 0,
    brawlBossesSpawned: false,
    brawlMinionSpawnTimer: 0,
    brawlTriggered1Min: false,
    brawlTriggered2Min: false,
    brawlTriggered3Min: false,
    brawlTriggered4Min: false,
    brawlTriggered5Min: false,
    // Passive Dagger
    passiveDaggerTimer: 0,
    // 대시 (Dash) 시스템
    isDashing: false,
    dashDurationTimer: 0,
    dashCooldownTimer: 0,
    dashCooldownTotal: 2.5,
    dashTrail: [] as { x: number; y: number; angle: number; alpha: number }[],
    // ERROR 보스 (5개 페이즈) 상태
    errorBossPhase: 1,
    errorBossTimer: 0,
    errorBossInvisible: false,
    errorBossInvisTimer: 0,
    errorBossTeleportComboCount: 0,
    errorBossComboTimer: 0,
    errorBossCycleDelayTimer: 0,
    errorBossVanishZones: [] as { x: number; y: number; radius: number; warningTimer: number; activeTimer: number }[],
    errorBossAttackCooldown: 0,
    errorBossHitFlashTimer: 0,
    screenShake: 0,
  });

  const lastCdEmitRef = useRef<number>(0);
  const lastRemainingSecRef = useRef<number>(0);

  // Keep callback refs fresh
  const callbacksRef = useRef({
    onAddStatusEffect,
    onRemoveStatusEffect,
    onEnemyKilled,
    onPlayerTakeDamage,
    onWaveClear,
    onUpdateBossStatus,
    onUpdateAttackCooldown,
    onTriggerNotification,
    onUpdateBrawlTime,
    onUpdateRankTime,
    onRankCleared,
    onUpdateDashCooldown,
  });
  useEffect(() => {
    callbacksRef.current = {
      onAddStatusEffect,
      onRemoveStatusEffect,
      onEnemyKilled,
      onPlayerTakeDamage,
      onWaveClear,
      onUpdateBossStatus,
      onUpdateAttackCooldown,
      onTriggerNotification,
      onUpdateBrawlTime,
      onUpdateRankTime,
      onRankCleared,
      onUpdateDashCooldown,
    };
  }, [onAddStatusEffect, onRemoveStatusEffect, onEnemyKilled, onPlayerTakeDamage, onWaveClear, onUpdateBossStatus, onUpdateAttackCooldown, onTriggerNotification, onUpdateBrawlTime, onUpdateRankTime, onRankCleared, onUpdateDashCooldown]);

  // Keep track of fast-moving inputs in refs to avoid restarting the main loop on every joystick change
  const inputRef = useRef({ moveDirection, isAttackPressed });
  useEffect(() => {
    inputRef.current = { moveDirection, isAttackPressed };
  }, [moveDirection, isAttackPressed]);

  // Spawn Wave Enemies when wave or gameMode changes
  useEffect(() => {
    const state = gameStateRef.current;
    
    // Always clear state on wave or mode change
    state.waveNumber = currentWave;
    state.enemies = [];
    state.projectiles = [];
    state.voidZones = [];
    state.waveSpawned = false;
    state.waveTransitioning = true;
    state.bossSummonTimer = 0;
    state.bossPhase1Timer = 0;
    state.bossPhase2Timer = 0;
    state.bossPhase3Timer = 0;
    state.bossPhase3Active = true;
    state.starlightExplosions = [];
    state.bossPhase2ExplodeWarning = false;
    state.bossPhase2WarningTimer = 0;
    
    // Brawl Mode specific resets
    state.brawlTimer = 0;
    state.brawlBossesSpawned = false;
    state.brawlMinionSpawnTimer = 0;
    state.brawlTriggered1Min = false;
    state.brawlTriggered2Min = false;
    state.brawlTriggered3Min = false;
    state.brawlTriggered4Min = false;
    state.brawlTriggered5Min = false;
    state.passiveDaggerTimer = 0;
    // Rank Mode specific resets
    state.rankTimer = 0;
    state.rankCleared = false;

    if (gameMode === 'RANK') {
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 800;
      const h = canvas ? canvas.height : 600;

      sound.playWaveStart();
      callbacksRef.current.onTriggerNotification?.('⭐ 랭크 모드 시작! 최종 보스 「별빛」을 신속히 격파하세요!', '⚡', 'amber');

      // Spawn ONLY 3-11_STARLIGHT_BOSS
      const starlightDef = ENEMY_DEFINITIONS['3-11_STARLIGHT_BOSS'];
      if (starlightDef) {
        state.enemies.push({
          uid: `boss_starlight_rank_${Date.now()}`,
          type: starlightDef.id,
          code: starlightDef.code,
          name: starlightDef.name,
          category: starlightDef.category,
          isBoss: true,
          x: w / 2,
          y: h * 0.28,
          hp: starlightDef.hp,
          maxHp: starlightDef.maxHp,
          xp: starlightDef.xp,
          speed: starlightDef.speed,
          damage: starlightDef.damage,
          radius: starlightDef.radius,
          color: starlightDef.color,
          abilityCooldown: 10,
          abilityTimer: 0,
          spawnTime: Date.now(),
        });
      }
    } else if (gameMode === 'BRAWL') {
      sound.playWaveStart();
      callbacksRef.current.onTriggerNotification?.('⚔️ 난투 모드 돌입! 6분간 생존하며 성장하십시오!', '🔥', 'rose');
    } else if (gameMode === 'HARDCORE') {
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 800;
      const h = canvas ? canvas.height : 600;

      sound.playWaveStart();
      callbacksRef.current.onTriggerNotification?.('☠️ 하드코어 모드 시작! 최종 보스 ERROR를 격파하십시오!', '⚠️', 'rose');

      state.errorBossPhase = 1;
      state.errorBossTimer = 0;
      state.errorBossInvisible = false;
      state.errorBossInvisTimer = 0;
      state.errorBossTeleportComboCount = 0;
      state.errorBossComboTimer = 0;
      state.errorBossCycleDelayTimer = 0;
      state.errorBossVanishZones = [];
      state.errorBossAttackCooldown = 1.0;
      state.errorBossHitFlashTimer = 0;

      // Spawn Boss ERROR (HP 1000)
      const errorDef = ENEMY_DEFINITIONS['ERROR_BOSS'];
      if (errorDef) {
        state.enemies.push({
          uid: `boss_error_${Date.now()}`,
          type: errorDef.id,
          code: errorDef.code,
          name: errorDef.name,
          category: errorDef.category,
          isBoss: true,
          x: w / 2,
          y: h * 0.28,
          hp: 1000,
          maxHp: 1000,
          xp: 1000,
          speed: 0.9,
          damage: 8,
          radius: 46,
          color: '#EF4444',
          abilityCooldown: 999,
          abilityTimer: 0,
          spawnTime: Date.now(),
        });
      }
    } else {
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 800;
      const h = canvas ? canvas.height : 600;

      // Helper to pick border spawn position
      const getSpawnPos = () => {
        const side = Math.floor(Math.random() * 4);
        const margin = 50;
        if (side === 0) return { x: Math.random() * w, y: -margin }; // top
        if (side === 1) return { x: w + margin, y: Math.random() * h }; // right
        if (side === 2) return { x: Math.random() * w, y: h + margin }; // bottom
        return { x: -margin, y: Math.random() * h }; // left
      };

      const spawnEnemy = (defKey: string, customPos?: { x: number; y: number }, isClone = false) => {
        const def = ENEMY_DEFINITIONS[defKey];
        if (!def) return;
        const pos = customPos || getSpawnPos();
        const newEnemy: EnemyEntity = {
          uid: `${def.id}_${Date.now()}_${Math.random()}`,
          type: def.id,
          code: def.code,
          name: isClone ? `${def.name} (분신)` : def.name,
          category: def.category,
          isBoss: isClone ? false : def.isBoss,
          x: pos.x,
          y: pos.y,
          hp: isClone ? 3 : def.hp,
          maxHp: isClone ? 3 : def.maxHp,
          xp: isClone ? 5 : def.xp,
          speed: def.speed,
          damage: isClone ? 3 : def.damage,
          radius: isClone ? 18 : def.radius,
          color: def.color,
          abilityCooldown: 10,
          abilityTimer: 0,
          spawnTime: Date.now(),
          cloneExpireTimer: isClone ? 15 : undefined,
        };
        state.enemies.push(newEnemy);
      };

      // Wave configurations
      sound.playWaveStart();
      if (currentWave === 1) {
        spawnEnemy('3-6_STALKER_USER');
        spawnEnemy('3-1_UI_BUG');
      } else if (currentWave === 2) {
        spawnEnemy('3-7_IMPERSONATOR_USER');
        spawnEnemy('3-2_LOGIC_BUG');
      } else if (currentWave === 3) {
        spawnEnemy('3-8_AGGRESSIVE_USER');
        spawnEnemy('3-3_SERVER_BUG');
      } else if (currentWave === 4) {
        spawnEnemy('3-9_SPAMMER_USER');
        spawnEnemy('3-4_DATA_BUG');
      } else if (currentWave === 5) {
        spawnEnemy('3-10_TROLL_USER');
        spawnEnemy('3-5_SECURITY_BUG');
      } else if (currentWave === 6) {
        spawnEnemy('3-11_STARLIGHT_BOSS');
      }

      // Spawn 10 Bots (11-1) for waves 1 to 5
      if (currentWave <= 5) {
        for (let i = 0; i < 10; i++) {
          spawnEnemy('11-1_BOT');
        }
      }
    }
    state.waveSpawned = true;
    state.waveTransitioning = false;
  }, [currentWave, gameMode]);

  // Handle Active Skill Triggers from HUD buttons or Keyboard shortcuts
  useEffect(() => {
    if (!activeSkillTrigger || isPaused) return;
    const state = gameStateRef.current;
    const hero = state.hero;

    const getSkillLevel = (code: string) => {
      const sk = acquiredSkills.find((s) => s.definition.code === code);
      return sk ? sk.level : 1;
    };

    if (activeSkillTrigger === '10-1_EXPLOSION') {
      sound.playExplosion();
      const lvl = getSkillLevel('10-1');
      const radius = 200; // 5 blocks = 200px
      const explosionDmg = 6 + (lvl - 1) * 1;

      state.effects.push({
        uid: `exp_${Date.now()}`,
        x: hero.x,
        y: hero.y,
        type: 'EXPLOSION',
        radius,
        color: '#EF4444',
        duration: 0.4,
        maxDuration: 0.4,
      });

      state.enemies.forEach((en) => {
        const dx = en.x - hero.x;
        const dy = en.y - hero.y;
        if (Math.hypot(dx, dy) <= radius + en.radius) {
          en.hp -= explosionDmg;
          if (en.code === 'ERROR') state.errorBossHitFlashTimer = 0.1;
          state.effects.push({
            uid: `txt_${Date.now()}_${Math.random()}`,
            x: en.x,
            y: en.y - 15,
            type: 'TEXT',
            text: `-${explosionDmg} (폭발 Lv.${lvl})`,
            color: '#FEF08A',
            duration: 0.8,
            maxDuration: 0.8,
          });
        }
      });
    } else if (activeSkillTrigger === '10-2_SLASH') {
      sound.playSlash();
      const lvl = getSkillLevel('10-2');
      const slashRadius = 130 + (lvl - 1) * 15;
      const slashDmg = 5 + (lvl - 1) * 1;

      state.effects.push({
        uid: `slash_${Date.now()}`,
        x: hero.x,
        y: hero.y,
        type: 'SLASH',
        angle: hero.angle,
        radius: slashRadius,
        color: '#F59E0B',
        duration: 0.3,
        maxDuration: 0.3,
      });

      // Damage enemies within 60 degree forward arc
      state.enemies.forEach((en) => {
        const dx = en.x - hero.x;
        const dy = en.y - hero.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= slashRadius + en.radius) {
          const angleToEnemy = Math.atan2(dy, dx);
          let diff = angleToEnemy - hero.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          if (Math.abs(diff) <= Math.PI / 6) { // 60 degrees is PI / 3 total, so Math.abs <= PI / 6
            en.hp -= slashDmg;
            if (en.code === 'ERROR') state.errorBossHitFlashTimer = 0.1;
            state.effects.push({
              uid: `txt_${Date.now()}_${Math.random()}`,
              x: en.x,
              y: en.y - 15,
              type: 'TEXT',
              text: `-${slashDmg.toFixed(1)} (베기 Lv.${lvl})`,
              color: '#FDE047',
              duration: 0.8,
              maxDuration: 0.8,
            });
          }
        }
      });
    } else if (activeSkillTrigger === '10-3_MAGIC') {
      sound.playMagicOrb();
      const lvl = getSkillLevel('10-3');
      const magicDmg = 7;
      const magicRadius = 14;
      const speedMult = 0.7 + (lvl - 1) * 0.8;

      const vx = Math.cos(hero.angle) * 10 * speedMult;
      const vy = Math.sin(hero.angle) * 10 * speedMult;
      state.projectiles.push({
        uid: `orb_${Date.now()}`,
        x: hero.x,
        y: hero.y,
        vx,
        vy,
        damage: magicDmg,
        radius: magicRadius,
        color: '#8B5CF6',
        type: 'MAGIC_ORB',
        maxDistance: 600,
        traveled: 0,
      });
    } else if (activeSkillTrigger === '10-8_STAR_EASTER_EGG') {
      sound.playLevelUp();
      // Scatter shooting stars all over screen dealing 1 dmg (10 dmg to boss 3-11) to every single enemy!
      state.effects.push({
        uid: `starrain_${Date.now()}`,
        x: hero.x,
        y: hero.y,
        type: 'STAR_RAIN',
        color: '#EAB308',
        duration: 1.5,
        maxDuration: 1.5,
      });
      state.enemies.forEach((en) => {
        const isStarlight = en.code === '3-11';
        const dmg = isStarlight ? 10 : 1;
        en.hp -= dmg;
        state.effects.push({
          uid: `txt_${Date.now()}_${Math.random()}`,
          x: en.x,
          y: en.y - 15,
          type: 'TEXT',
          text: `-${dmg} (⭐)`,
          color: '#FEF08A',
          duration: 0.8,
          maxDuration: 0.8,
        });
      });
    } else if (activeSkillTrigger === '10-9_DAGGER') {
      sound.playSlash();
      const lvl = getSkillLevel('10-9');
      const daggerDmg = 5;
      const daggerRadius = 5;
      const speed = 550; // speed of throwing
      const maxDistance = 550;
      const daggerCount = lvl; // skill stack increases the number of daggers by 1

      // Find enemies and sort by distance to hero
      const enemiesWithDist = state.enemies.map(en => ({
        en,
        dist: Math.hypot(en.x - hero.x, en.y - hero.y)
      }));
      enemiesWithDist.sort((a, b) => a.dist - b.dist);

      for (let i = 0; i < daggerCount; i++) {
        let targetAngle = hero.angle;
        if (enemiesWithDist.length > 0) {
          // Target the i-th nearest enemy, wrapping around
          const targetEnemy = enemiesWithDist[i % enemiesWithDist.length].en;
          targetAngle = Math.atan2(targetEnemy.y - hero.y, targetEnemy.x - hero.x);
          if (daggerCount > 1) {
            targetAngle += (Math.random() - 0.5) * 0.15; // small spread offset
          }
        } else {
          // No enemies, shoot forward with angle spread
          if (daggerCount > 1) {
            targetAngle += (i - (daggerCount - 1) / 2) * 0.15;
          }
        }

        state.projectiles.push({
          uid: `dagger_${Date.now()}_${i}_${Math.random()}`,
          x: hero.x,
          y: hero.y,
          vx: Math.cos(targetAngle) * speed,
          vy: Math.sin(targetAngle) * speed,
          damage: daggerDmg,
          radius: daggerRadius,
          color: '#14B8A6', // Teal sharp color
          type: 'DAGGER',
          maxDistance: maxDistance,
          traveled: 0,
        });
      }
    }


    onSkillTriggerHandled();
  }, [activeSkillTrigger, isPaused, onSkillTriggerHandled, acquiredSkills]);

  // Dash execution helper
  const executeDash = useCallback(() => {
    const state = gameStateRef.current;
    if (state.dashCooldownTimer > 0) return;
    const isControlDisabled = activeStatusEffects.some((e) => e.type === 'CONTROL_DISABLED');
    if (isControlDisabled) return;

    state.dashCooldownTimer = state.dashCooldownTotal;
    state.isDashing = true;
    state.dashDurationTimer = 0.35; // 0.35s invulnerability

    const hero = state.hero;
    let dashDx = 0;
    let dashDy = 0;
    const keys = state.keysPressed;
    if (keys['w'] || keys['arrowup']) dashDy -= 1;
    if (keys['s'] || keys['arrowdown']) dashDy += 1;
    if (keys['a'] || keys['arrowleft']) dashDx -= 1;
    if (keys['d'] || keys['arrowright']) dashDx += 1;
    const currentMoveDir = inputRef.current.moveDirection;
    if (currentMoveDir.x !== 0 || currentMoveDir.y !== 0) {
      dashDx = currentMoveDir.x;
      dashDy = currentMoveDir.y;
    }

    let angle = hero.angle;
    if (dashDx !== 0 || dashDy !== 0) {
      angle = Math.atan2(dashDy, dashDx);
    }
    const dashDist = 140;

    // Create ghost afterimage trail
    for (let t = 0; t <= 3; t++) {
      const frac = t / 3;
      state.dashTrail.push({
        x: hero.x + Math.cos(angle) * dashDist * frac,
        y: hero.y + Math.sin(angle) * dashDist * frac,
        angle: angle,
        alpha: 0.85 - frac * 0.15,
      });
    }

    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 800;
    const h = canvas ? canvas.height : 600;
    hero.x = Math.max(hero.radius, Math.min(w - hero.radius, hero.x + Math.cos(angle) * dashDist));
    hero.y = Math.max(hero.radius, Math.min(h - hero.radius, hero.y + Math.sin(angle) * dashDist));
    hero.angle = angle;

    sound.playSlash();
    state.effects.push({
      uid: `dash_txt_${Date.now()}`,
      x: hero.x,
      y: hero.y - 25,
      type: 'TEXT',
      text: '⚡ 대시! (무적)',
      color: '#38BDF8',
      duration: 0.6,
      maxDuration: 0.6,
    });
  }, [activeStatusEffects]);

  // Dash trigger from HUD or parent
  const lastDashTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (dashTrigger && dashTrigger > lastDashTriggerRef.current) {
      lastDashTriggerRef.current = dashTrigger;
      executeDash();
    }
  }, [dashTrigger, executeDash]);

  // Keyboard & Mouse/Touch Event Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key.toLowerCase()] = true;
      if (e.code === 'Space' || e.key === 'Shift') {
        const target = e.target as HTMLElement;
        if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          executeDash();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key.toLowerCase()] = false;
    };
    const updateMousePos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      gameStateRef.current.mousePos = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };
    const handleMouseMove = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
    };
    const handleMouseDown = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
      gameStateRef.current.isMouseDown = true;
    };
    const handleMouseUp = () => {
      gameStateRef.current.isMouseDown = false;
    };

    // For touch, only look at touches that start directly on the canvas element
    const handleTouchStart = (e: TouchEvent) => {
      if (e.targetTouches.length > 0) {
        const touch = e.targetTouches[0];
        updateMousePos(touch.clientX, touch.clientY);
        gameStateRef.current.isMouseDown = true;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.targetTouches.length > 0) {
        const touch = e.targetTouches[0];
        updateMousePos(touch.clientX, touch.clientY);
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.targetTouches.length === 0) {
        gameStateRef.current.isMouseDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Bind click and slide aiming directly to the canvas
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchend', handleMouseUp); // global safety release

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);



  // Main 60fps Gameplay Loop
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const canvas = canvasRef.current;
      if (canvas && !isPaused) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const state = gameStateRef.current;
          const hero = state.hero;

          // Local Player Damage Application with Dash Invulnerability & Defense & Shield
          const takeDamageLocal = (dmg: number, isInstantDeath = false) => {
            if (isInstantDeath) {
              callbacksRef.current.onPlayerTakeDamage(dmg, true);
              return;
            }
            // 1. Dash Invulnerability check
            if (state.isDashing || state.dashDurationTimer > 0) {
              return; // Completely invulnerable during dash
            }

            // 2. Defense Stat Damage Mitigation
            let mitigatedDmg = dmg;
            if (stats.defense && stats.defense > 0) {
              const reduction = Math.min(mitigatedDmg * 0.75, stats.defense * 0.5);
              mitigatedDmg = Math.max(1, mitigatedDmg - reduction);
            }

            const shieldSkill = acquiredSkills.find((s) => s.definition.code === '10-11');
            if (shieldSkill && state.shieldHp !== undefined && state.shieldHp > 0) {
              if (state.shieldHp >= mitigatedDmg) {
                state.shieldHp -= mitigatedDmg;
                sound.playHit();
                state.effects.push({
                  uid: `shield_absorb_${Date.now()}_${Math.random()}`,
                  x: hero.x,
                  y: hero.y - 25,
                  type: 'TEXT',
                  text: `🛡️ 보호막 흡수 (-${mitigatedDmg.toFixed(1)})`,
                  color: '#60A5FA',
                  duration: 0.8,
                  maxDuration: 0.8,
                });
                return;
              } else {
                const remainingDmg = mitigatedDmg - state.shieldHp;
                state.effects.push({
                  uid: `shield_break_${Date.now()}`,
                  x: hero.x,
                  y: hero.y - 25,
                  type: 'TEXT',
                  text: `💥 보호막 깨짐! (-${state.shieldHp.toFixed(0)} 흡수)`,
                  color: '#3B82F6',
                  duration: 1.0,
                  maxDuration: 1.0,
                });
                state.shieldHp = 0;
                state.shieldTimer = 0;
                callbacksRef.current.onPlayerTakeDamage(remainingDmg);
                return;
              }
            }
            callbacksRef.current.onPlayerTakeDamage(mitigatedDmg);
          };

          // --- PASSIVE SKILLS UPDATES ---


          // 2. Shield (10-11)
          const shieldSkill = acquiredSkills.find((s) => s.definition.code === '10-11');
          if (shieldSkill) {
            const lvl = shieldSkill.level;
            const shieldCooldown = 10 - (lvl - 1) * 0.5;
            const maxShieldHp = 10 + (lvl - 1) * 1;
            
            if (state.shieldHp === undefined) state.shieldHp = maxShieldHp;
            if (state.shieldTimer === undefined) state.shieldTimer = 0;
            
            if (state.shieldHp < maxShieldHp) {
              state.shieldTimer += dt;
              if (state.shieldTimer >= shieldCooldown) {
                state.shieldTimer = 0;
                state.shieldHp = maxShieldHp;
                sound.playLevelUp();
                state.effects.push({
                  uid: `shield_regen_${Date.now()}`,
                  x: hero.x,
                  y: hero.y - 25,
                  type: 'TEXT',
                  text: `🛡️ 보호막 충전! (+${maxShieldHp})`,
                  color: '#60A5FA',
                  duration: 0.8,
                  maxDuration: 0.8,
                });
              }
            }
          }

          // 3. Passive Dagger (10-12)
          const passiveDaggerSkill = acquiredSkills.find((s) => s.definition.code === '10-12');
          if (passiveDaggerSkill) {
            if (state.passiveDaggerTimer === undefined) state.passiveDaggerTimer = 0;
            state.passiveDaggerTimer += dt;
            if (state.passiveDaggerTimer >= 7) {
              state.passiveDaggerTimer = 0;
              sound.playSlash();
              const lvl = passiveDaggerSkill.level;
              const daggerDmg = 5;
              const daggerRadius = 5;
              const speed = 550; // projectile speed
              const maxDistance = 550;
              const daggerCount = lvl; // skill stack increases dagger count by 1

              // Find enemies and sort by distance to hero
              const enemiesWithDist = state.enemies.map(en => ({
                en,
                dist: Math.hypot(en.x - hero.x, en.y - hero.y)
              }));
              enemiesWithDist.sort((a, b) => a.dist - b.dist);

              for (let i = 0; i < daggerCount; i++) {
                let targetAngle = hero.angle;
                if (enemiesWithDist.length > 0) {
                  // Target the i-th nearest enemy, wrapping around
                  const targetEnemy = enemiesWithDist[i % enemiesWithDist.length].en;
                  targetAngle = Math.atan2(targetEnemy.y - hero.y, targetEnemy.x - hero.x);
                  if (daggerCount > 1) {
                    targetAngle += (Math.random() - 0.5) * 0.15; // small spread offset
                  }
                } else {
                  // No enemies, shoot forward with angle spread
                  if (daggerCount > 1) {
                    targetAngle += (i - (daggerCount - 1) / 2) * 0.15;
                  }
                }

                state.projectiles.push({
                  uid: `passive_dagger_${Date.now()}_${i}_${Math.random()}`,
                  x: hero.x,
                  y: hero.y,
                  vx: Math.cos(targetAngle) * speed,
                  vy: Math.sin(targetAngle) * speed,
                  damage: daggerDmg,
                  radius: daggerRadius,
                  color: '#06B6D4', // Cyan color for passive daggers
                  type: 'DAGGER',
                  maxDistance: maxDistance,
                  traveled: 0,
                });
              }
            }
          }

          // --- 1. PLAYER MOVEMENT & CONTROLS ---
          const isControlDisabled = activeStatusEffects.some((e) => e.type === 'CONTROL_DISABLED');
          const isAttackDisabled = activeStatusEffects.some((e) => e.type === 'DISABLE_ATTACK');

          let dx = 0;
          let dy = 0;
          if (!isControlDisabled) {
            const keys = state.keysPressed;
            if (keys['w'] || keys['arrowup']) dy -= 1;
            if (keys['s'] || keys['arrowdown']) dy += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1;
            if (keys['d'] || keys['arrowright']) dx += 1;

            const currentMoveDir = inputRef.current.moveDirection;
            if (currentMoveDir.x !== 0 || currentMoveDir.y !== 0) {
              dx = currentMoveDir.x;
              dy = currentMoveDir.y;
            }
          }

          const baseSpeedPx = 180; // pixels per sec
          const speedMultiplier = stats.moveSpeed / 0.8;
          const finalSpeed = baseSpeedPx * speedMultiplier;

          if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            hero.x += (dx / len) * finalSpeed * dt;
            hero.y += (dy / len) * finalSpeed * dt;
            hero.angle = Math.atan2(dy, dx);
          } else if (state.mousePos) {
            hero.angle = Math.atan2(state.mousePos.y - hero.y, state.mousePos.x - hero.x);
          }

          // Bound hero inside arena
          hero.x = Math.max(hero.radius, Math.min(w - hero.radius, hero.x));
          hero.y = Math.max(hero.radius, Math.min(h - hero.radius, hero.y));

          // --- 2. HERO MANUAL 30-DEGREE ATTACK (CLICK) ---
          const baseRangePx = 100;
          const rangeMultiplier = stats.range / 1.0;
          const finalRange = baseRangePx * rangeMultiplier;

          // Apply 10-7 Go Away passive attack speed scaling (1% + 1.5% per stack)
          const goAwaySkill = acquiredSkills.find((s) => s.definition.code === '10-7');
          const goAwayMult = goAwaySkill ? (1 + 0.01 + 0.015 * (goAwaySkill.level - 1)) : 1.0;
          const effectiveAttackSpeed = stats.attackSpeed * goAwayMult;

          const currentAttackPressed = inputRef.current.isAttackPressed;
          if (!isAttackDisabled && (state.isMouseDown || currentAttackPressed) && time - state.lastAttackTime >= 1000 / effectiveAttackSpeed) {
            state.lastAttackTime = time;
            state.lastPlayerAttackActionTime = Date.now();
            sound.playHit();

            // 공격 방향 계산 (마우스 위치, 이동 방향, 또는 스마트 오토 에임)
            let targetAngle = hero.angle;

            // 모바일 공격 패드 버튼을 누르고 있는 경우
            if (currentAttackPressed) {
              let nearestEnemy: EnemyEntity | null = null;
              let minDist = Infinity;

              // 가장 가까운 적 탐색
              state.enemies.forEach((en) => {
                const distToEnemy = Math.hypot(en.x - hero.x, en.y - hero.y);
                if (distToEnemy < minDist) {
                  minDist = distToEnemy;
                  nearestEnemy = en;
                }
              });

              // 적이 사거리 안(또는 조금 너머)에 있으면 자동으로 그 적을 조준
              if (nearestEnemy && minDist <= finalRange * 2.2) {
                targetAngle = Math.atan2((nearestEnemy as EnemyEntity).y - hero.y, (nearestEnemy as EnemyEntity).x - hero.x);
              } else {
                const currentMoveDir = inputRef.current.moveDirection;
                if (currentMoveDir.x !== 0 || currentMoveDir.y !== 0) {
                  // 조준할 적이 없으면 조이스틱으로 움직이는 방향을 조준
                  targetAngle = Math.atan2(currentMoveDir.y, currentMoveDir.x);
                }
              }
            } else {
              // 마우스 클릭 또는 화면 터치 조준
              if (state.mousePos) {
                const distToMouse = Math.hypot(state.mousePos.x - hero.x, state.mousePos.y - hero.y);
                if (distToMouse > 5) {
                  targetAngle = Math.atan2(state.mousePos.y - hero.y, state.mousePos.x - hero.x);
                }
              }
            }
            hero.angle = targetAngle;

            // 공격각 계산 (클래스별 동적 로드)
            const baseStats = CLASS_BASE_STATS[playerClass];
            const attackAngleDeg = baseStats.attackAngle;
            const slashRange = finalRange * 1.4;
            const coneAngleRad = (attackAngleDeg * Math.PI) / 180;
            const halfCone = coneAngleRad / 2;

            const hasVaccine = acquiredSkills.some((s) => s.definition.code === '10-1_VACCINE');
            const hasPepperSpray = acquiredSkills.some((s) => s.definition.code === '10-2_PEPPER_SPRAY');
            const hasGoAway = acquiredSkills.some((s) => s.definition.code === '10-7');

            let hitCount = 0;
            let hitBoss = false;

            // 부채꼴 범위 내 모든 적 타격
            state.enemies.forEach((en) => {
              const dist = Math.hypot(en.x - hero.x, en.y - hero.y) - en.radius;
              if (dist <= slashRange) {
                const angleToEnemy = Math.atan2(en.y - hero.y, en.x - hero.x);
                const diffAngle = Math.abs((angleToEnemy - targetAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI);
                const angleTolerance = halfCone + Math.asin(Math.min(1, en.radius / Math.max(10, dist)));
                if (diffAngle <= angleTolerance) {
                  hitCount++;
                  if (en.isBoss) hitBoss = true;

                  let totalDmg = stats.attack * 1.25; // 근접 부채꼴 타격 기본 보너스
                  if (hasVaccine && en.category === 'BUG') {
                    totalDmg *= 1 + killedBugCount * 0.015;
                  }
                  if (hasPepperSpray && en.category === 'USER') {
                    totalDmg *= 1.15;
                  }
                  if (hasGoAway) {
                    totalDmg *= 1.025; // 몬스터에게 2.5% 공격력 증가
                  }

                  // ERROR 보스 3 & 4페이즈 은신 중 받는 피해 감소
                  if (en.code === 'ERROR') {
                    if (state.errorBossPhase === 3 && state.errorBossInvisible) {
                      totalDmg *= 0.5; // 3페이즈: 50% 피해 감소
                    } else if (state.errorBossPhase === 4 && state.errorBossInvisible) {
                      totalDmg *= 0.25; // 4페이즈: 75% 피해 대폭 감소
                    }
                  }

                  en.hp -= totalDmg;
                  en.hitFlashTimer = 0.16; // 몬스터 피격 시 화이트-레드 섬광 점멸
                  if (en.code === 'ERROR') state.errorBossHitFlashTimer = 0.1;

                  // 넉백 파워 연산
                  let pushForce = 0;
                  if (hasGoAway) pushForce += 35;

                  if (pushForce > 0) {
                    const pushAngle = Math.atan2(en.y - hero.y, en.x - hero.x);
                    en.x += Math.cos(pushAngle) * pushForce;
                    en.y += Math.sin(pushAngle) * pushForce;
                  }

                  // 몬스터 피격 위치 개별 충격파 애니메이션
                  state.effects.push({
                    uid: `hit_sw_${Date.now()}_${Math.random()}`,
                    x: en.x,
                    y: en.y,
                    type: 'HIT_SHOCKWAVE',
                    radius: Math.max(32, en.radius * 1.8),
                    color: '#EF4444',
                    duration: 0.22,
                    maxDuration: 0.22,
                  });

                  // 몬스터 피격 붉은색 섬광 및 타격 스파크 파편 효과
                  state.effects.push({
                    uid: `hit_flash_${Date.now()}_${Math.random()}`,
                    x: en.x,
                    y: en.y,
                    type: 'RED_HIT_FLASH',
                    radius: Math.max(26, en.radius + 12),
                    color: '#FF2E54',
                    duration: 0.18,
                    maxDuration: 0.18,
                    particles: Array.from({ length: 6 }).map(() => {
                      const pAngle = targetAngle + (Math.random() - 0.5) * 1.4;
                      const pSpeed = 100 + Math.random() * 240;
                      return {
                        x: en.x,
                        y: en.y,
                        vx: Math.cos(pAngle) * pSpeed,
                        vy: Math.sin(pAngle) * pSpeed,
                        life: 0.22 + Math.random() * 0.1,
                        maxLife: 0.32,
                        color: Math.random() > 0.35 ? '#EF4444' : '#FCA5A5',
                        size: 2 + Math.random() * 2.5,
                      };
                    }),
                  });

                  state.effects.push({
                    uid: `txt_${Date.now()}_${Math.random()}`,
                    x: en.x,
                    y: en.y - 12,
                    type: 'TEXT',
                    text: `-${totalDmg.toFixed(1)}`,
                    color: baseStats.secondaryColor,
                    duration: 0.6,
                    maxDuration: 0.6,
                  });
                }
              }
            });

            // 타격감 강화를 위한 카메라 스크린 셰이크(화면 진동)
            if (hitCount > 0) {
              state.screenShake = Math.min(12, (state.screenShake || 0) + (hitBoss ? 7 : 4));
            }

            // [공격 범위 내 붉은색 섬광 효과 (RED FLASH)]
            state.effects.push({
              uid: `atk_flash_${Date.now()}_${Math.random()}`,
              x: hero.x,
              y: hero.y,
              type: 'ATTACK_RED_FLASH',
              radius: slashRange,
              angle: targetAngle,
              arcAngle: coneAngleRad,
              color: '#EF4444',
              duration: hitCount > 0 ? 0.22 : 0.16,
              maxDuration: hitCount > 0 ? 0.22 : 0.16,
            });

            // [공격 범위 내 충격파 애니메이션 (SHOCKWAVE)]
            state.effects.push({
              uid: `atk_sw_${Date.now()}_${Math.random()}`,
              x: hero.x,
              y: hero.y,
              type: 'ATTACK_SHOCKWAVE',
              radius: slashRange,
              angle: targetAngle,
              arcAngle: coneAngleRad,
              color: '#DC2626',
              duration: 0.24,
              maxDuration: 0.24,
            });

            // 클래스 맞춤형 참격 시각 효과 (SLASH)
            state.effects.push({
              uid: `slash_${Date.now()}_${Math.random()}`,
              x: hero.x,
              y: hero.y,
              type: 'SLASH',
              radius: slashRange,
              angle: targetAngle,
              arcAngle: coneAngleRad,
              color: baseStats.color, // 클래스 고유 색상
              duration: 0.22,
              maxDuration: 0.22,
            });

            // 참격 각도 반경에 맞춰 뻗어나가는 참격 파동 투사체 3발 발사
            const halfAngleRad = (attackAngleDeg / 2) * (Math.PI / 180);
            const offsets = [-halfAngleRad, 0, halfAngleRad];
            offsets.forEach((offset) => {
              const projAngle = targetAngle + offset;
              let projDmg = stats.attack * 0.8;

              // 클래스별 투사체 특성 커스터마이징
              const isAssassin = playerClass === 'ASSASSIN';
              const isTanker = playerClass === 'TANKER';
              const isMage = playerClass === 'MAGE';
              const isBerserker = playerClass === 'BERSERKER';

              const radius = isTanker ? 8 : (isMage ? 6 : (isBerserker ? 5 : 4));
              const speed = isAssassin ? 520 : (isTanker ? 320 : (isMage ? 420 : 460));
              const maxDistance = finalRange * (isAssassin ? 1.8 : (isTanker ? 1.0 : (isMage ? 1.4 : 1.3)));

              state.projectiles.push({
                uid: `proj_${Date.now()}_${Math.random()}`,
                x: hero.x + Math.cos(projAngle) * 20,
                y: hero.y + Math.sin(projAngle) * 20,
                vx: Math.cos(projAngle) * speed,
                vy: Math.sin(projAngle) * speed,
                damage: projDmg,
                radius: radius,
                color: baseStats.secondaryColor,
                type: isMage ? 'MAGIC_ORB' : 'BASIC',
                maxDistance: maxDistance,
                traveled: 0,
              });
            });
          }

          // --- 3. PROJECTILES SIMULATION ---
          state.projectiles = state.projectiles.filter((p) => {
            const stepX = p.vx * dt;
            const stepY = p.vy * dt;
            p.x += stepX;
            p.y += stepY;
            p.traveled += Math.hypot(stepX, stepY);

            // Check collision against enemies
            for (let i = 0; i < state.enemies.length; i++) {
              const en = state.enemies[i];
              if (Math.hypot(p.x - en.x, p.y - en.y) <= p.radius + en.radius) {
                const hasGoAway = acquiredSkills.some((s) => s.definition.code === '10-7');

                let finalDmg = p.damage;
                if (hasGoAway) finalDmg *= 1.025;

                // ERROR 보스 3 & 4페이즈 은신 중 받는 피해 감소
                if (en.code === 'ERROR') {
                  if (state.errorBossPhase === 3 && state.errorBossInvisible) {
                    finalDmg *= 0.5; // 3페이즈: 50% 피해 감소
                  } else if (state.errorBossPhase === 4 && state.errorBossInvisible) {
                    finalDmg *= 0.25; // 4페이즈: 75% 피해 대폭 감소
                  }
                }

                en.hp -= finalDmg;
                en.hitFlashTimer = 0.14;
                if (en.code === 'ERROR') state.errorBossHitFlashTimer = 0.1;
                state.screenShake = Math.min(8, (state.screenShake || 0) + (en.isBoss ? 3.5 : 1.8));

                // 투사체 적중 붉은 충격파
                state.effects.push({
                  uid: `p_sw_${Date.now()}_${Math.random()}`,
                  x: en.x,
                  y: en.y,
                  type: 'HIT_SHOCKWAVE',
                  radius: Math.max(22, en.radius * 1.3),
                  color: '#EF4444',
                  duration: 0.16,
                  maxDuration: 0.16,
                });

                // 넉백 파워 연산
                let pushForce = 0;
                if (hasGoAway) pushForce += 25;

                if (pushForce > 0) {
                  const pushAngle = Math.atan2(en.y - hero.y, en.x - hero.x);
                  en.x += Math.cos(pushAngle) * pushForce;
                  en.y += Math.sin(pushAngle) * pushForce;
                }

                state.effects.push({
                  uid: `txt_${Date.now()}_${Math.random()}`,
                  x: en.x,
                  y: en.y - 12,
                  type: 'TEXT',
                  text: `-${finalDmg.toFixed(1)}`,
                  color: p.type === 'MAGIC_ORB' ? '#C084FC' : (p.type === 'DAGGER' ? '#2DD4BF' : '#FDE047'),
                  duration: 0.6,
                  maxDuration: 0.6,
                });
                return false; // remove projectile on hit
              }
            }

            return p.traveled < p.maxDistance && p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h;
          });

          // --- 4. VOID ZONES (Server Bug 3-3 Ability) ---
          state.voidZones = state.voidZones.filter((vz) => {
            if (!vz.isVoid) {
              vz.timer -= dt;
              if (vz.timer <= 0) {
                vz.isVoid = true;
                sound.playWarning();
              }
            } else {
              vz.voidDuration -= dt;
              // Check if hero touches void -> Instant Death!
              if (Math.hypot(hero.x - vz.x, hero.y - vz.y) <= hero.radius + vz.radius) {
                callbacksRef.current.onPlayerTakeDamage(999, true);
              }
            }
            return vz.voidDuration > 0;
          });

          // --- 4.5. STARLIGHT BOSS SYSTEM ---
          state.starlightExplosions = state.starlightExplosions.filter((exp) => {
            exp.delay -= dt;
            if (exp.delay <= 0) {
              if (!exp.triggered) {
                exp.triggered = true;
                sound.playExplosion();
                state.effects.push({
                  uid: `boss_exp_${Date.now()}_${Math.random()}`,
                  x: exp.x,
                  y: exp.y,
                  type: 'EXPLOSION',
                  radius: 50,
                  color: '#EAB308',
                  duration: 0.4,
                  maxDuration: 0.4,
                });
                const distToHero = Math.hypot(hero.x - exp.x, hero.y - exp.y);
                if (distToHero <= 50 + hero.radius) {
                  callbacksRef.current.onPlayerTakeDamage(5);
                }
              }
              return false;
            }
            return true;
          });

          // --- 4.8. MODE TIME TRACKING & BRAWL SPAWNING ---
          if (gameMode === 'RANK') {
            if (!state.rankCleared && !state.waveTransitioning) {
              state.rankTimer += dt;
              callbacksRef.current.onUpdateRankTime?.(state.rankTimer);
            }
          }

          if (gameMode === 'BRAWL') {
            state.brawlTimer += dt;
            callbacksRef.current.onUpdateBrawlTime?.(state.brawlTimer);

            const getSpawnPosBrawl = () => {
              const side = Math.floor(Math.random() * 4);
              const margin = 50;
              if (side === 0) return { x: Math.random() * w, y: -margin }; // top
              if (side === 1) return { x: w + margin, y: Math.random() * h }; // right
              if (side === 2) return { x: Math.random() * w, y: h + margin }; // bottom
              return { x: -margin, y: Math.random() * h }; // left
            };

            const spawnBrawlSpecificEnemies = (enemyKeys: string[], count: number) => {
              enemyKeys.forEach((key) => {
                const def = ENEMY_DEFINITIONS[key];
                if (def) {
                  for (let i = 0; i < count; i++) {
                    const pos = getSpawnPosBrawl();
                    state.enemies.push({
                      uid: `${def.id}_${Date.now()}_${Math.random()}`,
                      type: def.id,
                      code: def.code,
                      name: def.name,
                      category: def.category,
                      isBoss: def.isBoss,
                      x: pos.x,
                      y: pos.y,
                      hp: def.hp,
                      maxHp: def.maxHp,
                      xp: def.xp,
                      speed: def.speed,
                      damage: def.damage,
                      radius: def.radius,
                      color: def.color,
                      abilityCooldown: 10,
                      abilityTimer: 0,
                      spawnTime: Date.now(),
                    });
                  }
                }
              });
            };

            // 1. Minute Spikes (Specific 10-count spawns)
            if (state.brawlTimer >= 60 && !state.brawlTriggered1Min) {
              state.brawlTriggered1Min = true;
              sound.playWarning();
              spawnBrawlSpecificEnemies(['3-1_UI_BUG', '3-6_STALKER_USER'], 10);
              callbacksRef.current.onTriggerNotification?.('🚨 1분 완료! 3-1 & 3-6 대참격 (각 10마리) 스폰!', '☠️', 'amber');
            }
            if (state.brawlTimer >= 120 && !state.brawlTriggered2Min) {
              state.brawlTriggered2Min = true;
              sound.playWarning();
              spawnBrawlSpecificEnemies(['3-2_LOGIC_BUG', '3-7_IMPERSONATOR_USER'], 10);
              callbacksRef.current.onTriggerNotification?.('🚨 2분 완료! 3-2 & 3-7 대참격 (각 10마리) 스폰!', '☠️', 'amber');
            }
            if (state.brawlTimer >= 180 && !state.brawlTriggered3Min) {
              state.brawlTriggered3Min = true;
              sound.playWarning();
              spawnBrawlSpecificEnemies(['3-3_SERVER_BUG', '3-8_AGGRESSIVE_USER'], 10);
              callbacksRef.current.onTriggerNotification?.('🚨 3분 완료! 3-3 & 3-8 대참격 (각 10마리) 스폰!', '☠️', 'purple');
            }
            if (state.brawlTimer >= 240 && !state.brawlTriggered4Min) {
              state.brawlTriggered4Min = true;
              sound.playWarning();
              spawnBrawlSpecificEnemies(['3-5_SECURITY_BUG', '3-9_SPAMMER_USER'], 10);
              callbacksRef.current.onTriggerNotification?.('🚨 4분 완료! 3-5 & 3-9 대참격 (각 10마리) 스폰!', '☠️', 'rose');
            }
            if (state.brawlTimer >= 300 && !state.brawlTriggered5Min) {
              state.brawlTriggered5Min = true;
              sound.playWarning();
              spawnBrawlSpecificEnemies(['3-4_DATA_BUG', '3-10_TROLL_USER'], 10);
              callbacksRef.current.onTriggerNotification?.('🚨 5분 완료! 3-4 & 3-10 대참격 (각 10마리) 스폰!', '☠️', 'pink');
            }

            // 2. Normal Continuous Minion Spawn (Only active below 6 mins)
            if (state.brawlTimer < 360) {
              state.brawlMinionSpawnTimer += dt;
              
              // Base spawn rate: starts at every 2.0 seconds, scaling down to every 0.6 seconds at 6 mins
              const progressRatio = Math.min(1, state.brawlTimer / 360);
              const currentSpawnCooldown = 2.0 - progressRatio * 1.4;
              
              if (state.brawlMinionSpawnTimer >= currentSpawnCooldown) {
                state.brawlMinionSpawnTimer = 0;
                
                // Spawn count: scales from 2 to 5 enemies per spawn wave
                const spawnCount = Math.floor(2 + progressRatio * 3);
                const minionKeys = ['11-1_BOT'];
                if (state.brawlTimer >= 60) {
                  minionKeys.push('3-1_UI_BUG');
                }
                if (state.brawlTimer >= 120) {
                  minionKeys.push('3-2_LOGIC_BUG');
                }
                if (state.brawlTimer >= 180) {
                  minionKeys.push('3-3_SERVER_BUG');
                }
                if (state.brawlTimer >= 240) {
                  minionKeys.push('3-5_SECURITY_BUG');
                }

                for (let i = 0; i < spawnCount; i++) {
                  const randomKey = minionKeys[Math.floor(Math.random() * minionKeys.length)];
                  const def = ENEMY_DEFINITIONS[randomKey];
                  if (def) {
                    const pos = getSpawnPosBrawl();
                    state.enemies.push({
                      uid: `${def.id}_${Date.now()}_${Math.random()}`,
                      type: def.id,
                      code: def.code,
                      name: def.name,
                      category: def.category,
                      isBoss: def.isBoss,
                      x: pos.x,
                      y: pos.y,
                      hp: def.hp,
                      maxHp: def.maxHp,
                      xp: def.xp,
                      speed: def.speed,
                      damage: def.damage,
                      radius: def.radius,
                      color: def.color,
                      abilityCooldown: 10,
                      abilityTimer: 0,
                      spawnTime: Date.now(),
                    });
                  }
                }
              }
            } else {
              // 3. 6 Minutes Completed -> Spawn Boss Alliance
              if (!state.brawlBossesSpawned) {
                state.brawlBossesSpawned = true;
                sound.playWarning();
                callbacksRef.current.onTriggerNotification?.('🚨 6분 완료! 보스 군단 총출동! 조무래기 침공 중단!', '☠️', 'rose');
                
                const bossKeys = [
                  '3-6_STALKER_USER',
                  '3-7_IMPERSONATOR_USER',
                  '3-8_AGGRESSIVE_USER',
                  '3-9_SPAMMER_USER',
                  '3-10_TROLL_USER',
                  '3-11_STARLIGHT_BOSS',
                ];

                bossKeys.forEach((bossKey, idx) => {
                  const angle = (Math.PI * 2 * idx) / bossKeys.length;
                  const borderDist = Math.max(w, h) * 0.55;
                  const spawnX = w / 2 + Math.cos(angle) * borderDist;
                  const spawnY = h / 2 + Math.sin(angle) * borderDist;
                  const clampedX = Math.max(50, Math.min(w - 50, spawnX));
                  const clampedY = Math.max(50, Math.min(h - 50, spawnY));

                  const def = ENEMY_DEFINITIONS[bossKey];
                  if (def) {
                    state.enemies.push({
                      uid: `${def.id}_${Date.now()}_${Math.random()}`,
                      type: def.id,
                      code: def.code,
                      name: def.name,
                      category: def.category,
                      isBoss: def.isBoss,
                      x: clampedX,
                      y: clampedY,
                      hp: def.hp * 1.5, // 1.5x Boss HP in Brawl Mode for high intensity!
                      maxHp: def.maxHp * 1.5,
                      xp: def.xp,
                      speed: def.speed,
                      damage: def.damage,
                      radius: def.radius,
                      color: def.color,
                      abilityCooldown: 10,
                      abilityTimer: 0,
                      spawnTime: Date.now(),
                    });
                  }
                });
              }
            }
          }

          // --- 5. ENEMIES AI & ABILITIES ---
          const isSpecialRuleOneDebuff = currentWave === 5; // Rule 9-5-2
          const applyDebuffSafe = (type: ActiveStatusEffect['type'], dur: number) => {
            if (isSpecialRuleOneDebuff && activeStatusEffects.length > 0) {
              return; // block second debuff in wave 5
            }
            callbacksRef.current.onAddStatusEffect(type, dur);
          };

          let currentBossName: string | undefined;
          let currentBossHp: number | undefined;
          let currentBossMaxHp: number | undefined;
          let currentBossCode: string | undefined;
          let currentBossPhase: number | undefined;
          const extraEnemiesToSpawn: EnemyEntity[] = [];

          state.enemies = state.enemies.filter((en) => {
            // 별빛(3-11)과 ERROR 보스만 상단 보스바로 표시
            if (en.code === '3-11' || en.code === 'ERROR') {
              currentBossName = en.name;
              currentBossHp = en.hp;
              currentBossMaxHp = en.maxHp;
              currentBossCode = en.code;
              if (en.code === '3-11') {
                const ratio = en.hp / en.maxHp;
                currentBossPhase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
              } else if (en.code === 'ERROR') {
                currentBossPhase = state.errorBossPhase || 1;
              }
            }

            // Clone expiration timer for 3-9 clones
            if (en.cloneExpireTimer !== undefined) {
              en.cloneExpireTimer -= dt;
              if (en.cloneExpireTimer <= 0) {
                return false;
              }
            }

            // Move towards hero
            const dx = hero.x - en.x;
            const dy = hero.y - en.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 5) {
              const baseMobSpeed = 60; // px/s
              const mobSpeed = baseMobSpeed * en.speed;
              en.x += (dx / dist) * mobSpeed * dt;
              en.y += (dy / dist) * mobSpeed * dt;
            }

            // Collision with hero -> deal damage (일반 몬스터만 몸통 충돌 피해, ERROR 보스는 120° 1칸 부채꼴 공격으로 타격)
            if (dist <= hero.radius + en.radius && en.code !== 'ERROR') {
              if (time - state.lastPlayerHitTime >= 800) {
                state.lastPlayerHitTime = time;
                takeDamageLocal(en.damage);
                sound.playHit();

                // 3-7 Impersonator ability: touching player disables control for 3s
                if (en.code === '3-7') {
                  applyDebuffSafe('CONTROL_DISABLED', 3);
                }
              }
            }

            // Periodic Abilities
            en.abilityTimer += dt;
            if (en.code === '3-1' && en.abilityTimer >= 10) {
              en.abilityTimer = 0;
              if (Math.random() < 0.05) {
                applyDebuffSafe('BLACKOUT', 5);
                callbacksRef.current.onPlayerTakeDamage(1);
              }
            } else if (en.code === '3-2' && en.abilityTimer >= 15) {
              en.abilityTimer = 0;
              if (Math.random() < 0.1) {
                applyDebuffSafe('DISABLE_ATTACK', 1);
              }
            } else if (en.code === '3-3' && en.abilityTimer >= 10) {
              en.abilityTimer = 0;
              if (Math.random() < 0.05) {
                sound.playWarning();
                state.voidZones.push({
                  uid: `void_${Date.now()}`,
                  x: Math.random() * (w - 120) + 60,
                  y: Math.random() * (h - 120) + 60,
                  radius: 45,
                  timer: 3,
                  isVoid: false,
                  voidDuration: 5,
                });
              }
            } else if (en.code === '3-4' && en.abilityTimer >= 20) {
              en.abilityTimer = 0;
              const timeSinceLastAttack = (Date.now() - state.lastPlayerAttackActionTime) / 1000;
              if (timeSinceLastAttack >= 10 && Math.random() < 0.01) {
                applyDebuffSafe('STAT_RESET', 10);
              }
            } else if (en.code === '3-5' && en.abilityTimer >= 20) {
              en.abilityTimer = 0;
              if (Math.random() < 0.01) {
                applyDebuffSafe('CONTROL_DISABLED', 5);
              }
            } else if (en.code === '3-9' && en.abilityTimer >= 10) {
              en.abilityTimer = 0;
              if (Math.random() < 0.05) {
                sound.playWarning();
                // Replicate into 10 copies around itself
                for (let c = 0; c < 10; c++) {
                  const angle = (Math.PI * 2 * c) / 10;
                  extraEnemiesToSpawn.push({
                    uid: `clone_${Date.now()}_${c}`,
                    type: '3-9_CLONE' as any,
                    code: '3-9_CLONE',
                    name: '도배 분신',
                    category: 'USER',
                    isBoss: false,
                    x: en.x + Math.cos(angle) * 35,
                    y: en.y + Math.sin(angle) * 35,
                    hp: 3,
                    maxHp: 3,
                    xp: 5,
                    speed: 0.85,
                    damage: 3,
                    radius: 16,
                    color: '#6366F1',
                    abilityCooldown: 99,
                    abilityTimer: 0,
                    spawnTime: Date.now(),
                    cloneExpireTimer: 15,
                  });
                }
              }
            } else if (en.code === '3-10' && en.abilityTimer >= 10) {
              en.abilityTimer = 0;
              if (Math.random() < 0.1) {
                const angleToBoss = Math.atan2(en.y - hero.y, en.x - hero.x);
                let diff = angleToBoss - hero.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                if (Math.abs(diff) <= Math.PI / 3) {
                  applyDebuffSafe('BLACKOUT', 3);
                }
              }
            } else if (en.code === '3-11') {
              // 3-11 보스전: 별빛 체력 150 기준 페이즈 분기
              
              // 15초에 한번 10마리의 조무래기(11-1) 소환 (모든 페이즈 지속적으로, 랭크 모드는 보스 1:1전이므로 소환 안함)
              state.bossSummonTimer += dt;
              if (gameMode !== 'RANK' && state.bossSummonTimer >= 15) {
                state.bossSummonTimer = 0;
                const botDef = ENEMY_DEFINITIONS['11-1_BOT'];
                if (botDef) {
                  sound.playWarning();
                  for (let i = 0; i < 10; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 60 + Math.random() * 50; // 보스 주변 60 ~ 110픽셀 범위
                    const spawnX = en.x + Math.cos(angle) * dist;
                    const spawnY = en.y + Math.sin(angle) * dist;
                    
                    const clampedX = Math.max(20, Math.min(w - 20, spawnX));
                    const clampedY = Math.max(20, Math.min(h - 20, spawnY));

                    extraEnemiesToSpawn.push({
                      uid: `boss_summon_${botDef.id}_${Date.now()}_${Math.random()}`,
                      type: botDef.id,
                      code: botDef.code,
                      name: botDef.name,
                      category: botDef.category,
                      isBoss: false,
                      x: clampedX,
                      y: clampedY,
                      hp: botDef.hp,
                      maxHp: botDef.maxHp,
                      xp: botDef.xp,
                      speed: botDef.speed,
                      damage: botDef.damage,
                      radius: botDef.radius,
                      color: botDef.color,
                      abilityCooldown: 10,
                      abilityTimer: 0,
                      spawnTime: Date.now(),
                    });

                    // 소환 이펙트 텍스트 띄우기
                    state.effects.push({
                      uid: `summon_txt_${Date.now()}_${Math.random()}`,
                      x: clampedX,
                      y: clampedY - 10,
                      type: 'TEXT',
                      text: '소환!',
                      color: '#94A3B8',
                      duration: 0.8,
                      maxDuration: 0.8,
                    });
                  }
                }
              }

              const hpRatio = en.hp / en.maxHp;

              if (hpRatio > 0.66) {
                // 1 페이즈: 7초에 한번 랜덤한 구역 5개에 5데미지
                state.bossPhase1Timer += dt;
                if (state.bossPhase1Timer >= 7) {
                  state.bossPhase1Timer = 0;
                  sound.playWarning();
                  for (let i = 0; i < 5; i++) {
                    state.starlightExplosions.push({
                      x: Math.random() * (w - 140) + 70,
                      y: Math.random() * (h - 140) + 70,
                      delay: 1.5,
                      maxDelay: 1.5,
                      triggered: false,
                    });
                  }
                }
              } else if (hpRatio > 0.33) {
                // 2 페이즈: 8초에 한번 별빛 주변 반지름 8칸을 폭파시킴 / 10데미지
                state.bossPhase2Timer += dt;
                if (state.bossPhase2Timer >= 8) {
                  state.bossPhase2Timer = 0;
                  state.bossPhase2ExplodeWarning = true;
                  state.bossPhase2WarningTimer = 1.6;
                  sound.playWarning();
                }

                if (state.bossPhase2ExplodeWarning) {
                  state.bossPhase2WarningTimer -= dt;
                  if (state.bossPhase2WarningTimer <= 0) {
                    state.bossPhase2ExplodeWarning = false;
                    sound.playExplosion();
                    state.effects.push({
                      uid: `boss_p2_exp_${Date.now()}`,
                      x: en.x,
                      y: en.y,
                      type: 'EXPLOSION',
                      radius: 192,
                      color: '#EF4444',
                      duration: 0.5,
                      maxDuration: 0.5,
                    });
                    const distToHero = Math.hypot(hero.x - en.x, hero.y - en.y);
                    if (distToHero <= 192 + hero.radius) {
                      callbacksRef.current.onPlayerTakeDamage(10);
                    }
                  }
                }
              } else {
                // 3 페이즈: 지속적으로 주변에 많은 원형톱날이 빈틈없이 지나가며 닿으면 7데미지 / 9초에 한번 3초간 톱날이 없어짐
                state.bossPhase3Timer += dt;
                if (state.bossPhase3Active) {
                  if (state.bossPhase3Timer >= 9) {
                    state.bossPhase3Timer = 0;
                    state.bossPhase3Active = false;
                  }

                  // 톱날 충돌 범위 검사 (회전 반경 144px, 개별 톱날 반지름 3px)
                  const distToHero = Math.hypot(hero.x - en.x, hero.y - en.y);
                  if (distToHero >= 141 - hero.radius && distToHero <= 147 + hero.radius) {
                    // 개별 12개 회전톱날 위치에 대해 정확하게 충돌 검사
                    const rotOffset = time / 150;
                    const numBlades = 12;
                    let hit = false;
                    for (let i = 0; i < numBlades; i++) {
                      const angle = (Math.PI * 2 * i) / numBlades + rotOffset;
                      const bx = en.x + Math.cos(angle) * 144;
                      const by = en.y + Math.sin(angle) * 144;
                      const d = Math.hypot(hero.x - bx, hero.y - by);
                      if (d <= 3 + hero.radius) {
                        hit = true;
                        break;
                      }
                    }
                    if (hit) {
                      if (time - state.lastPlayerHitTime >= 600) {
                        state.lastPlayerHitTime = time;
                        callbacksRef.current.onPlayerTakeDamage(7);
                        sound.playHit();
                      }
                    }
                  }
                } else {
                  if (state.bossPhase3Timer >= 3) {
                    state.bossPhase3Timer = 0;
                    state.bossPhase3Active = true;
                  }
                }
              }
            } else if (en.code === 'ERROR') {
              // ERROR 보스: 1000 체력 기반 5단계 페이즈 판정
              const hp = en.hp;
              let phase = 1;
              if (hp > 800) {
                phase = 1;
              } else if (hp > 600) {
                phase = 2;
              } else if (hp > 400) {
                phase = 3;
              } else if (hp > 200) {
                phase = 4;
              } else {
                phase = 5;
              }
              state.errorBossPhase = phase;
              currentBossName = `ERROR [Phase ${phase}] (체력: ${Math.max(0, Math.ceil(en.hp))}/1000)`;
              currentBossHp = Math.max(0, en.hp);
              currentBossMaxHp = en.maxHp;

              // ERROR 보스 120° 2칸 부채꼴 공격 메커니즘
              state.errorBossAttackCooldown -= dt;
              const distToHero = Math.hypot(hero.x - en.x, hero.y - en.y);
              const twoTileReach = en.radius + 80; // 2칸 사거리 (gridSize 40px * 2 = 80px)

              // 사거리 내 접근 시 120° 부채꼴 공격 실행
              if (state.errorBossAttackCooldown <= 0 && distToHero <= twoTileReach + hero.radius + 15) {
                state.errorBossAttackCooldown = phase === 5 ? 0.9 : 1.25;
                const attackAngle = Math.atan2(hero.y - en.y, hero.x - en.x);
                sound.playSlash();

                // 공격 시 공격 범위 시각화 (120° 2칸 붉은색 부채꼴)
                state.effects.push({
                  uid: `error_slash_${Date.now()}_${Math.random()}`,
                  x: en.x,
                  y: en.y,
                  type: 'SLASH',
                  radius: twoTileReach,
                  angle: attackAngle,
                  arcAngle: (120 * Math.PI) / 180, // 120도 부채꼴
                  color: '#EF4444',
                  duration: 0.28,
                  maxDuration: 0.28,
                });

                // 타격 판정 (거리 2칸 & 120도 부채꼴 범위)
                if (distToHero <= twoTileReach + hero.radius) {
                  const angleToHero = Math.atan2(hero.y - en.y, hero.x - en.x);
                  const diff = Math.abs((angleToHero - attackAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI);
                  if (diff <= (60 * Math.PI) / 180) { // 60도 (총 120도)
                    if (!state.isDashing) {
                      takeDamageLocal(en.damage);
                      sound.playHit();
                      if (phase === 1) {
                        applyDebuffSafe('CONTROL_DISABLED', 2);
                        state.effects.push({
                          uid: `stun_txt_${Date.now()}`,
                          x: hero.x,
                          y: hero.y - 25,
                          type: 'TEXT',
                          text: '💫 2초 기절! (ERROR 피격)',
                          color: '#EF4444',
                          duration: 1.0,
                          maxDuration: 1.0,
                        });
                      }
                    }
                  }
                }
              }

              // 1페이즈 (1000-801): 부채꼴 피격 시 2초 기절

              // 2페이즈 (800-601): 7초 간격으로 무작위 5개 구역 소멸
              if (phase === 2) {
                state.errorBossTimer += dt;
                if (state.errorBossTimer >= 7.0) {
                  state.errorBossTimer = 0;
                  sound.playWarning();
                  callbacksRef.current.onTriggerNotification?.('⚠️ [ERROR 2페이즈] 5개 구역 소멸 가동!', '💥', 'rose');
                  for (let i = 0; i < 5; i++) {
                    state.errorBossVanishZones.push({
                      x: Math.random() * (w - 180) + 90,
                      y: Math.random() * (h - 180) + 90,
                      radius: 54,
                      warningTimer: 1.8,
                      activeTimer: 5.0,
                    });
                  }
                }
              }

              // 3페이즈 (600-401): 9초 간격 3초 투명화, 받는 피해 감소, 공격력 증가
              if (phase === 3) {
                state.errorBossTimer += dt;
                if (state.errorBossTimer >= 9.0) {
                  state.errorBossTimer = 0;
                  state.errorBossInvisible = true;
                  state.errorBossInvisTimer = 3.0;
                  en.damage = 12; // 50% 공격력 증가
                  sound.playWarning();
                  callbacksRef.current.onTriggerNotification?.('👻 [ERROR 3페이즈] 3초 투명화 & 피해 50% 감소 & 공격력 증가!', '👁️', 'purple');
                }
              }

              // 4페이즈 (400-201): 7초 간격 4초 투명화, 받는 피해 대폭 감소, 공격력 증가
              if (phase === 4) {
                state.errorBossTimer += dt;
                if (state.errorBossTimer >= 7.0) {
                  state.errorBossTimer = 0;
                  state.errorBossInvisible = true;
                  state.errorBossInvisTimer = 4.0;
                  en.damage = 16; // 100% 공격력 증가
                  sound.playWarning();
                  callbacksRef.current.onTriggerNotification?.('💀 [ERROR 4페이즈] 4초 은신 & 피해 75% 감소 & 공격력 대폭 증폭!', '⚠️', 'rose');
                }
              }

              // 투명화 타이머 처리
              if (state.errorBossInvisTimer > 0) {
                state.errorBossInvisTimer -= dt;
                if (state.errorBossInvisTimer <= 0) {
                  state.errorBossInvisible = false;
                  if (phase !== 5) en.damage = 8;
                }
              }

              // 5페이즈 (200-1): 5초 간격 3초 투명화, 6칸 이내 순간이동, 3연타 공격, 6초 딜레이
              if (phase === 5) {
                if (state.errorBossCycleDelayTimer > 0) {
                  state.errorBossCycleDelayTimer -= dt;
                } else {
                  state.errorBossTimer += dt;
                  if (state.errorBossTimer >= 5.0) {
                    state.errorBossTimer = 0;
                    state.errorBossInvisible = true;
                    state.errorBossInvisTimer = 3.0;

                    // 6칸 (약 180~240px) 이내 순간이동
                    const teleportAngle = Math.random() * Math.PI * 2;
                    const teleportDist = 70 + Math.random() * 140;
                    en.x = Math.max(50, Math.min(w - 50, hero.x + Math.cos(teleportAngle) * teleportDist));
                    en.y = Math.max(50, Math.min(h - 50, hero.y + Math.sin(teleportAngle) * teleportDist));

                    sound.playWarning();
                    state.effects.push({
                      uid: `teleport_glitch_${Date.now()}`,
                      x: en.x,
                      y: en.y,
                      type: 'EXPLOSION',
                      radius: 65,
                      color: '#DC2626',
                      duration: 0.6,
                      maxDuration: 0.6,
                    });

                    state.errorBossTeleportComboCount = 3;
                    state.errorBossComboTimer = 0.3;
                    state.errorBossCycleDelayTimer = 6.0; // 6초 딜레이
                    callbacksRef.current.onTriggerNotification?.('⚡ [ERROR 5페이즈] 6칸 순간이동 & 3연타 폭주 공격!', '☠️', 'rose');
                  }
                }

                // 3연타 공격 진행 (120° 2칸 부채꼴)
                if (state.errorBossTeleportComboCount > 0) {
                  state.errorBossComboTimer -= dt;
                  if (state.errorBossComboTimer <= 0) {
                    state.errorBossTeleportComboCount--;
                    state.errorBossComboTimer = 0.45;

                    const strikeAngle = Math.atan2(hero.y - en.y, hero.x - en.x);
                    const twoTileReach = en.radius + 80; // 2칸 사거리
                    sound.playSlash();

                    state.effects.push({
                      uid: `combo_slash_${Date.now()}_${state.errorBossTeleportComboCount}`,
                      x: en.x,
                      y: en.y,
                      type: 'SLASH',
                      radius: twoTileReach,
                      angle: strikeAngle,
                      arcAngle: (120 * Math.PI) / 180, // 120도
                      color: '#DC2626',
                      duration: 0.3,
                      maxDuration: 0.3,
                    });

                    const distHero = Math.hypot(hero.x - en.x, hero.y - en.y);
                    const angleToHero = Math.atan2(hero.y - en.y, hero.x - en.x);
                    const diff = Math.abs((angleToHero - strikeAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI);

                    if (distHero <= twoTileReach + hero.radius && diff <= (60 * Math.PI) / 180 && !state.isDashing) {
                      takeDamageLocal(7);
                      sound.playHit();
                    }
                  }
                }
              }
            }

            // Check if killed
            if (en.hp <= 0) {
              callbacksRef.current.onEnemyKilled(en);

              // 보스 처치 즉시 완료 처리 (별빛 또는 하드코어 ERROR)
              if (en.code === '3-11') {
                state.starlightExplosions = [];
                state.projectiles = [];
                state.voidZones = [];
                if (gameMode === 'RANK') {
                  if (!state.rankCleared) {
                    state.rankCleared = true;
                    state.waveTransitioning = true;
                    callbacksRef.current.onRankCleared?.(state.rankTimer);
                    callbacksRef.current.onWaveClear();
                  }
                } else if (currentWave >= 6) {
                  // 스토리 모드 6웨이브: 최종 보스 별빛 처치 시 잔여 소환 몹 일괄 소멸 및 즉시 최종 승리!
                  state.enemies = [];
                  state.waveTransitioning = true;
                  callbacksRef.current.onWaveClear();
                }
              } else if (en.code === 'ERROR' && gameMode === 'HARDCORE') {
                state.projectiles = [];
                state.errorBossVanishZones = [];
                state.waveTransitioning = true;
                callbacksRef.current.onWaveClear();
              }

              return false;
            }
            return true;
          });

          if (extraEnemiesToSpawn.length > 0) {
            state.enemies.push(...extraEnemiesToSpawn);
          }

          // ERROR Boss Phase 2: 소멸 구역 시뮬레이션
          state.errorBossVanishZones = state.errorBossVanishZones.filter((vz) => {
            if (vz.warningTimer > 0) {
              vz.warningTimer -= dt;
              return true;
            }
            vz.activeTimer -= dt;
            if (vz.activeTimer > 0) {
              const distToHero = Math.hypot(hero.x - vz.x, hero.y - vz.y);
              if (distToHero <= vz.radius + hero.radius && !state.isDashing) {
                if (time - state.lastPlayerHitTime >= 500) {
                  state.lastPlayerHitTime = time;
                  takeDamageLocal(4);
                  sound.playHit();
                  state.effects.push({
                    uid: `vz_dmg_${Date.now()}`,
                    x: hero.x,
                    y: hero.y - 20,
                    type: 'TEXT',
                    text: '💥 구역 소멸 피해 (-4)',
                    color: '#DC2626',
                    duration: 0.6,
                    maxDuration: 0.6,
                  });
                }
              }
              return true;
            }
            return false;
          });

          // 대시 상태 및 쿨다운 업데이트
          if (state.dashDurationTimer > 0) {
            state.dashDurationTimer -= dt;
            if (state.dashDurationTimer <= 0) {
              state.isDashing = false;
            }
          }
          if (state.dashCooldownTimer > 0) {
            state.dashCooldownTimer = Math.max(0, state.dashCooldownTimer - dt);
            callbacksRef.current.onUpdateDashCooldown?.(state.dashCooldownTimer, state.dashCooldownTotal);
          }

          // 대시 잔상 서서히 사라짐
          state.dashTrail = state.dashTrail.filter((t) => {
            t.alpha -= dt * 2.5;
            return t.alpha > 0;
          });

          callbacksRef.current.onUpdateBossStatus(
            currentBossName,
            currentBossHp,
            currentBossMaxHp,
            currentBossCode,
            currentBossPhase
          );

          // Check if Wave cleared! (All enemies dead or all Bosses and target Bugs cleared)
          if (gameMode === 'BRAWL') {
            if (state.brawlBossesSpawned && state.enemies.filter((e) => e.isBoss).length === 0 && !state.waveTransitioning) {
              state.waveTransitioning = true;
              callbacksRef.current.onWaveClear();
            }
          } else if (gameMode === 'HARDCORE') {
            const errorBoss = state.enemies.find((e) => e.code === 'ERROR');
            if (!errorBoss && !state.waveTransitioning) {
              state.waveTransitioning = true;
              callbacksRef.current.onWaveClear();
            }
          } else if (gameMode === 'RANK') {
            const starlightBoss = state.enemies.find((e) => e.code === '3-11');
            if (!starlightBoss && !state.waveTransitioning && !state.rankCleared) {
              state.rankCleared = true;
              state.waveTransitioning = true;
              callbacksRef.current.onRankCleared?.(state.rankTimer);
              callbacksRef.current.onWaveClear();
            }
          } else if (currentWave >= 6) {
            // 스토리 모드 6웨이브 별빛 보스전 클리어 폴백
            const starlightBoss = state.enemies.find((e) => e.code === '3-11');
            if (!starlightBoss && !state.waveTransitioning) {
              state.enemies = [];
              state.projectiles = [];
              state.voidZones = [];
              state.starlightExplosions = [];
              state.waveTransitioning = true;
              callbacksRef.current.onWaveClear();
            }
          } else {
            if (state.enemies.length === 0 && !state.waveTransitioning) {
              state.waveTransitioning = true;
              callbacksRef.current.onWaveClear();
            }
          }

          // Throttled basic attack cooldown state update (every 100ms)
          const nowMs = Date.now();
          if (nowMs - lastCdEmitRef.current >= 100) {
            lastCdEmitRef.current = nowMs;
            const attackCdMs = 1000 / stats.attackSpeed;
            const attackElapsed = time - state.lastAttackTime;
            const remainingSec = Math.max(0, (attackCdMs - attackElapsed) / 1000);
            if (remainingSec > 0 || lastRemainingSecRef.current > 0) {
              callbacksRef.current.onUpdateAttackCooldown?.(remainingSec, attackCdMs / 1000);
              lastRemainingSecRef.current = remainingSec;
            }
          }

          // --- 6. VISUAL EFFECTS SIMULATION ---
          if (state.errorBossHitFlashTimer > 0) {
            state.errorBossHitFlashTimer = Math.max(0, state.errorBossHitFlashTimer - dt);
          }
          if ((state.screenShake || 0) > 0) {
            state.screenShake = Math.max(0, (state.screenShake || 0) - dt * 25);
          }
          state.enemies.forEach((en) => {
            if ((en.hitFlashTimer || 0) > 0) {
              en.hitFlashTimer = Math.max(0, (en.hitFlashTimer || 0) - dt);
            }
          });

          state.effects = state.effects.filter((ef) => {
            ef.duration -= dt;
            if (ef.particles && ef.particles.length > 0) {
              ef.particles.forEach((p) => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
              });
              ef.particles = ef.particles.filter((p) => p.life > 0);
            }
            return ef.duration > 0;
          });

          // --- 7. RENDERING ---
          ctx.clearRect(0, 0, w, h);

          // 카메라 스크린 셰이크(타격감 연출)
          const shakeMag = state.screenShake || 0;
          const shakeX = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
          const shakeY = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
          ctx.save();
          if (shakeMag > 0) {
            ctx.translate(shakeX, shakeY);
          }

          // Draw Arena Floor Tiles
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1;
          const gridSize = 40;
          for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Draw Void Zones
          state.voidZones.forEach((vz) => {
            ctx.save();
            if (!vz.isVoid) {
              // Blinking warning
              ctx.beginPath();
              ctx.arc(vz.x, vz.y, vz.radius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + 0.3 * Math.sin(time / 80)})`;
              ctx.fill();
              ctx.strokeStyle = '#EF4444';
              ctx.lineWidth = 3;
              ctx.setLineDash([6, 6]);
              ctx.stroke();
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(`⚠️ 공허 장판 (${vz.timer.toFixed(1)}s)`, vz.x, vz.y);
            } else {
              // Active Void (Instant Death Hole)
              const grad = ctx.createRadialGradient(vz.x, vz.y, 5, vz.x, vz.y, vz.radius);
              grad.addColorStop(0, '#000000');
              grad.addColorStop(0.6, '#581C87');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.beginPath();
              ctx.arc(vz.x, vz.y, vz.radius, 0, Math.PI * 2);
              ctx.fillStyle = grad;
              ctx.fill();
              ctx.strokeStyle = '#A855F7';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            ctx.restore();
          });

          // Draw ERROR Boss Vanish Zones (Phase 2)
          state.errorBossVanishZones.forEach((vz) => {
            ctx.save();
            if (vz.warningTimer > 0) {
              // Warning pulse ring
              ctx.beginPath();
              ctx.arc(vz.x, vz.y, vz.radius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + 0.15 * Math.sin(time / 60)})`;
              ctx.fill();
              ctx.strokeStyle = '#EF4444';
              ctx.lineWidth = 3;
              ctx.setLineDash([6, 6]);
              ctx.stroke();

              ctx.fillStyle = '#EF4444';
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('⚠️ 구역 소멸 경고', vz.x, vz.y + 4);
            } else if (vz.activeTimer > 0) {
              // Collapsing active void hole with digital glitch styling
              const grad = ctx.createRadialGradient(vz.x, vz.y, 4, vz.x, vz.y, vz.radius);
              grad.addColorStop(0, '#000000');
              grad.addColorStop(0.7, '#881337');
              grad.addColorStop(1, 'rgba(225, 29, 72, 0)');
              ctx.beginPath();
              ctx.arc(vz.x, vz.y, vz.radius, 0, Math.PI * 2);
              ctx.fillStyle = grad;
              ctx.fill();
              ctx.strokeStyle = '#F43F5E';
              ctx.lineWidth = 2.5;
              ctx.stroke();

              ctx.fillStyle = '#F43F5E';
              ctx.font = 'bold 10px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('[VANISH ZONE]', vz.x, vz.y + 4);
            }
            ctx.restore();
          });

          // Draw Starlight Boss Phase 1 Explosion Warnings
          state.starlightExplosions.forEach((exp) => {
            if (exp.delay > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(exp.x, exp.y, 50, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(234, 179, 8, ${0.1 + 0.15 * Math.sin(time / 60)})`;
              ctx.fill();
              ctx.strokeStyle = '#EAB308';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([5, 5]);
              ctx.stroke();

              // Draw countdown progress line inside warning circle
              const progressRatio = exp.delay / exp.maxDelay;
              ctx.beginPath();
              ctx.arc(exp.x, exp.y, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progressRatio);
              ctx.strokeStyle = '#EAB308';
              ctx.lineWidth = 3;
              ctx.stroke();

              // Warning label
              ctx.fillStyle = '#EAB308';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('⚡ ⚠️', exp.x, exp.y + 3);
              ctx.restore();
            }
          });

          // Draw Projectiles
          state.projectiles.forEach((p) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (p.type === 'DAGGER') {
              const angle = Math.atan2(p.vy, p.vx);
              ctx.rotate(angle);
              
              // Draw a sharp dagger shape pointing right (0 radians)
              ctx.beginPath();
              // Blade
              ctx.moveTo(12, 0);
              ctx.lineTo(0, -3);
              ctx.lineTo(-4, -2);
              ctx.lineTo(-4, 2);
              ctx.lineTo(0, 3);
              ctx.closePath();
              ctx.fillStyle = '#F1F5F9'; // silver blade
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 12;
              ctx.fill();
              
              // Guard
              ctx.beginPath();
              ctx.rect(-5, -5, 1.5, 10);
              ctx.fillStyle = '#EAB308'; // golden guard
              ctx.fill();
              
              // Hilt
              ctx.beginPath();
              ctx.rect(-10, -1.5, 5, 3);
              ctx.fillStyle = '#475569'; // slate-600 hilt
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 10;
              ctx.fill();
            }
            ctx.restore();
          });

          // Draw Enemies
          state.enemies.forEach((en) => {
            ctx.save();
            ctx.translate(en.x, en.y);

            // ERROR 보스 은폐(스텔스) 상태 처리:
            // 테두리도 전혀 안 보이게 해서 아예 어디 있는지 모르게 완전 은폐
            // 피격 시에만 형체만 붉은 색으로 점멸하며 0.1초간 보이게 처리
            if (en.code === 'ERROR' && state.errorBossInvisible) {
              if (state.errorBossHitFlashTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
                ctx.shadowColor = '#EF4444';
                ctx.shadowBlur = 15;
                ctx.fill();
              }
              ctx.restore();
              return;
            }

            // Boss glowing circle
            if (en.isBoss) {
              ctx.beginPath();
              ctx.arc(0, 0, en.radius + 6, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
              ctx.lineWidth = 3;
              ctx.stroke();
            }

            // Starlight Boss rendering special overlays (Phase 2 & 3 indicators)
            if (en.code === '3-11') {
              const hpRatio = en.hp / en.maxHp;

              // 2 Phase Warning: Big red warning zone around boss
              if (hpRatio <= 0.66 && hpRatio > 0.33 && state.bossPhase2ExplodeWarning) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, 192, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + 0.15 * Math.sin(time / 50)})`;
                ctx.fill();
                ctx.strokeStyle = '#EF4444';
                ctx.lineWidth = 4;
                ctx.setLineDash([8, 6]);
                ctx.stroke();
                ctx.restore();
              }

              // 3 Phase Rotating Sawblades around boss (Radius: 144px, Blade Radius: 3px)
              if (hpRatio <= 0.33) {
                ctx.save();
                const numBlades = 12;
                const active = state.bossPhase3Active;
                const rotOffset = time / 150; // rotation over time

                for (let i = 0; i < numBlades; i++) {
                  const angle = (Math.PI * 2 * i) / numBlades + rotOffset;
                  const bx = Math.cos(angle) * 144;
                  const by = Math.sin(angle) * 144;

                  ctx.beginPath();
                  ctx.arc(bx, by, 3, 0, Math.PI * 2);
                  if (active) {
                    ctx.fillStyle = '#EF4444'; // Red hot sawblades
                    ctx.shadowColor = '#EF4444';
                    ctx.shadowBlur = 4;
                  } else {
                    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'; // Deactivated gray sawblades
                    ctx.shadowBlur = 0;
                  }
                  ctx.fill();
                  ctx.strokeStyle = active ? '#FCA5A5' : '#475569';
                  ctx.lineWidth = 1;
                  ctx.stroke();

                  // Draw inner teeth of sawblade
                  ctx.beginPath();
                  ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
                  ctx.fillStyle = '#000000';
                  ctx.fill();
                }
                ctx.restore();
              }
            } else if (en.code === 'ERROR') {
              // 글리치 디지털 큐브 파편 회전
              const cubeCount = 4;
              for (let ci = 0; ci < cubeCount; ci++) {
                const cAngle = (Math.PI * 2 * ci) / cubeCount + (time / 300);
                const cx = Math.cos(cAngle) * (en.radius + 14);
                const cy = Math.sin(cAngle) * (en.radius + 14);
                ctx.fillStyle = '#F43F5E';
                ctx.fillRect(cx - 3, cy - 3, 6, 6);
              }
            }

            // Body
            ctx.beginPath();
            ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
            ctx.fillStyle = en.color;
            ctx.shadowColor = en.color;
            ctx.shadowBlur = en.isBoss ? 15 : 5;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Hit Flash silhouette (타격 피격 시 붉은색/백열 섬광 점멸)
            if (en.hitFlashTimer && en.hitFlashTimer > 0) {
              const flashAlpha = Math.min(1, en.hitFlashTimer / 0.16);
              ctx.beginPath();
              ctx.arc(0, 0, en.radius + 2, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.85})`;
              ctx.shadowColor = '#EF4444';
              ctx.shadowBlur = 16;
              ctx.fill();
              ctx.strokeStyle = `rgba(239, 68, 68, ${flashAlpha})`;
              ctx.lineWidth = 3;
              ctx.stroke();
            }

            // Label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px font-mono';
            ctx.textAlign = 'center';
            ctx.fillText(`[${en.code}]`, 0, 4);

            // Health Bar (Unified continuous bar with phase divider notches)
            if (en.code === '3-11') {
              // Starlight Boss: Unified connected bar with 2 dividing notch lines at 33.3% and 66.6%
              const barW = Math.max(en.radius * 2.2, 54);
              const barH = 5;
              const startX = -barW / 2;
              const barY = -en.radius - 12;
              const hpRatio = Math.max(0, Math.min(1, en.hp / en.maxHp));

              // Background
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(startX, barY, barW, barH);

              // Single continuous fill (depletes from right to left)
              if (hpRatio > 0) {
                ctx.fillStyle = '#F59E0B'; // radiant amber
                ctx.fillRect(startX, barY, barW * hpRatio, barH);
              }

              // Outer border
              ctx.strokeStyle = '#FBBF24';
              ctx.lineWidth = 1;
              ctx.strokeRect(startX, barY, barW, barH);

              // 2 Prominent vertical divider lines at 1/3 and 2/3
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(startX + barW * (1 / 3), barY);
              ctx.lineTo(startX + barW * (1 / 3), barY + barH);
              ctx.moveTo(startX + barW * (2 / 3), barY);
              ctx.lineTo(startX + barW * (2 / 3), barY + barH);
              ctx.stroke();
            } else if (en.code === 'ERROR') {
              // ERROR Boss: Unified connected bar with 4 dividing notch lines
              const barW = Math.max(en.radius * 2.4, 60);
              const barH = 5;
              const startX = -barW / 2;
              const barY = -en.radius - 12;
              const hpRatio = Math.max(0, Math.min(1, en.hp / en.maxHp));

              // Background
              ctx.fillStyle = '#000000';
              ctx.fillRect(startX, barY, barW, barH);

              // Single continuous fill (depletes from right to left)
              if (hpRatio > 0) {
                ctx.fillStyle = '#EF4444'; // glitch red
                ctx.fillRect(startX, barY, barW * hpRatio, barH);
              }

              // Outer border
              ctx.strokeStyle = '#06B6D4';
              ctx.lineWidth = 1;
              ctx.strokeRect(startX, barY, barW, barH);

              // 4 vertical divider notch lines at 20%, 40%, 60%, 80%
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              [0.2, 0.4, 0.6, 0.8].forEach((r) => {
                ctx.moveTo(startX + barW * r, barY);
                ctx.lineTo(startX + barW * r, barY + barH);
              });
              ctx.stroke();
            } else {
              // Standard Enemy Health Bar
              const barW = en.radius * 2;
              const barH = 4;
              ctx.fillStyle = '#334155';
              ctx.fillRect(-barW / 2, -en.radius - 10, barW, barH);
              ctx.fillStyle = en.isBoss ? '#EF4444' : '#10B981';
              ctx.fillRect(-barW / 2, -en.radius - 10, barW * Math.max(0, en.hp / en.maxHp), barH);
            }

            ctx.restore();
          });

          // Draw Dash Ghost Trail
          state.dashTrail.forEach((t) => {
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.angle);
            ctx.globalAlpha = t.alpha;
            ctx.beginPath();
            ctx.arc(0, 0, hero.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#38BDF8';
            ctx.shadowColor = '#0284C7';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
          });

          // Draw Player Hero (용사)
          ctx.save();
          ctx.translate(hero.x, hero.y);

          // Dash Invulnerability Aura
          if (state.isDashing || state.dashDurationTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, hero.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#0EA5E9';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Draw Shield ring if active
          const drawShieldSkill = acquiredSkills.find((s) => s.definition.code === '10-11');
          if (drawShieldSkill && state.shieldHp !== undefined && state.shieldHp > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, hero.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#60A5FA';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#3B82F6';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
          }

          // Basic Attack Cooldown Visual Ring/Bar (Upright, not rotated)
          const attackCdMs = 1000 / stats.attackSpeed;
          const attackElapsed = time - state.lastAttackTime;
          const attackCdRatio = attackElapsed / attackCdMs; // 0 to 1

          if (attackCdRatio < 1.0) {
            // Draw a subtle outer cooldown track
            ctx.beginPath();
            ctx.arc(0, 0, hero.radius + 7, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw the progress arc
            ctx.beginPath();
            ctx.arc(0, 0, hero.radius + 7, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * attackCdRatio));
            ctx.strokeStyle = CLASS_BASE_STATS[playerClass].color || '#F59E0B'; // Use class color
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Draw a tiny text indicator if cooldown is long
            if (attackCdMs >= 1500) {
              const remainingSecs = Math.max(0, (attackCdMs - attackElapsed) / 1000);
              if (remainingSecs > 0.1) {
                ctx.save();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 9px monospace, sans-serif';
                ctx.textAlign = 'center';
                
                const txt = `${remainingSecs.toFixed(1)}s`;
                const textWidth = ctx.measureText(txt).width;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                ctx.fillRect(-textWidth/2 - 3, -hero.radius - 23, textWidth + 6, 12);
                
                ctx.fillStyle = '#FBBF24'; // amber-400
                ctx.fillText(txt, 0, -hero.radius - 14);
                ctx.restore();
              }
            }
          }

          // Attack Range Guide Ring
          ctx.beginPath();
          ctx.arc(0, 0, finalRange, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.18)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          // Revival Ghost Aura if active
          const isRevivalGhost = activeStatusEffects.some((e) => e.type === 'REVIVAL_GHOST');
          if (isRevivalGhost) {
            ctx.beginPath();
            ctx.arc(0, 0, hero.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#EC4899';
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          // Draw Player Hero (용사)
          const currentClassConfig = CLASS_BASE_STATS[playerClass] || CLASS_BASE_STATS.ASSASSIN;
          const heroColor = currentClassConfig.color;
          const heroSecColor = currentClassConfig.secondaryColor;

          // Player Body
          ctx.beginPath();
          ctx.arc(0, 0, hero.radius, 0, Math.PI * 2);
          ctx.fillStyle = isRevivalGhost ? 'rgba(244, 114, 182, 0.7)' : heroColor;
          ctx.shadowColor = heroColor;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Player Hero Armor & Headgear (Class-specific visual identity)
          ctx.rotate(hero.angle);

          if (playerClass === 'ASSASSIN') {
            // 암살자: 날카로운 후드와 전방을 겨눈 쌍단검
            ctx.beginPath();
            ctx.moveTo(-4, -7);
            ctx.lineTo(14, 0);
            ctx.lineTo(-4, 7);
            ctx.closePath();
            ctx.fillStyle = '#4C0519'; // dark rose hood
            ctx.fill();
            ctx.strokeStyle = heroSecColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Twin Daggers
            ctx.fillStyle = '#FDA4AF';
            ctx.fillRect(8, -8, 12, 2.5);
            ctx.fillRect(8, 5.5, 12, 2.5);
          } else if (playerClass === 'TANKER') {
            // 탱커: 중무장 투구와 전방 방패
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#312E81'; // dark indigo
            ctx.fill();

            // Heavy Front Shield Arc
            ctx.beginPath();
            ctx.arc(10, 0, 11, -Math.PI / 3, Math.PI / 3);
            ctx.strokeStyle = '#C7D2FE';
            ctx.lineWidth = 4;
            ctx.stroke();
          } else if (playerClass === 'BERSERKER') {
            // 버서커: 광폭한 뿔 투구와 전방 대검
            ctx.beginPath();
            ctx.moveTo(-5, -9);
            ctx.lineTo(12, 0);
            ctx.lineTo(-5, 9);
            ctx.closePath();
            ctx.fillStyle = '#7F1D1D'; // dark crimson
            ctx.fill();
            ctx.strokeStyle = '#FCA5A5';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Spikes/Horns
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(8, -13);
            ctx.moveTo(0, 10);
            ctx.lineTo(8, 13);
            ctx.strokeStyle = '#F87171';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // 마법사: 신비로운 마법사 고깔과 별빛 보석
            ctx.beginPath();
            ctx.moveTo(-7, -8);
            ctx.lineTo(16, 0);
            ctx.lineTo(-7, 8);
            ctx.closePath();
            ctx.fillStyle = '#064E3B'; // deep emerald
            ctx.fill();
            ctx.strokeStyle = '#6EE7B7';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Arcane Gem
            ctx.beginPath();
            ctx.arc(4, 0, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#A7F3D0';
            ctx.shadowColor = '#34D399';
            ctx.shadowBlur = 8;
            ctx.fill();
          }

          ctx.restore();

          // Draw Visual Effects
          state.effects.forEach((ef) => {
            ctx.save();
            const alpha = ef.duration / ef.maxDuration;
            if (ef.type === 'EXPLOSION' && ef.radius) {
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, ef.radius * (1 - alpha * 0.3), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.4})`;
              ctx.fill();
              ctx.strokeStyle = `rgba(252, 165, 165, ${alpha})`;
              ctx.lineWidth = 4;
              ctx.stroke();
            } else if (ef.type === 'SLASH' && ef.radius && ef.angle !== undefined) {
              const halfArc = ef.arcAngle !== undefined ? ef.arcAngle / 2 : Math.PI / 3;
              ctx.beginPath();
              ctx.moveTo(ef.x, ef.y);
              ctx.arc(ef.x, ef.y, ef.radius, ef.angle - halfArc, ef.angle + halfArc);
              ctx.closePath();
              ctx.fillStyle = `${ef.color}${Math.floor(alpha * 120).toString(16).padStart(2, '0')}`;
              ctx.fill();
              ctx.strokeStyle = ef.color;
              ctx.lineWidth = 3.5;
              ctx.stroke();
            } else if (ef.type === 'TEXT' && ef.text) {
              ctx.font = 'bold 13px sans-serif';
              ctx.fillStyle = ef.color;
              ctx.shadowColor = '#000000';
              ctx.shadowBlur = 4;
              ctx.textAlign = 'center';
              ctx.fillText(ef.text, ef.x, ef.y - (1 - alpha) * 20);
            } else if (ef.type === 'STAR_RAIN') {
              ctx.fillStyle = `rgba(234, 179, 8, ${alpha * 0.2})`;
              ctx.fillRect(0, 0, w, h);
            } else if (ef.type === 'ATTACK_RED_FLASH' && ef.radius && ef.angle !== undefined) {
              const halfArc = ef.arcAngle !== undefined ? ef.arcAngle / 2 : Math.PI / 3;
              const progress = 1 - alpha;

              // 1. 공격 범위 부채꼴 붉은색 강렬한 그라데이션 섬광
              const grad = ctx.createRadialGradient(ef.x, ef.y, 5, ef.x, ef.y, ef.radius);
              grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95)})`);
              grad.addColorStop(0.25, `rgba(254, 202, 202, ${alpha * 0.85})`);
              grad.addColorStop(0.55, `rgba(239, 68, 68, ${alpha * 0.65})`);
              grad.addColorStop(0.85, `rgba(185, 28, 28, ${alpha * 0.35})`);
              grad.addColorStop(1, 'rgba(153, 27, 27, 0)');

              ctx.beginPath();
              ctx.moveTo(ef.x, ef.y);
              ctx.arc(ef.x, ef.y, ef.radius, ef.angle - halfArc, ef.angle + halfArc);
              ctx.closePath();
              ctx.fillStyle = grad;
              ctx.fill();

              // 2. 공격 범위 외곽 붉은색 섬광 링 라인
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, ef.radius * (0.4 + 0.6 * progress), ef.angle - halfArc, ef.angle + halfArc);
              ctx.strokeStyle = `rgba(254, 226, 226, ${alpha * 0.9})`;
              ctx.lineWidth = 3.5 * alpha;
              ctx.shadowColor = '#EF4444';
              ctx.shadowBlur = 16;
              ctx.stroke();

              // 3. 부채꼴 방향으로 뻗어나가는 붉은색 레이저 섬광 광선들
              const rayCount = 5;
              ctx.shadowColor = '#DC2626';
              ctx.shadowBlur = 12;
              for (let r = 0; r < rayCount; r++) {
                const rayAngle = ef.angle - halfArc + (ef.arcAngle || (Math.PI * 2 / 3)) * (r / (rayCount - 1));
                const rayLen = ef.radius * (0.6 + 0.4 * (1 - (r % 2) * 0.3));
                ctx.beginPath();
                ctx.moveTo(ef.x, ef.y);
                ctx.lineTo(ef.x + Math.cos(rayAngle) * rayLen, ef.y + Math.sin(rayAngle) * rayLen);
                ctx.strokeStyle = r % 2 === 0 ? `rgba(255, 255, 255, ${alpha * 0.85})` : `rgba(239, 68, 68, ${alpha * 0.75})`;
                ctx.lineWidth = 2 * alpha;
                ctx.stroke();
              }
            } else if (ef.type === 'ATTACK_SHOCKWAVE' && ef.radius && ef.angle !== undefined) {
              const halfArc = ef.arcAngle !== undefined ? ef.arcAngle / 2 : Math.PI / 3;
              const progress = 1 - (ef.duration / ef.maxDuration);
              const currentR = ef.radius * Math.sin((progress * Math.PI) / 2);

              // 1. 공격 범위 궤적을 휩쓰는 전방 붉은색 충격파 호(Arc)
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, currentR, ef.angle - halfArc * 1.05, ef.angle + halfArc * 1.05);
              ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.8})`;
              ctx.lineWidth = 7 * (1 - progress * 0.45);
              ctx.shadowColor = '#EF4444';
              ctx.shadowBlur = 18;
              ctx.stroke();

              // 2. 충격파 전면부 코어 하얀 백열광 라인
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, currentR, ef.angle - halfArc * 0.98, ef.angle + halfArc * 0.98);
              ctx.strokeStyle = `rgba(255, 241, 242, ${alpha * 0.95})`;
              ctx.lineWidth = 3 * alpha;
              ctx.stroke();

              // 3. 뒤따라 퍼지는 2차 잔여 충격파 리플 파동
              if (currentR > 20) {
                ctx.beginPath();
                ctx.arc(ef.x, ef.y, Math.max(5, currentR - 15), ef.angle - halfArc * 0.88, ef.angle + halfArc * 0.88);
                ctx.strokeStyle = `rgba(248, 113, 113, ${alpha * 0.45})`;
                ctx.lineWidth = 2 * alpha;
                ctx.stroke();
              }
            } else if (ef.type === 'HIT_SHOCKWAVE' && ef.radius) {
              const progress = 1 - (ef.duration / ef.maxDuration);
              const ringR = ef.radius * (0.25 + 0.85 * progress);

              // 몬스터 피격 중심 동심원 충격파 링
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, ringR, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.85})`;
              ctx.lineWidth = Math.max(1.5, 4.5 * (1 - progress));
              ctx.shadowColor = '#EF4444';
              ctx.shadowBlur = 14;
              ctx.stroke();

              // 안쪽 백열 충격 링
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, ringR * 0.72, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
              ctx.lineWidth = Math.max(1, 2 * alpha);
              ctx.stroke();
            } else if (ef.type === 'RED_HIT_FLASH') {
              const flashRadius = ef.radius || 25;

              // 1. 십자형 섬광 (Cross-Slash Spark)
              ctx.save();
              ctx.translate(ef.x, ef.y);
              ctx.strokeStyle = `rgba(255, 241, 242, ${alpha * 0.95})`;
              ctx.lineWidth = 3.5 * alpha;
              ctx.shadowColor = '#FF0033';
              ctx.shadowBlur = 16;
              ctx.beginPath();
              ctx.moveTo(-flashRadius, -flashRadius * 0.35);
              ctx.lineTo(flashRadius, flashRadius * 0.35);
              ctx.moveTo(-flashRadius * 0.35, flashRadius);
              ctx.lineTo(flashRadius * 0.35, -flashRadius);
              ctx.stroke();

              // 2. 중앙 강렬한 붉은 핵(Core)
              ctx.beginPath();
              ctx.arc(0, 0, Math.max(2, 6 * alpha), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.shadowColor = '#DC2626';
              ctx.shadowBlur = 18;
              ctx.fill();
              ctx.restore();

              // 3. 튀어나가는 붉은색 타격 파편/스파크 (Particles)
              if (ef.particles && ef.particles.length > 0) {
                ef.particles.forEach((p) => {
                  const pAlpha = Math.max(0, p.life / p.maxLife);
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.size * pAlpha, 0, Math.PI * 2);
                  ctx.fillStyle = p.color;
                  ctx.shadowColor = '#EF4444';
                  ctx.shadowBlur = 6;
                  ctx.fill();

                  // 속도 궤적 라인
                  ctx.beginPath();
                  ctx.moveTo(p.x, p.y);
                  ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
                  ctx.strokeStyle = `rgba(254, 202, 202, ${pAlpha * 0.8})`;
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                });
              }
            }
            ctx.restore();
          });

          // 월드 렌더링 카메라 셰이크 매트릭스 복원 (오버레이 및 암전 전)
          ctx.restore();

          // Draw Screen Blackout Overlay - 100% Total Complete Blackout (완전 암전: 아예 안 보이게)
          const isBlackout = activeStatusEffects.some((e) => e.type === 'BLACKOUT');
          if (isBlackout) {
            ctx.save();
            // 화면 전체를 100% 칠흑 같은 암흑으로 완전히 덮음 (시야 없음)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);

            // 중앙에 긴장감 넘치는 완전 암전 경고 표시
            const blackoutEffect = activeStatusEffects.find((e) => e.type === 'BLACKOUT');
            const remaining = blackoutEffect ? blackoutEffect.duration.toFixed(1) : '0.0';

            ctx.fillStyle = '#EF4444';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#DC2626';
            ctx.shadowBlur = 12;
            ctx.fillText(`👁️ 완전 암전 (${remaining}초)`, w / 2, h / 2 - 10);

            ctx.font = '13px sans-serif';
            ctx.fillStyle = '#94A3B8';
            ctx.shadowBlur = 0;
            ctx.fillText('시야가 완전히 차단되었습니다!', w / 2, h / 2 + 18);

            ctx.restore();
          }
        }
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [currentWave, stats, acquiredSkills, activeStatusEffects, isPaused, playerClass, killedBugCount, gameMode]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};
