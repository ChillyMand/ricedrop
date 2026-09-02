import test from'node:test';import assert from'node:assert/strict';import*as session from'../src/session-state.js';

test('marks a role disconnected with a five second grace deadline',()=>{
  assert.equal(typeof session.markDisconnected,'function');
  const room={state:'negotiating'};
  assert.deepEqual(session.markDisconnected(room,'joiner',1000),{state:'negotiating',disconnected:{joiner:6000}});
});

test('reconnecting clears only that role disconnect deadline',()=>{
  const room={disconnected:{creator:4000,joiner:5000}};
  assert.deepEqual(session.clearDisconnected(room,'creator'),{disconnected:{joiner:5000}});
});

test('reports an expired role only after its grace deadline',()=>{
  const room={disconnected:{joiner:6000}};
  assert.equal(session.expiredRole(room,5999),null);
  assert.equal(session.expiredRole(room,6000),'joiner');
});

test('expires pairing without deleting the room needed for same-code renewal',()=>{
  assert.equal(typeof session.expirePairing,'function');
  assert.deepEqual(session.expirePairing({state:'waiting',codeHash:'abc',roomId:'room'},1000),{state:'expired',codeHash:'abc',roomId:'room',disconnected:{},cleanupAt:601000});
});
