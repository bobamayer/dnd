(() => {
  'use strict';

  const STORAGE_KEY = 'dungeon-ledger-state-v1';

  /** @type {{started: boolean, nextId: number, players: Array<{id:number, name:string, cls:string, goal:number, treasure:number}>}} */
  let state = { started: false, nextId: 1, players: [] };

  let setupMode = 'new'; // 'new' | 'edit'

  // ---------- Persistence ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.players)) {
          state = Object.assign({ started: false, nextId: 1, players: [] }, parsed);
        }
      }
    } catch (e) {
      console.warn('Could not load saved ledger, starting fresh.', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save ledger.', e);
    }
  }

  // ---------- Helpers ----------
  function formatNumber(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function classLabel(cls) {
    const labels = { rogue: 'Rogue', cleric: 'Cleric', fighter: 'Fighter', wizard: 'Wizard', custom: 'Custom' };
    return labels[cls] || 'Custom';
  }

  // ---------- Screens ----------
  const setupScreen = document.getElementById('setup-screen');
  const gameScreen = document.getElementById('game-screen');

  function showScreen(name) {
    setupScreen.hidden = name !== 'setup';
    gameScreen.hidden = name !== 'game';
  }

  // ================= SETUP SCREEN =================
  const rosterRows = document.getElementById('roster-rows');
  const addRowBtn = document.getElementById('add-row-btn');
  const startBtn = document.getElementById('start-btn');
  const setupError = document.getElementById('setup-error');
  const panelTitle = document.querySelector('.panel-title');
  const panelHint = document.querySelector('.panel-hint');

  let cancelEditBtn = null;

  function createRosterRow(data) {
    const tpl = document.getElementById('roster-row-template');
    const frag = tpl.content.cloneNode(true);
    const row = frag.querySelector('[data-row]');

    const nameInput = row.querySelector('.row-name');
    const classSelect = row.querySelector('.row-class');
    const goalInput = row.querySelector('.row-goal');
    const removeBtn = row.querySelector('.row-remove');

    if (data) {
      nameInput.value = data.name || '';
      classSelect.value = data.cls || 'rogue';
      goalInput.value = data.goal || '';
      if (data.id) row.dataset.playerId = String(data.id);
    }

    classSelect.addEventListener('change', () => {
      const opt = classSelect.selectedOptions[0];
      const presetGoal = opt ? opt.dataset.goal : '';
      if (classSelect.value === 'custom') {
        goalInput.value = '';
        goalInput.focus();
      } else if (presetGoal) {
        goalInput.value = presetGoal;
      }
    });

    removeBtn.addEventListener('click', () => {
      row.remove();
    });

    rosterRows.appendChild(row);
    return row;
  }

  function renderSetup(mode, players) {
    setupMode = mode;
    rosterRows.innerHTML = '';
    setupError.hidden = true;

    if (mode === 'edit' && players && players.length) {
      players.forEach((p) => createRosterRow(p));
      panelTitle.textContent = 'Edit the Party';
      panelHint.textContent = 'Rename adventurers, adjust goals, or add/remove rows. Existing treasure totals are kept.';
      startBtn.textContent = 'Save Changes';
      if (!cancelEditBtn) {
        cancelEditBtn = document.createElement('button');
        cancelEditBtn.type = 'button';
        cancelEditBtn.className = 'btn btn-ghost btn-block';
        cancelEditBtn.textContent = 'Cancel';
        cancelEditBtn.addEventListener('click', () => {
          showScreen('game');
        });
        startBtn.insertAdjacentElement('afterend', cancelEditBtn);
      }
      cancelEditBtn.hidden = false;
    } else {
      createRosterRow(null);
      panelTitle.textContent = 'Assemble the Party';
      panelHint.textContent = "Add one row per adventurer you're keeping score for. Everyone else can open this same page on their own device and track themselves.";
      startBtn.textContent = 'Begin the Delve';
      if (cancelEditBtn) cancelEditBtn.hidden = true;
    }

    showScreen('setup');
  }

  function collectRosterRows() {
    const rows = Array.from(rosterRows.querySelectorAll('[data-row]'));
    const existingById = new Map(state.players.map((p) => [String(p.id), p]));
    const collected = [];

    for (const row of rows) {
      const name = row.querySelector('.row-name').value.trim();
      const cls = row.querySelector('.row-class').value;
      const goalRaw = row.querySelector('.row-goal').value;
      const goal = parseInt(goalRaw, 10);

      if (!name) continue; // skip blank rows silently
      if (!goal || goal <= 0) {
        return { error: `Give "${name}" a treasure goal greater than 0.` };
      }

      const existingId = row.dataset.playerId;
      const existing = existingId ? existingById.get(existingId) : null;

      collected.push({
        id: existing ? existing.id : state.nextId++,
        name,
        cls,
        goal,
        treasure: existing ? existing.treasure : 0,
      });
    }

    if (collected.length === 0) {
      return { error: 'Add at least one adventurer before you begin.' };
    }

    return { players: collected };
  }

  addRowBtn.addEventListener('click', () => createRosterRow(null));

  startBtn.addEventListener('click', () => {
    const result = collectRosterRows();
    if (result.error) {
      setupError.textContent = result.error;
      setupError.hidden = false;
      return;
    }
    state.players = result.players;
    state.started = true;
    saveState();
    renderGame();
    showScreen('game');
  });

  // ================= GAME SCREEN =================
  const cardsGrid = document.getElementById('cards-grid');
  const editRosterBtn = document.getElementById('edit-roster-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');
  const newGameBtn = document.getElementById('new-game-btn');

  function createCard(player) {
    const tpl = document.getElementById('card-template');
    const frag = tpl.content.cloneNode(true);
    const card = frag.querySelector('[data-card]');
    card.dataset.playerId = String(player.id);

    const clip = card.querySelector('[data-gem-clip]');
    const grad = card.querySelector('[data-gem-gradient]');
    const fillGroup = card.querySelector('[data-gem-fill-group]');
    const fillRect = card.querySelector('[data-gem-fill]');
    const clipId = `gem-clip-${player.id}`;
    const gradId = `gem-grad-${player.id}`;
    clip.id = clipId;
    grad.id = gradId;
    fillGroup.setAttribute('clip-path', `url(#${clipId})`);
    fillRect.setAttribute('fill', `url(#${gradId})`);

    card.querySelector('[data-name]').textContent = player.name;
    card.querySelector('[data-class]').textContent = classLabel(player.cls);

    const amountInput = card.querySelector('[data-amount-input]');
    card.querySelector('[data-add-btn]').addEventListener('click', () => {
      applyAmount(player.id, 1, amountInput);
    });
    card.querySelector('[data-subtract-btn]').addEventListener('click', () => {
      applyAmount(player.id, -1, amountInput);
    });

    card.querySelectorAll('[data-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        amountInput.value = chip.dataset.chip;
        amountInput.focus();
      });
    });

    card.querySelector('[data-edit-goal-btn]').addEventListener('click', () => {
      editGoal(player.id);
    });

    card.querySelector('[data-remove-card-btn]').addEventListener('click', () => {
      removeCard(player.id);
    });

    cardsGrid.appendChild(card);
    updateCardDisplay(player.id);
  }

  function findCardEl(playerId) {
    return cardsGrid.querySelector(`[data-card][data-player-id="${playerId}"]`);
  }

  function updateCardDisplay(playerId) {
    const player = state.players.find((p) => p.id === playerId);
    const cardEl = findCardEl(playerId);
    if (!player || !cardEl) return;

    const pct = player.goal > 0 ? clamp(player.treasure / player.goal, 0, 1) : 0;
    const escaped = player.treasure >= player.goal;

    cardEl.querySelector('[data-amount]').textContent = formatNumber(player.treasure);
    cardEl.querySelector('[data-progress]').style.width = `${pct * 100}%`;
    cardEl.querySelector('[data-progress-text]').textContent =
      `${formatNumber(player.treasure)} / ${formatNumber(player.goal)} gp`;

    const badge = cardEl.querySelector('[data-escaped-badge]');
    badge.hidden = !escaped;
    cardEl.classList.toggle('escaped', escaped);

    const fillRect = cardEl.querySelector('[data-gem-fill]');
    const top = 8, bottom = 116;
    const fillHeight = (bottom - top) * pct;
    fillRect.setAttribute('y', String(bottom - fillHeight));
    fillRect.setAttribute('height', String(fillHeight));
  }

  function applyAmount(playerId, sign, amountInput) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return;
    player.treasure = clamp(player.treasure + sign * amount, 0, Number.MAX_SAFE_INTEGER);
    saveState();
    updateCardDisplay(playerId);
  }

  function editGoal(playerId) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;
    const input = window.prompt(`New treasure goal for ${player.name} (gp):`, String(player.goal));
    if (input === null) return;
    const newGoal = parseInt(input, 10);
    if (!newGoal || newGoal <= 0) {
      window.alert('Enter a whole number greater than 0.');
      return;
    }
    player.goal = newGoal;
    saveState();
    updateCardDisplay(playerId);
  }

  function removeCard(playerId) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;
    if (!window.confirm(`Remove ${player.name} from this device's tracker?`)) return;
    state.players = state.players.filter((p) => p.id !== playerId);
    saveState();
    renderGame();
  }

  function renderGame() {
    cardsGrid.innerHTML = '';
    state.players.forEach((p) => createCard(p));
  }

  editRosterBtn.addEventListener('click', () => {
    renderSetup('edit', state.players);
  });

  resetScoresBtn.addEventListener('click', () => {
    if (!window.confirm("Reset everyone's treasure to 0? Names and goals stay the same.")) return;
    state.players.forEach((p) => { p.treasure = 0; });
    saveState();
    renderGame();
  });

  newGameBtn.addEventListener('click', () => {
    if (!window.confirm('Start a brand new game? This clears the whole roster.')) return;
    state.players = [];
    state.started = false;
    saveState();
    renderSetup('new', []);
  });

  // ---------- Init ----------
  loadState();
  if (state.started && state.players.length) {
    renderGame();
    showScreen('game');
  } else {
    renderSetup('new', []);
  }
})();
