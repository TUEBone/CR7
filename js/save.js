export const MODES = ['dribble', 'headers', 'free'];
export const STORAGE_KEY = 'cr7-challenge-save-v1';
export const freshState = () => ({version: 1, stats: Object.fromEntries(MODES.map(m => [m, {played: 0, best: 0, top: []}]))});
export const careerPoints = state => Math.min(100, Math.floor(Math.min(...MODES.map(m => state.stats[m].played)) / 5));
export const RANKS = ['Karriereanfänger', 'Nachwuchstalent', 'Stammspieler', 'Durchstarter', 'Liga-Star', 'Profi', 'Nationalheld', 'Weltstar', 'Legende', 'Ikone', 'GOAT'];
export const rank = points => RANKS[Math.floor(points / 10)];
export function recordRound(state, mode, score, at = Date.now()) {
  if (!MODES.includes(mode) || !Number.isSafeInteger(score) || score < 0) throw new Error('Ungültige Runde');
  const stat = state.stats[mode];
  stat.played++; stat.best = Math.max(stat.best, score);
  stat.top = [...stat.top, {score, at}].sort((a, b) => b.score - a.score || b.at - a.at).slice(0, 5);
}
function checksum(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function validateState(raw) {
  const integer = (n, max) => Number.isSafeInteger(n) && n >= 0 && n <= max;
  if (!raw || raw.version !== 1 || !raw.stats) throw new Error('Unbekannter Speicherstand.');
  const clean = freshState();
  for (const mode of MODES) {
    const s = raw.stats[mode];
    if (!s || !integer(s.played, 10000000) || !integer(s.best, 1000000000) || !Array.isArray(s.top) || s.top.length > 5 || s.top.length > s.played)
      throw new Error('Ungültige Spielstatistik.');
    if (!s.played && s.best !== 0) throw new Error('Ungültiger Highscore.');
    const top = s.top.map(e => {
      if (!e || !integer(e.score, s.best) || !integer(e.at, 8640000000000000)) throw new Error('Ungültiger Highscore-Eintrag.');
      return {score: e.score, at: e.at};
    }).sort((a, b) => b.score - a.score || b.at - a.at);
    if (s.played && (!top.length || top[0].score !== s.best)) throw new Error('Unvollständige Highscores.');
    clean.stats[mode] = {played: s.played, best: s.best, top};
  }
  return clean;
}
export function exportCode(state) {
  const json = JSON.stringify(validateState(state));
  const payload = btoa(json).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return `CR7.1.${payload}.${checksum(payload)}`;
}
export function importCode(text) {
  if (typeof text !== 'string' || text.length > 12000) throw new Error('Der Code ist zu lang oder ungültig.');
  const code = text.replace(/\s+/g, '');
  const match = /^CR7\.1\.([A-Za-z0-9_-]+)\.([a-f0-9]{8})$/.exec(code);
  if (!match || checksum(match[1]) !== match[2]) throw new Error('Der Code ist unvollständig oder beschädigt. Bitte vollständig kopieren.');
  try { return validateState(JSON.parse(atob(match[1].replaceAll('-', '+').replaceAll('_', '/')))); }
  catch { throw new Error('Dieser Code enthält keinen gültigen CR7-Spielstand.'); }
}
export function loadLocal(storage) {
  try { const code = storage.getItem(STORAGE_KEY); return {state: code ? importCode(code) : freshState(), available: true}; }
  catch { return {state: freshState(), available: false}; }
}
export function storeLocal(state, storage) {
  try { storage.setItem(STORAGE_KEY, exportCode(state)); return true; }
  catch { return false; }
}
