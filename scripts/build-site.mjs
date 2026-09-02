import{mkdir,writeFile}from'node:fs/promises';
import{locales,localeRoutes}from'../site/locales.js';
import{renderPage}from'../site/template.js';
const root=new URL('../public/',import.meta.url),origin='https://f.wzrice.cn',lastmod='2026-08-27';
for(const[lang,path]of Object.entries(localeRoutes)){const dir=new URL(path==='/'?'./':`.${path}`,root);await mkdir(dir,{recursive:true});await writeFile(new URL('index.html',dir),renderPage(lang))}
await writeFile(new URL('locale-data.js',root),`export const locales=${JSON.stringify(locales)};export const localeRoutes=${JSON.stringify(localeRoutes)};\n`);
const alternates=Object.entries(localeRoutes).map(([lang,path])=>`    <xhtml:link rel="alternate" hreflang="${locales[lang].hreflang}" href="${origin+path}"/>`).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>`).join('\n');
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${Object.values(localeRoutes).map(path=>`  <url>\n    <loc>${origin+path}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`).join('\n')}\n</urlset>\n`;
await writeFile(new URL('sitemap.xml',root),sitemap);await writeFile(new URL('robots.txt',root),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
