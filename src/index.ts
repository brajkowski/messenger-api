import express from 'express';
import http from 'http';
import { Server } from 'ws';
import { MessengerService } from './messenger/messenger-service';
import { WsController } from './ws/ws-controller';

const app = express();
const httpServer = http.createServer(app);
const wsServer = new Server({ server: httpServer });
const port = +(process.env.PORT || '8080');
const messengerService = new MessengerService();
const wsController = new WsController(messengerService);

app.get('/', (req, res) => {
  res.send('<h1>Messenger API</h1>');
});

wsServer.on('connection', (ws, req) => {
  wsController.handleNewConnection(ws, req);
});

httpServer.listen(port, () => {
  console.log(`[http-server] listening on port: ${port}`);
});
