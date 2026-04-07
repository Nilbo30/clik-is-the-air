// --- Game State & Core Logic ---

const Game = {
  state: null,

  initState() {
    const s = {
      dmg: 1,
      cost: 1,
      energy: 50,
      maxEnergy: 50,
      xp: 0,
      xpMult: 1,
      level: 1,
      xpToLevel: 100,
      wave: 1,
      enemyHp: 250,
      enemyMaxHp: 250,
      luckyBonus: 0,
      guarantee: null,
      cooldown: 1.0,
      lastClickTime: 0,
      kills: 0,
    };
    // Apply prestige upgrades
    Prestige.applyUpgrades(s);
    return s;
  },

  onClickEnemy(ignoreCooldown = false) {
    const s = Game.state;
    console.log({
      ignoreCooldown,
      goOvlOpen: UI.dom.goOvl.classList.contains('open'),
      modalOvlOpen: UI.dom.modalOvl.classList.contains('open'),
      timeSinceLastClick: Date.now() - s.lastClickTime,
      cooldownMs: s.cooldown * 1000,
      wouldBlock: Date.now() - s.lastClickTime < s.cooldown * 1000
    });
    if (UI.dom.goOvl.classList.contains('open')) return;
    if (!ignoreCooldown && UI.dom.modalOvl.classList.contains('open')) return;

    // Cooldown check
    if (!ignoreCooldown) {
      if (Date.now() - s.lastClickTime < s.cooldown * 1000) return;
      s.lastClickTime = Date.now();
      console.log('lastClickTime updated', s.lastClickTime, 'state.lastClickTime', Game.state.lastClickTime);
    }

    // Spend energy
    s.energy -= s.cost;

    // Deal damage
    s.enemyHp = Math.max(0, s.enemyHp - s.dmg);
    UI.spawnDmgNumber(s.dmg);
    UI.shakeEnemy();

    // Check energy
    if (s.energy <= 0) {
      s.energy = 0;
      UI.render();
      Game.gameOver();
      return;
    }

    // XP (with multiplier)
    s.xp += Math.floor(10 * s.xpMult);
    if (s.xp >= s.xpToLevel) {
      s.xp -= s.xpToLevel;
      s.level++;
      UI.render();
      Skills.showLevelUp();
    }

    // Enemy dead → next wave
    if (s.enemyHp <= 0) {
      s.kills++;
      s.wave++;
      s.enemyMaxHp = Math.ceil(s.enemyMaxHp * 1.5);
      s.enemyHp = s.enemyMaxHp;
    }

    UI.render();
  },

  gameOver() {
    const s = Game.state;
    const dpEarned = Prestige.calcDP(s.kills);
    Prestige.dp += dpEarned;
    Prestige.save();

    UI.dom.goKills.textContent = s.kills;
    UI.dom.goDpEarned.textContent = dpEarned;
    UI.dom.goDpTotal.textContent = Prestige.dp;
    UI.dom.goStats.textContent = 'Reached wave ' + s.wave + ' · Level ' + s.level;
    UI.dom.goOvl.classList.add('open');
  },

  restart() {
    // Hide all overlays first
    UI.dom.goOvl.classList.remove('open');
    UI.dom.modalOvl.classList.remove('open');

    // Fully reset state to base values, then apply prestige
    Game.state = Game.initState();
    Game.state.energy = Game.state.maxEnergy;
    UI.render();

    // If L1 purchased, show skill choice after everything is reset
    if (Prestige.purchased['L1']) {
      setTimeout(() => Skills.showLevelUp(), 0);
    }
  },

  init() {
    Prestige.load();
    Game.state = Game.initState();
    Game.state.energy = Game.state.maxEnergy;
    UI.dom.enemyBtn.addEventListener('click', () => Game.onClickEnemy(false));
    UI.dom.restartBtn.addEventListener('click', Game.restart);
    UI.dom.prestigeBtn.addEventListener('click', Prestige.showScreen);
    UI.dom.prestigeBack.addEventListener('click', Prestige.hideScreen);
    UI.dom.goPrestigeBtn.addEventListener('click', () => {
      UI.dom.goOvl.classList.remove('open');
      Prestige.showScreen();
    });
    UI.render();

    // If L1 purchased, show skill choice on first load too
    if (Prestige.purchased['L1']) {
      setTimeout(() => Skills.showLevelUp(), 0);
    }
  },
};
