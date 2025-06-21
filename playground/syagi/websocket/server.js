const WebSocket = require('ws');

// WebSocketサーバーを起動（ポート8080）
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('新しいクライアントが接続しました');

  // クライアントからのメッセージ受信
  ws.on('message', (message) => {
    console.log(`受信: ${message}`);
    // 全クライアントにメッセージをブロードキャスト
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // クライアント切断時の処理
  ws.on('close', () => {
    console.log('クライアントが切断しました');
  });
});

console.log('WebSocketサーバーが起動しました (ws://localhost:8080)');
