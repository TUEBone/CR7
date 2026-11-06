export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const LANES = [48, 144, 240, 336, 432];
export const PENALTY_GOAL = {x: 210, y: 125, w: 230, h: 150};
export const FINAL_GOAL = {x: 65, y: 125, w: 350, h: 190};

export class Dribble {
  constructor(random = Math.random) {
    Object.assign(this, {random, lane: 2, x: 240, y: 255, elapsed: 0, waves: [],
      spawned: 0, passed: 0, timer: .9, done: false, failed: false, score: 0, lastFree: 2});
  }
  move(d) { this.lane = clamp(this.lane + d, 0, 4); }
  update(dt) {
    if (this.done || this.failed) return;
    this.elapsed += dt;
    this.y = Math.min(320, 255 + this.elapsed * 12);
    this.x += clamp(LANES[this.lane] - this.x, -780 * dt, 780 * dt);
    this.timer -= dt;
    if (this.timer <= 0 && this.spawned < 18) {
      // The next opening is at most two lanes away. At least 1.65 seconds
      // separates rows, so all gaps remain reachable with the repeat controls.
      const choices = [0, 1, 2, 3, 4].filter(n => Math.abs(n - this.lastFree) <= 2);
      const free = choices[Math.floor(this.random() * choices.length)];
      this.waves.push({y: 820, free, checked: false, boss: this.spawned >= 15,
        speed: 155 + this.spawned * 3});
      this.lastFree = free; this.spawned++;
      this.timer += this.spawned >= 15 ? 1.65 : 1.9;
    }
    for (const w of this.waves) {
      w.y -= w.speed * dt;
      if (!w.checked && w.y <= this.y) {
        w.checked = true;
        if (Math.abs(this.x - LANES[w.free]) > 31) { this.failed = true; return; }
        this.passed++; this.score += w.boss ? 150 : 100;
      }
    }
    this.waves = this.waves.filter(w => w.y > 65);
    this.done = this.passed === 18;
  }
}

export class Headers {
  constructor(random = Math.random) {
    Object.assign(this, {random, x: 240, target: 240, elapsed: 0, score: 0,
      hits: 0, lives: 3, failed: false, balls: [], hitAge: 10, hitPose: 'header_up'});
    this.spawn();
  }
  spawn() {
    this.balls.push({x: 55 + this.random() * 370, y: 80 + this.random() * 35,
      vx: (this.random() - .5) * 65, vy: 65, cooldown: 0});
  }
  move(d, dt) { this.target = clamp(this.target + d * 355 * dt, 35, 445); }
  update(dt) {
    if (this.failed) return;
    this.elapsed += dt; this.hitAge += dt;
    this.x += clamp(this.target - this.x, -550 * dt, 550 * dt);
    for (const b of this.balls) {
      b.cooldown = Math.max(0, b.cooldown - dt);
      const old = b.y;
      b.vy += (185 + Math.min(180, this.elapsed * 1.8 + this.hits)) * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 18 || b.x > 462) { b.x = clamp(b.x, 18, 462); b.vx *= -1; }
      // The character's head is at y=510; use the lower edge of the ball.
      if (b.vy > 0 && old + 15 <= 510 && b.y + 15 >= 510 && Math.abs(b.x - this.x) < 39 && b.cooldown === 0) {
        const offset = b.x - this.x;
        b.y = 494; b.vy = -355 - Math.min(this.hits, 30) * 2;
        b.vx = clamp(offset * 2.3 + (this.random() - .5) * 80, -140, 140);
        b.cooldown = .2; this.hits++; this.score += 100; this.hitAge = 0;
        this.hitPose = offset < -12 ? 'header_left' : offset > 12 ? 'header_right' : 'header_up';
      }
      if (b.y > 740) {
        b.lost = true; this.lives--;
        if (!this.lives) { this.failed = true; break; }
      }
    }
    this.balls = this.balls.filter(b => !b.lost);
    if (!this.failed) {
      const wanted = 1 + Math.floor(this.elapsed / 15);
      while (this.balls.length < wanted) this.spawn();
    }
  }
}

