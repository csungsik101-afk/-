import { BlueprintItem, BlueprintSynergy } from '../types/game';

export const BLUEPRINT_LIST: BlueprintItem[] = [
  // --- ⚔️ 무기 5종 ---
  {
    id: 'wp_1',
    name: '마법서',
    type: 'WEAPON',
    typeLabel: '무기',
    index: 1,
    effectDescription: '사거리 +1칸, 공격력 +5%, 공격속도 -5%',
    statsBonus: {
      rangeBlocks: 1,
      attackPercent: 0.05,
      attackSpeedPercent: -0.05,
    },
    icon: 'BookOpen',
  },
  {
    id: 'wp_2',
    name: '장검',
    type: 'WEAPON',
    typeLabel: '무기',
    index: 2,
    effectDescription: '사거리 +0칸, 공격력 +5%, 공격속도 -5%',
    statsBonus: {
      rangeBlocks: 0,
      attackPercent: 0.05,
      attackSpeedPercent: -0.05,
    },
    icon: 'Sword',
  },
  {
    id: 'wp_3',
    name: '단검',
    type: 'WEAPON',
    typeLabel: '무기',
    index: 3,
    effectDescription: '사거리 +0칸, 공격력 +10%, 공격속도 +5%',
    statsBonus: {
      rangeBlocks: 0,
      attackPercent: 0.10,
      attackSpeedPercent: 0.05,
    },
    icon: 'Sparkles',
  },
  {
    id: 'wp_4',
    name: '해머',
    type: 'WEAPON',
    typeLabel: '무기',
    index: 4,
    effectDescription: '사거리 +1칸, 공격력 +10%, 공격속도 -10%',
    statsBonus: {
      rangeBlocks: 1,
      attackPercent: 0.10,
      attackSpeedPercent: -0.10,
    },
    icon: 'Hammer',
  },
  {
    id: 'wp_5',
    name: '활',
    type: 'WEAPON',
    typeLabel: '무기',
    index: 5,
    effectDescription: '사거리 +1칸, 공격력 +5%, 공격속도 -10%',
    statsBonus: {
      rangeBlocks: 1,
      attackPercent: 0.05,
      attackSpeedPercent: -0.10,
    },
    icon: 'Crosshair',
  },

  // --- 🧰 보조도구 5종 ---
  {
    id: 'tool_1',
    name: '깃팬',
    type: 'SUB_TOOL',
    typeLabel: '보조도구',
    index: 1,
    effectDescription: '자체 능력치 없음',
    statsBonus: {},
    icon: 'Feather',
  },
  {
    id: 'tool_2',
    name: '창',
    type: 'SUB_TOOL',
    typeLabel: '보조도구',
    index: 2,
    effectDescription: '자체 능력치 없음',
    statsBonus: {},
    icon: 'Zap',
  },
  {
    id: 'tool_3',
    name: '쌍단검',
    type: 'SUB_TOOL',
    typeLabel: '보조도구',
    index: 3,
    effectDescription: '자체 능력치 없음',
    statsBonus: {},
    icon: 'Scissors',
  },
  {
    id: 'tool_4',
    name: '검',
    type: 'SUB_TOOL',
    typeLabel: '보조도구',
    index: 4,
    effectDescription: '자체 능력치 없음',
    statsBonus: {},
    icon: 'ShieldAlert',
  },
  {
    id: 'tool_5',
    name: '실',
    type: 'SUB_TOOL',
    typeLabel: '보조도구',
    index: 5,
    effectDescription: '자체 능력치 없음',
    statsBonus: {},
    icon: 'Layers',
  },

  // --- 🛡️ 보조 장비 5종 ---
  {
    id: 'armor_1',
    name: '마법 로브',
    type: 'SUB_ARMOR',
    typeLabel: '보조 장비',
    index: 1,
    effectDescription: '방어력 +5, 이동속도 -5%',
    statsBonus: {
      defenseFlat: 5,
      moveSpeedPercent: -0.05,
    },
    icon: 'Shield',
  },
  {
    id: 'armor_2',
    name: '용사의 갑옷',
    type: 'SUB_ARMOR',
    typeLabel: '보조 장비',
    index: 2,
    effectDescription: '방어력 +5',
    statsBonus: {
      defenseFlat: 5,
    },
    icon: 'ShieldCheck',
  },
  {
    id: 'armor_3',
    name: '약탈자의 옷',
    type: 'SUB_ARMOR',
    typeLabel: '보조 장비',
    index: 3,
    effectDescription: '방어력 +3, 이동속도 +5%',
    statsBonus: {
      defenseFlat: 3,
      moveSpeedPercent: 0.05,
    },
    icon: 'Compass',
  },
  {
    id: 'armor_4',
    name: '탱커의 단단한 갑옷',
    type: 'SUB_ARMOR',
    typeLabel: '보조 장비',
    index: 4,
    effectDescription: '방어력 +10, 이동속도 -5%',
    statsBonus: {
      defenseFlat: 10,
      moveSpeedPercent: -0.05,
    },
    icon: 'Lock',
  },
  {
    id: 'armor_5',
    name: '궁수의 옷',
    type: 'SUB_ARMOR',
    typeLabel: '보조 장비',
    index: 5,
    effectDescription: '방어력 +2, 이동속도 +5%',
    statsBonus: {
      defenseFlat: 2,
      moveSpeedPercent: 0.05,
    },
    icon: 'Target',
  },
];

