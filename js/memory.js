const BOARD_SIZES = [
  [4, 6],
  [5, 10],
  [6, 10]
];

const LEVELS = {
  easy: {label: 'Leicht', memory: 2},
  normal: {label: 'Mittel', memory: 10},
  hard: {label: 'Schwer', memory: 60}
};

export class MemoryMatch {
  constructor({size, opponent, level}, random = Math.random) {
    const [short, long] = BOARD_SIZES[size];
    this.cards = Array.from({length: short * long}, (_, i) => i >> 1);
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.columns = {short, long};
    this.computer = opponent === 'computer';
    this.memoryLimit = LEVELS[level].memory;
    this.random = random;
    this.seen = new Map();
    this.open = [];
    this.matched = new Set();
    this.scores = [0, 0];
    this.turn = 0;
  }

  get done() { return this.matched.size === this.cards.length; }
  get computerTurn() { return !this.done && this.computer && this.turn === 1; }

  available(index) {
    return index >= 0 && index < this.cards.length && !this.matched.has(index) && !this.open.includes(index);
  }

  reveal(index) {
    if (!Number.isInteger(index) || this.done || this.open.length === 2 || !this.available(index)) return false;
    this.open.push(index);
    const motif = this.cards[index];
    this.seen.delete(index);
    this.seen.set(index, motif);
    if (this.seen.size > this.memoryLimit) this.seen.delete(this.seen.keys().next().value);
    return true;
  }

  resolve() {
    if (this.open.length !== 2) return;
    const [first, second] = this.open;
    if (this.cards[first] === this.cards[second]) {
      this.matched.add(first);
      this.matched.add(second);
      this.seen.delete(first);
      this.seen.delete(second);
      this.scores[this.turn]++;
    } else {
      this.turn = 1 - this.turn;
    }
    this.open = [];
  }

  computerPick() {
    const available = this.cards.map((_, i) => i).filter(i => this.available(i));
    const first = this.open[0];
    if (first !== undefined) {
      const partner = available.find(i => this.seen.get(i) === this.seen.get(first));
      if (partner !== undefined) return partner;
    } else {
      const observed = new Set();
      for (const index of available) {
        if (!this.seen.has(index)) continue;
        const motif = this.seen.get(index);
        if (observed.has(motif)) return index;
        observed.add(motif);
      }
    }
    const unknown = available.filter(i => !this.seen.has(i));
    const options = unknown.length ? unknown : available;
    return options[Math.floor(this.random() * options.length)];
  }
}

const PHOTO_COLUMNS = 5;
const PHOTO_ROWS = 3;
const PHOTOS_PER_SHEET = PHOTO_COLUMNS * PHOTO_ROWS;
const PHOTO_SHEETS = ['../assets/memory-photos-1.webp', '../assets/memory-photos-2.webp']
  .map(path => new URL(path,import.meta.url).href);
const MOTIF_NAMES = [
  'Elfmeter', 'Siuuu!', 'Kopfball', 'Antritt', 'Fallrückzieher',
  'Dribbling links', 'Vor dem Anpfiff', 'Pokalsieg', 'Dortmunder Stadion', 'Silberpokal',
  'Spielball', 'Spielertunnel', 'Rückennummer 7', 'Dribbling rechts', 'Ballfinte',
  'Zweikampf', 'Flugkopfball', 'Kopfball unter Flutlicht', 'Ronaldo als Nachwuchsstar', 'Torjubel',
  'Jubel im Tunnel', 'Siegermedaille', 'In der Kabine', 'Freistoß im Regen', 'Portugal-Flagge',
  'Applaus im Konfetti', 'Dortmunder Fankurve', 'Goldmedaille', 'Goldener Schuh', 'Stadion bei Nacht'
];

export class MemoryTable {
  constructor() {
    this.settings = {size: 0, opponent: 'computer', level: 'normal'};
  }

  stop() {
    clearTimeout(this.timer);
    this.panel = null;
  }

  open(panel) {
    this.stop();
    this.panel = panel;
    for (const src of PHOTO_SHEETS) {
      const photo = new Image();
      photo.src = src;
    }
    this.setup();
  }

  setup() {
    clearTimeout(this.timer);
    const {size, opponent, level} = this.settings;
    this.panel.innerHTML = `
      <form class="memory-settings">
        <label>Gegner<select name="opponent">
          <option value="computer">Computer</option><option value="person">Zweite Person am selben Gerät</option>
        </select></label>
        <label>Karten<select name="size">${BOARD_SIZES.map(([short, long], i) =>
          `<option value="${i}">${short * long} Karten (${short} × ${long})</option>`).join('')}</select></label>
        <label data-memory-level>Computerstärke<select name="level">${Object.entries(LEVELS).map(([id, {label}]) =>
          `<option value="${id}">${label}</option>`).join('')}</select></label>
        <p>Decke zwei Karten auf. Bei einem Paar bist du noch einmal dran.</p>
        <button class="primary" type="submit">Memory starten</button>
      </form>`;
    const form = this.panel.querySelector('form');
    const fields = form.elements;
    fields.opponent.value = opponent;
    fields.size.value = size;
    fields.level.value = level;
    const update = () => {
      this.settings = {size: Number(fields.size.value), opponent: fields.opponent.value, level: fields.level.value};
      form.querySelector('[data-memory-level]').hidden = fields.level.disabled = fields.opponent.value !== 'computer';
    };
    update();
    form.addEventListener('change', update);
    form.addEventListener('submit', event => {
      event.preventDefault();
      update();
      this.start();
    });
  }

