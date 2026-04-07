// --- DOM References & UI Updates ---

const UI = {
  dom: {},

  initDom() {
    const $ = id => document.getElementById(id);
    UI.dom = {
      enemyBtn:     $('enemy-btn'),
      hpFill:       $('hp-fill'),
      hpText:       $('hp-text'),
      enFill:       $('en-fill'),
      enText:       $('en-text'),
      xpFill:       $('xp-fill'),
      xpText:       $('xp-text'),
      hLevel:       $('h-level'),
      hWave:        $('h-wave'),
      hDmg:         $('h-dmg'),
      hCost:        $('h-cost'),
      hCd:          $('h-cd'),
      hDp:          $('h-dp'),
      modalOvl:     $('modal-overlay'),
      modalLevel:   $('modal-level'),
      skillDiv:     $('skill-choices'),
      goOvl:        $('gameover-overlay'),
      goStats:      $('go-stats'),
      goKills:      $('go-kills'),
      goDpEarned:   $('go-dp-earned'),
      goDpTotal:    $('go-dp-total'),
      restartBtn:   $('restart-btn'),
      goPrestigeBtn:$('go-prestige-btn'),
      guarBadge:    $('guarantee-badge'),
      debugBadge:   $('debug-badge'),
      cdRing:       document.querySelector('#cooldown-ring circle'),
      prestigeBtn:  $('prestige-btn'),
      prestigeOvl:  $('prestige-overlay'),
      prestigeBack: $('prestige-back'),
      prestigeNodes:$('prestige-nodes'),
      ptDp:         $('pt-dp'),
    };
  },

  render() {
    const s = Game.state;
    const d = UI.dom;
    d.hpFill.style.width = (s.enemyHp / s.enemyMaxHp * 100) + '%';
    d.hpText.textContent = s.enemyHp + ' / ' + s.enemyMaxHp;
    d.enFill.style.width = (s.energy / s.maxEnergy * 100) + '%';
    d.enText.textContent = s.energy + ' / ' + s.maxEnergy;
    d.xpFill.style.width = (s.xp / s.xpToLevel * 100) + '%';
    d.xpText.textContent = s.xp + ' / ' + s.xpToLevel;
    d.hLevel.textContent = s.level;
    d.hWave.textContent  = s.wave;
    d.hDmg.textContent   = s.dmg;
    d.hCost.textContent  = s.cost;
    d.hCd.textContent    = s.cooldown.toFixed(1) + 's';
    d.hDp.textContent    = Prestige.dp;

    // Guarantee badge
    d.guarBadge.className = '';
    if (s.guarantee) {
      const labels = {
        rare: 'Next draw: Rare+ guaranteed',
        epic: 'Next draw: Epic+ guaranteed',
        legendary: 'Next draw: Legendary guaranteed',
        'all-legendary': 'Next draw: ALL Legendary!',
      };
      const cls = s.guarantee === 'all-legendary' ? 'g-all-legendary' : 'g-' + s.guarantee;
      d.guarBadge.textContent = labels[s.guarantee];
      d.guarBadge.className = 'on ' + cls;
    }
  },

  renderPrestigeDp() {
    UI.dom.ptDp.textContent = Prestige.dp;
    UI.dom.hDp.textContent = Prestige.dp;
  },

  spawnDmgNumber(amount) {
    const el = document.createElement('span');
    el.className = 'dmg-float';
    el.textContent = '-' + amount;
    el.style.left = (30 + Math.random() * 100) + 'px';
    el.style.top  = (30 + Math.random() * 60) + 'px';
    UI.dom.enemyBtn.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  },

  shakeEnemy() {
    UI.dom.enemyBtn.classList.remove('shake');
    void UI.dom.enemyBtn.offsetWidth; // reflow
    UI.dom.enemyBtn.classList.add('shake');
  },

  // --- Cooldown ring animation ---
  CD_CIRCUMFERENCE: 2 * Math.PI * 90, // matches SVG r=90

  updateCooldownRing() {
    const s = Game.state;
    const now = Date.now();
    const elapsed = now - s.lastClickTime;
    const cdMs = s.cooldown * 1000;
    const progress = Math.min(elapsed / cdMs, 1);
    UI.dom.cdRing.style.strokeDashoffset = UI.CD_CIRCUMFERENCE * (1 - progress);
    if (progress >= 1) {
      UI.dom.enemyBtn.classList.remove('on-cooldown');
    } else {
      UI.dom.enemyBtn.classList.add('on-cooldown');
    }
    requestAnimationFrame(UI.updateCooldownRing);
  },

  startCooldownLoop() {
    requestAnimationFrame(UI.updateCooldownRing);
  },
};
