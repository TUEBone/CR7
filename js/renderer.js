import {SPRITES} from './sprites.js';
import {clamp, LANES, PENALTY_GOAL, FINAL_GOAL} from './models.js';

export class SpriteBank {
  constructor() { this.images = new Map(); this.pending = new Map(); }
  async load(keys, progress = () => {}) {
    let done = 0;
    await Promise.all(keys.map(async key => {
      if (!SPRITES[key]) throw new Error(`Unbekannte Animation: ${key}`);
      if (!this.images.has(key)) {
        if (!this.pending.has(key)) {
          const promise = (async () => {
            const img = new Image();
            img.src = new URL(`../assets/sprites/${key}.png`, import.meta.url).href;
            await img.decode(); this.images.set(key, img);
          })().finally(() => this.pending.delete(key));
          this.pending.set(key, promise);
        }
        await this.pending.get(key);
      }
      progress(++done, keys.length);
    }));
  }
}

export class Renderer {
  constructor(canvas, bank) { this.canvas = canvas; this.c = canvas.getContext('2d'); this.bank = bank; this.resize(); }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = 480 * d; this.canvas.height = 720 * d;
    this.c.setTransform(d, 0, 0, d, 0, 0);
  }
  text(text, x, y, size = 18, color = '#fff', align = 'center') {
    const c = this.c; c.fillStyle = color; c.font = `800 ${size}px system-ui`; c.textAlign = align; c.fillText(text, x, y);
  }
  polygon(points, fill, stroke = '#123b34', width = 2) {
    const c = this.c; c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath();
    c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  line(points, color, width = 2) {
    const c = this.c; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  background(scene, time = 0) {
    const c = this.c, running = scene === 'run';
    c.clearRect(0,0,480,720);
    const sky = c.createLinearGradient(0,0,0,220); sky.addColorStop(0,'#10263d'); sky.addColorStop(1,'#58869a');
    c.fillStyle = sky; c.fillRect(0,0,480,720);
    // Inked grandstands and warm floodlights match the shaded comic sprites.
    this.polygon([[0,44],[240,92],[480,44],[480,174],[0,174]],'#243c55','#102938',4);
    for (let row = 0; row < 4; row++) {
      this.line([[0,68+row*24],[240,107+row*16],[480,68+row*24]],'#748b9b',2);
      for (let i=0;i<38;i++) {
        c.fillStyle = ['#e6c174','#db736f','#b3d5d7','#7fa7c0'][(i*7+row)%4];
        c.fillRect(i*13+(row%2)*4,75+row*23+Math.sin(i*.12)*13,4,6);
      }
    }
    for (const x of [15,465]) {
      const glow = c.createRadialGradient(x,35,0,x,35,175); glow.addColorStop(0,'#fff8cf70'); glow.addColorStop(1,'#fff8cf00');
      c.fillStyle=glow;c.fillRect(0,0,480,230);
      c.fillStyle='#fff3c3';for(let i=0;i<4;i++)c.fillRect(x-13+(i%2)*15,22+Math.floor(i/2)*13,11,8);
    }
    const top = running ? 92 : 180;
    const grass = c.createLinearGradient(0,top,480,720);grass.addColorStop(0,'#288f68');grass.addColorStop(.5,'#277d51');grass.addColorStop(1,'#164e3c');
    c.fillStyle=grass;c.fillRect(0,top,480,720-top);
    c.save();c.beginPath();c.rect(0,top,480,720-top);c.clip();
    for(let i=-1;i<11;i++) {
      const y=top+i*75-(running?(time*85)%75:0);
      c.fillStyle=i%2?'#b9df6920':'#032f3318';c.fillRect(0,y,480,75);
      this.line([[0,y+73],[480,y+73]],'#082d3019',1);
    }
    for(let i=0;i<180;i++) {
      const x=(i*137)%480, y=top+((i*73)%(720-top));
      this.line([[x,y],[x+2,y-3]],i%2?'#b5d88021':'#082e3425',1);
    }
    if (running) {
      this.line([[15,720],[15,96],[465,96],[465,720]],'#e5edbfaa',3);
      for(let lane=1;lane<5;lane++) {c.setLineDash([8,12]);this.line([[lane*96,100],[lane*96,720]],'#e4e9ae30',1);c.setLineDash([]);}
      const y=92+((720-time*85)%630+630)%630;
      this.line([[15,y],[465,y]],'#e5edbf77',3);
      c.beginPath();c.ellipse(240,y,78,55,0,0,Math.PI*2);c.strokeStyle='#e5edbf77';c.lineWidth=3;c.stroke();
    } else if (scene === 'penalty') {
      this.line([[35,720],[240,260],[457,260],[480,485]],'#e5edbfaa',3);
      this.line([[170,480],[245,302],[440,302],[480,414]],'#e5edbf88',3);
      c.beginPath();c.ellipse(270,485,72,29,-.55,0,Math.PI);c.strokeStyle='#e5edbf88';c.stroke();
      c.fillStyle='#ecedbc';c.beginPath();c.ellipse(176,610,4,2,0,0,7);c.fill();
    } else {
      this.line([[25,720],[90,185],[390,185],[455,720]],'#e5edbf99',3);
      this.line([[65,355],[105,230],[375,230],[415,355],[65,355]],'#e5edbf66',3);
      c.beginPath();c.ellipse(240,540,116,36,0,0,Math.PI*2);c.strokeStyle='#e5edbf66';c.lineWidth=3;c.stroke();
    }
    c.restore();
    const shade=c.createLinearGradient(0,0,480,0);shade.addColorStop(0,'#03182750');shade.addColorStop(.25,'#03182700');shade.addColorStop(.75,'#03182700');shade.addColorStop(1,'#03182750');c.fillStyle=shade;c.fillRect(0,0,480,720);
  }
  player(character, pose, x, y, scale, time = 0, frameOverride = null) {
    const key=`${character}/${pose}`, meta=SPRITES[key], img=this.bank.images.get(key);
    if (!img || !meta) return;
    const frame=frameOverride === null ? (meta.loop ? Math.floor(time*meta.fps)%meta.frames : clamp(Math.floor(time*meta.fps),0,meta.frames-1)) : clamp(frameOverride,0,meta.frames-1);
    const c=this.c;
    c.save();c.globalAlpha=.23;c.fillStyle='#071b24';c.beginPath();c.ellipse(x,y+1,50*scale,12*scale,0,0,7);c.fill();c.restore();
    c.drawImage(img,frame*meta.width,0,meta.width,meta.width,x-meta.anchorX*scale,y-meta.anchorY*scale,meta.width*scale,meta.width*scale);
  }
  ball(x,y,r=15,time=0) {
    const c=this.c;c.save();c.translate(x,y);c.rotate(time*3);
    const g=c.createRadialGradient(-r*.3,-r*.3,0,0,0,r);g.addColorStop(0,'#fffef0');g.addColorStop(1,'#bbcbd0');
    c.beginPath();c.arc(0,0,r,0,7);c.fillStyle=g;c.fill();c.strokeStyle='#112e3a';c.lineWidth=1.8;c.stroke();
    const points=Array.from({length:5},(_,i)=>[Math.cos(i*Math.PI*2/5)*r*.43,Math.sin(i*Math.PI*2/5)*r*.43]);
    this.polygon(points,'#17303c',null);
    for(let i=0;i<5;i++) {c.rotate(Math.PI*2/5);this.line([[r*.44,0],[r*.92,0]],'#17303c',1.5);}
    c.restore();
  }
  goal(g=FINAL_GOAL) {
    const {x,y,w,h}=g,c=this.c;
    this.polygon([[x,y+h],[x+18,y+h-15],[x+w+15,y+h-15],[x+w,y+h]],'#052d3344',null);
    this.polygon([[x,y],[x+16,y-16],[x+w+16,y-16],[x+w,y]],'#e1e4d2','#657f88',2);
    this.polygon([[x+w,y],[x+w+16,y-16],[x+w+16,y+h-16],[x+w,y+h]],'#8aa5a3','#395c65',2);
    c.fillStyle='#122d4380';c.fillRect(x,y,w,h);
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    for(let i=0;i<w;i+=17)this.line([[x+i,y],[x+i-9,y+h]],'#d8eee36b',1);
    for(let i=0;i<h;i+=17)this.line([[x,y+i],[x+w,y+i]],'#d8eee36b',1);
    c.restore();
    this.line([[x,y+h],[x,y],[x+w,y],[x+w,y+h]],'#123240',10);
    this.line([[x,y+h],[x,y],[x+w,y],[x+w,y+h]],'#f7f6dc',6);
    this.line([[x,y+h],[x+w,y+h]],'#eef1c666',2);
  }
  meter(value,zones,vertical,active,hit) {
    const c=this.c, x=vertical?425:30,y=vertical?390:340,w=vertical?20:340,h=vertical?158:23;
    c.save();c.globalAlpha=active?1:.72;
    c.fillStyle='#102a3b';c.fillRect(x-3,y-3,w+6,h+6);
    c.fillStyle='#9b4747';c.fillRect(x,y,w,h);
    for(const [a,b] of zones) {c.fillStyle='#42d995';if(vertical)c.fillRect(x,y+a*h,w,(b-a)*h);else c.fillRect(x+a*w,y,(b-a)*w,h);}
    c.strokeStyle=hit===null?'#ffe28a':hit?'#a6ffca':'#ffb0a2';c.lineWidth=3;
    if(vertical) {this.line([[x-6,y+value*h],[x+w+6,y+value*h]],c.strokeStyle,4);this.text('2 · HÖHE',434,377,11,'#fff');}
    else {this.line([[x+value*w,y-6],[x+value*w,y+h+6]],c.strokeStyle,4);this.text('1 · RICHTUNG',30,326,13,'#fff','left');}
    c.restore();
  }
  confetti(t) {
    const c=this.c;for(let i=0;i<36;i++){c.fillStyle=['#ffdc78','#f07479','#7ee7b3'][i%3];c.fillRect((i*79+Math.sin(t+i)*25)%480,(i*41+t*80)%720,5,10);}
  }
  menu(time) {
    this.background('menu',time);
    const compact=this.canvas.clientWidth<320, foot=compact?325:400;
    this.player('ronaldo','idle_front',240,foot,compact?.4:.64,time);
    this.ball(compact?280:306,foot,compact?13:20,time*.2);
  }
  dribble(m,time,finish,endWon=false) {
    if(finish) {
      this.background('final',time);this.goal();
      this.player('keeper','idle_front',240,318,.38,time);
      this.player('ronaldo',endWon?'celebrate_front':'shoot_side',235,620,.62,endWon?time:finish.shot||0);
      if(finish.phase==='shot') {
        const f=clamp((finish.shot-.45)/.8,0,1),tx=finish.success?340:437;
        this.ball(280+(tx-280)*f,597+(205-597)*f-Math.sin(f*Math.PI)*75,17-f*8,time);
        if(finish.success&&f===1)this.confetti(time);
      }
      return;
    }
    this.background('run',time);
    const c=this.c;c.save();c.beginPath();c.rect(0,94,480,626);c.clip();
    const actors=[];
    for(const wave of m.waves)for(let lane=0;lane<5;lane++)if(lane!==wave.free)
      actors.push({char:wave.boss?'messi':'defender',pose:'run_back',x:LANES[lane],y:wave.y,scale:.32});
    actors.push({char:'ronaldo',pose:'run_front',x:m.x,y:m.y,scale:.43});
    actors.sort((a,b)=>a.y-b.y).forEach(a=>this.player(a.char,a.pose,a.x,a.y,a.scale,time));
    this.ball(m.x+19,m.y+10,11,time);c.restore();
    if(m.passed>=15)this.text('MESSI · DIE LETZTEN DREI REIHEN',240,100,13,'#ffe193');
  }
  headers(m,time) {
    this.background('headers',time);
    this.text(`${m.balls.length} ${m.balls.length===1?'BALL':'BÄLLE'} · NÄCHSTER IN ${Math.ceil(15-m.elapsed%15)} s`,240,118,12,'#ffe193');
    this.player('ronaldo',m.hitAge<.8?m.hitPose:'idle_front',m.x,670,.54,m.hitAge<.8?m.hitAge:time);
    for(const b of m.balls)this.ball(b.x,b.y,15,time);
  }
  penalty(m,time,endWon=false) {
    this.background('penalty',time);this.goal(PENALTY_GOAL);
    const res=m.result,flight=m.flight,progress=res?clamp((flight-.5)/.9,0,1):0;
    const center=PENALTY_GOAL.x+PENALTY_GOAL.w/2;
    let kx=center,ky=280,pose='idle_front',kf=null;
    if(res&&progress>0) {
      const right=res.x>center,save=res.outcome==='save';
      pose=res.y<175&&save?'jump_front':right?'dive_right':'dive_left';
      const targetX=save?(pose==='jump_front'?res.x:res.x-(right?37:-37)):center+(res.x>center?-48:48);
      const targetY=save?res.y+(pose==='jump_front'?82:46):285;
      kx+=(targetX-center)*clamp(progress*1.8,0,1);ky+=(targetY-280)*clamp(progress*1.8,0,1);
      kf=clamp(Math.floor(progress*7),0,4);
    }
    this.player('keeper',pose,kx,ky,.33,time,kf);
    const shooting=res&&flight>=.2;
    const heroPose=endWon?'celebrate_front':res&&!shooting?'run_right_side':shooting?'shoot_side':'shoot_side';
    this.player('ronaldo',heroPose,105+(res?clamp(flight/.2,0,1)*25:0),615,.7,endWon?time:res?Math.max(0,flight-.2):0,endWon?null:res?null:0);
    let bx=185,by=605,br=17;
    if(res) {
      bx+=(res.x-bx)*progress;by+=(res.y-by)*progress-Math.sin(progress*Math.PI)*72;br-=progress*8;
      if(res.outcome==='bar'&&progress===1){bx-=Math.min(25,(flight-1.4)*90);by-=Math.min(35,(flight-1.4)*120);}
      // A saved ball stays at the keeper; no success animation is triggered.
      if(res.outcome==='save'&&progress===1){bx=res.x;by=res.y;}
    }
    this.ball(bx,by,br,time);
    const dh=m.directionHit,hh=m.heightHit;
    this.meter(m.phase==='direction'?m.cursor:m.direction,m.directionZones,false,m.phase==='direction',dh);
    this.meter(m.phase==='height'?m.cursor:m.height,m.heightZones,true,m.phase==='height',hh);
    this.text(m.phase==='direction'?'Erst die Richtung im Grün stoppen':m.phase==='height'?'Jetzt die Höhe im Grün stoppen':res?.goal?'TOOOR! Beide Bereiche getroffen.':res?.outcome==='save'?'Gehalten!':res?.outcome==='bar'?'Latte!':'Knapp vorbei!',240,92,16,'#ffdd8a');
    if(res?.goal&&progress===1)this.confetti(time);
  }
}
