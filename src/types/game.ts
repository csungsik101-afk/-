export type EnemyType =
  | '3-1_UI_BUG'
  | '3-2_LOGIC_BUG'
  | '3-3_SERVER_BUG'
  | '3-4_DATA_BUG'
  | '3-5_SECURITY_BUG'
  | '3-6_STALKER_USER'
  | '3-7_IMPERSONATOR_USER'
  | '3-8_AGGRESSIVE_USER'
  | '3-9_SPAMMER_USER'
  | '3-9_CLONE'
  | '3-10_TROLL_USER'
  | '11-1_BOT';

export type EnemyCategory = 'BUG' | 'USER' | 'BOT';

export interface EnemyDefinition {
  id: EnemyType;
  code: string;
  name: string;
  category: EnemyCategory;
  isBoss: boolean;
  hp: number;
  maxHp: number;
  xp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  icon: string;
  description: string;
  abilityName: string;
}

export interface ActiveStatusEffect {
  type: 'BLACKOUT' | 'DISABLE_ATTACK' | 'CONTROL_DISABLED' | 'STAT_RESET' | 'REVIVAL_GHOST';
  duration: number; // seconds remaining
  maxDuration: number;
}

export interface PlayerStats {
  attack: number;         // 7-1: level * 1.5%
  attackPoints: number;   // 0~30
  moveSpeed: number;      // 7-2: level * 1.7%
  moveSpeedPoints: number;// 0~30
  maxHp: number;          // 7-3: level * 1.2%
  maxHpPoints: number;    // 0~30
  attackSpeed: number;    // 7-4: level * 1.3%
  attackSpeedPoints: number; // 0~30
  range: number;          // 7-5: level * 1.1%
  rangePoints: number;    // 0~30
  regenSpeed: number;     // 7-6: level * 1.2%
  regenSpeedPoints: number; // 0~10
}

export interface SkillDefinition {
  id: string;
  code: string;
  name: string;
  type: 'ACTIVE' | 'PASSIVE' | 'INSTANT';
  probability: number; // percentage weight out of 100
  cooldown?: number; // seconds
  damage?: number;
  description: string;
  icon: string;
  color: string;
}

export interface AcquiredSkill {
  id: string;
  definition: SkillDefinition;
  level: number;
  currentCooldown: number; // seconds remaining
}

export interface EnemyEntity {
  uid: string;
  type: EnemyType;
  code: string;
  name: string;
  category: EnemyCategory;
  isBoss: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  xp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  abilityCooldown: number;
  abilityTimer: number;
  spawnTime: number;
  cloneExpireTimer?: number;
  lastSawbladeHitTime?: number;
}

export interface Projectile {
  uid: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  type: 'BASIC' | 'MAGIC_ORB' | 'STAR' | 'DAGGER';
  maxDistance: number;
  traveled: number;
}

export interface VisualEffect {
  uid: string;
  x: number;
  y: number;
  type: 'EXPLOSION' | 'SLASH' | 'TEXT' | 'STAR_RAIN' | 'VOID_ZONE' | 'REVIVE_RING';
  radius?: number;
  angle?: number;
  arcAngle?: number; // radians for custom fan/cone slash angle
  text?: string;
  color: string;
  duration: number; // seconds
  maxDuration: number;
  damage?: number;
}

export interface VoidZone {
  uid: string;
  x: number;
  y: number;
  radius: number;
  timer: number; // 3s countdown blinking red before turning to void
  isVoid: boolean;
  voidDuration: number; // stays active for 5s
}

export interface QuestState {
  id: string;
  code: string;
  title: string;
  targetCount: number;
  currentCount: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface WaveInfo {
  waveNumber: number;
  title: string;
  bossCode: string;
  bugCode: string;
  description: string;
  rewardText: string;
  isSpecialRule?: boolean;
}

export type PlayerClassType = 'ASSASSIN' | 'TANKER' | 'BERSERKER' | 'MAGE';
export type GameModeType = 'STORY' | 'BRAWL';

export interface ClassStatsConfig {
  attack: number;
  moveSpeed: number;
  maxHp: number;
  attackSpeed: number;
  attackAngle: number;
  regenSeconds: number;
  name: string;
  color: string;
  secondaryColor: string;
}

export const CLASS_BASE_STATS: Record<PlayerClassType, ClassStatsConfig> = {
  ASSASSIN: {
    attack: 2.0,
    moveSpeed: 1.0,
    maxHp: 3,
    attackSpeed: 1.5,
    attackAngle: 20,
    regenSeconds: 15,
    name: '암살자',
    color: '#F43F5E',
    secondaryColor: '#FB7185',
  },
  TANKER: {
    attack: 5.0,
    moveSpeed: 0.3,
    maxHp: 7,
    attackSpeed: 0.6,
    attackAngle: 90,
    regenSeconds: 17,
    name: '탱커',
    color: '#6366F1',
    secondaryColor: '#818CF8',
  },
  BERSERKER: {
    attack: 1.0,
    moveSpeed: 0.8,
    maxHp: 6,
    attackSpeed: 1.0,
    attackAngle: 40,
    regenSeconds: 10,
    name: '버서커',
    color: '#EF4444',
    secondaryColor: '#F87171',
  },
  MAGE: {
    attack: 2.0,
    moveSpeed: 0.8,
    maxHp: 5,
    attackSpeed: 0.9,
    attackAngle: 180,
    regenSeconds: 10,
    name: '마법사',
    color: '#10B981',
    secondaryColor: '#34D399',
  },
};