export const insideGreen = (value, zones) => zones.some(([a, b]) => value >= a && value <= b);
export function greenZones(random = Math.random, two = false) {
  if (!two) {
    const width = .14 + random() * .12, start = .04 + random() * (.92 - width);
    return [[start, start + width]];
  }
  return [.05 + random() * .19, .56 + random() * .16].map(start => [start, start + .12 + random() * .09]);
}
export function resolveShot(direction, height, directionZones, heightZones, shotIndex = 0) {
  const horizontalHit = insideGreen(direction, directionZones), verticalHit = insideGreen(height, heightZones);
  const goal = horizontalHit && verticalHit;
  const g = PENALTY_GOAL;
  let x = g.x + 22 + direction * (g.w - 44), y = g.y + 18 + height * (g.h - 36);
  const outcome = goal ? 'goal' : ['save', 'bar', 'wide'][shotIndex % 3];
  if (outcome === 'bar') y = g.y;
  if (outcome === 'wide') { x = shotIndex % 2 ? g.x - 38 : g.x + g.w + 25; y = g.y + 55; }
  return {x, y, goal, horizontalHit, verticalHit, outcome, points: goal ? 100 : 0};
}
export class Penalty {
  constructor(random = Math.random) {
    Object.assign(this, {random, score: 0, shots: 0, goals: 0, elapsed: 0});
    this.prepare();
  }
  prepare() {
    this.phase = 'direction'; this.phaseTime = 0; this.direction = 0; this.height = 0;
    this.directionHit = null; this.heightHit = null; this.result = null; this.flight = 0;
    // Alternate one/two windows on the two axes; randomise their widths and positions.
    this.directionZones = greenZones(this.random, this.shots % 2 === 1);
    this.heightZones = greenZones(this.random, this.shots % 2 === 0);
  }
  get cursor() { return 1 - Math.abs((this.phaseTime * 1.12) % 2 - 1); }
  tap() {
    if (this.phase === 'direction') {
      this.direction = this.cursor;
      this.directionHit = insideGreen(this.direction, this.directionZones);
      this.phase = 'height'; this.phaseTime = 0;
      return true;
    }
    if (this.phase === 'height' && this.phaseTime >= .18) {
      this.height = this.cursor;
      this.result = resolveShot(this.direction, this.height, this.directionZones, this.heightZones, this.shots);
      this.heightHit = this.result.verticalHit;
      this.phase = 'flight'; this.flight = 0; this.phaseTime = 0; this.shots++;
      return true;
    }
    if (this.phase === 'result' && this.shots < 10) { this.prepare(); return true; }
    return false;
  }
  update(dt) {
    this.elapsed += dt; this.phaseTime += dt;
    if (this.phase === 'flight') {
      this.flight += dt;
      if (this.flight >= 1.7) {
        this.score += this.result.points;
        if (this.result.goal) this.goals++;
        this.phase = 'result'; this.phaseTime = 0;
      }
    }
  }
}

export class FinalTargets {
  constructor(random = Math.random) {
    Object.assign(this, {random, index: 0, remaining: .5, failed: false, done: false, target: null});
    this.next();
  }
  next() {
    const old = this.target;
    const spots = [{x: 115, y: 175}, {x: 240, y: 175}, {x: 365, y: 175},
      {x: 115, y: 260}, {x: 240, y: 260}, {x: 365, y: 260}].filter(p => !old || p.x !== old.x || p.y !== old.y);
    this.target = spots[Math.floor(this.random() * spots.length)]; this.remaining = .5;
  }
  update(dt) {
    if (this.done || this.failed) return;
    this.remaining -= dt;
    if (this.remaining <= 0) { this.remaining = 0; this.failed = true; }
  }
  hit(index) {
    if (this.failed || this.done || this.remaining <= 0 || index !== this.index) return false;
    this.index++;
    if (this.index === 6) this.done = true;
    else this.next();
    return true;
  }
}
