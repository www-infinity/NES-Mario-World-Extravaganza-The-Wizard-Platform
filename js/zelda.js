/**
 * zelda.js — The Legend of Zelda canvas tribute
 * Fan-made NES-style top-down Zelda game engine
 * Inspired by The Legend of Zelda (NES, 1986) © Nintendo
 */
'use strict';
(function () {

  // ── Canvas & viewport ────────────────────────────────────────────────
  const canvas = document.getElementById('zeldaCanvas');
  const ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // NES Zelda game world: 16×11 tiles of 16px each = 256×176 game pixels
  const TILE = 16, COLS = 16, ROWS = 11;
  const GW = COLS * TILE;   // 256
  const GH = ROWS * TILE;   // 176

  let scale = 3, ox = 0, oy = 0;

  function resize() {
    canvas.width  = canvas.clientWidth  || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    scale = Math.max(2, Math.min(8,
      Math.floor(Math.min(canvas.width / GW, canvas.height / GH))));
    ox = Math.floor((canvas.width  - GW * scale) / 2);
    oy = Math.floor((canvas.height - GH * scale) / 2);
  }
  window.addEventListener('resize', resize);

  // ── Palette ──────────────────────────────────────────────────────────
  const C = {
    HUD_BG:'#000',HUD_TXT:'#fcfc00',HEART_F:'#d80000',HEART_E:'#444',
    GRASS:'#70c028',GRASS2:'#28a000',
    TREE_BG:'#004800',TREE_LT:'#006800',
    WATER_DK:'#3038ec',WATER_LT:'#6888fc',
    PATH:'#c87028',PATH_LT:'#e09838',
    ROCK:'#9898d8',ROCK_LT:'#bcbcf8',ROCK_DK:'#6868b0',
    STAIR_L:'#e0a040',STAIR_M:'#b87820',STAIR_D:'#784010',STAIR_OPEN:'#080808',
    FLOWER_P:'#f840a0',FLOWER_Y:'#f8f800',
    CAVE_BG:'#484848',CAVE_DK:'#080808',
    // Link
    L_HAT:'#70c028',L_HAT_D:'#285800',
    L_SKIN:'#f8d858',L_SKIN_D:'#d0a030',L_EYE:'#000',
    L_TUNIC:'#70c028',L_TUNIC_D:'#285800',
    L_BOOT:'#c07840',L_BOOT_D:'#884028',
    L_SWORD:'#fcfcfc',L_SHIELD:'#4868fc',L_SHIELD_D:'#0000d0',L_SHIELD_H:'#fcfcfc',
    // Enemies
    OCT:'#d82800',OCT_D:'#900000',OCT_EYE:'#fcfcfc',OCT_PUP:'#000',OCT_PROJ:'#d82800',
    MOB:'#7868e8',MOB_D:'#4848b0',MOB_LT:'#a898fc',
    MOB_LANCE:'#b0b0b0',MOB_LANCE_D:'#606060',
    // Items
    RUP_G:'#00d800',RUP_B:'#4868fc',RUP_R:'#d82800',RUP_Y:'#f8e800',
    HEART_I:'#d80000',HEART_I_L:'#f86868',
    // FX
    FX_W:'#ffffff',FX_Y:'#f8f800',FX_R:'#d80000',
  };

  // ── Tile IDs ─────────────────────────────────────────────────────────
  const [G,T,W,P,R,S,F,X] = [0,1,2,3,4,5,6,7];
  const SOLID = new Set([T,W,R,X]);

  // ── Map data ─────────────────────────────────────────────────────────
  const MAPS = {
    '1,0': { // North — hills
      tiles:[
        [T,T,T,T,T,T,T,G,T,T,T,T,T,T,T,T],
        [T,R,R,R,R,G,G,G,G,G,R,R,R,R,R,T],
        [T,R,R,G,G,G,G,G,G,G,G,G,R,R,R,T],
        [T,R,G,G,G,G,G,G,G,G,G,G,G,R,R,T],
        [T,G,G,G,G,F,G,G,G,F,G,G,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,R,G,G,G,G,G,G,G,G,G,G,G,R,R,T],
        [T,R,R,G,G,G,G,G,G,G,G,G,R,R,R,T],
        [T,R,R,R,G,G,G,G,G,G,G,R,R,R,R,T],
        [T,T,T,T,T,T,T,G,T,T,T,T,T,T,T,T],
      ],
      enemies:[{type:'moblin',tx:5,ty:4},{type:'moblin',tx:10,ty:5},{type:'moblin',tx:7,ty:8},{type:'octorok',tx:3,ty:6}],
      pickups:[{type:'rupee',col:'g',tx:3,ty:3},{type:'rupee',col:'g',tx:12,ty:7}],
    },
    '0,1': { // West — lake
      tiles:[
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,W,W,W,W,W,W,W,W,W,W,G,G,G,G,T],
        [T,W,W,W,W,W,W,W,W,W,G,G,F,G,G,T],
        [T,W,W,W,W,W,W,W,W,G,G,G,G,G,G,T],
        [T,W,W,W,W,W,W,W,G,G,G,G,G,G,G,T],
        [G,W,W,W,W,W,W,G,G,G,G,G,G,G,G,G],
        [T,W,W,W,W,W,W,W,G,G,G,G,G,G,G,T],
        [T,W,W,W,W,W,W,W,W,G,G,G,F,G,G,T],
        [T,W,W,W,W,W,W,W,W,W,G,G,G,G,G,T],
        [T,W,W,W,W,W,W,W,W,W,W,G,G,G,G,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
      ],
      enemies:[{type:'octorok',tx:2,ty:2},{type:'octorok',tx:2,ty:7}],
      pickups:[{type:'rupee',col:'b',tx:12,ty:4},{type:'rupee',col:'g',tx:13,ty:6},{type:'heart',tx:11,ty:5}],
    },
    '1,1': { // Center — start
      tiles:[
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,R,R,G,G,G,G,G,R,R,G,G,G,T],
        [T,G,G,R,G,G,F,G,G,G,G,R,G,G,G,T],
        [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
        [T,G,G,R,G,G,F,G,G,G,G,R,G,G,G,T],
        [T,G,G,R,R,G,G,G,G,G,R,R,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,G,G,P,P,P,P,P,G,G,G,G,G,T],
        [T,T,T,T,T,T,T,G,T,T,T,T,T,T,T,T],
      ],
      enemies:[],
      pickups:[{type:'rupee',col:'g',tx:7,ty:2},{type:'rupee',col:'g',tx:5,ty:8}],
      linkStart:{tx:7,ty:5},
    },
    '2,1': { // East — cave
      tiles:[
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,G,G,G,G,R,R,R,R,R,R,R,R,R,R,T],
        [T,G,G,G,G,R,R,R,R,R,R,R,R,R,R,T],
        [T,G,G,G,G,R,R,R,R,R,R,R,R,R,R,T],
        [T,G,G,G,G,R,G,G,G,G,R,R,R,R,R,T],
        [G,G,G,G,G,R,G,G,G,G,R,R,R,R,R,T],
        [T,G,G,G,G,R,G,X,G,G,R,R,R,R,R,T],
        [T,G,G,G,G,R,R,R,R,R,R,R,R,R,R,T],
        [T,G,G,G,G,R,R,R,R,R,R,R,R,R,R,T],
        [T,G,G,G,R,R,R,R,R,R,R,R,R,R,R,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
      ],
      enemies:[{type:'octorok',tx:7,ty:4},{type:'octorok',tx:8,ty:6}],
      pickups:[{type:'rupee',col:'r',tx:10,ty:5},{type:'rupee',col:'b',tx:8,ty:5}],
    },
    '1,2': { // South — dungeon
      tiles:[
        [T,T,T,T,T,T,T,G,T,T,T,T,T,T,T,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,R,R,R,G,G,G,R,R,R,G,G,G,T],
        [T,G,G,R,R,G,G,G,G,G,R,R,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,G,G,R,R,G,G,G,G,G,R,R,G,G,G,T],
        [T,G,G,R,R,R,G,G,G,R,R,R,G,G,G,T],
        [T,G,G,G,P,P,P,S,P,P,P,G,G,G,G,T],
        [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
      ],
      enemies:[{type:'moblin',tx:4,ty:4},{type:'moblin',tx:11,ty:4},{type:'moblin',tx:8,ty:6}],
      pickups:[{type:'rupee',col:'y',tx:7,ty:3},{type:'heart',tx:5,ty:6}],
    },
  };

  // ── Game state ───────────────────────────────────────────────────────
  let sX=1, sY=1, currentMap=null;
  let link = {
    x:0,y:0,dir:'down',walkFrame:0,walkTimer:0,
    attacking:false,attackTimer:0,attackHit:false,
    health:6,maxHealth:6,rupees:0,invincible:0,speed:112,
    stairsVisited:false,
  };
  let enemies=[], projectiles=[], pickups=[], particles=[];
  let transitioning=false,transDir=null,transAlpha=0,transPhase=0;
  let gameStarted=false,gamePaused=false,animTime=0,lastTime=null;

  // ── Input ────────────────────────────────────────────────────────────
  const keys={}, td={up:false,down:false,left:false,right:false};
  let   touchAttack=false;

  document.addEventListener('keydown',e=>{
    keys[e.key]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    if(!gameStarted){startGame();return;}
    if((e.key==='p'||e.key==='P'||e.key==='Escape')&&!transitioning) gamePaused=!gamePaused;
    if(['z','Z','x','X',' '].includes(e.key)&&!link.attacking) attack();
  });
  document.addEventListener('keyup',e=>{keys[e.key]=false;});

  function attack(){link.attacking=true;link.attackTimer=0.35;link.attackHit=false;}
  function mv(d){return keys['Arrow'+{up:'Up',down:'Down',left:'Left',right:'Right'}[d]]||keys[{up:'w',down:'s',left:'a',right:'d'}[d]]||keys[{up:'W',down:'S',left:'A',right:'D'}[d]]||td[d];}

  // ── Screen load ──────────────────────────────────────────────────────
  function loadScreen(sx,sy,from){
    const key=`${sx},${sy}`;
    if(!MAPS[key]) return false;
    sX=sx;sY=sy;currentMap=MAPS[key];
    enemies=(currentMap.enemies||[]).map(e=>({
      type:e.type,x:e.tx*TILE,y:e.ty*TILE,
      dir:['up','down','left','right'][Math.floor(Math.random()*4)],
      frame:0,frameTimer:0,hp:e.type==='moblin'?2:1,
      moveTimer:Math.random(),shootTimer:Math.random()*2,
    }));
    pickups=(currentMap.pickups||[]).map(p=>({...p,x:p.tx*TILE,y:p.ty*TILE,bobTimer:Math.random()*Math.PI*2}));
    if(from==='w'){link.x=GW-TILE;link.dir='right';}
    if(from==='e'){link.x=0;      link.dir='left';}
    if(from==='n'){link.y=GH-TILE;link.dir='down';}
    if(from==='s'){link.y=0;      link.dir='up';}
    link.stairsVisited=false;
    return true;
  }

  // ── Collision ────────────────────────────────────────────────────────
  function solid(tx,ty){
    if(tx<0||tx>=COLS||ty<0||ty>=ROWS) return true;
    return SOLID.has(currentMap.tiles[ty][tx]);
  }
  function blocked(px,py,pw,ph){
    for(let ty=Math.floor(py/TILE);ty<=Math.floor((py+ph-1)/TILE);ty++)
      for(let tx=Math.floor(px/TILE);tx<=Math.floor((px+pw-1)/TILE);tx++)
        if(solid(tx,ty)) return true;
    return false;
  }
  function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

  // ── Particles ────────────────────────────────────────────────────────
  function spark(x,y,col,n){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2,s=30+Math.random()*80;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,color:col,life:0.4+Math.random()*0.3,maxLife:0.7,alpha:1,size:2+Math.random()*2});
    }
  }

  // ── Sword box ────────────────────────────────────────────────────────
  function swordBox(){
    const ext=20;
    return {
      up:   {x:link.x+2,y:link.y-ext,w:12,h:ext},
      down: {x:link.x+2,y:link.y+TILE,w:12,h:ext},
      left: {x:link.x-ext,y:link.y+2,w:ext,h:12},
      right:{x:link.x+TILE,y:link.y+2,w:ext,h:12},
    }[link.dir];
  }

  // ── Update ───────────────────────────────────────────────────────────
  function update(dt){
    animTime+=dt;
    if(transitioning){
      const spd=2.5;
      if(transPhase===0){
        transAlpha+=dt*spd;
        if(transAlpha>=1){
          transAlpha=1;
          const m={n:[sX,sY-1,'n'],s:[sX,sY+1,'s'],e:[sX+1,sY,'e'],w:[sX-1,sY,'w']}[transDir];
          loadScreen(m[0],m[1],m[2]);
          transPhase=1;
        }
      } else {
        transAlpha-=dt*spd;
        if(transAlpha<=0){transAlpha=0;transitioning=false;transPhase=0;}
      }
      return;
    }
    if(gamePaused) return;

    // Link movement
    if(!link.attacking){
      let dx=0,dy=0;
      if     (mv('up'))   {dy=-1;link.dir='up';}
      else if(mv('down')) {dy=+1;link.dir='down';}
      else if(mv('left')) {dx=-1;link.dir='left';}
      else if(mv('right')){dx=+1;link.dir='right';}
      if(dx||dy){
        const nx=link.x+dx*link.speed*dt,ny=link.y+dy*link.speed*dt;
        if(!blocked(nx+2,link.y+2,12,12)) link.x=nx;
        if(!blocked(link.x+2,ny+2,12,12)) link.y=ny;
        link.walkTimer+=dt;
        if(link.walkTimer>0.12){link.walkFrame=1-link.walkFrame;link.walkTimer=0;}
      } else link.walkFrame=0;
    }

    // Attack timer
    if(link.attacking){
      link.attackTimer-=dt;
      if(link.attackTimer<=0){link.attacking=false;link.attackHit=false;}
      else if(!link.attackHit){
        const sb=swordBox();
        enemies.forEach(e=>{
          if(e.hp<=0) return;
          if(overlap(sb,{x:e.x+2,y:e.y+2,w:12,h:12})){
            e.hp--;link.attackHit=true;
            spark(e.x+8,e.y+8,C.FX_W,6);
            if(e.hp<=0){spark(e.x+8,e.y+8,C.FX_Y,10);link.rupees+=e.type==='moblin'?5:1;}
          }
        });
      }
    }

    // Screen exit
    const exits=[
      [link.x<-4,     sX-1,sY,'w'],[link.x>GW-TILE+4, sX+1,sY,'e'],
      [link.y<-4,     sX,sY-1,'n'],[link.y>GH-TILE+4, sX,sY+1,'s'],
    ];
    for(const[cond,nx,ny,dir] of exits){
      if(cond){
        if(MAPS[`${nx},${ny}`]){transitioning=true;transDir=dir;transPhase=0;transAlpha=0;}
        else{if(dir==='w') link.x=0;if(dir==='e') link.x=GW-TILE;if(dir==='n') link.y=0;if(dir==='s') link.y=GH-TILE;}
        return;
      }
    }

    // Stairs — use a flag so bonus only triggers once per visit
    const lTX=Math.floor((link.x+8)/TILE),lTY=Math.floor((link.y+8)/TILE);
    const onStairs=currentMap.tiles[lTY]?.[lTX]===S;
    if(onStairs && !link.stairsVisited){
      link.stairsVisited=true;
      spark(link.x+8,link.y+8,C.RUP_Y,8);link.rupees+=10;
    } else if(!onStairs){
      link.stairsVisited=false;
    }

    if(link.invincible>0) link.invincible-=dt;

    // Enemies
    enemies.forEach(e=>updateEnemy(e,dt));
    enemies=enemies.filter(e=>e.hp>0);

    // Projectiles
    projectiles.forEach(p=>{
      p.x+=p.dx*dt;p.y+=p.dy*dt;p.life-=dt;
      if(solid(Math.floor((p.x+4)/TILE),Math.floor((p.y+4)/TILE))){p.life=0;return;}
      if(link.invincible<=0&&overlap({x:p.x,y:p.y,w:8,h:8},{x:link.x+2,y:link.y+2,w:12,h:12})){
        link.health=Math.max(0,link.health-1);link.invincible=1.5;p.life=0;
        spark(link.x+8,link.y+8,C.FX_R,6);
      }
    });
    projectiles=projectiles.filter(p=>p.life>0);

    // Pickups
    pickups.forEach(p=>{
      p.bobTimer+=dt*3;
      if(overlap({x:p.x,y:p.y,w:TILE,h:TILE},{x:link.x,y:link.y,w:TILE,h:TILE})){
        p.collected=true;
        if(p.type==='rupee'){
          link.rupees+=({g:1,b:5,r:20,y:100}[p.col]||1);
          spark(p.x+8,p.y+8,{g:C.RUP_G,b:C.RUP_B,r:C.RUP_R,y:C.RUP_Y}[p.col]||C.RUP_G,8);
        } else if(p.type==='heart'){
          link.health=Math.min(link.maxHealth,link.health+2);
          spark(p.x+8,p.y+8,C.HEART_I,10);
        }
      }
    });
    pickups=pickups.filter(p=>!p.collected);

    // Particles
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;p.life-=dt;p.alpha=Math.max(0,p.life/p.maxLife);});
    particles=particles.filter(p=>p.life>0);
  }

  function updateEnemy(e,dt){
    if(e.hp<=0) return;
    e.frameTimer+=dt;
    if(e.frameTimer>0.18){e.frame=1-e.frame;e.frameTimer=0;}

    if(e.type==='octorok'){
      e.moveTimer-=dt;
      if(e.moveTimer<=0){e.moveTimer=0.8+Math.random()*0.8;e.dir=['up','down','left','right'][Math.floor(Math.random()*4)];}
      const dx={left:-1,right:1,up:0,down:0}[e.dir];
      const dy={left:0,right:0,up:-1,down:1}[e.dir];
      const spd=48;
      const nx=e.x+dx*spd*dt,ny=e.y+dy*spd*dt;
      if(!blocked(nx+2,e.y+2,12,12)) e.x=nx;
      if(!blocked(e.x+2,ny+2,12,12)) e.y=ny;
      e.x=Math.max(0,Math.min(GW-TILE,e.x));e.y=Math.max(0,Math.min(GH-TILE,e.y));
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=2+Math.random()*2;
        const ang=Math.atan2(link.y-e.y,link.x-e.x);
        projectiles.push({x:e.x+8,y:e.y+8,dx:Math.cos(ang)*96,dy:Math.sin(ang)*96,life:2});
      }
    } else if(e.type==='moblin'){
      e.moveTimer-=dt;
      if(e.moveTimer<=0){
        e.moveTimer=0.3+Math.random()*0.4;
        const adx=link.x-e.x,ady=link.y-e.y;
        e.dir=Math.abs(adx)>Math.abs(ady)?(adx>0?'right':'left'):(ady>0?'down':'up');
      }
      const dx={left:-1,right:1,up:0,down:0}[e.dir];
      const dy={left:0,right:0,up:-1,down:1}[e.dir];
      const spd=56;
      const nx=e.x+dx*spd*dt,ny=e.y+dy*spd*dt;
      if(!blocked(nx+2,e.y+2,12,12)) e.x=nx;
      if(!blocked(e.x+2,ny+2,12,12)) e.y=ny;
      e.x=Math.max(0,Math.min(GW-TILE,e.x));e.y=Math.max(0,Math.min(GH-TILE,e.y));
      if(link.invincible<=0&&overlap({x:e.x+2,y:e.y+2,w:12,h:12},{x:link.x+2,y:link.y+2,w:12,h:12})){
        link.health=Math.max(0,link.health-1);link.invincible=1.5;
        spark(link.x+8,link.y+8,C.FX_R,6);
      }
    }
  }

  // ── Rendering ────────────────────────────────────────────────────────
  function render(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);

    // Tiles
    for(let ty=0;ty<ROWS;ty++)
      for(let tx=0;tx<COLS;tx++)
        drawTile(currentMap.tiles[ty][tx],ox+tx*TILE*scale,oy+ty*TILE*scale,tx,ty);

    // Pickups
    pickups.forEach(p=>{
      const bob=Math.sin(p.bobTimer)*2;
      drawPickup(p,ox+p.x*scale,oy+(p.y+bob)*scale);
    });

    // Link
    if(!(link.invincible>0&&Math.floor(animTime*10)%2===0)){
      const lx=ox+link.x*scale,ly=oy+link.y*scale;
      drawLink(lx,ly);
      if(link.attacking) drawSword(lx,ly);
    }

    // Enemies
    enemies.forEach(e=>{
      if(e.hp<=0) return;
      const ex=ox+e.x*scale,ey=oy+e.y*scale;
      if(e.type==='octorok') drawOctorok(ex,ey,e);
      else drawMoblin(ex,ey,e);
    });

    // Projectiles
    projectiles.forEach(p=>{
      const px=ox+p.x*scale,py=oy+p.y*scale;
      ctx.fillStyle=C.OCT_PROJ;ctx.fillRect(px-4*scale,py-4*scale,8*scale,8*scale);
      ctx.fillStyle=C.FX_W;ctx.fillRect(px-2*scale,py-2*scale,4*scale,4*scale);
    });

    // Particles
    particles.forEach(p=>{
      ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      const sz=p.size*scale;
      ctx.fillRect(ox+p.x*scale-sz/2,oy+p.y*scale-sz/2,sz,sz);
    });
    ctx.globalAlpha=1;

    drawHUD();

    // Transition
    if(transitioning&&transAlpha>0){
      ctx.globalAlpha=transAlpha;ctx.fillStyle='#000';
      ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
    }

    // Start screen
    if(!gameStarted){
      ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.textAlign='center';
      ctx.fillStyle='#f8d858';ctx.font=`bold ${Math.max(14,scale*6)}px "Press Start 2P",monospace`;
      ctx.fillText('THE LEGEND OF ZELDA',canvas.width/2,canvas.height/2-36);
      ctx.fillStyle='#fcfc00';ctx.font=`${Math.max(9,scale*3)}px "Press Start 2P",monospace`;
      ctx.fillText('▶ PRESS START OR TAP',canvas.width/2,canvas.height/2+8);
      ctx.fillStyle='#aaa';ctx.font=`${Math.max(6,scale*2)}px "Press Start 2P",monospace`;
      ctx.fillText('ARROWS/WASD · Z/X/SPACE=SWORD',canvas.width/2,canvas.height/2+44);
    }

    // Paused
    if(gamePaused&&gameStarted){
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.textAlign='center';ctx.fillStyle='#fcfc00';
      ctx.font=`bold ${Math.max(12,scale*5)}px "Press Start 2P",monospace`;
      ctx.fillText('PAUSED',canvas.width/2,canvas.height/2);
      ctx.fillStyle='#fff';ctx.font=`${Math.max(8,scale*2)}px "Press Start 2P",monospace`;
      ctx.fillText('P / ESC to resume',canvas.width/2,canvas.height/2+30);
    }
  }

  function drawHUD(){
    const hudH=28*scale;
    ctx.fillStyle=C.HUD_BG;ctx.fillRect(ox,oy-hudH,GW*scale,hudH);
    ctx.fillStyle=C.RUP_G;ctx.textAlign='left';
    ctx.font=`${scale*5}px "Press Start 2P",monospace`;
    ctx.fillText(`◆×${String(link.rupees).padStart(3,'0')}`,ox+4*scale,oy-16*scale);
    ctx.fillStyle=C.HUD_TXT;ctx.textAlign='center';
    ctx.font=`${scale*4}px "Press Start 2P",monospace`;
    ctx.fillText(`${sX}-${sY}`,ox+GW*scale/2,oy-14*scale);
    // Hearts
    const hs=7*scale,tot=link.maxHealth/2,full=Math.floor(link.health/2),half=link.health%2===1;
    for(let i=0;i<tot;i++){
      const hx=ox+GW*scale-(tot-i)*(hs+scale)-4*scale,hy=oy-hudH+8*scale;
      ctx.fillStyle=i<full?C.HEART_F:(i===full&&half?'#ff8888':C.HEART_E);
      drawHeart(hx,hy,hs);
    }
  }

  function drawHeart(hx,hy,sz){
    const s=sz/7;
    ctx.fillRect(hx+s,hy,2*s,2*s);ctx.fillRect(hx+4*s,hy,2*s,2*s);
    ctx.fillRect(hx,hy+s,6*s,2*s);ctx.fillRect(hx+s,hy+3*s,4*s,2*s);
    ctx.fillRect(hx+2*s,hy+5*s,2*s,s);
  }

  // ── Tile renderer ────────────────────────────────────────────────────
  function drawTile(id,px,py,tx,ty){
    const s=scale,ts=TILE*s;
    function r(gx,gy,gw,gh,col){ctx.fillStyle=col;ctx.fillRect(px+gx*s,py+gy*s,gw*s,gh*s);}
    switch(id){
      case G:
        r(0,0,16,16,C.GRASS);
        if((tx+ty)%2===0){r(0,0,16,1,C.GRASS2);r(0,0,1,16,C.GRASS2);}
        const h=(tx*11+ty*7)%16;
        if(h<4){r(h+4,h+4,1,2,C.GRASS2);r(h+3,h+5,1,1,C.GRASS2);r(h+5,h+5,1,1,C.GRASS2);}
        break;
      case T:
        r(0,0,16,16,C.TREE_BG);
        r(1,2,6,5,C.TREE_LT);r(2,1,4,1,C.TREE_LT);
        r(8,8,6,5,C.TREE_LT);r(9,7,4,1,C.TREE_LT);
        r(2,9,4,4,C.TREE_LT);
        break;
      case W:
        for(let gy=0;gy<16;gy++){
          ctx.fillStyle=(gy+Math.floor(animTime*2))%2===0?C.WATER_DK:C.WATER_LT;
          ctx.fillRect(px,py+gy*s,ts,s);
        }
        break;
      case P:
        r(0,0,16,16,C.PATH);r(0,0,16,1,C.PATH_LT);r(0,0,1,16,C.PATH_LT);
        r(14,0,2,16,C.GRASS2);r(0,14,16,2,C.GRASS2);
        break;
      case R:
        r(0,0,16,16,C.ROCK);r(1,1,6,3,C.ROCK_LT);r(9,7,4,3,C.ROCK_LT);
        r(0,13,16,3,C.ROCK_DK);r(13,0,3,16,C.ROCK_DK);
        break;
      case S:
        r(0,0,16,16,C.STAIR_D);
        for(let st=0;st<4;st++){r(st,st*2,16-st*2,2,C.STAIR_L);r(st,st*2+2,16-st*2,1,C.STAIR_M);}
        r(4,8,8,8,C.STAIR_OPEN);
        break;
      case F:
        r(0,0,16,16,C.GRASS);
        r(6,4,2,2,C.FLOWER_P);r(4,6,2,2,C.FLOWER_P);r(8,6,2,2,C.FLOWER_P);r(6,8,2,2,C.FLOWER_P);
        r(6,6,2,2,C.FLOWER_Y);
        break;
      case X:
        r(0,0,16,16,C.CAVE_BG);r(3,3,10,10,C.CAVE_DK);
        r(4,2,8,1,C.ROCK_DK);r(3,3,1,8,C.ROCK_DK);r(12,3,1,8,C.ROCK_DK);
        break;
    }
  }

  // ── Link sprite ──────────────────────────────────────────────────────
  function drawLink(bx,by){
    const s=scale,f=link.walkFrame;
    function r(gx,gy,gw,gh,col){ctx.fillStyle=col;ctx.fillRect(bx+gx*s,by+gy*s,gw*s,gh*s);}
    // Hat (all directions)
    r(4,0,6,2,C.L_HAT);r(3,2,8,1,C.L_HAT_D);r(3,3,8,1,C.L_HAT);
    if(link.dir==='down'){
      r(4,4,7,4,C.L_SKIN);r(5,5,2,2,C.L_EYE);r(9,5,2,2,C.L_EYE);r(4,7,7,1,C.L_SKIN_D);
      r(3,8,9,4,C.L_TUNIC);r(2,9,1,3,C.L_SKIN);r(12,9,1,3,C.L_SKIN);
      r(1,8,2,5,C.L_SHIELD);r(1,9,2,3,C.L_SHIELD_D);r(1,9,2,1,C.L_SHIELD_H);
      r(3+f,12,3,3,C.L_BOOT);r(3+f,14,3,1,C.L_BOOT_D);
      r(9-f,12,3,3,C.L_BOOT);r(9-f,14,3,1,C.L_BOOT_D);
    } else if(link.dir==='up'){
      r(4,4,7,4,C.L_SKIN_D);
      r(3,8,9,4,C.L_TUNIC);r(2,9,1,3,C.L_SKIN);r(12,9,1,3,C.L_SKIN);
      r(11,8,2,5,C.L_SHIELD);r(11,9,2,3,C.L_SHIELD_D);
      r(3+f,12,3,3,C.L_BOOT);r(3+f,14,3,1,C.L_BOOT_D);
      r(9-f,12,3,3,C.L_BOOT);r(9-f,14,3,1,C.L_BOOT_D);
    } else if(link.dir==='left'){
      r(1,4,8,4,C.L_SKIN);r(2,5,2,2,C.L_EYE);r(1,7,8,1,C.L_SKIN_D);
      r(1,8,9,4,C.L_TUNIC);
      r(10,8,3,5,C.L_SHIELD);r(10,9,3,3,C.L_SHIELD_D);r(10,9,3,1,C.L_SHIELD_H);
      if(f===0){r(2,12,5,3,C.L_BOOT);r(2,14,5,1,C.L_BOOT_D);}
      else{r(1,12,4,3,C.L_BOOT);r(1,14,4,1,C.L_BOOT_D);r(5,13,4,2,C.L_BOOT);}
    } else {
      r(6,4,8,4,C.L_SKIN);r(10,5,2,2,C.L_EYE);r(6,7,8,1,C.L_SKIN_D);
      r(5,8,9,4,C.L_TUNIC);
      r(2,8,3,5,C.L_SHIELD);r(2,9,3,3,C.L_SHIELD_D);r(2,9,3,1,C.L_SHIELD_H);
      if(f===0){r(8,12,5,3,C.L_BOOT);r(8,14,5,1,C.L_BOOT_D);}
      else{r(9,12,4,3,C.L_BOOT);r(9,14,4,1,C.L_BOOT_D);r(5,13,4,2,C.L_BOOT);}
    }
  }

  function drawSword(bx,by){
    const s=scale;
    ctx.fillStyle=C.L_SWORD;
    switch(link.dir){
      case 'up':    ctx.fillRect(bx+7*s,by-16*s,2*s,16*s);ctx.fillStyle=C.L_BOOT;ctx.fillRect(bx+5*s,by-6*s,6*s,2*s);break;
      case 'down':  ctx.fillRect(bx+7*s,by+16*s,2*s,16*s);ctx.fillStyle=C.L_BOOT;ctx.fillRect(bx+5*s,by+20*s,6*s,2*s);break;
      case 'left':  ctx.fillRect(bx-16*s,by+7*s,16*s,2*s);ctx.fillStyle=C.L_BOOT;ctx.fillRect(bx-7*s,by+5*s,2*s,6*s);break;
      case 'right': ctx.fillRect(bx+16*s,by+7*s,16*s,2*s);ctx.fillStyle=C.L_BOOT;ctx.fillRect(bx+20*s,by+5*s,2*s,6*s);break;
    }
  }

  // ── Enemy sprites ────────────────────────────────────────────────────
  function drawOctorok(ex,ey,e){
    const s=scale;
    function r(gx,gy,gw,gh,col){ctx.fillStyle=col;ctx.fillRect(ex+gx*s,ey+gy*s,gw*s,gh*s);}
    r(3,2,10,8,C.OCT);r(2,4,12,6,C.OCT);r(1,5,14,4,C.OCT);r(4,6,8,4,C.OCT_D);
    r(3,4,3,3,C.OCT_EYE);r(10,4,3,3,C.OCT_EYE);r(4,4,2,2,C.OCT_PUP);r(10,4,2,2,C.OCT_PUP);
    const lo=e.frame*2;
    r(2,10+lo,3,4,C.OCT_D);r(6,10,4,4,C.OCT_D);r(11,10+lo,3,4,C.OCT_D);
    if(e.dir==='up')    r(6,0,4,3,C.OCT_D);
    if(e.dir==='down')  r(6,13,4,3,C.OCT_D);
    if(e.dir==='left')  r(0,6,3,4,C.OCT_D);
    if(e.dir==='right') r(13,6,3,4,C.OCT_D);
  }

  function drawMoblin(ex,ey,e){
    const s=scale;
    function r(gx,gy,gw,gh,col){ctx.fillStyle=col;ctx.fillRect(ex+gx*s,ey+gy*s,gw*s,gh*s);}
    r(3,4,10,8,C.MOB);r(4,3,8,1,C.MOB);r(4,12,8,1,C.MOB);r(4,4,4,3,C.MOB_LT);
    r(4,1,8,4,C.L_SKIN);r(5,2,2,2,C.L_EYE);r(9,2,2,2,C.L_EYE);r(6,4,4,1,C.OCT_D);
    r(2,1,2,3,C.MOB_LT);r(12,1,2,3,C.MOB_LT);
    const lo=e.frame;
    r(4,13+lo,3,3,C.MOB_D);r(9,13-lo,3,3,C.MOB_D);
    ctx.fillStyle=C.MOB_LANCE;
    switch(e.dir){
      case 'right': ctx.fillRect(ex+13*s,ey+6*s,16*s,2*s);break;
      case 'left':  ctx.fillRect(ex-13*s,ey+6*s,14*s,2*s);break;
      case 'up':    ctx.fillRect(ex+7*s,ey-14*s,2*s,16*s);break;
      case 'down':  ctx.fillRect(ex+7*s,ey+14*s,2*s,16*s);break;
    }
  }

  // ── Pickup sprite ────────────────────────────────────────────────────
  function drawPickup(p,px,py){
    const s=scale;
    function r(gx,gy,gw,gh,col){ctx.fillStyle=col;ctx.fillRect(px+gx*s,py+gy*s,gw*s,gh*s);}
    if(p.type==='rupee'){
      const col={g:C.RUP_G,b:C.RUP_B,r:C.RUP_R,y:C.RUP_Y}[p.col]||C.RUP_G;
      const dk={g:'#00a800',b:'#2040c0',r:'#a80000',y:'#c0a000'}[p.col]||'#00a800';
      r(6,2,4,2,dk);r(4,4,8,4,col);r(6,8,4,4,dk);r(5,6,6,2,C.FX_W);
    } else if(p.type==='heart'){
      r(1,0,2,2,C.HEART_I);r(4,0,2,2,C.HEART_I);r(0,1,6,2,C.HEART_I);
      r(1,3,4,2,C.HEART_I_L);r(2,5,2,1,C.HEART_I);
    }
  }

  // ── Main loop ────────────────────────────────────────────────────────
  function loop(ts){
    if(lastTime===null) lastTime=ts;
    const dt=Math.min(0.05,(ts-lastTime)/1000);lastTime=ts;
    if(gameStarted) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function startGame(){
    if(gameStarted) return;
    gameStarted=true;resize();
    loadScreen(1,1,null);
    const st=MAPS['1,1'].linkStart;
    link.x=st.tx*TILE;link.y=st.ty*TILE;
  }

  // ── D-pad wiring ─────────────────────────────────────────────────────
  function wireDpad(){
    const press={
      'btn-up':   ()=>{td.up=true;},   'btn-down': ()=>{td.down=true;},
      'btn-left': ()=>{td.left=true;}, 'btn-right':()=>{td.right=true;},
      'btn-sword':()=>{attack();},      'btn-start':()=>{if(!gameStarted)startGame();else gamePaused=!gamePaused;},
    };
    const release={
      'btn-up':()=>{td.up=false;},'btn-down':()=>{td.down=false;},
      'btn-left':()=>{td.left=false;},'btn-right':()=>{td.right=false;},
      'btn-sword':()=>{},'btn-start':()=>{},
    };
    Object.entries(press).forEach(([id,fn])=>{
      const el=document.getElementById(id);if(!el)return;
      el.addEventListener('touchstart',e=>{e.preventDefault();fn();if(!gameStarted)startGame();},{passive:false});
      el.addEventListener('mousedown', e=>{e.preventDefault();fn();if(!gameStarted)startGame();});
    });
    Object.entries(release).forEach(([id,fn])=>{
      const el=document.getElementById(id);if(!el)return;
      ['touchend','touchcancel'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();fn();},{passive:false}));
      ['mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev,fn));
    });
    canvas.addEventListener('click',()=>{if(!gameStarted)startGame();});
    canvas.addEventListener('touchend',e=>{e.preventDefault();if(!gameStarted)startGame();},{passive:false});
  }

  // ── Init ─────────────────────────────────────────────────────────────
  window.addEventListener('load',()=>{
    resize();wireDpad();
    currentMap=MAPS['1,1'];enemies=[];pickups=[];projectiles=[];particles=[];
    requestAnimationFrame(loop);
  });

})();
