import http from 'http';
import net from 'net';
import { Database } from 'sqlite3';
import WebSocket, { Server } from 'ws';
import { IncomingMessage } from '../../src/messenger/message';
import { MessengerService } from '../../src/messenger/messenger-service';
import { MessengerPersistenceService } from '../../src/messenger/persistence/messenger-persistence-service';
import { WsController } from '../../src/ws/ws-controller';

describe('WsController', () => {
  let db = new Database(':memory:');
  let messengerPersistenceService = new MessengerPersistenceService(db);
  let wsController: WsController;
  let messengerService: MessengerService;
  let ws: WebSocket;
  let req: http.IncomingMessage;
  let server: Server;

  let expectNewConnectionFailureIsHandled = () => {
    const closeSpy = jest.spyOn(ws, 'close');
    const activateUserSpy = jest.spyOn(messengerService, 'activateUser');
    expect(() => wsController.handleNewConnection(ws, req)).not.toThrow();
    expect(closeSpy).toHaveBeenCalled();
    expect(activateUserSpy).not.toHaveBeenCalled();
  };

  let expectMessageHandlerFailureIsHandled = (data: string) => {
    expect(() =>
      WsController.messageHandler(ws, data, messengerService)
    ).not.toThrow();
  };

  beforeAll((done) => {
    server = new Server({ port: 8082 });
    server.on('listening', () => {
      ws = new WebSocket('ws://localhost:8082');
      ws.on('open', () => {
        done();
      });
    });
  });

  beforeEach(() => {
    messengerService = new MessengerService(messengerPersistenceService);
    wsController = new WsController(messengerService);
    req = new http.IncomingMessage(new net.Socket());
  });

  afterAll(() => {
    ws.removeEventListener('close'); // Remove listener that tries to log after tests are complete.
    ws.close();
    server.close();
  });

  it('should fail gracefully for malformed request urls', () => {
    req.url = '/\\';
    expectNewConnectionFailureIsHandled();
  });

  it('should fail gracefully for incorrect request paths', () => {
    req.url = '/wrong/resource';
    expectNewConnectionFailureIsHandled();
  });

  it('should fail gracefully when username query param missing', () => {
    req.url = WsController.messageResource;
    expectNewConnectionFailureIsHandled();
  });

  it('should fail gracefully when username query param is empty', () => {
    req.url = `${WsController.messageResource}?${WsController.usernameQueryParam}=&otherparam=5`;
    expectNewConnectionFailureIsHandled();
  });

  it('should activate new connections that are well-formed', () => {
    const onSpy = jest.spyOn(ws, 'on');
    const activateUserSpy = jest.spyOn(messengerService, 'activateUser');
    const expectedUsername = 'user';
    req.url = `${WsController.messageResource}?${WsController.usernameQueryParam}=${expectedUsername}`;
    wsController.handleNewConnection(ws, req);
    expect(onSpy).toHaveBeenCalledTimes(2);
    expect(activateUserSpy).toHaveBeenCalledWith(expectedUsername, ws);
  });

  it('should fail gracefully for malformed json in incoming messages', () => {
    expectMessageHandlerFailureIsHandled('{');
  });

  it('should fail gracefully for invalid incoming messages', () => {
    expectMessageHandlerFailureIsHandled('{"invalid":"message"}');
  });

  it('should send the incoming message to the recipient', () => {
    const expectedSender = 'sender';
    const expectedRecipient = 'recipient';
    const expectedBody = 'body';

    const sendMessageSpy = jest.spyOn(messengerService, 'sendMessage');
    const incomingMessage: IncomingMessage = {
      recipient: expectedRecipient,
      body: expectedBody,
    };
    jest
      .spyOn(messengerService, 'getActiveUsername')
      .mockReturnValue(expectedSender);
    WsController.messageHandler(
      ws,
      JSON.stringify(incomingMessage),
      messengerService
    );
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expectedSender,
      expectedRecipient,
      expectedBody
    );
  });

  it('should not send the incoming message if the recipient is not active', () => {
    const incomingMessage: IncomingMessage = {
      recipient: '',
      body: '',
    };
    const sendMessageSpy = jest.spyOn(messengerService, 'sendMessage');
    jest
      .spyOn(messengerService, 'getActiveUsername')
      .mockReturnValue(undefined);
    WsController.messageHandler(
      ws,
      JSON.stringify(incomingMessage),
      messengerService
    );
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });
});
