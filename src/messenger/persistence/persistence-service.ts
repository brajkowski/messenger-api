import { Database } from 'sqlite3';
import { Message } from '../message';

export class MessengerPersistenceService {
  constructor(private db: Database) {
    db.run('CREATE table message');
  }

  save(message: Message): void {
    throw new Error();
  }

  getMessages(recipient: string, sender?: string): Message[] {
    throw new Error();
  }
}
