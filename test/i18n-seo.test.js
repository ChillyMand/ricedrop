import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{locales,localeRoutes}from'../site/locales.js';
import{renderPage}from'../site/template.js';
import{localeFromPath,localizedPath,translate}from'../public/i18n.js';
import{localeEntryRedirect,qrTargetPath}from'../src/locale.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('all locales expose the same complete translation contract',()=>{
  assert.deepEqual(Object.keys(locales),['zh','en','ja']);
  const keys=Object.keys(locales.zh).sort();
  assert.ok(keys.length>70);
  assert.deepEqual(Object.keys(locales.en).sort(),keys);
  assert.deepEqual(Object.keys(locales.ja).sort(),keys);
});

test('renders crawlable localized pages with reciprocal language links',()=>{
  for(const lang of Object.keys(locales)){
    const html=renderPage(lang);
    assert.match(html,new RegExp(`<html lang="${locales[lang].htmlLang}">`));
    assert.match(html,new RegExp(`<title>${locales[lang].title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}</title>`));
    assert.match(html,new RegExp(`<link rel="canonical" href="https://f\\.wzrice\\.cn${localeRoutes[lang]}">`));
    for(const [alternate,path]of Object.entries(localeRoutes))assert.match(html,new RegExp(`hreflang="${locales[alternate].hreflang}" href="https://f\\.wzrice\\.cn${path}"`));
    for(const label of['ZH','EN','JA'])assert.match(html,new RegExp(`>${label}</a>`));
    assert.match(html,/application\/ld\+json/);
  }
});

test('publishes RiceDrop as the English brand and supplies site identity signals',()=>{
  assert.equal(locales.en.brand,'RiceDrop');assert.equal(locales.ja.brand,'RiceDrop');
  assert.match(locales.en.title,/^RiceDrop/);assert.match(locales.en.description,/RiceDrop/);
  const root=renderPage('zh'),english=renderPage('en');
  assert.match(root,/"@type":"WebSite"/);assert.match(root,/"name":"RiceDrop"/);assert.match(root,/"alternateName":\["糯米饭快传","RICE\.Drop","RICEDROP","Rice Drop"\]/);
  assert.match(root,/"@type":"Organization"/);assert.match(root,/"logo":"https:\/\/f\.wzrice\.cn\/logo\.png"/);
  assert.match(english,/rel="icon"[^>]*sizes="64x64"/);assert.match(english,/rel="shortcut icon"[^>]*\/favicon\.ico/);
});

test('generated sitemap and robots expose only canonical locale URLs',async()=>{
  const sitemap=await read('public/sitemap.xml'),robots=await read('public/robots.txt');
  assert.equal((sitemap.match(/<url>/g)||[]).length,3);
  for(const path of Object.values(localeRoutes))assert.match(sitemap,new RegExp(`<loc>https://f\\.wzrice\\.cn${path}</loc>`));
  for(const lang of['zh-CN','en','ja','x-default'])assert.equal((sitemap.match(new RegExp(`hreflang="${lang}"`,'g'))||[]).length,3);
  assert.doesNotMatch(sitemap,/\?code=|file\.wzrice\.cn/);
  assert.match(robots,/Sitemap: https:\/\/f\.wzrice\.cn\/sitemap\.xml/);
});

test('runtime localization resolves paths interpolation and pairing links',()=>{
  assert.equal(localeFromPath('/en/'),'en');assert.equal(localeFromPath('/ja/'),'ja');assert.equal(localeFromPath('/'),'zh');
  assert.equal(translate('en','invalidCode',{code:'123'}),'Pairing code 123 does not exist or has expired');
  assert.equal(localizedPath('ja',new URL('https://f.wzrice.cn/en/?code=321')),'/ja/?code=321');
});

test('worker normalizes locale entries and builds language-aware QR paths',()=>{
  assert.equal(localeEntryRedirect('/en'),'/en/');assert.equal(localeEntryRedirect('/ja'),'/ja/');assert.equal(localeEntryRedirect('/en/'),null);
  assert.equal(qrTargetPath('en'),'/en/');assert.equal(qrTargetPath('ja'),'/ja/');assert.equal(qrTargetPath('unknown'),'/');
});

test('wrangler runs the worker for locale entry normalization',async()=>{
  const config=await read('wrangler.jsonc');assert.match(config,/"run_worker_first":\["\/api\/\*","\/en","\/ja"\]/);
});
