import test from'node:test';
import assert from'node:assert/strict';
import * as turnstile from'../src/turnstile.js';

test('accepts a valid single-action Turnstile result for the production hostname',async()=>{
  assert.equal(typeof turnstile.verifyTurnstile,'function');
  const fetcher=async(_url,{body})=>{
    assert.equal(body.get('secret'),'secret');
    assert.equal(body.get('response'),'token');
    assert.equal(body.get('remoteip'),'203.0.113.8');
    return new Response(JSON.stringify({success:true,action:'join_room',hostname:'f.wzrice.cn'}));
  };
  assert.equal(await turnstile.verifyTurnstile({secret:'secret',token:'token',ip:'203.0.113.8',action:'join_room',fetcher}),true);
});

test('rejects invalid tokens action mismatches and wrong hostnames',async()=>{
  const verify=(result)=>turnstile.verifyTurnstile({secret:'secret',token:'token',ip:'203.0.113.8',action:'create_room',fetcher:async()=>new Response(JSON.stringify(result))});
  assert.equal(await verify({success:false}),false);
  assert.equal(await verify({success:true,action:'join_room',hostname:'f.wzrice.cn'}),false);
  assert.equal(await verify({success:true,action:'create_room',hostname:'file.wzrice.cn'}),false);
  assert.equal(await verify({success:true,action:'create_room',hostname:'example.com'}),false);
});

test('rejects missing and oversized tokens without contacting Siteverify',async()=>{
  let calls=0;const fetcher=async()=>{calls++;return new Response('{}')};
  assert.equal(await turnstile.verifyTurnstile({secret:'secret',token:'',action:'join_room',fetcher}),false);
  assert.equal(await turnstile.verifyTurnstile({secret:'secret',token:'x'.repeat(2049),action:'join_room',fetcher}),false);
  assert.equal(calls,0);
});
