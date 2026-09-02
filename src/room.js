import { DurableObject } from 'cloudflare:workers';
import { parseSignal } from './protocol.js';
import { markDisconnected,clearDisconnected,expiredRole,expirePairing } from './session-state.js';

const WAIT_MS=180000;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

export class TransferRoom extends DurableObject{
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env}
  async fetch(request){
    const url=new URL(request.url);
    if(request.method==='POST'&&url.pathname==='/init'){
      if(await this.ctx.storage.get('room'))return json({error:'exists'},409);
      const room=await request.json();
      await this.ctx.storage.put('room',{...room,state:'waiting',joinerDevice:null,disconnected:{},lastActivity:Date.now()});
      await this.ctx.storage.setAlarm(room.expires);return json({ok:true});
    }
    if(request.method==='POST'&&url.pathname==='/request')return this.requestJoin(request);
    if(request.method==='POST'&&url.pathname==='/resume')return this.resumeWaiting(request);
    if(url.pathname==='/socket')return this.socket(request,url);
    return json({error:'not_found'},404);
  }
  async requestJoin(request){
    const room=await this.ctx.storage.get('room');
    if(!room||room.expires<=Date.now()||room.state!=='waiting')return json({error:'room_unavailable'},404);
    const{device}=await request.json();room.state='negotiating';room.joinerDevice=device;room.sessionId=crypto.randomUUID()+crypto.randomUUID();room.disconnected={};
    await this.ctx.storage.put('room',room);
    await this.ctx.storage.deleteAlarm();
    await this.env.DIRECTORY.getByName('registry').fetch(new Request('https://directory/consume',{method:'POST',body:JSON.stringify({codeHash:room.codeHash})}));
    return json({roomId:room.roomId,token:room.joinerToken,sessionId:room.sessionId});
  }
  async resumeWaiting(request){
    const room=await this.ctx.storage.get('room'),{token}=await request.json();
    if(!room||token!==room.creatorToken)return json({error:'unauthorized'},401);
    const expires=Date.now()+WAIT_MS,restored=await this.env.DIRECTORY.getByName('registry').fetch(new Request('https://directory/restore',{method:'POST',body:JSON.stringify({codeHash:room.codeHash,roomId:room.roomId,expires})}));
    if(!restored.ok)return json({error:'code_conflict'},409);
    this.send('joiner',{type:'session-close',reason:'creator_resumed'});
    for(const ws of this.ctx.getWebSockets('joiner'))ws.close(1000,'creator_resumed');
    room.state='waiting';room.joinerDevice=null;room.sessionId=null;room.disconnected={};room.expires=expires;
    await this.ctx.storage.put('room',room);
    await this.ctx.storage.setAlarm(room.expires);
    return json({expiresAt:room.expires});
  }
  async socket(request,url){
    if(request.headers.get('upgrade')!=='websocket')return json({error:'upgrade_required'},426);
    let room=await this.ctx.storage.get('room');const token=url.searchParams.get('token');
    const role=token===room?.creatorToken?'creator':token===room?.joinerToken?'joiner':null;
    if(!role)return json({error:'unauthorized'},401);
    room=clearDisconnected(room,role);await this.ctx.storage.put('room',room);
    const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server,[role]);server.serializeAttachment({role});this.replayState(room);
    return new Response(null,{status:101,webSocket:client});
  }
  replayState(room){if(room.state==='negotiating')this.broadcast({type:'join-approved',sessionId:room.sessionId,restart:true,creatorDevice:room.device,joinerDevice:room.joinerDevice})}
  webSocketMessage(ws,message){try{const signal=parseSignal(message),{role}=ws.deserializeAttachment(),target=role==='creator'?'joiner':'creator';for(const peer of this.ctx.getWebSockets(target))peer.send(JSON.stringify(signal))}catch{ws.send(JSON.stringify({type:'error',code:'invalid_signal'}))}}
  async webSocketClose(ws,code,reason){
    const {role}=ws.deserializeAttachment()||{};ws.close(code,reason);
    let room=await this.ctx.storage.get('room');if(!room||room.state!=='negotiating'||!role)return;
    room=markDisconnected(room,role,Date.now());await this.ctx.storage.put('room',room);
    await this.ctx.storage.setAlarm(Math.min(room.expires,room.disconnected[role]));
  }
  async webSocketError(ws){await this.webSocketClose(ws,1011,'socket_error')}
  send(role,msg){for(const ws of this.ctx.getWebSockets(role))ws.send(JSON.stringify(msg))}
  broadcast(msg){for(const ws of this.ctx.getWebSockets())ws.send(JSON.stringify(msg))}
  async alarm(){
    let room=await this.ctx.storage.get('room');if(!room)return;const now=Date.now();
    const role=expiredRole(room,now);
    if(role&&this.ctx.getWebSockets(role).length===0){this.send(role==='creator'?'joiner':'creator',{type:'session-close',reason:'peer_disconnected'});room.state='ended';room.disconnected={};await this.ctx.storage.put('room',room);return}
    if(role){room=clearDisconnected(room,role);await this.ctx.storage.put('room',room)}
    if(room.state==='waiting'&&room.expires<=now){
      await this.env.DIRECTORY.getByName('registry').fetch(new Request('https://directory/consume',{method:'POST',body:JSON.stringify({codeHash:room.codeHash})}));
      room=expirePairing(room,now);await this.ctx.storage.put('room',room);await this.ctx.storage.setAlarm(room.cleanupAt);this.broadcast({type:'session-close',reason:'expired'});return;
    }
    if(room.state==='expired'&&room.cleanupAt<=now){await this.ctx.storage.deleteAll();return}
    const deadlines=Object.values(room.disconnected||{});
    if(deadlines.length)await this.ctx.storage.setAlarm(Math.min(...deadlines));else if(room.state==='waiting')await this.ctx.storage.setAlarm(room.expires);else await this.ctx.storage.deleteAlarm();
  }
}
