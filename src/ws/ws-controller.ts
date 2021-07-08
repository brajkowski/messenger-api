import http from 'http';
import WebSocket from 'ws';
import {
  IncomingMessage,
  instanceOfIncomingMessage,
} from '../messenger/message';
import { MessengerService } from '../messenger/messenger-service';

export class WsController {
  static readonly messageResource = '/messages';
  static readonly usernameQueryParam = 'username';
  static messageHandler(
    ws: WebSocket,
    data: WebSocket.Data,
    messengerService: MessengerService
  ): void {
    let incomingMessage: IncomingMessage;
    try {
      incomingMessage = JSON.parse(data.toString());
    } catch (err) {
      console.debug('[ws-controller] could not parse incoming message');
      return;
    }
    if (!instanceOfIncomingMessage(incomingMessage)) {
      console.debug('[ws-controller] invalid incoming message');
      return;
    }
    const sender = messengerService.getActiveUsername(ws);
    if (sender) {
      messengerService.sendMessage(
        sender,
        incomingMessage.recipient,
        incomingMessage.body
      );
    }
  }

  constructor(private messengerService: MessengerService) {}

  handleNewConnection(ws: WebSocket, req: http.IncomingMessage): void {
    let url: URL;
    let path: string;
    let username: string | null;
    try {
      url = new URL(req.url!, 'http://localhost'); // Base can be any value.
    } catch (err) {
      console.debug('[ws-controller] could not parse new connection URL');
      ws.close();
      return;
    }
    path = url.pathname;
    username = url.searchParams.get(WsController.usernameQueryParam);
    if (
      path.toLocaleLowerCase() !== WsController.messageResource ||
      !username ||
      username.length < 1
    ) {
      console.debug('[ws-controller] incorrect path or missing/empty username');
      ws.close();
      return;
    }
    this.activateNewConnection(username, ws);
  }

  protected activateNewConnection(username: string, ws: WebSocket): void {
    ws.on('message', (data: WebSocket.Data) =>
      WsController.messageHandler(ws, data, this.messengerService)
    );
    ws.on('close', () => this.messengerService.deactivateUser(ws));
    this.messengerService.activateUser(username, ws);
  }
}
