const SITEVERIFY='https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile({secret,token,ip='',action,fetcher=fetch}){
  if(!secret||typeof token!=='string'||!token||token.length>2048)return false;
  const body=new FormData();
  body.set('secret',secret);body.set('response',token);
  if(ip)body.set('remoteip',ip);
  body.set('idempotency_key',crypto.randomUUID());
  try{
    const response=await fetcher(SITEVERIFY,{method:'POST',body,signal:AbortSignal.timeout(8000)});
    const result=await response.json();
    return result.success===true&&result.action===action&&result.hostname==='f.wzrice.cn';
  }catch{return false}
}
