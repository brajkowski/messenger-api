import WebSocket from 'ws';
import { OutgoingMessage } from './message';

export class MessengerService {
  protected usernameWsMap: Map<string, WebSocket>;
  protected wsUsernameMap: Map<WebSocket, string>;

  constructor() {
    this.usernameWsMap = new Map();
    this.wsUsernameMap = new Map();
  }

  activateUser(username: string, ws: WebSocket): void {
    this.usernameWsMap.set(username, ws);
    this.wsUsernameMap.set(ws, username);
    console.debug(`[messenger-service] '${username}' has joined`);
  }

  deactivateUser(user: string | WebSocket): void {
    let ws: WebSocket;
    let username: string;
    if (user instanceof WebSocket) {
      ws = user;
      username = this.getActiveUsername(ws)!;
    } else {
      username = user;
      ws = this.getActiveWebSocket(username)!;
    }
    this.usernameWsMap.delete(username);
    this.wsUsernameMap.delete(ws);
    console.debug(`[messenger-service] '${username}' has left`);
  }

  getActiveUsername(ws: WebSocket): string | undefined {
    return this.wsUsernameMap.get(ws);
  }

  getActiveWebSocket(username: string): WebSocket | undefined {
    return this.usernameWsMap.get(username);
  }

  sendMessage(sender: string, recipient: string, body: string): void {
    const outgoingMessage: OutgoingMessage = {
      sender,
      body: body,
      timestamp: new Date(),
    };
    this.getActiveWebSocket(recipient)?.send(JSON.stringify(outgoingMessage));
  }
}
