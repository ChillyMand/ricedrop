const paths={zh:'/',en:'/en/',ja:'/ja/'};
export const localeEntryRedirect=pathname=>pathname==='/en'?'/en/':pathname==='/ja'?'/ja/':null;
export const qrTargetPath=lang=>paths[lang]||'/';
