import express from 'express';
import http from 'http';
import { Database } from 'sqlite3';
import { Server } from 'ws';
import { MessengerService } from './messenger/messenger-service';
import {
  MessagesLimit,
  MessengerPersistenceService,
} from './messenger/persistence/messenger-persistence-service';
import { WsController } from './ws/ws-controller';

const app = express();
const httpServer = http.createServer(app);
const wsServer = new Server({ server: httpServer });
const port = +(process.env.PORT || '8080');
const db = new Database('messages.sqlite3');
const messengerPersistenceService = new MessengerPersistenceService(db);
const messengerService = new MessengerService(messengerPersistenceService);
const wsController = new WsController(messengerService);

app.get('/', (req, res) => {
  res.send('<h1>Messenger API</h1>');
});

app.get('/messages', (req, res) => {
  const recipient = req.query.recipient;
  const sender = req.query.sender;
  const limit = req.query.limit;
  if (typeof recipient !== 'string' || recipient === '') {
    res.status(400);
    res.json({ message: 'recipient is a required parameter' });
    return;
  }
  if (
    limit !== MessagesLimit.LAST_30_DAYS &&
    limit !== MessagesLimit.LAST_100_MESSAGES
  ) {
    res.status(400);
    res.json({
      message: `limit is a required parameter (${MessagesLimit.LAST_30_DAYS} | ${MessagesLimit.LAST_100_MESSAGES})`,
    });
    return;
  }
  messengerPersistenceService
    .getMessages(
      recipient as string,
      limit as MessagesLimit,
      sender as string | undefined
    )
    .then((messages) => {
      res.json(messages);
    });
});

wsServer.on('connection', (ws, req) => {
  wsController.handleNewConnection(ws, req);
});

httpServer.listen(port, () => {
  console.log(`[http-server] listening on port: ${port}`);
});
