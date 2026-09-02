import{locales,localeRoutes}from'./locales.js';
const ORIGIN='https://f.wzrice.cn';
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function renderPage(lang){const s=locales[lang];if(!s)throw Error(`Unknown locale: ${lang}`);const path=localeRoutes[lang],canonical=ORIGIN+path,links=Object.entries(localeRoutes).map(([key,href])=>`<a href="${href}" data-lang="${key}" hreflang="${locales[key].hreflang}"${key===lang?' aria-current="page"':''}>${key==='zh'?'ZH':key.toUpperCase()}</a>`).join('');const alternates=Object.entries(localeRoutes).map(([key,href])=>`  <link rel="alternate" hreflang="${locales[key].hreflang}" href="${ORIGIN+href}">`).join('\n');const jsonLd=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':`${ORIGIN}/#website`,name:'RiceDrop',alternateName:['糯米饭快传','RICE.Drop','RICEDROP','Rice Drop'],url:`${ORIGIN}/`},{'@type':'Organization','@id':`${ORIGIN}/#organization`,name:'RiceDrop',alternateName:'糯米饭快传',url:`${ORIGIN}/`,logo:`${ORIGIN}/logo.png`},{'@type':'WebApplication',name:s.brand,url:canonical,description:s.description,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',browserRequirements:'Requires a modern browser with WebRTC',isAccessibleForFree:true,inLanguage:s.htmlLang,publisher:{'@id':`${ORIGIN}/#organization`}}]});return`<!doctype html>
<html lang="${s.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#101112">
  <meta name="description" content="${esc(s.description)}">
  <meta name="keywords" content="${esc(s.keywords)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(s.title)}">
  <meta property="og:description" content="${esc(s.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${esc(s.brand)}">
  <meta property="og:locale" content="${s.ogLocale}">
  <title>${s.title}</title>
  <link rel="canonical" href="${canonical}">
${alternates}
  <link rel="alternate" hreflang="x-default" href="${ORIGIN}/">
  <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/ui.css">
  <script type="application/ld+json">${jsonLd.replace(/</g,'\\u003c')}</script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>
</head>
<body data-locale="${lang}">
  <main>
    <header><a href="${path}" class="brand" aria-label="${esc(s.brand)}"><span class="brand-logo"><img src="/logo.png" alt=""></span><b>${s.brand}</b></a><span>${s.tagline}</span><nav class="language-nav" aria-label="${s.languageNav}">${links}</nav></header>
    <aside id="language-suggestion" class="language-suggestion" hidden><span>${s.languageSuggestion}</span><a id="suggested-language" href="/en/">${s.switchLanguage}</a><button id="dismiss-language" type="button">${s.dismiss}</button></aside>
    <section id="wechat-guard" hidden><p class="kicker">${s.compatibility}</p><h1 id="compat-title">${s.openSystem}</h1><p id="compat-message">${s.embeddedMessage}</p><button id="copy-page-link" class="primary wide">${s.copyLink}</button><button id="continue-browser" class="secondary wide" hidden>${s.continueAnyway}</button><small id="wechat-help">${s.openHelp}</small></section>
    <section id="home">
      <p class="kicker">${s.brand} · ${s.tagline}</p><h1>${s.hero}</h1><p class="intro">${s.intro}</p>
      <button id="create" class="primary wide">${s.create}</button><div id="creating" class="pending-panel" role="status" hidden><span class="spinner"></span><b>${s.creating}</b></div>
      <div class="divider"><span>${s.orCode}</span></div><form id="join" class="auto-code-form"><input id="code" name="pairing-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="000" aria-label="${s.codeLabel}" aria-describedby="join-error" autocomplete="off" data-1p-ignore data-lpignore="true" data-bwignore><button type="submit" hidden>${s.connect}</button></form>
      <p id="join-error" class="inline-error" role="status"></p><div id="joining" class="pending-panel" role="status" hidden><span class="spinner"></span><b>${s.joining}</b><button id="cancel-join" type="button" class="secondary">${s.cancelHome}</button></div><p class="note">${s.privacyNote}</p>
    </section>
    <section id="session" hidden><div class="status"><i id="dot"></i><span id="status">${s.ready}</span></div><button id="cancel-connect" class="secondary wide" hidden>${s.cancelHome}</button>
      <div id="pair" hidden><small>${s.tellCode}</small><strong id="pair-code">000</strong><p id="timer"></p><img id="pair-qr" alt="${s.qrAlt}"><p class="lan-warning">${s.sameLan}</p><div class="pair-actions"><button id="copy">${s.copyCode}</button><button id="leave-wait" class="secondary">${s.leaveWait}</button></div></div>
      <div id="connection-actions" hidden><p id="connection-help"></p><div><button id="retry" class="primary">${s.retry}</button><button id="back-home" class="secondary">${s.backHome}</button></div></div>
      <div id="transfer" hidden><div id="peer-info" class="peer-info"><span>${s.peerDevice}</span><strong id="peer-device">${s.detecting}</strong></div><div class="drop" id="drop"><h2>${s.dropTitle}</h2><p>${s.dropHint}</p><input id="files" type="file" multiple><button id="choose" class="primary">${s.choose}</button></div><div id="offers"></div><div id="queue"></div><button id="disconnect" class="danger wide">${s.disconnect}</button></div><p id="error" class="error"></p>
    </section>
  </main>
  <div id="turnstile-dialog" class="modal" role="dialog" aria-modal="true" aria-labelledby="turnstile-title" hidden><div class="modal-card"><p class="kicker">${s.security}</p><h2 id="turnstile-title">${s.securityTitle}</h2><p>${s.securityText}</p><div id="turnstile-widget"></div><p id="turnstile-error" class="inline-error" role="status"></p><button id="cancel-turnstile" class="secondary wide">${s.cancel}</button></div></div>
  <footer>${s.copyright}</footer><script type="module" src="/app.js"></script>
</body></html>`}
