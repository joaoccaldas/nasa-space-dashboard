/* CaldaSpace's synthetic lesson: one dark circular planet, one uniform star.
 * All lengths are in stellar radii; time is an arbitrary fraction, not days.
 * No limb darkening, orbital dynamics, real observations or fitted parameters.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CaldaTransit = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const VERSION = 'uniform-disc-v1';
  const clamp = x => Math.max(-1, Math.min(1, x));
  function blockedFraction(distance, radius) {
    const d = Math.abs(distance), r = radius;
    if (!Number.isFinite(d) || !Number.isFinite(r) || r <= 0 || r >= 1) throw new RangeError('Invalid disc geometry');
    if (d >= 1 + r) return 0;
    if (d <= 1 - r) return r * r;
    const area = r*r*Math.acos(clamp((d*d+r*r-1)/(2*d*r)))
      + Math.acos(clamp((d*d+1-r*r)/(2*d)))
      - .5*Math.sqrt(Math.max(0, (-d+r+1)*(d+r-1)*(d-r+1)*(d+r+1)));
    return Math.max(0, Math.min(r*r, area/Math.PI));
  }
  function experiment({seed = 20261017, radiusRatio = .1, noise = .001} = {}) {
    if (!Number.isInteger(seed) || seed < 1 || seed > 4294967295) throw new RangeError('Seed must be 1–4294967295');
    if (![.04, .1, .16].includes(radiusRatio) || ![0, .001, .004].includes(noise)) throw new RangeError('Unsupported lesson settings');
    let state = seed;
    const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
    const center = .2 + random() * .6, halfDuration = .12;
    const samples = Array.from({length:241}, (_, i) => {
      const time = i/240;
      const separation = (time-center)/halfDuration*(1+radiusRatio);
      const modelFlux = 1-blockedFraction(separation, radiusRatio);
      return {time, modelFlux, flux:modelFlux+(random()-.5)*2*noise};
    });
    return {schemaVersion:1, model:VERSION, synthetic:true,
      parameters:{seed,radiusRatio,noise,center,halfDuration},
      units:{time:'arbitrary observation window fraction',flux:'relative stellar brightness; unobscured = 1',length:'stellar radius'},
      assumptions:['Uniform stellar disc','Dark circular planet','Central straight crossing at constant projected speed','Uniform seeded noise, not an instrument noise model','One transit; no period or detection significance inferred'],
      samples};
  }
  return {VERSION, blockedFraction, experiment};
});