  start() {
    clearTimeout(this.timer);
    const match = this.match = new MemoryMatch(this.settings);
    this.panel.innerHTML = `
      <div class="memory-score"><strong data-memory-score></strong><span role="status" data-memory-status></span></div>
      <div class="memory-board" style="--columns:${match.columns.short};--wide-columns:${match.columns.long}" aria-label="Memory-Karten">
        ${match.cards.map((_, i) => `<button type="button" class="memory-card" data-card="${i}"></button>`).join('')}
      </div>
      <div class="memory-actions"><button type="button" data-memory-again hidden>Noch eine Runde</button>
      <button type="button" data-memory-settings>Einstellungen</button></div>`;
    this.buttons = [...this.panel.querySelectorAll('[data-card]')];
    this.panel.querySelector('.memory-board').addEventListener('click', event => {
      const button = event.target.closest('[data-card]');
      if (button && !match.computerTurn) this.play(Number(button.dataset.card));
    });
    this.panel.querySelector('[data-memory-again]').onclick = () => this.start();
    this.panel.querySelector('[data-memory-settings]').onclick = () => {
      this.setup();
      this.panel.querySelector('select').focus();
    };
    this.update();
    this.buttons[0].focus({preventScroll: true});
  }

  play(index) {
    const match = this.match;
    if (!match.reveal(index)) return;
    this.update();
    if (match.open.length === 2) {
      this.timer = setTimeout(() => {
        match.resolve();
        this.update();
        this.scheduleComputer();
      }, 900);
    } else {
      this.scheduleComputer();
    }
  }

  scheduleComputer() {
    if (this.match.computerTurn) {
      this.timer = setTimeout(() => this.play(this.match.computerPick()), 600);
    }
  }

  update() {
    const match = this.match;
    const names = match.computer ? ['Du', 'Computer'] : ['Spieler 1', 'Spieler 2'];
    const score = this.panel.querySelector('[data-memory-score]');
    score.textContent = `${names[0]} ${match.scores[0]} : ${match.scores[1]} ${names[1]}`;
    const status = this.panel.querySelector('[data-memory-status]');
    const [one, two] = match.scores;
    const winner = one > two ? (match.computer ? 'Du gewinnst!' : 'Spieler 1 gewinnt!') : `${names[1]} gewinnt!`;
    const message = match.done ? (one === two ? 'Unentschieden!' : winner)
      : match.open.length === 2
        ? (match.cards[match.open[0]] === match.cards[match.open[1]] ? 'Ein Paar!' : 'Kein Paar.')
        : `${match.turn === 0 && match.computer ? 'Du bist' : names[match.turn] + ' ist'} dran`;
    if (status.textContent !== message) status.textContent = message;
    this.buttons.forEach((button, index) => {
      const matched = match.matched.has(index);
      const face = matched || match.open.includes(index);
      const motif = match.cards[index];
      const name = MOTIF_NAMES[motif];
      const label = `Karte ${index + 1}` + (face ? `, ${name}${matched ? ', gefunden' : ''}` : ', verdeckt');
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-disabled', String(match.computerTurn || match.open.length === 2 || !match.available(index)));
      button.classList.toggle('matched', matched);
      if (face === (button.dataset.face === 'up')) return;
      button.dataset.face = face ? 'up' : 'down';
      if (!face) { button.replaceChildren(); return; }
      const tile = motif % PHOTOS_PER_SHEET;
      const art = document.createElement('img');
      art.className = 'memory-motif';
      art.alt = '';
      art.draggable = false;
      art.src = PHOTO_SHEETS[Math.floor(motif / PHOTOS_PER_SHEET)];
      art.style.width = `${PHOTO_COLUMNS * 100}%`;
      art.style.height = `${PHOTO_ROWS * 100}%`;
      art.style.left = `${-(tile % PHOTO_COLUMNS) * 100}%`;
      art.style.top = `${-Math.floor(tile / PHOTO_COLUMNS) * 100}%`;
      const caption = document.createElement('span');
      caption.className = 'memory-caption';
      caption.textContent = name;
      button.replaceChildren(art, caption);
    });
    this.panel.querySelector('[data-memory-again]').hidden = !match.done;
  }
}
