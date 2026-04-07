// --- Prestige System ---

const Prestige = {
  // Persistent state (survives across runs)
  dp: 0,
  purchased: {},   // { nodeId: true }

  // Upgrade tree definition
  nodes: [
    { id: 'E1', name: 'Energy I',    desc: '+10 max energy',              cost: 1,  branch: 'stats', requires: null, col: 0, row: 0 },
    { id: 'E2', name: 'Energy II',   desc: '+20 max energy',              cost: 3,  branch: 'stats', requires: 'E1', col: 0, row: 1 },
    { id: 'X1', name: 'XP Boost',    desc: '+10% XP gained',             cost: 3,  branch: 'stats', requires: null, col: 1, row: 0 },
    { id: 'D1', name: 'Damage Up',   desc: '+1 base damage',             cost: 2,  branch: 'stats', requires: null, col: 2, row: 0 },
    { id: 'C1', name: 'Quick Start', desc: '-0.1s base cooldown',        cost: 5,  branch: 'stats', requires: null, col: 3, row: 0 },
    { id: 'R1', name: 'Rarity Up',   desc: '+5% base rarity upgrade',    cost: 5,  branch: 'stats', requires: null, col: 4, row: 0 },
    { id: 'L1', name: 'Head Start',  desc: 'Start each run at level 2',  cost: 10, branch: 'stats', requires: null, col: 5, row: 0 },
  ],

  canPurchase(nodeId) {
    const node = Prestige.nodes.find(n => n.id === nodeId);
    if (!node) return false;
    if (Prestige.purchased[nodeId]) return false;
    if (Prestige.dp < node.cost) return false;
    if (node.requires && !Prestige.purchased[node.requires]) return false;
    return true;
  },

  purchase(nodeId) {
    if (!Prestige.canPurchase(nodeId)) return false;
    const node = Prestige.nodes.find(n => n.id === nodeId);
    Prestige.dp -= node.cost;
    Prestige.purchased[nodeId] = true;
    Prestige.save();
    return true;
  },

  // Apply all purchased upgrades to a fresh game state
  applyUpgrades(state) {
    if (Prestige.purchased['E1']) state.maxEnergy += 10;
    if (Prestige.purchased['E2']) state.maxEnergy += 20;
    if (Prestige.purchased['X1']) state.xpMult = (state.xpMult || 1) + 0.1;
    if (Prestige.purchased['D1']) state.dmg += 1;
    if (Prestige.purchased['C1']) state.cooldown = Math.max(0.2, state.cooldown - 0.1);
    if (Prestige.purchased['R1']) state.luckyBonus += 5;
    if (Prestige.purchased['L1']) state.level = 2;
    return state;
  },

  // Calculate DP earned from a run
  calcDP(killCount) {
    return 1 + killCount;
  },

  // Save/load from localStorage
  save() {
    try {
      localStorage.setItem('clik-prestige', JSON.stringify({
        dp: Prestige.dp,
        purchased: Prestige.purchased,
      }));
    } catch (e) {}
  },

  load() {
    try {
      const data = JSON.parse(localStorage.getItem('clik-prestige'));
      if (data) {
        Prestige.dp = data.dp || 0;
        Prestige.purchased = data.purchased || {};
      }
    } catch (e) {}
  },

  // Render the prestige screen
  renderTree() {
    const container = UI.dom.prestigeNodes;
    container.innerHTML = '';

    // Stats branch
    const statsNodes = Prestige.nodes.filter(n => n.branch === 'stats');
    statsNodes.forEach(node => {
      const owned = !!Prestige.purchased[node.id];
      const canBuy = Prestige.canPurchase(node.id);
      const locked = !owned && !canBuy;

      const el = document.createElement('div');
      el.className = 'pt-node' + (owned ? ' owned' : '') + (canBuy ? ' available' : '') + (locked ? ' locked' : '');
      el.innerHTML =
        '<div class="pt-node-name">' + node.name + '</div>' +
        '<div class="pt-node-desc">' + node.desc + '</div>' +
        '<div class="pt-node-cost">' + (owned ? 'Owned' : node.cost + ' DP') + '</div>';

      if (canBuy) {
        el.addEventListener('click', () => {
          Prestige.purchase(node.id);
          Prestige.renderTree();
          UI.renderPrestigeDp();
        });
      }

      // Draw connector line to parent
      if (node.requires) {
        const connector = document.createElement('div');
        connector.className = 'pt-connector';
        el.prepend(connector);
      }

      container.appendChild(el);
    });

    // Coming soon placeholders
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'pt-branch-placeholder';
      el.innerHTML = '<div class="pt-node-name">???</div><div class="pt-node-desc">Coming soon</div>';
      container.appendChild(el);
    }
  },

  showScreen() {
    Prestige.renderTree();
    UI.renderPrestigeDp();
    UI.dom.prestigeOvl.classList.add('open');
  },

  hideScreen() {
    UI.dom.prestigeOvl.classList.remove('open');
  },
};
