import test from'node:test';import assert from'node:assert/strict';import*as rate from'../src/rate-limit.js';

test('requires Turnstile after the create and join thresholds',()=>{
  assert.equal(typeof rate.rateLimitDecision,'function');
  assert.equal(rate.rateLimitDecision({window_start:1000,joins:3,failures:0},'create',2000,false).allowed,false);
  assert.equal(rate.rateLimitDecision({window_start:1000,joins:5,failures:4},'join',2000,false).allowed,false);
});

test('a verified challenge grants one action and starts a fresh window',()=>{
  assert.deepEqual(rate.rateLimitDecision({window_start:1000,joins:99,failures:99,cooldown_until:999999},'join',5000,true),{allowed:true,windowStart:5000,attempts:1,failures:0});
});

test('ordinary attempts reset after one minute without a cooldown',()=>{
  assert.deepEqual(rate.rateLimitDecision({window_start:1000,joins:20,failures:8,cooldown_until:999999},'join',61001,false),{allowed:true,windowStart:61001,attempts:1,failures:0});
});
