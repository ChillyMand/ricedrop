export function detectEnvironment(userAgent='',capabilities={}){
  const isWeChat=/MicroMessenger/i.test(userAgent);
  const isMobile=/Mobile|Android|iPhone|iPad/i.test(userAgent);
  const isAndroid=/Android/i.test(userAgent);
  const isEdge=/Edg\//i.test(userAgent);
  const isChrome=/Chrome\//i.test(userAgent)&&!isEdge&&!/OPR\//i.test(userAgent);
  const embeddedMatchers=[
    ['微信',/MicroMessenger/i],['QQ',/(?:\bQQ\/|V1_AND_SQ_)/i],['支付宝',/AlipayClient/i],
    ['钉钉',/DingTalk/i],['微博',/Weibo/i],['抖音',/(?:aweme|BytedanceWebview)/i],
    ['应用内浏览器',/(?:;\s*wv\)|\bwv\)|Version\/4\.0.*Chrome\/.*Mobile Safari)/i]
  ];
  const embedded=embeddedMatchers.find(([,pattern])=>pattern.test(userAgent));
  const knownAndroidBrowser=/(?:Chrome\/|EdgA?\/|Firefox\/|OPR\/|SamsungBrowser\/|HuaweiBrowser\/|VivoBrowser\/|HeyTapBrowser\/|MiuiBrowser\/|UCBrowser\/)/i.test(userAgent);
  const access=embedded?'blocked':isAndroid&&!knownAndroidBrowser?'warning':'allowed';
  const secureContext=capabilities.secureContext??globalThis.isSecureContext===true;
  const hasPicker=capabilities.showSaveFilePicker??typeof globalThis.showSaveFilePicker==='function';
  return {isWeChat,isMobile,isAndroid,isEdge,isChrome,access,embeddedName:embedded?.[0]||'',canStreamLargeFiles:access==='allowed'&&!isMobile&&(isEdge||isChrome)&&secureContext&&hasPicker};
}

export function assessSaveCapability(meta,{mobile=false,canShareFiles=false}={}){
  if(!mobile)return {canReceive:true,method:'download'};
  if(canShareFiles)return {canReceive:true,method:'share'};
  if(/^(?:image|video)\//i.test(meta.mime||''))return {canReceive:true,method:'preview'};
  return {canReceive:false,method:'unsupported'};
}
