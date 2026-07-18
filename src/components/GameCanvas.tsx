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
  onUpdateBossStatus: (name?: string, hp?: number, maxHp?: number) => void;
  onUpdateAttackCooldown?: (remainingSec: number, totalSec: number) => void;
  onTriggerNotification?: (message: string, icon?: string, colorTheme?: string) => void;
  isPaused: boolean;
  playerClass: PlayerClassType;
  killedBugCount: number;
  gameMode?: string | null;
  onUpdateBrawlTime?: (elapsed: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentWave,
  stats,
  acquiredSkills,
  activeStatusEffects,
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
    };
  }, [onAddStatusEffect, onRemoveStatusEffect, onEnemyKilled, onPlayerTakeDamage, onWaveClear, onUpdateBossStatus, onUpdateAttackCooldown, onTriggerNotification, onUpdateBrawlTime]);

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

    if (gameMode === 'BRAWL') {
      sound.playWaveStart();
      callbacksRef.current.onTriggerNotification?.('⚔️ 난투 모드 돌입! 6분간 생존하며 성장하십시오!', '🔥', 'rose');
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

  // Keyboard & Mouse/Touch Event Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key.toLowerCase()] = true;
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

          // Local Player Damage Application with Shield Absorption (10-11)
          const takeDamageLocal = (dmg: number, isInstantDeath = false) => {
            if (isInstantDeath) {
              callbacksRef.current.onPlayerTakeDamage(dmg, true);
              return;
            }
            const shieldSkill = acquiredSkills.find((s) => s.definition.code === '10-11');
            if (shieldSkill && state.shieldHp !== undefined && state.shieldHp > 0) {
              if (state.shieldHp >= dmg) {
                state.shieldHp -= dmg;
                sound.playHit();
                state.effects.push({
                  uid: `shield_absorb_${Date.now()}_${Math.random()}`,
                  x: hero.x,
                  y: hero.y - 25,
                  type: 'TEXT',
                  text: `🛡️ 보호막 흡수 (-${dmg})`,
                  color: '#60A5FA',
                  duration: 0.8,
                  maxDuration: 0.8,
                });
                return;
              } else {
                const remainingDmg = dmg - state.shieldHp;
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
            callbacksRef.current.onPlayerTakeDamage(dmg);
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

            // 부채꼴 범위 내 모든 적 타격
            state.enemies.forEach((en) => {
              const dist = Math.hypot(en.x - hero.x, en.y - hero.y) - en.radius;
              if (dist <= slashRange) {
                const angleToEnemy = Math.atan2(en.y - hero.y, en.x - hero.x);
                const diffAngle = Math.abs((angleToEnemy - targetAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI);
                const angleTolerance = halfCone + Math.asin(Math.min(1, en.radius / Math.max(10, dist)));
                if (diffAngle <= angleTolerance) {
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

                  en.hp -= totalDmg;

                  // 넉백 파워 연산
                  let pushForce = 0;
                  if (hasGoAway) pushForce += 35;

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
                    text: `-${totalDmg.toFixed(1)}`,
                    color: baseStats.secondaryColor,
                    duration: 0.6,
                    maxDuration: 0.6,
                  });
                }
              }
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

                en.hp -= finalDmg;

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

          // --- 4.8. BRAWL MODE SPAWNING ---
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
          const extraEnemiesToSpawn: EnemyEntity[] = [];

          if (gameMode === 'BRAWL' && state.brawlBossesSpawned) {
            const activeBosses = state.enemies.filter((e) => e.isBoss);
            if (activeBosses.length > 0) {
              currentBossName = `🚨 보스 대군단 (남은 보스: ${activeBosses.length}마리)`;
              currentBossHp = activeBosses.reduce((acc, b) => acc + b.hp, 0);
              currentBossMaxHp = activeBosses.reduce((acc, b) => acc + b.maxHp, 0);
            }
          }

          state.enemies = state.enemies.filter((en) => {
            if (en.isBoss && !(gameMode === 'BRAWL' && state.brawlBossesSpawned)) {
              currentBossName = en.name;
              currentBossHp = en.hp;
              currentBossMaxHp = en.maxHp;
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

            // Collision with hero -> deal damage
            if (dist <= hero.radius + en.radius) {
              if (time - state.lastPlayerHitTime >= 800) {
                state.lastPlayerHitTime = time;
                callbacksRef.current.onPlayerTakeDamage(en.damage);
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
              
              // 15초에 한번 10마리의 조무래기(11-1) 소환 (모든 페이즈 지속적으로)
              state.bossSummonTimer += dt;
              if (state.bossSummonTimer >= 15) {
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
            }

            // Check if killed
            if (en.hp <= 0) {
              callbacksRef.current.onEnemyKilled(en);
              return false;
            }
            return true;
          });

          if (extraEnemiesToSpawn.length > 0) {
            state.enemies.push(...extraEnemiesToSpawn);
          }

          callbacksRef.current.onUpdateBossStatus(currentBossName, currentBossHp, currentBossMaxHp);

          // Check if Wave cleared! (All enemies dead or all Bosses and target Bugs cleared)
          if (gameMode === 'BRAWL') {
            if (state.brawlBossesSpawned && state.enemies.filter((e) => e.isBoss).length === 0 && !state.waveTransitioning) {
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
          state.effects = state.effects.filter((ef) => {
            ef.duration -= dt;
            return ef.duration > 0;
          });

          // --- 7. RENDERING ---
          ctx.clearRect(0, 0, w, h);

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

            // Label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px font-mono';
            ctx.textAlign = 'center';
            ctx.fillText(`[${en.code}]`, 0, 4);

            // Health Bar
            const barW = en.radius * 2;
            const barH = 4;
            ctx.fillStyle = '#334155';
            ctx.fillRect(-barW / 2, -en.radius - 10, barW, barH);
            ctx.fillStyle = en.isBoss ? '#EF4444' : '#10B981';
            ctx.fillRect(-barW / 2, -en.radius - 10, barW * Math.max(0, en.hp / en.maxHp), barH);

            ctx.restore();
          });

          // Draw Sugar Gnome Hero
          ctx.save();
          ctx.translate(hero.x, hero.y);

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

          // Gnome Body
          ctx.beginPath();
          ctx.arc(0, 0, hero.radius, 0, Math.PI * 2);
          ctx.fillStyle = isRevivalGhost ? 'rgba(244, 114, 182, 0.7)' : '#F59E0B';
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Gnome Pointy Red Hat
          ctx.rotate(hero.angle);
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(18, 0);
          ctx.lineTo(-6, 8);
          ctx.closePath();
          ctx.fillStyle = '#EF4444';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
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
            }
            ctx.restore();
          });

          // Draw Screen Blackout Overlay (Rule 3-1, 3-10)
          const isBlackout = activeStatusEffects.some((e) => e.type === 'BLACKOUT');
          if (isBlackout) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#A855F7';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👁️ 암전 상태! 설탕노움의 시야가 차단되었습니다!', w / 2, h / 2);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#CBD5E1';
            ctx.fillText('침착하게 방향키로 이동하며 생존하세요!', w / 2, h / 2 + 30);
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
