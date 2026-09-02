import test from 'node:test';
import assert from 'node:assert/strict';
import { detectEnvironment } from '../public/environment.js';
import * as environment from '../public/environment.js';

test('blocks WeChat embedded browser',()=>{
  const env=detectEnvironment('Mozilla/5.0 (iPhone) MicroMessenger/8.0.50',{secureContext:true,showSaveFilePicker:true});
  assert.equal(env.isWeChat,true);
  assert.equal(env.canStreamLargeFiles,false);
});

test('allows large streaming in desktop Edge and Chrome',()=>{
  const edge=detectEnvironment('Mozilla/5.0 (Windows NT 10.0) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',{secureContext:true,showSaveFilePicker:true});
  const chrome=detectEnvironment('Mozilla/5.0 (Macintosh) Chrome/127.0.0.0 Safari/537.36',{secureContext:true,showSaveFilePicker:true});
  assert.equal(edge.canStreamLargeFiles,true);
  assert.equal(chrome.canStreamLargeFiles,true);
});

test('does not offer large streaming in Safari or mobile Chrome',()=>{
  const safari=detectEnvironment('Mozilla/5.0 (Macintosh) Version/18.0 Safari/605.1.15',{secureContext:true,showSaveFilePicker:true});
  const mobile=detectEnvironment('Mozilla/5.0 (Linux; Android 15) Chrome/127.0.0.0 Mobile Safari/537.36',{secureContext:true,showSaveFilePicker:true});
  assert.equal(safari.canStreamLargeFiles,false);
  assert.equal(mobile.canStreamLargeFiles,false);
});

test('blocks QQ and common embedded WebViews before pairing',()=>{
  const qq=detectEnvironment('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Mobile QQ/9.0.10.12345',{secureContext:true});
  const androidWebView=detectEnvironment('Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A; wv) AppleWebKit/537.36 Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',{secureContext:true});
  const alipay=detectEnvironment('Mozilla/5.0 (iPhone) AlipayClient/10.6.0',{secureContext:true});
  assert.equal(qq.access,'blocked');
  assert.equal(androidWebView.access,'blocked');
  assert.equal(alipay.access,'blocked');
});

test('warns for unknown Android browsers but allows explicit continuation',()=>{
  const unknown=detectEnvironment('Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 Mobile Safari/537.36',{secureContext:true});
  const chrome=detectEnvironment('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/127.0.0.0 Mobile Safari/537.36',{secureContext:true});
  assert.equal(unknown.access,'warning');
  assert.equal(chrome.access,'allowed');
});

test('preflights mobile save support before accepting a file',()=>{
  assert.equal(typeof environment.assessSaveCapability,'function');
  const assess=environment.assessSaveCapability;
  assert.deepEqual(assess({mime:'application/pdf'},{mobile:true,canShareFiles:true}),{canReceive:true,method:'share'});
  assert.deepEqual(assess({mime:'image/jpeg'},{mobile:true,canShareFiles:false}),{canReceive:true,method:'preview'});
  assert.deepEqual(assess({mime:'video/mp4'},{mobile:true,canShareFiles:false}),{canReceive:true,method:'preview'});
  assert.deepEqual(assess({mime:'application/pdf'},{mobile:true,canShareFiles:false}),{canReceive:false,method:'unsupported'});
  assert.deepEqual(assess({mime:'application/pdf'},{mobile:false,canShareFiles:false}),{canReceive:true,method:'download'});
});