export const BLUEPRINT_SYNERGIES: BlueprintSynergy[] = [
  {
    id: 'syn_mage',
    name: '마법사',
    recipe: [1, 1, 1],
    effectDescription: '공격력 +3%',
    statsBonus: {
      attackPercent: 0.03,
    },
  },
  {
    id: 'syn_swordsman',
    name: '검사',
    recipe: [2, 2, 2],
    effectDescription: '공격력 +4%',
    statsBonus: {
      attackPercent: 0.04,
    },
  },
  {
    id: 'syn_raider',
    name: '약탈자',
    recipe: [3, 3, 3],
    effectDescription: '공격력 +3%',
    statsBonus: {
      attackPercent: 0.03,
    },
  },
  {
    id: 'syn_tanker',
    name: '탱커',
    recipe: [4, 4, 4],
    effectDescription: '공격력 +5%',
    statsBonus: {
      attackPercent: 0.05,
    },
  },
  {
    id: 'syn_archer',
    name: '궁수',
    recipe: [5, 5, 5],
    effectDescription: '공격력 +5%',
    statsBonus: {
      attackPercent: 0.05,
    },
  },
  {
    id: 'syn_why_work',
    name: '이게 왜 되지?',
    recipe: [4, 2, 1],
    effectDescription: '체력 +5',
    statsBonus: {
      hpFlat: 5,
    },
  },
];

/**
 * Checks which hidden synergies are satisfied by the current blueprint IDs inventory.
 */
export function checkSatisfiedSynergies(inventoryBlueprintIds: string[]): BlueprintSynergy[] {
  const weaponIndices = new Set<number>();
  const toolIndices = new Set<number>();
  const armorIndices = new Set<number>();

  inventoryBlueprintIds.forEach((id) => {
    const bp = BLUEPRINT_LIST.find((b) => b.id === id);
    if (!bp) return;
    if (bp.type === 'WEAPON') weaponIndices.add(bp.index);
    if (bp.type === 'SUB_TOOL') toolIndices.add(bp.index);
    if (bp.type === 'SUB_ARMOR') armorIndices.add(bp.index);
  });

  return BLUEPRINT_SYNERGIES.filter((synergy) => {
    const [wIdx, tIdx, aIdx] = synergy.recipe;
    return weaponIndices.has(wIdx) && toolIndices.has(tIdx) && armorIndices.has(aIdx);
  });
}

/**
 * Calculates aggregated stat multipliers and flat bonuses from selected blueprints and active synergies.
 */
export function calculateBlueprintStats(
  inventoryBlueprintIds: string[],
  activeSynergies: BlueprintSynergy[]
) {
  let attackPercent = 0;
  let attackFlat = 0;
  let attackSpeedPercent = 0;
  let rangeBlocks = 0;
  let defenseFlat = 0;
  let moveSpeedPercent = 0;
  let hpFlat = 0;

  inventoryBlueprintIds.forEach((id) => {
    const bp = BLUEPRINT_LIST.find((b) => b.id === id);
    if (!bp || !bp.statsBonus) return;
    if (bp.statsBonus.attackPercent) attackPercent += bp.statsBonus.attackPercent;
    if (bp.statsBonus.attackFlat) attackFlat += bp.statsBonus.attackFlat;
    if (bp.statsBonus.attackSpeedPercent) attackSpeedPercent += bp.statsBonus.attackSpeedPercent;
    if (bp.statsBonus.rangeBlocks) rangeBlocks += bp.statsBonus.rangeBlocks;
    if (bp.statsBonus.defenseFlat) defenseFlat += bp.statsBonus.defenseFlat;
    if (bp.statsBonus.moveSpeedPercent) moveSpeedPercent += bp.statsBonus.moveSpeedPercent;
  });

  activeSynergies.forEach((syn) => {
    if (syn.statsBonus.attackPercent) attackPercent += syn.statsBonus.attackPercent;
    if (syn.statsBonus.hpFlat) hpFlat += syn.statsBonus.hpFlat;
  });

  return {
    attackPercent,
    attackFlat,
    attackSpeedPercent,
    rangeBlocks,
    defenseFlat,
    moveSpeedPercent,
    hpFlat,
  };
}
