// --- Rarity System & Skill Pool ---

const RARITIES = [
  { id: 'common',    name: 'Common',    mult: 1,   weight: 60 },
  { id: 'rare',      name: 'Rare',      mult: 1.5, weight: 25 },
  { id: 'epic',      name: 'Epic',      mult: 2,   weight: 12 },
  { id: 'legendary', name: 'Legendary', mult: 3,   weight: 3  },
];
const TOTAL_WEIGHT = RARITIES.reduce((s, r) => s + r.weight, 0);

const SKILLS = [
  {
    id: 'heavy', name: 'Heavy Strike', base: 2,
    desc: (v) => '+' + v + ' damage per click',
    apply: (s, v) => { s.dmg += v; },
  },
  {
    id: 'efficient', name: 'Efficient', base: 1,
    desc: (v) => '-' + v + ' energy cost (min 1)',
    apply: (s, v) => { s.cost = Math.max(1, s.cost - v); },
  },
  {
    id: 'berserker', name: 'Berserker', baseDmg: 5, baseCost: 2,
    desc: (v, r) => '+' + Math.floor(5 * r.mult) + ' damage, +' + Math.floor(2 * r.mult) + ' energy cost',
    apply: (s, v, r) => { s.dmg += Math.floor(5 * r.mult); s.cost += Math.floor(2 * r.mult); },
  },
  {
    id: 'focus', name: 'Focus', base: 20,
    desc: (v) => '+' + v + ' max energy',
    apply: (s, v) => { s.maxEnergy += v; s.energy = Math.min(s.energy + v, s.maxEnergy); },
  },
  {
    id: 'quickhands', name: 'Quick Hands', base: 0,
    desc: (v, r) => {
      const vals = { common: 0.1, rare: 0.15, epic: 0.25, legendary: 0.4 };
      return '-' + vals[r.id] + 's cooldown';
    },
    apply: (s, v, r) => {
      const vals = { common: 0.1, rare: 0.15, epic: 0.25, legendary: 0.4 };
      s.cooldown = Math.max(0.2, Math.min(3, s.cooldown - vals[r.id]));
    },
  },
  {
    id: 'slowdeadly', name: 'Slow but Deadly', base: 0,
    desc: (v, r) => {
      const cd = { common: 0.3, rare: 0.4, epic: 0.5, legendary: 0.8 };
      const dm = { common: 3, rare: 6, epic: 12, legendary: 25 };
      return '+' + cd[r.id] + 's cooldown, +' + dm[r.id] + ' damage';
    },
    apply: (s, v, r) => {
      const cd = { common: 0.3, rare: 0.4, epic: 0.5, legendary: 0.8 };
      const dm = { common: 3, rare: 6, epic: 12, legendary: 25 };
      s.cooldown = Math.max(0.2, Math.min(3, s.cooldown + cd[r.id]));
      s.dmg += dm[r.id];
    },
  },
  {
    id: 'lucky', name: 'Lucky', base: 0, isMeta: true,
    desc: (v, r) => {
      const vals = { common: 5, rare: 10, epic: 20, legendary: 35 };
      return '+' + vals[r.id] + '% chance to upgrade skill rarity';
    },
    apply: (s, v, r) => {
      const vals = { common: 5, rare: 10, epic: 20, legendary: 35 };
      s.luckyBonus += vals[r.id];
    },
  },
  {
    id: 'guarantee', name: 'Guarantee', base: 0, isMeta: true,
    desc: (v, r) => {
      const descs = {
        common: 'Next draw: at least one Rare skill',
        rare: 'Next draw: at least one Epic skill',
        epic: 'Next draw: at least one Legendary skill',
        legendary: 'Next draw: ALL 3 skills are Legendary',
      };
      return descs[r.id];
    },
    apply: (s, v, r) => {
      const mapping = { common: 'rare', rare: 'epic', epic: 'legendary', legendary: 'all-legendary' };
      const newG = mapping[r.id];
      // Keep the stronger guarantee
      const rank = { rare: 1, epic: 2, legendary: 3, 'all-legendary': 4 };
      if (!s.guarantee || rank[newG] > rank[s.guarantee]) {
        s.guarantee = newG;
      }
    },
  },
];

const Skills = {
  rollRarity(minRarityIndex = 0) {
    // Roll base rarity from weights
    let roll = Math.random() * TOTAL_WEIGHT;
    let result = RARITIES[0];
    for (const r of RARITIES) {
      roll -= r.weight;
      if (roll <= 0) { result = r; break; }
    }
    let idx = RARITIES.indexOf(result);

    // Lucky bonus: chance to upgrade to next rarity tier
    const state = Game.state;
    if (state && state.luckyBonus > 0 && idx < RARITIES.length - 1) {
      if (Math.random() * 100 < state.luckyBonus) {
        idx++;
      }
    }

    // Enforce minimum rarity
    if (idx < minRarityIndex) idx = minRarityIndex;

    return RARITIES[idx];
  },

  pick3() {
    const state = Game.state;
    const pool = [...SKILLS];
    const out = [];
    const rarityIdx = { rare: 1, epic: 2, legendary: 3 };

    // Determine guarantee state
    const g = state.guarantee;
    const allLegendary = g === 'all-legendary';
    const guaranteedSlot = (!allLegendary && g) ? Math.floor(Math.random() * 3) : -1;

    // Consume guarantee
    state.guarantee = null;

    for (let slot = 0; slot < 3 && pool.length; slot++) {
      const i = Math.floor(Math.random() * pool.length);
      const skill = pool.splice(i, 1)[0];

      let minIdx = 0;
      if (allLegendary) {
        minIdx = 3; // legendary index
      } else if (slot === guaranteedSlot) {
        minIdx = rarityIdx[g] || 0;
      }

      const rarity = Skills.rollRarity(minIdx);
      const scaledVal = Math.floor((skill.base || 0) * rarity.mult);
      out.push({ skill, rarity, scaledVal });
    }
    return out;
  },

  showLevelUp() {
    const state = Game.state;
    const choices = Skills.pick3();
    UI.dom.modalLevel.textContent = 'You reached level ' + state.level + '!';
    UI.dom.skillDiv.innerHTML = '';
    choices.forEach(({ skill, rarity, scaledVal }) => {
      const btn = document.createElement('button');
      btn.className = 'skill-btn rarity-' + rarity.id;
      btn.innerHTML =
        '<span class="skill-rarity">' + rarity.name + '</span>' +
        '<span class="skill-name">' + skill.name + '</span>' +
        '<span class="skill-desc">' + skill.desc(scaledVal, rarity) + '</span>';
      btn.onclick = () => {
        skill.apply(state, scaledVal, rarity);
        UI.dom.modalOvl.classList.remove('open');
        UI.render();
      };
      UI.dom.skillDiv.appendChild(btn);
    });
    UI.dom.modalOvl.classList.add('open');
  },
};
