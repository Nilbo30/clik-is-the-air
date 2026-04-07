// --- Debug Mode (Shift + Hover) ---

const Debug = {
  interval: null,
  shiftHeld: false,
  hovering: false,

  update() {
    const shouldRun = Debug.shiftHeld && Debug.hovering;
    if (shouldRun && !Debug.interval) {
      UI.dom.debugBadge.classList.add('on');
      Debug.interval = setInterval(() => Game.onClickEnemy(true), 100);
    } else if (!shouldRun && Debug.interval) {
      clearInterval(Debug.interval);
      Debug.interval = null;
      UI.dom.debugBadge.classList.remove('on');
    }
  },

  init() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Shift' && !Debug.shiftHeld) { Debug.shiftHeld = true; Debug.update(); }
    });
    document.addEventListener('keyup', e => {
      if (e.key === 'Shift') { Debug.shiftHeld = false; Debug.update(); }
    });
    UI.dom.enemyBtn.addEventListener('mouseenter', () => { Debug.hovering = true; Debug.update(); });
    UI.dom.enemyBtn.addEventListener('mouseleave', () => { Debug.hovering = false; Debug.update(); });
  },
};
