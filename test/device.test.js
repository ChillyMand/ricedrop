import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDevice } from '../public/device.js';

test('detects Edge on Windows',()=>{
  const value=detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0');
  assert.deepEqual(value,{name:'Windows 电脑',browser:'Microsoft Edge 127'});
});

test('detects Safari on iPhone',()=>{
  const value=detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1');
  assert.deepEqual(value,{name:'iPhone',browser:'Safari 18'});
});

test('detects Samsung Internet on Android',()=>{
  const value=detectDevice('Mozilla/5.0 (Linux; Android 15; SM-S9280) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36 SamsungBrowser/26.0');
  assert.deepEqual(value,{name:'Samsung SM-S9280',browser:'Samsung Internet 26'});
});
