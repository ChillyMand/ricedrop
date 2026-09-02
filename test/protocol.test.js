import test from 'node:test'; import assert from 'node:assert/strict';
import { normalizeCode,isValidCode,hashCode,createToken,parseSignal,encodeChunk,decodeChunk } from '../src/protocol.js';
test('normalizes and validates three digit codes',()=>{assert.equal(normalizeCode(' 0-2 7 '),'027');assert.equal(isValidCode('027'),true);assert.equal(isValidCode('27'),false)});
test('hashes codes and creates strong tokens',async()=>{assert.match(await hashCode('027'),/^[a-f0-9]{64}$/);assert.ok(createToken().length>=22)});
test('accepts bounded signaling but rejects file and oversized messages',()=>{assert.equal(parseSignal(JSON.stringify({type:'offer',sdp:'x'})).type,'offer');assert.throws(()=>parseSignal(JSON.stringify({type:'file-chunk'})));assert.throws(()=>parseSignal('x'.repeat(65537)))});
test('round trips binary chunks',()=>{const data=new Uint8Array([1,2,3]);const decoded=decodeChunk(encodeChunk('abc',9,data));assert.equal(decoded.fileId,'abc');assert.equal(decoded.sequence,9);assert.deepEqual([...decoded.data],[1,2,3])});
