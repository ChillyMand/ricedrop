const LIMITS={create:3,join:5};

export function rateLimitDecision(row,kind,now,verified=false){
  const fresh=!row||now-row.window_start>=60000;
  if(verified||fresh)return {allowed:true,windowStart:now,attempts:1,failures:0};
  if((row.joins||0)>=LIMITS[kind])return {allowed:false};
  return {allowed:true,windowStart:row.window_start,attempts:(row.joins||0)+1,failures:row.failures||0};
}
