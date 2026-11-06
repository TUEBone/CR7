import {Dribble, Headers, Penalty, FinalTargets, clamp} from './models.js';
import {SpriteBank, Renderer} from './renderer.js';
import {MODES, careerPoints, rank, RANKS, recordRound, exportCode, importCode, loadLocal, storeLocal} from './save.js';

const $ = id => document.getElementById(id);
const bank = new SpriteBank(), r = new Renderer($('game'), bank);
const names = {dribble: 'Dribbel-Challenge', headers: 'Kopfball-Challenge', free: 'Elfmeterschießen'};
const shortNames = {dribble: 'Dribbeln', headers: 'Kopfball', free: 'Elfmeter'};
const instructions = {
  dribble: 'Ronaldo läuft dir entgegen, die Gegner kommen von unten. Fünf Spuren, vier Gegner, eine Lücke! Tippe links/rechts oder halte die Pfeiltasten bzw. Pfeilflächen gedrückt. Nach 15 Reihen fordert Messi dich dreimal heraus. Im Finale: sechs Ballsymbole nacheinander, jeweils in 0,5 Sekunden antippen.',
  headers: 'Stell dich unter die Bälle: Ronaldo köpft automatisch. Nutze die Pfeiltasten, halte die Pfeilflächen gedrückt oder ziehe Ronaldo auf dem Spielfeld nach links und rechts. Nach jeweils 15 Sekunden kommt ein weiterer Ball hinzu. Drei Leben, 100 Punkte pro Kopfball.',
  free: 'Stoppe zuerst den waagerechten, dann den senkrechten Balken im Grün. Beide Balken kommen bei jedem Schuss. Nur zwei grüne Treffer ergeben ein Tor! Die grünen Bereiche verändern sich mit jedem Versuch. Tippen oder Leertaste/Enter. Zehn Schüsse pro Runde.'
};
const ASSETS = {
  dribble: ['ronaldo/run_front','ronaldo/shoot_side','ronaldo/celebrate_front','defender/run_back','messi/run_back','keeper/idle_front'],
  headers: ['ronaldo/idle_front','ronaldo/header_up','ronaldo/header_left','ronaldo/header_right'],
  free: ['ronaldo/shoot_side','ronaldo/run_right_side','ronaldo/celebrate_front','keeper/idle_front','keeper/jump_front','keeper/dive_left','keeper/dive_right']
};
let storage;
try { storage = window.localStorage; } catch { /* Export codes remain available. */ }
const initial = loadLocal(storage);
let state = initial.state, storageAvailable = initial.available;
let view = 'loading', mode = null, model = null, finish = null, paused = false, ended = false;
let time = 0, last = performance.now(), ticket = 0, repeat = .14, down = null;
let muted = true, audio, saveReturn = 'menu', resultInfo = null;
const keys = new Set();

