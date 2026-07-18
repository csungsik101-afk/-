import { EnemyDefinition, SkillDefinition, WaveInfo } from '../types/game';

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  '3-1_UI_BUG': {
    id: '3-1_UI_BUG',
    code: '3-1',
    name: '눈뽕몬',
    category: 'BUG',
    isBoss: false,
    hp: 5,
    maxHp: 5,
    xp: 10,
    speed: 0.9,
    damage: 1,
    radius: 16,
    color: '#E11D48', // rose-600
    icon: 'Bug',
    abilityName: '화면 암전 (10초 주기 5% 확률)',
    description: '1웨이브 생성. 10초에 한번 5% 확률로 화면 암전 5초와 1데미지를 입힙니다.'
  },
  '3-2_LOGIC_BUG': {
    id: '3-2_LOGIC_BUG',
    code: '3-2',
    name: '수갑몬',
    category: 'BUG',
    isBoss: false,
    hp: 10,
    maxHp: 10,
    xp: 30,
    speed: 1.0,
    damage: 1,
    radius: 18,
    color: '#D97706', // amber-600
    icon: 'Cpu',
    abilityName: '공격 마비 (15초 주기 10% 확률)',
    description: '2웨이브 생성. 15초에 한번 10% 확률로 1초 동안 플레이어의 공격을 불가능하게 만듭니다.'
  },
  '3-3_SERVER_BUG': {
    id: '3-3_SERVER_BUG',
    code: '3-3',
    name: '공허몬',
    category: 'BUG',
    isBoss: false,
    hp: 20,
    maxHp: 20,
    xp: 50,
    speed: 0.85,
    damage: 2,
    radius: 20,
    color: '#9333EA', // purple-600
    icon: 'ServerCrash',
    abilityName: '공허 생성 (즉사 구역)',
    description: '3웨이브 생성. 10초에 한번 5% 확률로 배틀필드 랜덤 위치에 3초 동안 구역이 빨간색으로 점멸한 뒤 공허를 생성합니다. 공허에 닿을 시 즉사합니다.'
  },
  '3-4_DATA_BUG': {
    id: '3-4_DATA_BUG',
    code: '3-4',
    name: '리세마라몬',
    category: 'BUG',
    isBoss: false,
    hp: 30,
    maxHp: 30,
    xp: 70,
    speed: 1.1,
    damage: 2,
    radius: 22,
    color: '#059669', // emerald-600
    icon: 'Database',
    abilityName: '스탯 초기화',
    description: '4웨이브 생성. 플레이어가 10초간 공격 안할 시, 20초에 한번 1% 확률로 스탯을 초기화합니다.'
  },
  '3-5_SECURITY_BUG': {
    id: '3-5_SECURITY_BUG',
    code: '3-5',
    name: '롤플레이어몬',
    category: 'BUG',
    isBoss: false,
    hp: 50,
    maxHp: 50,
    xp: 100,
    speed: 0.95,
    damage: 3,
    radius: 24,
    color: '#DC2626', // red-600
    icon: 'ShieldAlert',
    abilityName: '조종 불가 (5초)',
    description: '5웨이브 생성. 20초에 1% 확률로 5초 동안 캐릭터 조종 불가능 상태로 만듭니다.'
  },
  '3-6_STALKER_USER': {
    id: '3-6_STALKER_USER',
    code: '3-6',
    name: '스토커 (보스)',
    category: 'USER',
    isBoss: true,
    hp: 10,
    maxHp: 10,
    xp: 10,
    speed: 1.5,
    damage: 1,
    radius: 24,
    color: '#2563EB', // blue-600
    icon: 'Eye',
    abilityName: '고속 추적',
    description: '1웨이브 보스. 이동속도가 1.5로 매우 빠르며 공격 시 1데미지를 입힙니다.'
  },
  '3-7_IMPERSONATOR_USER': {
    id: '3-7_IMPERSONATOR_USER',
    code: '3-7',
    name: '응아무것도못하죠 (보스)',
    category: 'USER',
    isBoss: true,
    hp: 20,
    maxHp: 20,
    xp: 10,
    speed: 0.5,
    damage: 1,
    radius: 26,
    color: '#0D9488', // teal-600
    icon: 'UserX',
    abilityName: '접촉 시 조종 불가 (3초)',
    description: '2웨이브 보스. 이동속도는 0.5로 느리지만 플레이어와 닿을 시 캐릭터를 3초 동안 조종할 수 없게 만듭니다 (중복 불가).'
  },
  '3-8_AGGRESSIVE_USER': {
    id: '3-8_AGGRESSIVE_USER',
    code: '3-8',
    name: '별빛 부하 (보스)',
    category: 'USER',
    isBoss: true,
    hp: 30,
    maxHp: 30,
    xp: 30,
    speed: 0.7,
    damage: 7,
    radius: 28,
    color: '#B91C1C', // red-700
    icon: 'Flame',
    abilityName: '강한 화력 (공격력 7)',
    description: '3웨이브 보스. 이동속도 0.7이며 공격력이 7로 막강합니다.'
  },
  '3-9_SPAMMER_USER': {
    id: '3-9_SPAMMER_USER',
    code: '3-9',
    name: '응그림자분신술 (보스)',
    category: 'USER',
    isBoss: true,
    hp: 45,
    maxHp: 45,
    xp: 50,
    speed: 0.8,
    damage: 3,
    radius: 30,
    color: '#4F46E5', // indigo-600
    icon: 'Copy',
    abilityName: '도배 분신 복제',
    description: '4웨이브 보스. 10초당 5% 확률로 스스로를 10개로 복제합니다. 복제본은 공격력 3이며 15초 후 자동 소멸합니다.'
  },
  '3-10_TROLL_USER': {
    id: '3-10_TROLL_USER',
    code: '3-10',
    name: '응강화된눈뽕몬 (보스)',
    category: 'USER',
    isBoss: true,
    hp: 70,
    maxHp: 70,
    xp: 55,
    speed: 0.85,
    damage: 4,
    radius: 34,
    color: '#BE185D', // pink-700
    icon: 'Skull',
    abilityName: '시선 응시 시 암전',
    description: '5웨이브 보스. 10초당 10% 확률로 플레이어의 시선이 자신을 향해 있으면 화면을 3초간 암전시킵니다.'
  },
  '3-11_STARLIGHT_BOSS': {
    id: '3-11_STARLIGHT_BOSS' as any,
    code: '3-11',
    name: '별빛 (최종 흑막 보스)',
    category: 'USER',
    isBoss: true,
    hp: 150,
    maxHp: 150,
    xp: 200,
    speed: 0.8,
    damage: 7,
    radius: 40,
    color: '#EAB308', // yellow-500
    icon: 'Star',
    abilityName: '3단계 페이즈 전투',
    description: '최종 보스 별빛. 150 체력, 이동속도 0.8, 공격력 7, 공격속도 1.5. 1페이즈(랜덤 광역폭격), 2페이즈(주변 자폭폭파), 3페이즈(회전 톱날 방어벽).'
  },
  '11-1_BOT': {
    id: '11-1_BOT',
    code: '11-1',
    name: '조무래기',
    category: 'BOT',
    isBoss: false,
    hp: 3,
    maxHp: 3,
    xp: 20,
    speed: 0.8,
    damage: 1,
    radius: 14,
    color: '#64748B', // slate-500
    icon: 'Bot',
    abilityName: '기본 봇',
    description: '공격력 1, 체력 3, 처치 시 20 XP를 지급하는 기본 조무래기 봇입니다.'
  }
};

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    id: '10-1_EXPLOSION',
    code: '10-1',
    name: '10-1 폭발 (Explosion)',
    type: 'ACTIVE',
    probability: 10,
    cooldown: 10,
    damage: 6,
    icon: 'Bomb',
    color: '#EF4444',
    description: '주변 반경 5블럭에 6데미지를 입힙니다. 스킬이 중첩될 때마다 데미지가 1씩 증가합니다. (Active, 쿨타임: 10초)'
  },
  {
    id: '10-2_SLASH',
    code: '10-2',
    name: '10-2 베기 (Slash)',
    type: 'ACTIVE',
    probability: 10,
    cooldown: 5,
    damage: 5,
    icon: 'Sword',
    color: '#F59E0B',
    description: '바라보는 방향 60° 반경에 5데미지를 입힙니다. 스킬이 중첩될 때마다 데미지가 1씩 증가합니다. (Active, 쿨타임: 5초)'
  },
  {
    id: '10-3_MAGIC',
    code: '10-3',
    name: '10-3 마법 (Magic)',
    type: 'ACTIVE',
    probability: 15,
    cooldown: 12,
    damage: 7,
    icon: 'Sparkles',
    color: '#8B5CF6',
    description: '바라보는 방향으로 7데미지짜리 구체를 발사합니다 (속도 0.7). 스킬이 중첩될 때마다 속도가 0.8 증가합니다. (Active, 쿨타임: 12초)'
  },
  {
    id: '10-5_LAST_STRIKE',
    code: '10-5',
    name: '10-5 마지막 일격 (Last Strike)',
    type: 'PASSIVE',
    probability: 10,
    icon: 'HeartHandshake',
    color: '#EC4899',
    description: '사망 시 10초 동안 유령 상태로 변하며 이 시간에 보스를 처치하면 완전히 부활합니다. 스킬이 중첩될 때마다 지속 시간이 1초씩 단축됩니다. (Passive)'
  },
  {
    id: '10-7_GO_AWAY',
    code: '10-7',
    name: '10-7 저리 꺼져!!!!',
    type: 'PASSIVE',
    probability: 15,
    icon: 'Zap',
    color: '#F97316',
    description: '몬스터에게 주는 피해량이 2.5% 증가하고, 타격 시 밀치기 힘이 1.5% 증가합니다. 스킬이 중첩될 때마다 수치가 0.5%씩 증가합니다. (Passive)'
  },
  {
    id: '10-8_STAR_EASTER_EGG',
    code: '10-8',
    name: '10-8 별 이스터에그 (Star Easter Egg)',
    type: 'INSTANT',
    probability: 10,
    damage: 1,
    icon: 'Star',
    color: '#EAB308',
    description: '[1회성 즉시시전] 사방에 1데미지짜리 별을 흩뿌립니다. (비밀 규칙: 최종보스 별빛에게는 10데미지를 입힙니다)'
  },
  {
    id: '10-9_DAGGER',
    code: '10-9',
    name: '10-9 단검 (Dagger)',
    type: 'ACTIVE',
    probability: 5,
    cooldown: 7,
    damage: 5,
    icon: 'Sword',
    color: '#14B8A6',
    description: '주변 몬스터에게 5데미지짜리 단검을 1.2의 속도로 투척합니다. 스킬이 중첩될 때마다 발사되는 단검 개수가 1개씩 증가합니다. (Active, 쿨타임: 7초)'
  },
  {
    id: '10-11_SHIELD',
    code: '10-11',
    name: '10-11 보호막 (Shield)',
    type: 'PASSIVE',
    probability: 15,
    cooldown: 10,
    icon: 'ShieldCheck',
    color: '#60A5FA',
    description: '10초마다 10데미지를 방어해주는 보호막이 재생됩니다. 스킬이 중첩될 때마다 쿨타임이 0.5초 감소하고, 방어 한도가 1데미지씩 증가합니다. (Passive)'
  },
  {
    id: '10-12_PASSIVE_DAGGER',
    code: '10-12',
    name: '10-12 단검 (Passive Dagger)',
    type: 'PASSIVE',
    probability: 5,
    cooldown: 7,
    damage: 5,
    icon: 'Sword',
    color: '#06B6D4',
    description: '7초마다 주변 몬스터에게 5데미지짜리 단검을 1.2의 속도로 투척합니다. 스킬이 중첩될 때마다 투척되는 단검 개수가 1개씩 증가합니다. (Passive)'
  }
];

