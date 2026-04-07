// --- Game State & Core Logic ---

const Game = {
  state: null,

  initState() {
    return {
      dmg: 1,
      cost: 1,
      energy: 50,
      maxEnergy: 50,
      xp: 0,
      level: 1,
      xpToLevel: 100,
      wave: 1,
      enemyHp: 100,
      enemyMaxHp: 100,
      luckyBonus: 0,
      guarantee: null,
      cooldown: 1.0,
      lastClickTime: 0,
    };
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

    // XP
    s.xp += 10;
    if (s.xp >= s.xpToLevel) {
      s.xp -= s.xpToLevel;
      s.level++;
      UI.render();
      Skills.showLevelUp();
    }

    // Enemy dead → next wave
    if (s.enemyHp <= 0) {
      s.wave++;
      s.enemyMaxHp = Math.ceil(s.enemyMaxHp * 1.5);
      s.enemyHp = s.enemyMaxHp;
    }

    UI.render();
  },

  gameOver() {
    UI.dom.goStats.textContent = 'Reached wave ' + Game.state.wave + ' · Level ' + Game.state.level;
    UI.dom.goOvl.classList.add('open');
  },

  restart() {
    UI.dom.goOvl.classList.remove('open');
    UI.dom.modalOvl.classList.remove('open');
    Game.state = Game.initState();
    UI.render();
  },

  init() {
    Game.state = Game.initState();
    UI.dom.enemyBtn.addEventListener('click', () => Game.onClickEnemy(false));
    UI.dom.restartBtn.addEventListener('click', Game.restart);
    UI.render();
  },
};
