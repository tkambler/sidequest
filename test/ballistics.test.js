import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BALL_GRAVITY,projectilePoint,previewTrajectory,autoAimPose,ballisticDirection,chargeVelocity,riflePose,segmentHitTime} from '../src/ballistics.js';

test('a longer charge gives a faster ball, with bounded full power',()=>{
  assert.ok(chargeVelocity(0)<chargeVelocity(.5));
  assert.ok(chargeVelocity(.5)<chargeVelocity(1));
  assert.equal(chargeVelocity(2),chargeVelocity(1));
  assert.equal(chargeVelocity(-1),chargeVelocity(0));
});
test('rifle muzzle follows mouse aim on either side of the cowboy',()=>{
  for(const facing of [-1,1]) for(const mouse of [{x:500,y:100},{x:20,y:100},{x:500,y:700},{x:20,y:700}]) {
    const pose=riflePose(200,800,80,facing,mouse);
    assert.ok(Number.isFinite(pose.angle));
    assert.ok(Math.abs(Math.hypot(pose.dx,pose.dy)-1)<1e-10);
    const pivotX=200+(facing===1?19:21)*2,pivotY=800-19*2;
    assert.ok(Math.abs((pose.muzzle.x-pivotX)*pose.dy-(pose.muzzle.y-pivotY)*pose.dx)<1e-8);
    assert.ok((mouse.x-pose.muzzle.x)*pose.dx+(mouse.y-pose.muzzle.y)*pose.dy>0);
  }
});
test('swept balls hit moving-sized targets without tunneling',()=>{
  const box={left:40,right:60,top:-5,bottom:5};
  assert.equal(segmentHitTime({x:0,y:0},{x:100,y:0},box),.4);
  assert.equal(segmentHitTime({x:100,y:0},{x:0,y:0},box),.4);
  assert.equal(segmentHitTime({x:50,y:0},{x:80,y:10},box),0);
  assert.equal(segmentHitTime({x:0,y:10},{x:100,y:10},box),null);
  assert.equal(segmentHitTime({x:0,y:0},{x:20,y:0},box),null);
});

test('preview follows the real charged ball physics from the muzzle',()=>{
  const pose={muzzle:{x:100,y:600},dx:.8,dy:-.6};
  const power=.5,points=previewTrajectory(pose,power,1600,900);
  assert.deepEqual(points[0],pose.muzzle);
  const shot={muzzle:pose.muzzle,vx:pose.dx*chargeVelocity(power),vy:pose.dy*chargeVelocity(power),gravity:BALL_GRAVITY};
  assert.deepEqual(points.at(-1),projectilePoint(shot,220+power*280));
  assert.ok(points.at(-1).y>pose.muzzle.y+shot.vy*.36);
});
test('charging extends the trajectory, including mirrored aim',()=>{
  for(const dx of [-1,1]){
    const pose={muzzle:{x:800,y:100},dx,dy:0};
    const weak=previewTrajectory(pose,0,1600,900),strong=previewTrajectory(pose,1,1600,900);
    assert.ok(Math.abs(strong.at(-1).x-800)>Math.abs(weak.at(-1).x-800)*3);
    assert.equal(Math.sign(strong.at(-1).x-800),dx);
  }
});
test('preview clips at the viewport and floor instead of drawing offscreen',()=>{
  for(const pose of [{muzzle:{x:95,y:20},dx:1,dy:0},{muzzle:{x:5,y:20},dx:-1,dy:0},{muzzle:{x:50,y:95},dx:0,dy:1},{muzzle:{x:50,y:5},dx:0,dy:-1}]){
    const points=previewTrajectory(pose,1,100,100);
    assert.ok(points.length>=2);
    assert.ok(points.every(p=>p.x>=-1e-8&&p.x<=100+1e-8&&p.y>=-1e-8&&p.y<=100+1e-8));
    assert.ok([0,100].some(edge=>Math.abs(points.at(-1).x-edge)<1e-8||Math.abs(points.at(-1).y-edge)<1e-8));
  }
  assert.deepEqual(previewTrajectory({muzzle:{x:-10,y:20},dx:-1,dy:0},1,100,100),[]);
});

test('autonomous aim compensates for gravity to either side',()=>{
  for(const target of [{x:600,y:500},{x:50,y:500},{x:600,y:850}]){
    const direction=target.x<250?-1:1;
    const pose=autoAimPose(200,900,48,direction,target,.8);
    assert.ok(pose);
    const time=(target.x-pose.muzzle.x)/(pose.dx*pose.speed);
    const hit=projectilePoint({muzzle:pose.muzzle,vx:pose.dx*pose.speed,vy:pose.dy*pose.speed,gravity:BALL_GRAVITY},time*1000);
    assert.ok(time>0);
    assert.ok(Math.abs(hit.y-target.y)<.1);
  }
  assert.equal(ballisticDirection({x:200,y:900},{x:500,y:-5000},260),null);
});
test('wide autonomous aim follows a different barrel direction than an accurate shot',()=>{
  const target={x:600,y:700};
  const accurate=autoAimPose(200,900,48,1,target,.8);
  const wide=autoAimPose(200,900,48,1,target,.8,.15);
  assert.ok(Math.abs(wide.angle-accurate.angle)>8);
  assert.notDeepEqual(wide.muzzle,accurate.muzzle);
});
