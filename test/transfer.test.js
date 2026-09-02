import test from 'node:test';
import assert from 'node:assert/strict';
import { Transfer, SMALL_FILE_LIMIT, MAX_FILE_SIZE } from '../public/transfer.js';

const channel=()=>({sent:[],bufferedAmount:0,send(value){this.sent.push(value)},addEventListener(){}});
const callbacks=()=>({offer(){},update(){},error(){},save(){}});

test('rejects files larger than 10GB before offering them',()=>{
  const c=channel(),updates=[],transfer=new Transfer(c,{...callbacks(),update(...args){updates.push(args)}});
  transfer.sendFiles([{name:'too-large.bin',size:MAX_FILE_SIZE+1,type:'application/octet-stream'}]);
  assert.equal(c.sent.length,0);
  assert.match(updates[0][3],/超过 10GB/);
});

test('keeps small received files on the memory path',()=>{
  const c=channel(),transfer=new Transfer(c,callbacks());
  transfer.accept({id:'small',name:'small.bin',size:SMALL_FILE_LIMIT-1,mime:''});
  assert.ok(Array.isArray(transfer.receiving.get('small').chunks));
  assert.equal(transfer.receiving.get('small').sink,null);
});

test('large received chunks write to disk and acknowledge completed windows',async()=>{
  const c=channel(),writes=[],sink={async write(part){writes.push(part.byteLength)},async close(){},async abort(){}},transfer=new Transfer(c,callbacks());
  transfer.accept({id:'large',name:'large.bin',size:SMALL_FILE_LIMIT,mime:''},sink);
  const id=new TextEncoder().encode('large'),part=new Uint8Array(4*1024*1024),frame=new Uint8Array(1+id.length+4+part.length);
  frame[0]=id.length;frame.set(id,1);frame.set(part,5+id.length);
  await transfer.message(frame.buffer);
  assert.deepEqual(writes,[4*1024*1024]);
  assert.match(String(c.sent.at(-1)),/file-write-ack/);
});

test('cancelling a large receive aborts its disk stream',async()=>{
  const c=channel();let aborted=false;const sink={async write(){},async close(){},async abort(){aborted=true}},transfer=new Transfer(c,callbacks());
  transfer.accept({id:'large',name:'large.bin',size:SMALL_FILE_LIMIT,mime:''},sink);
  await transfer.cancel('large');
  assert.equal(aborted,true);
  assert.match(String(c.sent.at(-1)),/file-cancel/);
});

test('delivers the receiver compatibility reason to the sender',async()=>{
  const c=channel(),updates=[],transfer=new Transfer(c,{...callbacks(),update(...args){updates.push(args)}}),file={name:'movie.mp4',size:1024,type:'video/mp4',slice(){}};
  transfer.sendFiles([file]);
  await transfer.message(JSON.stringify({type:'file-reject',id:[...transfer.pending.keys()][0],reason:'large_file_unsupported'}));
  assert.equal(updates.at(-1)[3],'对方设备不支持接收此大文件');
});

test('does not queue a file after the data channel has closed',()=>{
  const c={...channel(),readyState:'closed'},updates=[],transfer=new Transfer(c,{...callbacks(),update(...args){updates.push(args)}});
  transfer.sendFiles([{name:'late.pdf',size:20,type:'application/pdf'}]);
  assert.equal(c.sent.length,0);
  assert.equal(updates[0][3],'对方已断开连接，无法发送');
});
