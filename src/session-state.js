const GRACE_MS=5000;
export function markDisconnected(room,role,now){return {...room,disconnected:{...(room.disconnected||{}),[role]:now+GRACE_MS}}}
export function clearDisconnected(room,role){const disconnected={...(room.disconnected||{})};delete disconnected[role];return {...room,disconnected}}
export function expiredRole(room,now){for(const role of['creator','joiner'])if(room.disconnected?.[role]<=now)return role;return null}
export function expirePairing(room,now){return {...room,state:'expired',disconnected:{},cleanupAt:now+600000}}
