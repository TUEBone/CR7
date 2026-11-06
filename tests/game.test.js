import test from 'node:test';
import assert from 'node:assert/strict';
import {Dribble, Headers, Penalty, FinalTargets, insideGreen, greenZones, resolveShot, LANES} from '../js/models.js';
import {freshState, careerPoints, recordRound, exportCode, importCode, validateState, loadLocal, storeLocal, STORAGE_KEY} from '../js/save.js';

function rng(seed=42) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

test('only two green stops score; saves, bars and wides never score',()=>{
  const x=[[.2,.4],[.7,.8]],y=[[.1,.3]];
  for(let i=0;i<=100;i++)for(let j=0;j<=100;j++) {
    const result=resolveShot(i/100,j/100,x,y,i+j);
    assert.equal(result.goal,insideGreen(i/100,x)&&insideGreen(j/100,y));
    assert.equal(result.points,result.goal?100:0);
    assert.equal(result.outcome==='goal',result.goal);
  }
  assert.deepEqual([0,1,2].map(i=>resolveShot(0,0,x,y,i).outcome),['save','bar','wide']);
});
test('each of ten shots requires direction then height; both windows change',()=>{
  const m=new Penalty(rng());let old;
  for(let i=0;i<10;i++) {
    assert.equal(m.phase,'direction');
    assert.equal(m.directionZones.length,i%2?2:1);
    assert.equal(m.heightZones.length,i%2?1:2);
    const windows=JSON.stringify([m.directionZones,m.heightZones]);assert.notEqual(windows,old);old=windows;
    m.phaseTime=(m.directionZones[0][0]+m.directionZones[0][1])/2/1.12;m.tap();
    assert.equal(m.phase,'height');assert.equal(m.shots,i);
    assert.equal(m.tap(),false,'an immediate duplicate event cannot skip the height meter');
    const value=(m.heightZones[0][0]+m.heightZones[0][1])/2;
    m.phaseTime=value/1.12;
    // The height phase must have been visible for at least 180 ms.
    if(m.phaseTime<.18)m.phaseTime=(2-value)/1.12;
    m.tap();assert.equal(m.phase,'flight');assert.equal(m.shots,i+1);
    m.update(1.8);assert.equal(m.phase,'result');assert.equal(m.goals,i+1);
    m.update(3);assert.equal(m.score,(i+1)*100,'a result is credited once');
    if(i<9)m.tap();
  }
  assert.equal(m.tap(),false);assert.equal(m.shots,10);
});
test('green windows stay on screen, separated and vary in size',()=>{
  const random=rng();const widths=new Set();
  for(let i=0;i<100;i++) {
    const zones=greenZones(random,i%2===0);
    for(const [a,b] of zones){assert.ok(a>=0&&b<=1&&a<b);widths.add((b-a).toFixed(3));}
    if(zones.length===2)assert.ok(zones[0][1]<zones[1][0]);
  }
  assert.ok(widths.size>10);
});
test('five-lane rows have four opponents and a reachable opening; full course completes',()=>{
  const m=new Dribble(rng());let lastFree=2,spawned=0;
  for(let i=0;i<120*60&&!m.done&&!m.failed;i++) {
    const next=m.waves.find(w=>!w.checked);
    if(next)m.lane=next.free;
    m.update(1/120);
    if(m.spawned!==spawned){const row=m.waves.at(-1);assert.ok(Math.abs(row.free-lastFree)<=2);assert.equal(LANES.filter((_,n)=>n!==row.free).length,4);lastFree=row.free;spawned=m.spawned;}
  }
  assert.equal(m.failed,false);assert.equal(m.done,true);assert.equal(m.passed,18);assert.equal(m.score,1950);
});
test('a blocked lane loses, while lane controls clamp to the five tracks',()=>{
  const m=new Dribble(()=>0);m.move(-99);assert.equal(m.lane,0);m.move(99);assert.equal(m.lane,4);
  for(let i=0;i<120*10&&!m.failed;i++)m.update(1/120);
  assert.equal(m.failed,true);assert.equal(m.done,false);
});
test('headers add one ball every 15 seconds and each miss loses only one life',()=>{
  const m=new Headers(rng());m.lives=1000;
  for(let i=0;i<14.9*120;i++)m.update(1/120);
  assert.equal(m.balls.length,1);
  for(let i=0;i<.2*120;i++)m.update(1/120);assert.equal(m.balls.length,2);
  for(let i=0;i<15*120;i++)m.update(1/120);assert.equal(m.balls.length,3);
  const n=new Headers(()=>.5);n.balls[0].y=741;const lives=n.lives;n.update(.01);
  assert.equal(n.lives,lives-1);n.update(.01);assert.equal(n.lives,lives-1);assert.equal(n.balls.length,1);
});
test('a header collision awards points and rebounds the ball at the sprite head',()=>{
  const m=new Headers(()=>.5);m.balls=[{x:240,y:494,vy:150,vx:0,cooldown:0}];
  m.update(.02);assert.equal(m.score,100);assert.equal(m.hits,1);assert.ok(m.balls[0].vy<0);
  m.update(.01);assert.equal(m.score,100);
});
test('six sequential target taps, 500 ms deadlines, and stale taps',()=>{
  const m=new FinalTargets(rng());
  for(let i=0;i<6;i++){m.update(.49);assert.equal(m.hit(i),true);if(i<5)assert.equal(m.hit(i),false);}
  assert.equal(m.done,true);assert.equal(m.index,6);assert.equal(m.hit(6),false);
  const late=new FinalTargets();late.update(.5);assert.equal(late.hit(0),false);assert.equal(late.failed,true);
});
test('five rounds per mode earn one point, imbalance cannot skip requirements, 1500 rounds reach GOAT',()=>{
  const s=freshState();for(let i=0;i<5;i++)for(const m of ['dribble','headers'])recordRound(s,m,0,1);
  assert.equal(careerPoints(s),0);for(let i=0;i<4;i++)recordRound(s,'free',0,1);assert.equal(careerPoints(s),0);
  recordRound(s,'free',0,1);assert.equal(careerPoints(s),1);
  for(let i=5;i<500;i++)for(const m of ['dribble','headers','free'])recordRound(s,m,i,1);
  assert.equal(careerPoints(s),100);assert.equal(Object.values(s.stats).reduce((n,s)=>n+s.played,0),1500);
});
test('portable save codes round-trip all stats and reject truncation or tampering',()=>{
  const s=freshState();for(let i=0;i<9;i++)recordRound(s,'headers',i*100,1000+i);
  assert.equal(s.stats.headers.top.length,5);assert.equal(s.stats.headers.top[0].score,800);
  const code=exportCode(s);assert.deepEqual(importCode(code),s);assert.deepEqual(importCode(' \n'+code+'\n '),s);
  assert.throws(()=>importCode(code.slice(0,-1)));assert.throws(()=>importCode(code.replace('CR7.1','CR7.2')));
  assert.throws(()=>importCode(code.slice(0,15)+'x'+code.slice(16)));
  const before=structuredClone(s);assert.throws(()=>importCode('<script>alert(1)</script>'));assert.deepEqual(s,before);
});
test('save schema rejects bad counters and inconsistent scores; storage failures are recoverable',()=>{
  const s=freshState();s.stats.free.played=-1;assert.throws(()=>validateState(s));
  s.stats.free.played=0;s.stats.free.best=100;assert.throws(()=>validateState(s));
  const store={value:null,getItem(){return this.value;},setItem(key,v){assert.equal(key,STORAGE_KEY);this.value=v;}};
  const clean=freshState();assert.equal(storeLocal(clean,store),true);assert.deepEqual(loadLocal(store).state,clean);
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
  assert.equal(storeLocal(clean,blocked),false);assert.equal(loadLocal(blocked).available,false);
});
