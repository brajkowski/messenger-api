import WebSocket, { Server } from 'ws';
import { MessengerService } from '../../src/messenger/messenger-service';

describe('MessengerService', () => {
  let messengerService: MessengerService;
  let ws: WebSocket;
  let server: Server;

  beforeAll((done) => {
    server = new Server({ port: 8080 });
    server.on('listening', () => {
      ws = new WebSocket('ws://localhost:8080');
      ws.on('open', () => {
        done();
      });
    });
  });

  beforeEach(() => {
    messengerService = new MessengerService();
  });

  afterAll(() => {
    ws.close();
    server.close();
  });

  it('should activate users', () => {
    const expectedUsername = 'user';
    messengerService.activateUser(expectedUsername, ws);
    expect(messengerService.getActiveUsername(ws)).toEqual(expectedUsername);
    expect(messengerService.getActiveWebSocket(expectedUsername)).toEqual(ws);
  });

  it('should deactivate users by username', () => {
    const username = 'user';
    messengerService.activateUser(username, ws);
    messengerService.deactivateUser(username);
    expect(messengerService.getActiveUsername(ws)).toBeUndefined();
    expect(messengerService.getActiveWebSocket(username)).toBeUndefined();
  });

  it('should deactivate users by web socket', () => {
    const username = 'user';
    messengerService.activateUser(username, ws);
    messengerService.deactivateUser(ws);
    expect(messengerService.getActiveUsername(ws)).toBeUndefined();
    expect(messengerService.getActiveWebSocket(username)).toBeUndefined();
  });

  it('should send messages from a sender to a recipient', () => {
    const expectedSender = 'sender';
    const expectedRecipient = 'recipient';
    const expectedBody = 'my message!';
    const sendSpy = jest.spyOn(ws, 'send');
    messengerService.activateUser(expectedRecipient, ws);
    messengerService.sendMessage(
      expectedSender,
      expectedRecipient,
      expectedBody
    );
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should silently fail while sending messages to recipients that are not active', () => {
    const expectedSender = 'sender';
    const expectedRecipient = 'recipient';
    const expectedBody = 'my message!';
    messengerService.deactivateUser(expectedRecipient);
    expect(() =>
      messengerService.sendMessage(
        expectedSender,
        expectedRecipient,
        expectedBody
      )
    ).not.toThrow();
  });
});
