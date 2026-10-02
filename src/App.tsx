import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { LevelUpModal } from './components/LevelUpModal';
import { SkillSelectModal } from './components/SkillSelectModal';
import { QuestModal } from './components/QuestModal';
import { CodexModal } from './components/CodexModal';
import { WaveBanner } from './components/WaveBanner';
import { GameOverModal } from './components/GameOverModal';
import { ClassSelectModal } from './components/ClassSelectModal';
import { HomeModeSelect } from './components/HomeModeSelect';
import { BlueprintSelectionModal } from './components/BlueprintSelectionModal';
import { BlueprintInventoryModal } from './components/BlueprintInventoryModal';
import { RankingModal } from './components/RankingModal';
import { checkSatisfiedSynergies, calculateBlueprintStats } from './data/blueprints';
import { PlayerStats, AcquiredSkill, ActiveStatusEffect, QuestState, SkillDefinition, EnemyEntity, PlayerClassType, CLASS_BASE_STATS, GameModeType } from './types/game';
import { SKILL_DEFINITIONS, WAVE_CONFIGS } from './data/encyclopedia';
import { sound } from './utils/sound';
import { Sparkles, Bug, AlertTriangle } from 'lucide-react';

export default function App() {
  // --- CORE GAME STATE ---
  const [playerClass, setPlayerClass] = useState<PlayerClassType | null>(null);
  const [gameMode, setGameMode] = useState<GameModeType | null>(null);
  const [brawlElapsed, setBrawlElapsed] = useState<number>(0);
  const [currentWave, setCurrentWave] = useState<number>(1);
  const lastHealedWaveRef = useRef<number>(1);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [lastSkillCheckXp, setLastSkillCheckXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [unspentPoints, setUnspentPoints] = useState<number>(0);
  const [pendingSkillSelections, setPendingSkillSelections] = useState<number>(0);

  const [stats, setStats] = useState<PlayerStats>({
    attack: 1,
    attackPoints: 0,
    moveSpeed: 0.8,
    moveSpeedPoints: 0,
    maxHp: 5,
    maxHpPoints: 0,
    attackSpeed: 1,
    attackSpeedPoints: 0,
    range: 1.0,
    rangePoints: 0,
    regenSpeed: 1.0,
    regenSpeedPoints: 0,
    sawbladeSpeedPoints: 0,
    sawbladeSpeedBonus: 1.0,
  });

  const [hp, setHp] = useState<number>(5);
  const [acquiredSkills, setAcquiredSkills] = useState<AcquiredSkill[]>([]);
  const [activeStatusEffects, setActiveStatusEffects] = useState<ActiveStatusEffect[]>([]);

  // Combat Stats
  const [enemiesKilled, setEnemiesKilled] = useState<number>(0);
  const [bossesKilled, setBossesKilled] = useState<number>(0);
  const [killedBugCount, setKilledBugCount] = useState<number>(0);

  // Boss UI Info
  const [bossInfo, setBossInfo] = useState<{
    name?: string;
    hp?: number;
    maxHp?: number;
    code?: string;
    phase?: number;
  }>({});

  // Quests
  const [quests, setQuests] = useState<QuestState[]>([
    {
      id: 'q1',
      code: '5-1',
      title: '몬스터 3회 잡기',
      targetCount: 3,
      currentCount: 0,
      rewardXp: 30,
      completed: false,
      claimed: false,
    },
  ]);

  // Modals & Banners
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState<boolean>(false);
  const [questOpenCount, setQuestOpenCount] = useState<number>(0);
  const [lastQuestOpenTime, setLastQuestOpenTime] = useState<number>(0);
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [skillChoices, setSkillChoices] = useState<SkillDefinition[]>([]);
  const [isSkillSelectOpen, setIsSkillSelectOpen] = useState<boolean>(false);
  const [showWaveBanner, setShowWaveBanner] = useState<boolean>(true);

  // Game Over
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Notifications
  const [notifications, setNotifications] = useState<{ id: string; message: string; icon: string; colorTheme: string }[]>([]);

  const addNotification = useCallback((message: string, icon = '✨', colorTheme = 'amber') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, icon, colorTheme }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 1200); // 1.2s - quickly disappears as requested
  }, []);

  // Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Action / Controls
  const [moveDirection, setMoveDirection] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAttackPressed, setIsAttackPressed] = useState<boolean>(false);
  const [activeSkillTrigger, setActiveSkillTrigger] = useState<string | null>(null);
  const [attackCdRemaining, setAttackCdRemaining] = useState<number>(0);
  const [attackCdTotal, setAttackCdTotal] = useState<number>(0);

  // Blueprint System State
  const [coupons, setCoupons] = useState<number>(0);
  const [ownedBlueprints, setOwnedBlueprints] = useState<string[]>([]);
  const [isBlueprintSelectionOpen, setIsBlueprintSelectionOpen] = useState<boolean>(false);
  const [isBlueprintInventoryOpen, setIsBlueprintInventoryOpen] = useState<boolean>(false);

  // Dash System State
  const [dashTrigger, setDashTrigger] = useState<number>(0);
  const [dashCdRemaining, setDashCdRemaining] = useState<number>(0);
  const [dashCdTotal, setDashCdTotal] = useState<number>(2.5);
  const hardcoreSkillsTriggeredRef = useRef<boolean>(false);

  // Global Ranking System State
  const [isRankingOpen, setIsRankingOpen] = useState<boolean>(false);
  const [rankElapsed, setRankElapsed] = useState<number>(0);
  const [rankClearTime, setRankClearTime] = useState<number>(0);

  // Track whether the player has finished picking skills and blueprints
  const isSkillsReady = !isSkillSelectOpen && pendingSkillSelections === 0 && !isBlueprintSelectionOpen;

  // Boss Spawn Aura state (3 seconds full-screen aura)
  const [bossSpawnAura, setBossSpawnAura] = useState<'STARLIGHT' | 'ERROR' | null>(null);

  const handleBossSpawned = useCallback((bossType: 'STARLIGHT' | 'ERROR') => {
    setBossSpawnAura(bossType);
    if (bossType === 'STARLIGHT') {
      sound.playPhaseShift('STARLIGHT');
    } else {
      sound.playPhaseShift('ERROR');
    }
    const timer = setTimeout(() => {
      setBossSpawnAura(null);
    }, 3000); // 3 seconds intense full-screen aura
    return () => clearTimeout(timer);
  }, []);

  // Blueprint Synergies & Stats Calculation
  const activeSynergies = useMemo(() => {
    return checkSatisfiedSynergies(ownedBlueprints);
  }, [ownedBlueprints]);

  const bpStats = useMemo(() => {
    return calculateBlueprintStats(ownedBlueprints, activeSynergies);
  }, [ownedBlueprints, activeSynergies]);

  // Combined Effective Stats (Player Base + Blueprint & Synergy Modifiers)
  const effectiveStats = useMemo<PlayerStats>(() => {
    const baseAtk = stats.attack;
    const baseSpd = stats.moveSpeed;
    const baseHp = stats.maxHp;
    const baseAtkSpd = stats.attackSpeed;
    const baseRange = stats.range;

    const rangeMultiplier = 1 + (bpStats.rangeBlocks * 0.4);

    return {
      ...stats,
      attack: Math.max(0.1, (baseAtk * (1 + bpStats.attackPercent)) + bpStats.attackFlat),
      attackSpeed: Math.max(0.2, baseAtkSpd * (1 + bpStats.attackSpeedPercent)),
      moveSpeed: Math.max(0.3, baseSpd * (1 + bpStats.moveSpeedPercent)),
      maxHp: Math.max(1, baseHp + bpStats.hpFlat),
      range: Math.max(0.2, baseRange * Math.max(0.1, rangeMultiplier)),
      defense: bpStats.defenseFlat,
    };
  }, [stats, bpStats]);

  // 특수 조합 등으로 최대 체력이 늘어나면 늘어난 칸만큼 현재 체력도 즉시 채워줌 (예: 6칸에서 11칸으로 늘면 11/11 완충)
  const prevMaxHpRef = useRef<number>(effectiveStats.maxHp);
  useEffect(() => {
    const prevMax = prevMaxHpRef.current;
    const currentMax = effectiveStats.maxHp;
    if (currentMax > prevMax) {
      const diff = currentMax - prevMax;
      setHp((currentHp) => Math.min(currentMax, currentHp + diff));
    } else if (currentMax < prevMax) {
      setHp((currentHp) => Math.min(currentMax, currentHp));
    }
    prevMaxHpRef.current = currentMax;
  }, [effectiveStats.maxHp]);

  // Active Boss Type for BGM pitch modulation & screen hue shift
  const activeBossType: 'STARLIGHT' | 'ERROR' | null = useMemo(() => {
    if (bossInfo.name && bossInfo.hp !== undefined && bossInfo.hp > 0) {
      if (bossInfo.code === '3-11' || bossInfo.name.includes('별빛')) return 'STARLIGHT';
      if (bossInfo.code === 'ERROR' || bossInfo.name.toUpperCase().includes('ERROR')) return 'ERROR';
    }
    return null;
  }, [bossInfo.name, bossInfo.hp, bossInfo.code]);

  useEffect(() => {
    sound.setBossTheme(activeBossType);
  }, [activeBossType]);

  useEffect(() => {
    sound.enabled = soundEnabled;
    if (soundEnabled) {
      sound.startBgm();
    } else {
      sound.stopBgm();
    }
  }, [soundEnabled]);

  // Show wave banner briefly when wave starts and restore all HP on stage change
  useEffect(() => {
    setShowWaveBanner(true);
    const timer = setTimeout(() => setShowWaveBanner(false), 4500);

    if (currentWave !== lastHealedWaveRef.current) {
      setHp(effectiveStats.maxHp);
      addNotification("❤️ 다음 스테이지 진입! 모든 체력이 회복되었습니다.", "❇️", "emerald");
      lastHealedWaveRef.current = currentWave;
    }

    return () => clearTimeout(timer);
  }, [currentWave, effectiveStats.maxHp, addNotification]);

  // --- XP & LEVEL UP HANDLING ---
  const addXp = useCallback((amount: number) => {
    setTotalXp((prev) => {
      const newTotal = prev + amount;
      const prevLevel = Math.floor(prev / 50) + 1;
      const newLevel = Math.floor(newTotal / 50) + 1;

      if (newLevel > prevLevel) {
        sound.playLevelUp();
        const levelDiff = newLevel - prevLevel;
        setLevel(newLevel);
        setUnspentPoints((pts) => pts + levelDiff);
        // Also heal player a bit upon leveling up!
        setHp((h) => Math.min(effectiveStats.maxHp, h + 1));
      }

      return newTotal;
    });
  }, [effectiveStats.maxHp]);

  // --- AUTOMATIC RANDOM STAT UPGRADE UPON LEVEL UP ---
  useEffect(() => {
    if (level > 1 && playerClass) {
      const base = CLASS_BASE_STATS[playerClass] || CLASS_BASE_STATS['ASSASSIN'];
      const baseAtk = base.attack;
      const baseSpd = base.moveSpeed;
      const baseHp = base.maxHp;
      const baseAtkSpd = base.attackSpeed;

      let pickedStatName = '';

      setStats((prev) => {
        const next = { ...prev };
        const eligible: { key: keyof PlayerStats; name: string }[] = [];
        if (next.attackPoints < 30) eligible.push({ key: 'attackPoints', name: '공격력' });
        if (next.moveSpeedPoints < 30) eligible.push({ key: 'moveSpeedPoints', name: '이동 속도' });
        if (next.maxHpPoints < 30) eligible.push({ key: 'maxHpPoints', name: '최대 체력' });
        if (next.attackSpeedPoints < 30) eligible.push({ key: 'attackSpeedPoints', name: '공격 속도' });
        if (next.rangePoints < 30) eligible.push({ key: 'rangePoints', name: '공격 사거리' });
        if (next.regenSpeedPoints < 10) eligible.push({ key: 'regenSpeedPoints', name: '재생 속도' });

        if (eligible.length > 0) {
          const picked = eligible[Math.floor(Math.random() * eligible.length)];
          pickedStatName = picked.name;
          if (picked.key === 'attackPoints') {
            next.attackPoints++;
            next.attack = baseAtk * (1 + next.attackPoints * 0.015);
          } else if (picked.key === 'moveSpeedPoints') {
            next.moveSpeedPoints++;
            next.moveSpeed = baseSpd * (1 + next.moveSpeedPoints * 0.017);
          } else if (picked.key === 'maxHpPoints') {
            next.maxHpPoints++;
            const oldMax = next.maxHp;
            next.maxHp = baseHp * (1 + next.maxHpPoints * 0.012);
            setHp((h) => Math.min(next.maxHp, h + (next.maxHp - oldMax)));
          } else if (picked.key === 'attackSpeedPoints') {
            next.attackSpeedPoints++;
            next.attackSpeed = baseAtkSpd * (1 + next.attackSpeedPoints * 0.013);
          } else if (picked.key === 'rangePoints') {
            next.rangePoints++;
            next.range = 1 * (1 + next.rangePoints * 0.011);
          } else if (picked.key === 'regenSpeedPoints') {
            next.regenSpeedPoints++;
            next.regenSpeed = 1 * (1 + next.regenSpeedPoints * 0.012);
          }
        }

        return next;
      });

      if (pickedStatName) {
        addNotification(`레벨업! ${pickedStatName} +1`, '✨', 'amber');
      }
    }
  }, [level, playerClass, addNotification]);

  // --- SKILL DRAW HELPER ---
  const triggerNextSkillDraw = useCallback(() => {
    // Draw 3 random skills weighted by probability
    const available = [...SKILL_DEFINITIONS];
    const drawn: SkillDefinition[] = [];
    while (drawn.length < 3 && available.length > 0) {
      const totalWeight = available.reduce((acc, s) => acc + s.probability, 0);
      let rand = Math.random() * totalWeight;
      let pickedIndex = 0;
      for (let i = 0; i < available.length; i++) {
        rand -= available[i].probability;
        if (rand <= 0) {
          pickedIndex = i;
          break;
        }
      }
      drawn.push(available[pickedIndex]);
      available.splice(pickedIndex, 1);
    }

    sound.playLevelUp();
    setSkillChoices(drawn);
    setIsSkillSelectOpen(true);
  }, []);

  // --- CUMULATIVE 100 XP SKILL GACHA TRIGGER ---
  useEffect(() => {
    if (totalXp >= lastSkillCheckXp + 100) {
      const count = Math.floor((totalXp - lastSkillCheckXp) / 100);
      if (count > 0) {
        const nextThreshold = lastSkillCheckXp + count * 100;
        setLastSkillCheckXp(nextThreshold);
        setPendingSkillSelections((prev) => {
          const nextCount = prev + count;
          if (!isSkillSelectOpen) {
            triggerNextSkillDraw();
          }
          return nextCount;
        });
      }
    }
  }, [totalXp, lastSkillCheckXp, isSkillSelectOpen, triggerNextSkillDraw]);

  // --- STAT RESET EFFECT (RESEMARAMON DEBUFF) ---
  useEffect(() => {
    const hasStatReset = activeStatusEffects.some((e) => e.type === 'STAT_RESET');
    if (hasStatReset && playerClass) {
      const base = CLASS_BASE_STATS[playerClass];
      setStats((prev) => {
        const investedPoints =
          prev.attackPoints +
          prev.moveSpeedPoints +
          prev.maxHpPoints +
          prev.attackSpeedPoints +
          prev.rangePoints +
          prev.regenSpeedPoints;

        if (investedPoints > 0) {
          setUnspentPoints((pts) => pts + investedPoints);
          setHp((h) => Math.min(base.maxHp, h));
          sound.playWarning();
        }
        return {
          attack: base.attack,
          attackPoints: 0,
          moveSpeed: base.moveSpeed,
          moveSpeedPoints: 0,
          maxHp: base.maxHp,
          maxHpPoints: 0,
          attackSpeed: base.attackSpeed,
          attackSpeedPoints: 0,
          range: 1.0,
          rangePoints: 0,
          regenSpeed: 1.0,
          regenSpeedPoints: 0,
          sawbladeSpeedPoints: 0,
          sawbladeSpeedBonus: 1.0,
        };
      });

      // Clear the reset debuff so it only fires once per trigger
      setActiveStatusEffects((prev) => prev.filter((e) => e.type !== 'STAT_RESET'));
    }
  }, [activeStatusEffects, playerClass]);

  // --- CLASS SELECTION ---
  const handleSelectClass = (chosenClass: PlayerClassType) => {
    setPlayerClass(chosenClass);
    const base = CLASS_BASE_STATS[chosenClass];

    setStats({
      attack: base.attack,
      attackPoints: 0,
      moveSpeed: base.moveSpeed,
      moveSpeedPoints: 0,
      maxHp: base.maxHp,
      maxHpPoints: 0,
      attackSpeed: base.attackSpeed,
      attackSpeedPoints: 0,
      range: 1.0,
      rangePoints: 0,
      regenSpeed: 1.0,
      regenSpeedPoints: 0,
      sawbladeSpeedPoints: 0,
      sawbladeSpeedBonus: 1.0,
    });
    setHp(base.maxHp);

    if (gameMode === 'HARDCORE') {
      setCoupons(3);
      setOwnedBlueprints([]);
      setIsBlueprintSelectionOpen(true);
    } else if (gameMode === 'RANK') {
      // 랭크 모드: 시작 후 20회 스킬을 획득 후 시작
      setPendingSkillSelections(20);
      triggerNextSkillDraw();
      addNotification('⭐ 랭크 모드 돌입: 스킬 20회 선택 혜택이 주어집니다!', '🏆', 'amber');
    }
  };

  // --- STAT UPGRADES ---
  const handleUpgradeStat = (statKey: keyof PlayerStats) => {
    if (unspentPoints <= 0) return;

    const base = CLASS_BASE_STATS[playerClass || 'ASSASSIN'];
    const baseAtk = base.attack;
    const baseSpd = base.moveSpeed;
    const baseHp = base.maxHp;
    const baseAtkSpd = base.attackSpeed;

    setStats((prev) => {
      const next = { ...prev };
      if (statKey === 'attackPoints' && next.attackPoints < 30) {
        next.attackPoints++;
        next.attack = baseAtk * (1 + next.attackPoints * 0.015);
      } else if (statKey === 'moveSpeedPoints' && next.moveSpeedPoints < 30) {
        next.moveSpeedPoints++;
        next.moveSpeed = baseSpd * (1 + next.moveSpeedPoints * 0.017);
      } else if (statKey === 'maxHpPoints' && next.maxHpPoints < 30) {
        next.maxHpPoints++;
        const oldMax = next.maxHp;
        next.maxHp = baseHp * (1 + next.maxHpPoints * 0.012);
        setHp((h) => Math.min(next.maxHp, h + (next.maxHp - oldMax)));
      } else if (statKey === 'attackSpeedPoints' && next.attackSpeedPoints < 30) {
        next.attackSpeedPoints++;
        next.attackSpeed = baseAtkSpd * (1 + next.attackSpeedPoints * 0.013);
      } else if (statKey === 'rangePoints' && next.rangePoints < 30) {
        next.rangePoints++;
        next.range = 1 * (1 + next.rangePoints * 0.011);
      } else if (statKey === 'regenSpeedPoints' && next.regenSpeedPoints < 10) {
        next.regenSpeedPoints++;
        next.regenSpeed = 1 * (1 + next.regenSpeedPoints * 0.012);
      } else {
        return prev;
      }
      setUnspentPoints((pts) => Math.max(0, pts - 1));
      return next;
    });
  };

  // --- SKILL SELECTION ---
  const handleSelectSkill = (skill: SkillDefinition) => {
    if (skill.code === '10-8') {
      // Instant Easter Egg Star Rain
      setActiveSkillTrigger('10-8_STAR_EASTER_EGG');
    } else {
      setAcquiredSkills((prev) => {
        const existing = prev.find((s) => s.definition.id === skill.id);
        if (existing) {
          return prev.map((s) =>
            s.definition.id === skill.id ? { ...s, level: s.level + 1 } : s
          );
        } else {
          return [
            ...prev,
            { id: skill.id, definition: skill, level: 1, currentCooldown: 0 },
          ];
        }
      });
    }

    setPendingSkillSelections((prev) => {
      const nextPending = Math.max(0, prev - 1);
      if (nextPending > 0) {
        triggerNextSkillDraw();
      } else {
        setIsSkillSelectOpen(false);
      }
      return nextPending;
    });
  };

  // --- TICK COOL DOWNS & REGEN (Every 1 second) ---
  useEffect(() => {
    if (
      playerClass === null ||
      isStatsOpen ||
      isQuestsOpen ||
      isCodexOpen ||
      isSkillSelectOpen ||
      isGameOverOpen ||
      isBlueprintSelectionOpen ||
      isBlueprintInventoryOpen ||
      isRankingOpen
    )
      return;
    const interval = setInterval(() => {
      // Tick skill cooldowns
      setAcquiredSkills((prev) =>
        prev.map((s) =>
          s.currentCooldown > 0
            ? { ...s, currentCooldown: Math.max(0, s.currentCooldown - 1) }
            : s
        )
      );

      // Tick status effects
      setActiveStatusEffects((prev) =>
        prev
          .map((e) => ({ ...e, duration: e.duration - 1 }))
          .filter((e) => e.duration > 0)
      );

      // HP Regeneration (Base 1 HP per class.regenSeconds accelerated by regenSpeed)
      setHp((prevHp) => {
        if (prevHp <= 0) return prevHp;
        const baseSeconds = playerClass ? CLASS_BASE_STATS[playerClass].regenSeconds : 10;
        const healRatePerSec = (1 / baseSeconds) * stats.regenSpeed;
        return Math.min(effectiveStats.maxHp, prevHp + healRatePerSec);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    stats.regenSpeed,
    effectiveStats.maxHp,
    playerClass,
    isStatsOpen,
    isQuestsOpen,
    isCodexOpen,
    isSkillSelectOpen,
    isGameOverOpen,
    isBlueprintSelectionOpen,
    isBlueprintInventoryOpen,
    isRankingOpen,
  ]);

  // --- WAVE CLEAR CALLBACK ---
  const handleWaveClear = useCallback(() => {
    if (isGameOverOpen) return;

    if (gameMode === 'BRAWL' || gameMode === 'HARDCORE' || gameMode === 'RANK') {
      sound.playLevelUp();
      setIsVictory(true);
      setIsGameOverOpen(true);
      return;
    }

    if (currentWave < 6) {
      // Apply wave clear rewards
      sound.playLevelUp();
      if (currentWave === 1) {
        // 9-1-2 보상: 이동속도 1.2% 증가
        setStats((prev) => ({ ...prev, moveSpeed: prev.moveSpeed * 1.012 }));
      } else if (currentWave === 2) {
        // 9-2-2 보상: 조종불가 지속시간 1.2% 감소
      } else if (currentWave === 3) {
        // 9-3-2 보상: 공격력 2 증가
        setStats((prev) => ({ ...prev, attack: prev.attack + 2 }));
      } else if (currentWave === 4) {
        // 9-4-2 보상: 체력 3 증가
        setStats((prev) => ({ ...prev, maxHp: prev.maxHp + 3 }));
        setHp((h) => h + 3);
      } else if (currentWave === 5) {
        // 9-5-3 보상: 공격속도 1.2% 증가
        setStats((prev) => ({ ...prev, attackSpeed: prev.attackSpeed * 1.012 }));
      }
      setCurrentWave((w) => w + 1);
    } else {
      // Wave 6 cleared (Starlight Defeated!) -> Final Victory!
      sound.playLevelUp();
      setIsVictory(true);
      setIsGameOverOpen(true);
    }
  }, [currentWave, gameMode, isGameOverOpen]);

  // --- ENEMY KILLED CALLBACK ---
  const handleEnemyKilled = useCallback((enemy: EnemyEntity) => {
    setEnemiesKilled((prev) => prev + 1);
    addXp(enemy.xp);

    if (enemy.isBoss) {
      setBossesKilled((prev) => prev + 1);

      // Check Last Strike (10-5) revival check
      const hasLastStrikeGhost = activeStatusEffects.some((e) => e.type === 'REVIVAL_GHOST');
      if (hasLastStrikeGhost) {
        setHp(effectiveStats.maxHp);
        setActiveStatusEffects((prev) => prev.filter((e) => e.type !== 'REVIVAL_GHOST'));
      }
    }

    // 최종 보스 처치 즉시 게임 클리어 처리 (별빛 또는 하드코어 ERROR)
    if (enemy.code === '3-11') {
      if (gameMode === 'RANK') {
        setRankClearTime((prev) => (prev > 0 ? prev : rankElapsed));
        handleWaveClear();
      } else if (currentWave >= 6) {
        handleWaveClear();
      }
    } else if (enemy.code === 'ERROR' && gameMode === 'HARDCORE') {
      handleWaveClear();
    }

    if (enemy.category === 'BUG') {
      setKilledBugCount((prev) => prev + 1);
    }

    // Update quest progress
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.code === '5-1') {
          const nextCnt = q.currentCount + 1;
          return { ...q, currentCount: nextCnt, completed: nextCnt >= q.targetCount };
        }
        return q;
      })
    );
  }, [addXp, activeStatusEffects, effectiveStats.maxHp, gameMode, currentWave, rankElapsed, handleWaveClear]);

  // --- TAKE DAMAGE & REVIVAL CHECK ---
  const handlePlayerTakeDamage = useCallback((dmg: number, isInstantDeath = false) => {
    setHp((prevHp) => {
      const nextHp = isInstantDeath ? 0 : prevHp - dmg;
      if (nextHp <= 0) {
        // 하드코어 모드는 단 1회 사망 시 부활 없이 즉시 게임오버 및 리셋
        if (gameMode === 'HARDCORE') {
          setIsVictory(false);
          setIsGameOverOpen(true);
          return 0;
        }

        // Check Last Strike skill (10-5)
        const hasLastStrike = acquiredSkills.some((s) => s.definition.code === '10-5');
        const alreadyGhost = activeStatusEffects.some((e) => e.type === 'REVIVAL_GHOST');

        if (hasLastStrike && !alreadyGhost && !isInstantDeath) {
          setActiveStatusEffects((prev) => [
            ...prev,
            { type: 'REVIVAL_GHOST', duration: 10, maxDuration: 10 },
          ]);
          return 0.1; // surviving at 0.1 HP during ghost state
        } else {
          setIsVictory(false);
          setIsGameOverOpen(true);
          return 0;
        }
      }
      return nextHp;
    });
  }, [acquiredSkills, activeStatusEffects, gameMode]);

  // --- OPEN QUESTS (WITH DEVELOPER CHEAT TRACKING) ---
  const handleOpenQuests = () => {
    const now = Date.now();
    let nextCount = 1;
    if (now - lastQuestOpenTime < 2500) {
      nextCount = questOpenCount + 1;
    }
    setQuestOpenCount(nextCount);
    setLastQuestOpenTime(now);

    if (nextCount >= 10) {
      setCurrentWave(6);
      addNotification("🛠️ 제작자 루트 활성화! 별빛 보스전 즉시 진입!", "⭐", "emerald");
      setQuestOpenCount(0);
      setIsQuestsOpen(false);
    } else {
      if (nextCount >= 3) {
        addNotification(`🛠️ 제작자 루트 감지 중... (${nextCount}/10)`, "⚙️", "amber");
      }
      setIsQuestsOpen(true);
    }
  };

  // --- CLAIM QUEST REWARD ---
  const handleClaimQuest = (questId: string) => {
    if (questId === 'DEVELOPER_CHEAT_WAVE6') {
      setCurrentWave(6);
      addNotification("🛠️ 제작자 루트 활성화! 별빛 보스전 즉시 진입!", "⭐", "emerald");
      setIsQuestsOpen(false);
      return;
    }
    const q = quests.find((item) => item.id === questId);
    if (q && q.completed && !q.claimed) {
      addXp(q.rewardXp);
      sound.playLevelUp();
      // Cycle/reset quest for next round but carry over extra progress
      setQuests((prev) =>
        prev.map((item) => {
          if (item.id === questId) {
            const nextCount = Math.max(0, item.currentCount - item.targetCount);
            return {
              ...item,
              currentCount: nextCount,
              completed: nextCount >= item.targetCount,
              claimed: false,
            };
          }
          return item;
        })
      );
    }
  };

  // --- RESTART GAME ---
  const handleRestart = () => {
    setPlayerClass(null);
    setGameMode(null);
    setBrawlElapsed(0);
    setRankElapsed(0);
    setRankClearTime(0);
    setIsRankingOpen(false);
    setCurrentWave(1);
    lastHealedWaveRef.current = 1;
    setTotalXp(0);
    setLastSkillCheckXp(0);
    setPendingSkillSelections(0);
    setQuestOpenCount(0);
    setLastQuestOpenTime(0);
    setLevel(1);
    setUnspentPoints(0);
    const initialStats = {
      attack: 1,
      attackPoints: 0,
      moveSpeed: 0.8,
      moveSpeedPoints: 0,
      maxHp: 5,
      maxHpPoints: 0,
      attackSpeed: 1,
      attackSpeedPoints: 0,
      range: 1.0,
      rangePoints: 0,
      regenSpeed: 1.0,
      regenSpeedPoints: 0,
      sawbladeSpeedPoints: 0,
      sawbladeSpeedBonus: 1.0,
    };
    setStats(initialStats);
    setHp(5);
    setAcquiredSkills([]);
    setActiveStatusEffects([]);
    setEnemiesKilled(0);
    setBossesKilled(0);
    setKilledBugCount(0);
    setIsGameOverOpen(false);
    setIsVictory(false);
    setIsSkillSelectOpen(false);
    setIsStatsOpen(false);
    setCoupons(0);
    setOwnedBlueprints([]);
    setIsBlueprintSelectionOpen(false);
    setIsBlueprintInventoryOpen(false);
    setDashTrigger(0);
    setDashCdRemaining(0);
    setQuests([
      {
        id: 'q1',
        code: '5-1',
        title: '몬스터 3회 잡기',
        targetCount: 3,
        currentCount: 0,
        rewardXp: 30,
        completed: false,
        claimed: false,
      },
    ]);
    hardcoreSkillsTriggeredRef.current = false;
  };

  // Blueprint Confirmation Handler
  const handleConfirmBlueprints = (selectedBlueprintIds: string[], remainingCoupons: number) => {
    setOwnedBlueprints(selectedBlueprintIds);
    setCoupons(remainingCoupons);
    setIsBlueprintSelectionOpen(false);

    const synergies = checkSatisfiedSynergies(selectedBlueprintIds);
    const newBpStats = calculateBlueprintStats(selectedBlueprintIds, synergies);
    const newMaxHp = Math.max(1, stats.maxHp + newBpStats.hpFlat);
    const oldMaxHp = effectiveStats.maxHp;

    // 특수 조합 등으로 최대 체력이 증가했을 경우 전체 체력을 100% 완전 충전 (예: 11칸 중 11칸 채움)
    if (newMaxHp > oldMaxHp) {
      setHp(newMaxHp);
    }

    if (synergies.length > 0) {
      addNotification(`📜 조합 ${synergies.length}개 완성 완료!`, '✨', 'emerald');
      sound.playLevelUp();
    } else {
      sound.playSlash();
    }

    // 하드코어 모드 시작 시 20회 스킬 뽑기 발동
    if (gameMode === 'HARDCORE' && !hardcoreSkillsTriggeredRef.current) {
      hardcoreSkillsTriggeredRef.current = true;
      setPendingSkillSelections(20);
      triggerNextSkillDraw();
      addNotification('하드코어 특별 보급: 스킬 20회 뽑기 가동!', '🎁', 'cyan');
    }
  };

  const handleCloseBlueprintSelection = () => {
    setIsBlueprintSelectionOpen(false);
    if (gameMode === 'HARDCORE' && !hardcoreSkillsTriggeredRef.current) {
      hardcoreSkillsTriggeredRef.current = true;
      setPendingSkillSelections(20);
      triggerNextSkillDraw();
      addNotification('하드코어 특별 보급: 스킬 20회 뽑기 가동!', '🎁', 'cyan');
    }
  };

  // Keyboard shortcut for Skills (E, Q, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // Prevent triggering skills while typing in input fields
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // Prevent triggering skills during menu, pause, or class selection
      if (
        playerClass === null ||
        gameMode === null ||
        isStatsOpen ||
        isQuestsOpen ||
        isCodexOpen ||
        isSkillSelectOpen ||
        isGameOverOpen ||
        isBlueprintSelectionOpen ||
        isBlueprintInventoryOpen ||
        isRankingOpen
      ) {
        return;
      }

      const key = e.key;
      const activeList = acquiredSkills.filter((s) => s.definition.type === 'ACTIVE');

      let targetIndex = -1;
      const num = parseInt(key, 10);
      if (!isNaN(num) && num >= 1 && num <= activeList.length) {
        targetIndex = num - 1;
      } else if (key.toLowerCase() === 'e') {
        targetIndex = 0;
      } else if (key.toLowerCase() === 'q') {
        targetIndex = 1;
      } else if (key.toLowerCase() === 'r') {
        targetIndex = 2;
      }

      if (targetIndex >= 0 && activeList[targetIndex] && activeList[targetIndex].currentCooldown <= 0) {
        const targetSkill = activeList[targetIndex];
        setActiveSkillTrigger(targetSkill.id);
        setAcquiredSkills((prev) =>
          prev.map((s) =>
            s.id === targetSkill.id ? { ...s, currentCooldown: s.definition.cooldown || 5 } : s
          )
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    acquiredSkills,
    playerClass,
    gameMode,
    isStatsOpen,
    isQuestsOpen,
    isCodexOpen,
    isSkillSelectOpen,
    isGameOverOpen,
    isBlueprintSelectionOpen,
    isBlueprintInventoryOpen,
    isRankingOpen,
  ]);

  const unclaimedQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;
  const currentWaveConfig = WAVE_CONFIGS.find((w) => w.waveNumber === currentWave) || null;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        currentWave={currentWave}
        level={level}
        unspentPoints={unspentPoints}
        unclaimedQuests={unclaimedQuestsCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenCodex={() => setIsCodexOpen(true)}
        onOpenQuests={handleOpenQuests}
        onOpenStats={() => setIsStatsOpen(true)}
        onRestart={handleRestart}
        onOpenBlueprints={() => {
          if (coupons > 0) {
            setIsBlueprintSelectionOpen(true);
          } else {
            setIsBlueprintInventoryOpen(true);
          }
        }}
        onOpenRanking={() => setIsRankingOpen(true)}
        blueprintCount={ownedBlueprints.length}
        coupons={coupons}
        gameMode={gameMode || 'STORY'}
        synergyCount={activeSynergies.length}
      />

      {/* Main Canvas Arena & HUD Container */}
      <main className="relative flex-1 w-full overflow-hidden">
        {/* Full-screen Subtle Ambient Hue Shift for Starlight & ERROR Boss Fights */}
        {activeBossType === 'STARLIGHT' && (
          <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08)_0%,rgba(168,85,247,0.11)_65%,transparent_100%)] transition-opacity duration-1000" />
        )}
        {activeBossType === 'ERROR' && (
          <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.09)_0%,rgba(6,182,212,0.08)_65%,transparent_100%)] transition-opacity duration-1000" />
        )}
        {/* Rank Mode Timeattack Widget */}
        {gameMode === 'RANK' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in">
            <div className="bg-slate-900/90 border border-amber-500/40 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <div className="text-left">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  별빛 보스전 타임어택
                </div>
                <div className="text-lg sm:text-xl font-black text-white tabular-nums tracking-wider font-mono">
                  {rankElapsed.toFixed(2)}s
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brawl Mode Timeline Gauge */}
        {gameMode === 'BRAWL' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm sm:max-w-md px-4 pointer-events-none animate-fade-in">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-black">
                <div className="flex items-center gap-2">
                  <span className={brawlElapsed >= 360 ? "text-red-400 animate-pulse flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
                    {brawlElapsed >= 360 ? "☠️ 보스 총공격!" : "⚔️ 조무래기 난투"}
                  </span>
                  <span className="text-rose-400 font-mono bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px]">
                    ❤️ {Math.ceil(hp)}/{Math.ceil(effectiveStats.maxHp)}
                  </span>
                </div>
                <span className="text-slate-300 font-mono tracking-wider">
                  {brawlElapsed >= 360 ? "보스를 처치하십시오!" : `${Math.floor(brawlElapsed / 60)}분 ${Math.floor(brawlElapsed % 60)}초 / 6분`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-100 ${
                    brawlElapsed >= 360
                      ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse"
                      : "bg-gradient-to-r from-amber-500 to-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, (brawlElapsed / 360) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Game Arena Canvas */}
        <GameCanvas
          currentWave={currentWave}
          stats={effectiveStats}
          acquiredSkills={acquiredSkills}
          activeStatusEffects={activeStatusEffects}
          onAddStatusEffect={(type, dur) => {
            setActiveStatusEffects((prev) => {
              if (prev.some((e) => e.type === type)) return prev;
              return [...prev, { type, duration: dur, maxDuration: dur }];
            });
          }}
          onRemoveStatusEffect={(type) => {
            setActiveStatusEffects((prev) => prev.filter((e) => e.type !== type));
          }}
          onEnemyKilled={handleEnemyKilled}
          onPlayerTakeDamage={handlePlayerTakeDamage}
          onWaveClear={handleWaveClear}
          moveDirection={moveDirection}
          isAttackPressed={isAttackPressed}
          activeSkillTrigger={activeSkillTrigger}
          onSkillTriggerHandled={() => setActiveSkillTrigger(null)}
          onUpdateBossStatus={(name, bossHp, maxHp, code, phase) =>
            setBossInfo({ name, hp: bossHp, maxHp, code, phase })
          }
          onUpdateAttackCooldown={(remaining, total) => {
            setAttackCdRemaining(remaining);
            setAttackCdTotal(total);
          }}
          onTriggerNotification={addNotification}
          isPaused={
            playerClass === null ||
            isStatsOpen ||
            isQuestsOpen ||
            isCodexOpen ||
            isSkillSelectOpen ||
            isGameOverOpen ||
            isBlueprintSelectionOpen ||
            isBlueprintInventoryOpen ||
            isRankingOpen ||
            gameMode === null
          }
          playerClass={playerClass || 'ASSASSIN'}
          killedBugCount={killedBugCount}
          gameMode={gameMode}
          onUpdateBrawlTime={setBrawlElapsed}
          onUpdateRankTime={setRankElapsed}
          onRankCleared={(clearSec) => {
            setRankClearTime(clearSec);
            setRankElapsed(clearSec);
          }}
          dashTrigger={dashTrigger}
          onUpdateDashCooldown={(remaining, total) => {
            setDashCdRemaining(remaining);
            setDashCdTotal(total);
          }}
        />

        {/* HUD Overlay */}
        <HUD
          hp={hp}
          maxHp={effectiveStats.maxHp}
          level={level}
          xp={totalXp}
          nextLevelXp={totalXp + (50 - (totalXp % 50))}
          currentWave={currentWave}
          stats={effectiveStats}
          acquiredSkills={acquiredSkills}
          activeStatusEffects={activeStatusEffects}
          bossName={bossInfo.name}
          bossHp={bossInfo.hp}
          bossMaxHp={bossInfo.maxHp}
          bossCode={bossInfo.code}
          bossPhase={bossInfo.phase}
          onUseSkill={(skillId) => {
            const skill = acquiredSkills.find((s) => s.id === skillId);
            if (skill && skill.currentCooldown <= 0) {
              setActiveSkillTrigger(skillId);
              setAcquiredSkills((prev) =>
                prev.map((s) =>
                  s.id === skillId ? { ...s, currentCooldown: s.definition.cooldown || 5 } : s
                )
              );
            }
          }}
          moveDirection={moveDirection}
          onSetMoveDirection={setMoveDirection}
          isAttackPressed={isAttackPressed}
          onSetAttackPressed={setIsAttackPressed}
          playerClass={playerClass}
          attackCdRemaining={attackCdRemaining}
          attackCdTotal={attackCdTotal}
          onDash={() => setDashTrigger((t) => t + 1)}
          dashCdRemaining={dashCdRemaining}
          dashCdTotal={dashCdTotal}
          gameMode={gameMode || 'STORY'}
          activeSynergies={activeSynergies}
          onOpenBlueprints={() => setIsBlueprintInventoryOpen(true)}
        />

        {/* Wave Banner Announcement */}
        {gameMode !== 'BRAWL' && gameMode !== 'HARDCORE' && <WaveBanner waveInfo={currentWaveConfig} visible={showWaveBanner} />}

        {/* Level Up & Resistance Random Stat Notifications */}
        <div
          className={`absolute ${
            bossInfo.name && bossInfo.hp !== undefined && bossInfo.hp > 0 ? 'top-24 sm:top-28' : 'top-16'
          } left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 pointer-events-none select-none w-full max-w-xs sm:max-w-md px-4 transition-all duration-300`}
        >
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`bg-slate-950/95 border ${
                  notif.colorTheme === 'emerald'
                    ? 'border-emerald-500/50 text-emerald-300 shadow-emerald-500/10'
                    : 'border-amber-500/50 text-amber-200 shadow-amber-500/10'
                } px-3.5 py-1 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md`}
              >
                <span className="text-sm sm:text-base">{notif.icon}</span>
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">{notif.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* MODALS */}
      <LevelUpModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        level={level}
        unspentPoints={unspentPoints}
        stats={stats}
        onUpgradeStat={handleUpgradeStat}
      />

      <SkillSelectModal
        isOpen={isSkillSelectOpen}
        choices={skillChoices}
        onSelectSkill={handleSelectSkill}
        remainingPicks={pendingSkillSelections}
      />

      <QuestModal
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
        quests={quests}
        onClaimQuest={handleClaimQuest}
      />

      <CodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        isVictory={isVictory}
        waveReached={currentWave}
        level={level}
        totalXp={totalXp}
        enemiesKilled={enemiesKilled}
        bossesKilled={bossesKilled}
        onRestart={handleRestart}
        gameMode={gameMode}
        clearTime={gameMode === 'RANK' ? (rankClearTime || rankElapsed) : undefined}
        playerClass={playerClass || undefined}
        onOpenRanking={() => setIsRankingOpen(true)}
      />

      <BlueprintSelectionModal
        isOpen={isBlueprintSelectionOpen}
        onClose={handleCloseBlueprintSelection}
        coupons={coupons}
        ownedBlueprints={ownedBlueprints}
        onConfirm={handleConfirmBlueprints}
      />

      <BlueprintInventoryModal
        isOpen={isBlueprintInventoryOpen}
        onClose={() => setIsBlueprintInventoryOpen(false)}
        inventoryIds={ownedBlueprints}
        ownedBlueprints={ownedBlueprints}
        onOpenSelection={() => {
          setIsBlueprintInventoryOpen(false);
          setIsBlueprintSelectionOpen(true);
        }}
        onOpenCouponShop={() => {
          setIsBlueprintInventoryOpen(false);
          setIsBlueprintSelectionOpen(true);
        }}
        coupons={coupons}
      />

      <HomeModeSelect
        isOpen={gameMode === null}
        onSelect={(mode) => {
          setGameMode(mode);
          if (mode === 'HARDCORE') {
            setCoupons(3);
            setOwnedBlueprints([]);
          }
        }}
        onOpenRanking={() => setIsRankingOpen(true)}
      />

      <RankingModal
        isOpen={isRankingOpen}
        onClose={() => setIsRankingOpen(false)}
      />

      <ClassSelectModal
        isOpen={gameMode !== null && playerClass === null}
        onSelect={handleSelectClass}
      />
    </div>
  );
}
