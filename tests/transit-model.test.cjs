const {test} = require('node:test');
const assert = require('node:assert/strict');
const {blockedFraction, experiment} = require('../transit-model.js');
test('central depth is area ratio and contact is continuous', () => {
  for (const r of [.04,.1,.16]) {
    assert.equal(blockedFraction(0,r),r*r);
    assert.equal(blockedFraction(1+r,r),0);
    assert.equal(blockedFraction(2,r),0);
    assert.ok(Math.abs(blockedFraction(1-r+1e-8,r)-r*r)<1e-8);
    for(let d=0;d<1.2;d+=.001) {
      assert.ok(blockedFraction(d,r)>=0 && blockedFraction(d,r)<=r*r);
      assert.equal(blockedFraction(-d,r),blockedFraction(d,r));
    }
  }
});
test('same parameters reproduce all samples; zero noise preserves exact flux', () => {
  const a=experiment({noise:0}), b=experiment({noise:0});
  assert.deepEqual(a,b);
  assert.equal(a.samples.length,241);
  assert.ok(a.samples.every(x=>x.flux===x.modelFlux));
  assert.notDeepEqual(a.samples,experiment({seed:2,noise:0}).samples);
  assert.equal(a.samples[0].flux,1);
  assert.equal(a.samples.at(-1).flux,1);
});
test('known radius gives its area-ratio depth; noise is bounded and does not move the signal', () => {
  const small=experiment({radiusRatio:.04,noise:0}), large=experiment({radiusRatio:.1,noise:.004});
  assert.equal(small.parameters.center,large.parameters.center);
  const depth=1-Math.min(...small.samples.map(x=>x.flux));
  assert.ok(Math.abs(depth-.04**2)<1e-12);
  assert.ok(large.samples.every(x=>Math.abs(x.flux-x.modelFlux)<=.004+1e-15));
  assert.throws(()=>experiment({seed:NaN}));
  assert.throws(()=>experiment({noise:Infinity}));
});
