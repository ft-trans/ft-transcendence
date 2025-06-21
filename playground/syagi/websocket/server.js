const WebSocket = require('ws');

// WebSocketサーバーを起動（ポート8080）
const wss = new WebSocket.Server({ port: 8080 });

let state = {
  count: 0,
};

wss.on('connection', (ws) => {
  console.log('新しいクライアントが接続しました');

  // クライアントからのメッセージ受信
  ws.on('message', (message) => {
    console.log(`受信: ${message}`);
    state.count += 1;
    // 全クライアントにメッセージをブロードキャスト
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
              message: String(message),
              count: state.count
            }));
      }
    });
  });

  // クライアント切断時の処理
  ws.on('close', () => {
    console.log('クライアントが切断しました');
  });
});

console.log('WebSocketサーバーが起動しました (ws://localhost:8080)');
