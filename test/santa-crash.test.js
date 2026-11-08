import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepSantaCrash } from '../src/santa-crash.js';
const bounds={width:1000,height:800,size:123};
const body=()=>({x:400,y:150,vx:160,vy:60,bank:0,direction:1});
test('crashing Santa accelerates downward and tumbles while horizontal momentum decays',()=>{
  const s=body();stepSantaCrash(s,1/60,bounds);
  assert.ok(s.y>150 && s.vy>60);assert.ok(s.x>400 && s.vx<160);assert.ok(s.bank>0);
  const left={...body(),direction:-1};stepSantaCrash(left,1/60,bounds);assert.ok(left.bank<0);
});
test('the lowest tilted corner reaches the viewport floor without falling through it',()=>{
  const endings=[];
  for(const dt of [1/120,1/60,1/20]){
    const s=body();let grounded=false;
    for(let t=0;t<5 && !grounded;t+=dt)grounded=stepSantaCrash(s,dt,bounds);
    assert.ok(grounded);assert.equal(s.vx,0);assert.equal(s.vy,0);
    const angle=s.bank*Math.PI/180;
    const bottom=s.y+(89*Math.abs(Math.sin(angle))+44.5*Math.cos(angle)-44.5)*123/178;
    assert.ok(Math.abs(bottom-800)<1e-9);endings.push(s);
  }
  assert.ok(Math.abs(endings[0].x-endings[2].x)<6,'crash travel stays consistent across frame rates');
});
test('crash drift stays visible at the viewport edges',()=>{
  const right={...body(),x:876,vx:900};stepSantaCrash(right,.05,bounds);
  assert.equal(right.x,877);assert.equal(right.vx,0);
  const left={...body(),x:1,vx:-900};stepSantaCrash(left,.05,bounds);
  assert.equal(left.x,0);assert.equal(left.vx,0);
});
