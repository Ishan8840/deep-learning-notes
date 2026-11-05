import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionWeights, ppoObjective, gaeContributions } from '../src/mechanisms.js';
import { convolutionValue, filmForNote } from '../src/films.js';

test('convolution detects both signed vertical edges and flat regions', () => {
  assert.equal(convolutionValue(0), 0);
  assert.equal(convolutionValue(7), 3);
  assert.equal(convolutionValue(10), -3);
});
test('attention normalizes over allowed keys, including the one-token causal case', () => {
  for (let query=0; query<6; query++) for (const causal of [true,false]) {
    const weights=attentionWeights(query,causal);
    assert.ok(Math.abs(weights.reduce((a,b)=>a+b)-1)<1e-12);
    assert.ok(weights.every(x=>x>=0));
    if(causal) assert.ok(weights.slice(query+1).every(x=>x===0));
  }
  assert.deepEqual(attentionWeights(0,true),[1,0,0,0,0,0]);
});
test('PPO flattens only the favored side and still penalizes harmful changes', () => {
  assert.equal(ppoObjective(2,5),6);
  assert.equal(ppoObjective(.5,-5),-4);
  assert.equal(ppoObjective(.5,5),2.5);
  assert.equal(ppoObjective(2,-5),-10);
});
test('GAE lambda zero uses only the present error; lambda one retains discounted future errors', () => {
  assert.equal(gaeContributions(0).reduce((a,b)=>a+b),1);
  const sum=gaeContributions(1).reduce((a,b)=>a+b);
  assert.ok(Math.abs(sum-(1-.4*.95+.8*.95**2+1.3*.95**3-.2*.95**4))<1e-12);
});
test('paper routes use their own mechanisms instead of generic substring fallbacks', () => {
  assert.equal(filmForNote('03-reinforcement-learning/06-ppo'),'ppo');
  assert.equal(filmForNote('01-foundations/07-vision-transformer'),'patches');
  assert.equal(filmForNote('04-robot-policies/04-vita-flow-matching'),'vita');
  assert.equal(filmForNote('04-robot-policies/05-a2a-flow-matching'),'a2a');
  assert.equal(filmForNote('01-foundations/13-mixture-of-transformers'),undefined);
});
