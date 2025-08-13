// 使用 require 替代 import
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
	console.log('新的客户端连接');

   // 收到消息
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      switch (msg.type) {
        case 'login':
          console.log(`${msg.user} 登录`);
          ws.send(JSON.stringify({ type: 'welcome' }));
          break;
        case 'chat':
          console.log(`${msg.user} 说: ${msg.text}`);
          // 广播给所有客户端
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(msg));
            }
          });
          break;
        default:
          console.log('未知消息类型:', msg);
      }
    } catch (e) {
      console.error('消息解析失败:', e);
    }
  });

	// 错误处理
  ws.on('error', (error) => {
    console.error('客户端错误:', error);
  });
});

console.log('WebSocket 服务器已启动在 ws://localhost:8080');