function announce(text) { $('announce').textContent = text; }
function overlay(html, cls = '') { $('overlay').className = cls; $('overlay').innerHTML = html; $('overlay').scrollTop = 0; }
function controls(show, shooting = false) {
  $('controls').hidden = !show;
  $('left').hidden = $('right').hidden = shooting;
  $('action').hidden = !shooting;
}
function clearInput() { keys.clear(); down = null; repeat = .14; }
function updateStorageNote() { $('storage-note').hidden = storageAvailable; }
function persist() { storageAvailable = storeLocal(state, storage); updateStorageNote(); }
function tone(win = true) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain(); osc.connect(gain); gain.connect(audio.destination);
    osc.frequency.setValueAtTime(win ? 660 : 180, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(win ? 990 : 80, audio.currentTime + .15);
    gain.gain.setValueAtTime(.05, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .25);
    osc.start(); osc.stop(audio.currentTime + .25);
  } catch { /* Sound is optional. */ }
}
function careerBar() {
  const points = careerPoints(state);
  return `<strong>${rank(points)}</strong> ${points} / 100<div class="progress" role="progressbar" aria-label="Karrierefortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${points}"><i style="width:${points}%"></i></div>`;
}
function nextPoint() {
  const points = careerPoints(state);
  if (points === 100) return '<div class="next-point"><p>★ GOAT erreicht! Deine Karriere ist komplett. Neue Highscores sind weiterhin möglich.</p></div>';
  return `<div class="next-point"><p>Nächster Karrierepunkt: fünf Runden je Spiel.</p>${MODES.map(m => `<span>${shortNames[m]}: ${clamp(state.stats[m].played - points * 5, 0, 5)}/5</span>`).join('')}</div>`;
}
function menu() {
  ticket++; view = 'menu'; mode = null; model = null; finish = null; ended = false; paused = false; clearInput();
  $('hud').hidden = true; $('pause').hidden = true; controls(false);
  overlay(`<div class="hero-title"><div class="eyebrow">DAS STADION GEHÖRT DIR</div><h1>CR7 <span>CHALLENGE</span></h1><p>Drei Challenges. Deine Karriere. Werde zum GOAT.</p></div>
    <div class="career-chip">${careerBar()}</div><div class="modes">
    <button class="mode" data-mode="dribble"><i>⚡</i><span><strong>Dribbel-Challenge</strong><small>Fünf Spuren. Eine freie Lücke.</small></span><em>→</em></button>
    <button class="mode" data-mode="headers"><i>⚽</i><span><strong>Kopfball-Challenge</strong><small>Mehr Bälle. Mehr Punkte. Drei Leben.</small></span><em>→</em></button>
    <button class="mode" data-mode="free"><i>🎯</i><span><strong>Elfmeterschießen</strong><small>Zweimal Grün. Ein perfekter Schuss.</small></span><em>→</em></button></div>
    <div class="menu-tools"><button data-room>🏆 Trophäen & Highscores</button><button data-save>Speichern & Laden</button></div>`, 'menu');
}
function intro(selected) {
  view = 'intro'; mode = selected;
  overlay(`<div class="card"><div class="eyebrow">DEIN NÄCHSTES SPIEL</div><h2>${names[selected]}</h2><p>${instructions[selected]}</p><button class="primary" data-start="${selected}">Los geht’s →</button><button data-home>Hauptmenü</button><p class="tip">Nur abgeschlossene Runden zählen für die Karriere. Ein regulärer Fehlversuch zählt ebenfalls; ein Abbruch nicht.</p></div>`);
}
async function start(selected) {
  if (!MODES.includes(selected)) return;
  const current = ++ticket;
  view = 'loading'; model = null; mode = selected; paused = false; ended = false; finish = null; clearInput();
  $('hud').hidden = true; $('pause').hidden = true; controls(false);
  overlay('<div class="card"><div class="eyebrow">GLEICH GEHT’S LOS</div><h2>Ab ins Stadion</h2><p id="load-progress">Figuren werden geladen …</p><button data-home>Zurück zum Menü</button></div>');
  try {
    await bank.load(ASSETS[selected], (n,total) => { if (current === ticket && $('load-progress')) $('load-progress').textContent = `Animationen laden: ${n} / ${total}`; });
    if (current !== ticket) return;
    model = selected === 'dribble' ? new Dribble() : selected === 'headers' ? new Headers() : new Penalty();
    view = 'play'; last = performance.now(); overlay(''); $('hud').hidden = false; $('pause').hidden = false; $('pause').textContent = 'Pause';
    controls(true, selected === 'free'); announce(`${names[selected]} gestartet.`);
  } catch {
    if (current !== ticket) return;
    overlay(`<div class="card"><h2>Grafiken konnten nicht geladen werden</h2><p>Bitte prüfe deine Verbindung und versuche es erneut.</p><button class="primary" data-start="${selected}">Erneut versuchen</button><button data-home>Hauptmenü</button></div>`);
  }
}
function finishRound(title, description, won = false) {
  if (ended || !model) return;
  ended = true; clearInput();
  const previousPoints = careerPoints(state);
  recordRound(state, mode, model.score); persist();
  const points = careerPoints(state), unlocked = Math.floor(points / 10) > Math.floor(previousPoints / 10);
  resultInfo = {title, description, won, points, gained: points > previousPoints, unlocked};
  view = 'result'; $('pause').hidden = true; controls(false); tone(won); showResult();
  announce(`${title} ${model.score} Punkte. Runde gespeichert.`);
}
function showResult() {
  const a = resultInfo;
  overlay(`<div class="card"><div class="medal">${a.won ? '🏆' : '⚽'}</div><h2>${a.title}</h2><p>${a.description}</p><div class="result-score">${model.score}</div><div class="eyebrow">PUNKTE · RUNDE GESPEICHERT</div>
    ${a.gained ? `<p>${a.unlocked ? '★ Neuer Karriere-Sticker freigeschaltet!' : '+1 Karrierepunkt!'} ${rank(careerPoints(state))} · ${careerPoints(state)}/100</p>` : ''}
    <button class="primary" data-start="${mode}">Noch eine Runde →</button><button data-room>Karriere & Highscores</button><button data-home>Hauptmenü</button></div>`);
}
function pause() {
  if (!model || ended || !['play','pause'].includes(view)) return;
  advance(performance.now());
  if (ended) return;
  clearInput(); paused = !paused; last = performance.now();
  if (paused) {
    pauseUI();
  } else {
    view = 'play'; $('pause').textContent = 'Pause';
    if (finish?.phase === 'ready') finalReadyUI();
    else if (finish?.phase === 'targets') targetUI();
    else overlay('');
    controls(!finish, mode === 'free');
  }
}
function pauseUI() {
  view = 'pause'; $('pause').textContent = 'Weiter'; controls(false);
  overlay('<div class="card"><div class="eyebrow">KURZ DURCHATMEN</div><h2>Spiel pausiert</h2><button class="primary" data-resume>Weiterspielen</button><button data-save>Spielstand als Code sichern</button><button data-home>Runde abbrechen · Menü</button><p class="tip">Der Code enthält deine abgeschlossenen Runden. Die laufende Runde ist noch nicht gespeichert.</p></div>');
}
function beginFinish() {
  finish = {phase:'ready', sequence:null, shot:0, success:false}; controls(false); finalReadyUI();
}
function finalReadyUI() {
  overlay('<div class="card"><div class="eyebrow">DER ENTSCHEIDENDE ABSCHLUSS</div><h2>Sechs Bälle. Dein Tor.</h2><p>Tippe jedes Ballsymbol im Tor innerhalb von <strong>0,5 Sekunden</strong> weg. Sechs Treffer in Folge – dann versenkst du den Abschluss!</p><button class="primary" data-final-start>Ich bin bereit →</button><p class="tip">Mit Touch oder Maus direkt auf den Ball tippen. Tastatur: mit Tab den Ball fokussieren, dann Enter.</p></div>');
}
function targetUI() {
  const seq = finish.sequence, p = seq.target;
  overlay(`<button class="target-ball" data-target="${seq.index}" aria-label="Ball ${seq.index+1} von 6 antippen" style="left:${p.x/4.8}%;top:${p.y/7.2}%;--remaining:${seq.remaining/.5}"><span aria-hidden="true">⚽</span></button><div class="target-help">${seq.index+1} / 6 · Je Ball 0,5 Sekunden</div>`, 'targets');
  $('overlay').querySelector('.target-ball').focus({preventScroll:true});
}
function endTargets(success) {
  finish.phase = 'shot'; finish.success = success; finish.shot = 0; overlay(''); tone(success);
}
function hitTarget(index) {
  advance(performance.now());
  if (view !== 'play' || paused || finish?.phase !== 'targets') return;
  if (finish.sequence.hit(index)) {
    tone();
    if (finish.sequence.done) endTargets(true);
    else targetUI();
  }
}
function room() {
  if (model && !ended) return;
  view = 'trophies'; model = null; mode = null; controls(false); $('hud').hidden = true; $('pause').hidden = true;
  const points = careerPoints(state), total = MODES.reduce((n,m) => n + state.stats[m].played, 0);
  overlay(`<div class="modal-content"><div class="eyebrow">DEIN WEG ZUM GOAT</div><h2>Trophäenraum</h2><div class="card">${careerBar()}<div class="stat-grid"><div><strong>${points}</strong><small>Karrierepunkte</small></div><div><strong>${Math.floor(points/10)}/10</strong><small>Sticker</small></div><div><strong>${total}</strong><small>Runden</small></div></div>${nextPoint()}</div>
    <h3>Highscore-Tabelle</h3><table><thead><tr><th>Challenge</th><th>Rekord</th><th>Runden</th></tr></thead><tbody>${MODES.map(m => `<tr><td>${shortNames[m]}</td><td>${state.stats[m].best}</td><td>${state.stats[m].played}</td></tr>`).join('')}</tbody></table>
    ${MODES.map(m => `<details><summary>${names[m]} · Top 5</summary>${state.stats[m].top.length ? `<ol>${state.stats[m].top.map(e => `<li>${e.score} Punkte · ${new Intl.DateTimeFormat('de-DE').format(new Date(e.at))}</li>`).join('')}</ol>` : '<p>Noch keine abgeschlossene Runde.</p>'}</details>`).join('')}
    <h3>Deine Karriere-Sticker</h3><p>Alle zehn Karrierepunkte ein neuer Abschnitt. Für einen Punkt brauchst du jeweils fünf abgeschlossene Runden in jedem der drei Spiele.</p><div class="trophy-grid">${Array.from({length:10},(_,i) => {
      const threshold=(i+1)*10, locked=points<threshold;
      return `<div class="trophy ${locked?'locked':''}"><div class="sticker" style="--hue:${40+i*26}"><img src="./assets/stickers/ronaldo.png" alt="${locked?'Gesperrter':'Freigeschalteter'} Ronaldo-Sticker"><b>CR7 · ${threshold}</b></div>${locked?'<span class="lock" aria-hidden="true">🔒</span>':''}<strong>${RANKS[i+1]}</strong><small>${locked?`Ab ${threshold} Punkten`:'★ Freigeschaltet'}</small></div>`;
    }).join('')}</div><button data-save>Speichern & Laden</button><button class="primary" data-home>Zurück zum Hauptmenü</button></div>`, 'modal');
}
function openSave() {
  if (view === 'loading' || view === 'save') return;
  advance(performance.now());
  saveReturn = view === 'play' || view === 'pause' ? 'pause' : view;
  if (model && !ended) { paused = true; $('pause').textContent = 'Weiter'; }
  clearInput(); controls(false); view = 'save';
  overlay(`<div class="modal-content"><div class="eyebrow">DEINE KARRIERE ZUM MITNEHMEN</div><h2>Speichern & Laden</h2><p>Deine Highscores, Runden und Karriere-Sticker stecken in diesem Code. Kopiere ihn zum Beispiel in deine Notizen. Er funktioniert auch auf einem anderen Gerät.</p>
    <p class="tip">${storageAvailable?'Abgeschlossene Runden werden außerdem automatisch in diesem Browser gespeichert.':'Automatisches Speichern ist in diesem Browser nicht verfügbar. Bitte sichere deinen Code.'} Eine laufende Runde ist nicht im Code enthalten.</p>
    <label class="save-label" for="export-code">Dein aktueller Speichercode</label><textarea id="export-code" readonly spellcheck="false" aria-label="Aktueller Speichercode"></textarea><button class="primary" data-copy>Code kopieren</button><div id="copy-status" class="status" role="status"></div>
    <label class="save-label" for="import-code">Vorhandenen Code laden</label><textarea id="import-code" placeholder="CR7.1.…" spellcheck="false" autocapitalize="off"></textarea><p class="tip">Laden ersetzt deine aktuell gespeicherten Highscores und den Karrierefortschritt durch den Stand aus dem Code.</p><button data-import>Spielstand aus Code laden</button><div id="import-status" class="status" role="status"></div><button data-save-back>Zurück</button></div>`, 'modal');
  $('export-code').value = exportCode(state);
}
function closeSave() {
  if (saveReturn === 'pause' && model && !ended) { paused = true; pauseUI(); }
  else if (saveReturn === 'trophies') room();
  else if (saveReturn === 'result' && model) { view = 'result'; showResult(); }
  else menu();
}
async function copyCode() {
  const field = $('export-code'), status = $('copy-status'), value = field.value;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard');
    await navigator.clipboard.writeText(value);
    if (status.isConnected) status.textContent = 'Code kopiert. Bewahre ihn in deinen Notizen auf.';
  } catch {
    if (!field.isConnected) return;
    field.focus(); field.select(); field.setSelectionRange(0, value.length);
    status.textContent = 'Code ist markiert. Bitte über „Kopieren“ oder Strg/Cmd+C kopieren.';
  }
}
function loadCode() {
  const status = $('import-status');
  try {
    const loaded = importCode($('import-code').value);
    state = loaded; persist(); $('export-code').value = exportCode(state);
    status.className = 'status'; status.textContent = `Geladen: ${rank(careerPoints(state))}, ${careerPoints(state)}/100 Karrierepunkte. ${storageAvailable?'In diesem Browser gespeichert.':'Bitte den Code weiterhin aufbewahren.'}`;
    announce('Spielstand erfolgreich geladen.');
  } catch (e) { status.className = 'status error'; status.textContent = e.message; }
}
function move(d) { if (view === 'play' && !paused && !ended && !finish && mode === 'dribble') model.move(d); }
function action() {
  advance(performance.now());
  if (view !== 'play' || paused || ended || finish) return;
  if (mode === 'free') model.tap();
}
function targetPress(event) {
  const button = event.target.closest('[data-target]');
  if (!button) return;
  event.preventDefault();
  // Pointerdown avoids click delay on phones. Stale index events never hit
  // the newly spawned target; hitTarget checks the actual remaining time.
  hitTarget(Number(button.dataset.target));
}
$('overlay').addEventListener('pointerdown', targetPress);
$('overlay').addEventListener('click', event => {
  const b = event.target.closest('button'); if (!b) return;
  if (b.dataset.target !== undefined) { if (event.detail === 0) hitTarget(Number(b.dataset.target)); return; }
  if (b.dataset.mode) intro(b.dataset.mode);
  else if (b.dataset.start) start(b.dataset.start);
  else if (b.hasAttribute('data-home')) menu();
  else if (b.hasAttribute('data-resume')) pause();
  else if (b.hasAttribute('data-room')) room();
  else if (b.hasAttribute('data-save')) openSave();
  else if (b.hasAttribute('data-save-back')) closeSave();
  else if (b.hasAttribute('data-copy')) copyCode();
  else if (b.hasAttribute('data-import')) loadCode();
  else if (b.hasAttribute('data-final-start')) {
    finish.sequence = new FinalTargets(); finish.phase = 'targets'; last = performance.now(); targetUI();
  }
});
$('home').onclick = e => { e.preventDefault(); menu(); };
$('save').onclick = openSave;
$('pause').onclick = pause;
$('sound').onclick = () => {
  muted = !muted; $('sound').textContent = muted ? 'Ton aus' : 'Ton an';
  $('sound').setAttribute('aria-pressed', String(!muted)); $('sound').setAttribute('aria-label', muted ? 'Ton einschalten' : 'Ton ausschalten'); tone();
};
for (const [id,d] of [['left',-1],['right',1]]) {
  $(id).onpointerdown = e => { e.preventDefault(); $(id).setPointerCapture(e.pointerId); move(d); keys.add(id); repeat=.14; };
  for (const ev of ['pointerup','pointercancel','lostpointercapture']) $(id).addEventListener(ev, () => keys.delete(id));
}
$('action').onclick = action;
function pointerX(e) { const rect = $('game').getBoundingClientRect(); return (e.clientX - rect.left) / rect.width * 480; }
$('game').onpointerdown = e => {
  if (view !== 'play' || paused || ended || finish) return;
  e.preventDefault(); $('game').setPointerCapture(e.pointerId); down = {x:e.clientX};
  if (mode === 'headers') model.target = clamp(pointerX(e),35,445);
};
$('game').onpointermove = e => { if (down && view === 'play' && mode === 'headers' && !paused) model.target = clamp(pointerX(e),35,445); };
$('game').onpointerup = e => {
  if (!down || view !== 'play' || paused || ended || finish) { down=null; return; }
  const dx=e.clientX-down.x;down=null;
  if (mode === 'dribble') move(Math.abs(dx)>25?Math.sign(dx):pointerX(e)<240?-1:1);
  if (mode === 'free') action();
};
$('game').onpointercancel = () => { down=null; };
window.addEventListener('keydown', e => {
  if(e.key==='Escape'&&view==='save'){closeSave();return;}
  if (e.target.closest('textarea,input,summary')) return;
  // Preserve native Enter/Space activation on focused buttons while allowing
  // arrow-key play after a mouse/touch interaction with a control.
  if (e.target.closest('button,a') && [' ','Enter'].includes(e.key)) return;
  if (!['ArrowLeft','ArrowRight',' ','Enter','Escape'].includes(e.key)) return;
  if (view === 'play' || view === 'pause') e.preventDefault();
  if (e.repeat) return;
  if (e.key === 'Escape') { pause(); return; }
  if (view !== 'play' || paused || ended || finish) return;
  keys.add(e.key); repeat=.14;
  if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);
  if(e.key===' '||e.key==='Enter')action();
});
window.addEventListener('keyup',e=>keys.delete(e.key));
window.addEventListener('blur',()=>{clearInput();if(view==='play'&&!ended)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(view==='play'&&!ended)pause();}});
window.addEventListener('resize',()=>r.resize());