export const WAVE_CONFIGS: WaveInfo[] = [
  {
    waveNumber: 1,
    title: '1웨이브: 침공의 시작',
    bossCode: '3-6_STALKER_USER',
    bugCode: '3-1_UI_BUG',
    description: '스토커(3-6)와 눈뽕몬(3-1)이 침입했습니다! 조무래기(11-1) 10마리와 함께 공격합니다.',
    rewardText: '이동속도 1.2% 증가'
  },
  {
    waveNumber: 2,
    title: '2웨이브: 수갑과 무력화',
    bossCode: '3-7_IMPERSONATOR_USER',
    bugCode: '3-2_LOGIC_BUG',
    description: '응아무것도못하죠(3-7)와 수갑몬(3-2) 등장! 접촉 시 조종 불가와 공격 마비를 주의하세요.',
    rewardText: '조종불가 지속시간 1.2% 감소'
  },
  {
    waveNumber: 3,
    title: '3웨이브: 공허와 강한 화력',
    bossCode: '3-8_AGGRESSIVE_USER',
    bugCode: '3-3_SERVER_BUG',
    description: '공격력 7의 별빛 부하(3-8)와 즉사 공허 장판을 소환하는 공허몬(3-3)이 나타났습니다!',
    rewardText: '기본 공격력 +2 증가'
  },
  {
    waveNumber: 4,
    title: '4웨이브: 분신과 리세마라',
    bossCode: '3-9_SPAMMER_USER',
    bugCode: '3-4_DATA_BUG',
    description: '응그림자분신술(3-9) 보스가 분신을 생성합니다! 공격을 쉬면 리세마라몬(3-4)이 스탯을 초기화합니다.',
    rewardText: '최대 체력 +3 증가'
  },
  {
    waveNumber: 5,
    title: '5웨이브: 강화된 공격전 (특수 룰)',
    bossCode: '3-10_TROLL_USER',
    bugCode: '3-5_SECURITY_BUG',
    description: '응강화된눈뽕몬(3-10)과 롤플레이어몬(3-5)! 시선이 향하면 암전됩니다. 상태이상은 최대 1개만 적용됩니다.',
    rewardText: '암전 지속시간 0.8% 단축',
    isSpecialRule: true
  },
  {
    waveNumber: 6,
    title: '최종 페이즈: 별빛 보스전',
    bossCode: '3-11_STARLIGHT_BOSS',
    bugCode: '',
    description: '평화로운 마을을 위협하는 만악의 근원, 별빛(3-11)이 등장했습니다! 3단계의 무시무시한 전투 페이즈를 돌파하세요!',
    rewardText: '평화로운 마을의 영웅'
  }
];
