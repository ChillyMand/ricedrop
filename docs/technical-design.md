# 局域网文件传输技术设计

> 历史资料：本文档记录项目初始技术方案。当前正式域名为 `f.wzrice.cn`，实际功能以根目录 README 和当前代码为准。

## 结论

在 `lan-file-transfer/` 中建立完全独立的 Cloudflare Worker 应用，并通过 Wrangler 部署到 `file.wzrice.cn`。Worker 只托管静态页面、处理配对 API 与转发 WebRTC 信令；文件二进制只能通过浏览器 WebRTC DataChannel 传输。

## 服务端

- `PairingDirectory` 是三位码注册表与 IP 限流协调点。它保存配对码 SHA-256 摘要、房间 ID 和过期时间，不保存明文码。
- `TransferRoom` 每个会话一个实例，保存两端短期令牌、审批/连接状态，并使用 Hibernation WebSocket API 转发有大小上限的 JSON 信令。
- 创建和加入 API 返回短期房间凭证；创建方批准后，房间删除目录映射，第三台设备无法加入。
- 服务端没有文件上传、R2、D1、KV 或 TURN 接口。

## 客户端

- 使用 `RTCPeerConnection({ iceServers: [] })`，由创建方生成 DataChannel 和 Offer。
- 连接成功后检查选中 candidate pair；发现 `relay` 或无法确认直接连接时中止。
- 控制消息为 JSON，文件块为带固定头的二进制帧；每方向独立串行队列，使用 `bufferedAmountLowThreshold` 背压。
- 接收方逐个接受文件。支持 File System Access API 时流式写入，否则累积分块后 Blob 下载并提示内存限制。

## 部署与验证

独立 `wrangler.jsonc` 声明两个 SQLite Durable Object 类、静态资源和 `file.wzrice.cn` Custom Domain。自动测试覆盖配对码、消息校验和传输帧；Wrangler dry-run 校验构建与绑定，线上验证首页和 API。
