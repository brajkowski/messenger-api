export interface Body {
  body: string;
}

export interface IncomingMessage extends Body {
  recipient: string;
}

export interface OutgoingMessage extends Body {
  sender: string;
  timestamp: Date;
}

export interface Message extends IncomingMessage, OutgoingMessage {}

export function instanceOfIncomingMessage(
  object: any
): object is IncomingMessage {
  return 'recipient' in object && 'body' in object;
}
