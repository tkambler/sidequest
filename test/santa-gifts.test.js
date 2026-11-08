import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSantaGifts } from '../src/santa-gifts.js';

function setup(visitors) {
  const previous = { document: globalThis.document, innerWidth: globalThis.innerWidth, innerHeight: globalThis.innerHeight };
  globalThis.innerWidth=1000;globalThis.innerHeight=700;
  globalThis.document={createElement:()=>({style:{},dataset:{},isConnected:true,remove(){this.isConnected=false}})};
  const nodes=[], delivered=[];
  const surfaces=[{part:'box',anchor:'blocking-card',left:0,right:1000,y:220,originLeft:0},
    {part:'box',anchor:'another-heading',left:0,right:1000,y:350,originLeft:0},
    {part:'box',anchor:'recipient-ledge',left:0,right:1000,y:500,originLeft:0},
    {part:'floor',anchor:'floor',left:0,right:1000,y:700,originLeft:0}];
  const child=(x,y=500)=>({x,width:17,height:28,surface:{y},element:{hidden:false},received:false});
  const children=visitors || [child(100)];
  const gifts=createSantaGifts({scenery:{append:e=>nodes.push(e)},surfaces:()=>surfaces,children:()=>children,
    deliver:c=>{c.received=true;delivered.push(c)}});
  return {gifts,nodes,children,delivered,child,restore(){gifts.destroy();for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}};
}
const toss={muzzle:{x:108,y:100},dx:0,dy:1,speed:200};

test('gifts pass through intervening page cards and headings before reaching a child',()=>{
  const s=setup();try{
    s.gifts.toss(toss,0);s.gifts.update(500);
    assert.equal(s.nodes[0].dataset.outcome,'flying','a card at220px must not block the present');
    assert.equal(s.delivered.length,0);
    s.gifts.update(1000);
    assert.equal(s.delivered.length,1);assert.equal(s.nodes[0].dataset.outcome,'delivered');assert.equal(s.gifts.count,0);
  }finally{s.restore()}
});
test('a miss also passes page surfaces, lands only at the viewport floor, and fades away',()=>{
  const s=setup();try{
    s.gifts.toss({...toss,muzzle:{x:800,y:100}},0);s.gifts.update(1000);
    assert.equal(s.nodes[0].dataset.outcome,'flying');assert.equal(s.delivered.length,0);
    s.gifts.update(1500);assert.equal(s.nodes[0].dataset.outcome,'miss');assert.equal(s.gifts.count,1);
    assert.match(s.nodes[0].style.transform,/688px/);
    s.gifts.update(3500);assert.equal(s.gifts.count,0);assert.equal(s.nodes[0].isConnected,false);
  }finally{s.restore()}
});
test('swept collision delivers to the first waiting child and cannot grant a duplicate',()=>{
  const s=setup();try{
    const near=s.child(100,300);s.children.unshift(near);
    s.gifts.toss(toss,0);s.gifts.update(1000);
    assert.equal(s.delivered[0],near);
    s.children.splice(1);s.gifts.toss(toss,1000);s.gifts.update(2000);
    assert.equal(s.delivered.length,1,'the already served child is ignored');
  }finally{s.restore()}
});
test('a present landing close to a child counts even when it misses the body',()=>{
  const s=setup();try{
    s.gifts.toss({...toss,muzzle:{x:138,y:100}},0);s.gifts.update(1000);
    assert.equal(s.delivered.length,1);assert.equal(s.gifts.count,0);
  }finally{s.restore()}
});
test('projectiles remain bounded and cleanup removes every retained gift',()=>{
  const s=setup();try{
    for(let i=0;i<40;i++)s.gifts.toss(toss,0);
    assert.equal(s.gifts.count,16);assert.equal(s.nodes.filter(n=>n.isConnected).length,16);
    s.gifts.destroy();assert.equal(s.gifts.count,0);assert.ok(s.nodes.every(n=>!n.isConnected));
  }finally{s.restore()}
});
