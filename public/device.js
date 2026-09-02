const version=(ua,pattern)=>ua.match(pattern)?.[1]?.split('.')[0]||'';

export function detectDevice(ua=''){
  let name='电脑';
  const androidModel=ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|\))/i)?.[1]?.trim();
  if(/iPhone/i.test(ua))name='iPhone';
  else if(/iPad/i.test(ua))name='iPad';
  else if(/Macintosh|Mac OS X/i.test(ua))name='Mac';
  else if(/Windows/i.test(ua))name='Windows 电脑';
  else if(/Android/i.test(ua))name=androidModel?`${/^SM-/i.test(androidModel)?'Samsung ':''}${androidModel}`:'Android 设备';
  else if(/Linux/i.test(ua))name='Linux 电脑';

  let browser='浏览器';
  if(/SamsungBrowser\//i.test(ua))browser=`Samsung Internet ${version(ua,/SamsungBrowser\/([\d.]+)/i)}`;
  else if(/Edg(?:A|iOS)?\//i.test(ua))browser=`Microsoft Edge ${version(ua,/Edg(?:A|iOS)?\/([\d.]+)/i)}`;
  else if(/OPR\//i.test(ua))browser=`Opera ${version(ua,/OPR\/([\d.]+)/i)}`;
  else if(/CriOS\//i.test(ua))browser=`Chrome ${version(ua,/CriOS\/([\d.]+)/i)}`;
  else if(/FxiOS\//i.test(ua))browser=`Firefox ${version(ua,/FxiOS\/([\d.]+)/i)}`;
  else if(/Firefox\//i.test(ua))browser=`Firefox ${version(ua,/Firefox\/([\d.]+)/i)}`;
  else if(/Chrome\//i.test(ua))browser=`Chrome ${version(ua,/Chrome\/([\d.]+)/i)}`;
  else if(/Version\//i.test(ua)&&/Safari\//i.test(ua))browser=`Safari ${version(ua,/Version\/([\d.]+)/i)}`;
  return {name,browser:browser.trim()};
}
