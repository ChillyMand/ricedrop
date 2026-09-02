# LAN Transfer Session Recovery Design

> Historical design record. The current behavior is documented in the root README and enforced by the test suite.

## Goal

Make peer departure visible within a short grace period, propagate file-rejection reasons to the sender, and let the creator return a failed negotiation to the original pairing-code waiting screen.

## Session state

`waiting` accepts one joiner. A valid join moves the room to `negotiating`. A successful WebRTC data channel moves the client UI to connected without changing server authorization. If a role's signaling socket disappears, the room records a five-second disconnect deadline. Reconnection by the same role clears that deadline; expiration notifies the other role with `session-close`.

During negotiation, both clients expose an exit control. A creator whose LAN connection times out can invoke an authenticated resume operation. Resume notifies the stale joiner, restores `waiting`, clears joiner/session fields, extends the room by 180 seconds, and registers the same code hash and room ID in the directory. The joiner returns home instead of retrying the stale session.

## Transfer errors

`file-reject` carries a bounded reason code. The receiver uses `large_file_unsupported` when a mobile or otherwise incompatible browser cannot accept the large-file disk-stream path. The sender maps the code to an explicit user-facing reason. Manual rejection continues to display `已拒绝`.

## Client behavior

WebRTC `failed` ends immediately. `disconnected` starts a five-second grace timer and recovers if state returns to `connected`. File selection is disabled once the peer is known to be gone. Creator retry becomes `继续等待` and returns to the pairing view with the same code. Creator negotiation always shows `取消并返回首页`.

## Verification

Automated tests cover disconnect-deadline decisions, same-code room resume, reason propagation, creator-only resume UI, and existing transfer/session behavior. Deployment requires all tests and Wrangler dry-run to pass.
