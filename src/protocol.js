const SIGNAL_TYPES=new Set(['join-request','join-approved','join-rejected','offer','answer','ice-candidate','ice-restart','peer-ready','session-close','error']);
export const normalizeCode=v=>String(v??'').replace(/[\s-]/g,'');
export const isValidCode=v=>/^\d{3}$/.test(v);
export async function hashCode(code){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function createToken(){const b=new Uint8Array(24);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replace(/[+/=]/g,'').slice(0,32)}
export function parseSignal(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>65536)throw Error('invalid_signal');let value;try{value=JSON.parse(raw)}catch{throw Error('invalid_signal')}if(!value||!SIGNAL_TYPES.has(value.type))throw Error('invalid_signal');return value}
export function encodeChunk(fileId,sequence,data){const id=new TextEncoder().encode(fileId);if(id.length>255)throw Error('file_id_too_long');const out=new Uint8Array(1+id.length+4+data.byteLength);out[0]=id.length;out.set(id,1);new DataView(out.buffer).setUint32(1+id.length,sequence);out.set(new Uint8Array(data.buffer??data,data.byteOffset??0,data.byteLength),5+id.length);return out.buffer}
export function decodeChunk(buffer){const bytes=new Uint8Array(buffer),n=bytes[0];if(bytes.length<5+n)throw Error('invalid_chunk');return{fileId:new TextDecoder().decode(bytes.slice(1,1+n)),sequence:new DataView(bytes.buffer,bytes.byteOffset).getUint32(1+n),data:bytes.slice(5+n)}}