function advance(stamp) {
  const elapsed=Math.max(0,(stamp-last)/1000);last=stamp;
  if(view!=='play'||paused||ended||!model)return;
  time+=elapsed;
  if(finish) {
    if(finish.phase==='targets') {
      finish.sequence.update(elapsed);
      if(finish.sequence.failed)endTargets(false);
      else $('overlay').querySelector('.target-ball')?.style.setProperty('--remaining',String(finish.sequence.remaining/.5));
    } else if(finish.phase==='shot') {
      finish.shot+=elapsed;
      if(finish.shot>=1.7) {
        if(finish.success)model.score+=500;
        finishRound(finish.success?'Siuuu!':'Knapp daneben!',finish.success?'Sechs Bälle erwischt und den Abschluss versenkt! +500 Punkte.':'Ein Ball war zu langsam. Beim nächsten Finale zählt wieder jeder Tipp.',finish.success);
      }
    }
    return;
  }
  // Small physics steps prevent fast balls/rows crossing a hit plane unseen.
  // Reaction deadlines above use elapsed wall time, not this physics cap.
  let remaining=Math.min(elapsed,2);
  while(remaining>0&&!ended&&!finish) {
    const dt=Math.min(remaining,1/120);remaining-=dt;
    const direction=(keys.has('ArrowRight')||keys.has('right')?1:0)-(keys.has('ArrowLeft')||keys.has('left')?1:0);
    if(mode==='headers')model.move(direction,dt);
    if(mode==='dribble'&&direction) {repeat-=dt;if(repeat<=0){move(direction);repeat+=.14;}}
    const oldScore=model.score;model.update(dt);
    if(mode==='headers'&&model.score!==oldScore)tone();
    if(mode==='dribble'&&model.done)beginFinish();
    if(model.failed)finishRound(mode==='dribble'?'Abgefangen!':'Stark geköpft!',mode==='dribble'?`${model.passed} von 18 Reihen geschafft. Finde beim nächsten Mal die freie Spur!`:`${model.hits} Kopfbälle in ${Math.floor(model.elapsed)} Sekunden. Schaffst du noch mehr?`);
    if(mode==='free'&&model.phase==='result'&&model.shots===10&&model.phaseTime>=1)
      finishRound('Abpfiff!',`${model.goals} Tore aus zehn Elfmetern. Nur zwei grüne Treffer zählen als Tor.`,model.goals>=5);
  }
}
function draw(stamp) {
  advance(stamp);
  if(!model)r.menu(stamp/1000);
  else if(mode==='dribble')r.dribble(model,time,finish,ended&&resultInfo?.won);
  else if(mode==='headers')r.headers(model,time);
  else if(mode==='free')r.penalty(model,time,ended&&resultInfo?.won);
  if(model) {
    $('score').textContent=`${model.score} Pkt`;
    if(mode==='dribble')$('detail').textContent=finish?`TORFINALE ${finish.sequence?.index||0}/6`:`REIHE ${model.passed}/18`;
    if(mode==='headers')$('detail').textContent='♥'.repeat(model.lives)+'♡'.repeat(3-model.lives);
    if(mode==='free') {
      $('detail').textContent=`SCHUSS ${Math.min(model.shots+(model.phase==='direction'||model.phase==='height'?1:0),10)}/10`;
      $('action').textContent=model.phase==='direction'?'1 · Richtung stoppen':model.phase==='height'?'2 · Höhe stoppen':model.phase==='flight'?'Schuss …':'Nächster Elfmeter →';
      $('action').disabled=model.phase==='flight'||(model.phase==='result'&&model.shots===10);
    }
  }
  requestAnimationFrame(draw);
}
updateStorageNote();requestAnimationFrame(draw);
const bootTicket = ticket;
try { await bank.load(['ronaldo/idle_front']); if(ticket===bootTicket&&view==='loading')menu(); }
catch { overlay('<div class="card"><h2>Die Spielfigur konnte nicht geladen werden</h2><p>Bitte prüfe deine Verbindung und lade die Seite erneut.</p><button data-reload>Neu laden</button></div>');$('overlay').querySelector('[data-reload]').onclick=()=>location.reload(); }
