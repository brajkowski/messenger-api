import { Database } from 'sqlite3';
import { Message } from '../message';

export enum MessagesLimit {
  LAST_30_DAYS = '30days',
  LAST_100_MESSAGES = '100',
}

export class MessengerPersistenceService {
  constructor(private db: Database) {
    this.db.run(
      'CREATE TABLE IF NOT EXISTS messages (body TEXT, recipient TEXT, sender TEXT, timestamp TEXT)'
    );
  }

  saveMessage(message: Message): void {
    const stmt = this.db.prepare(
      'INSERT INTO messages (body, recipient, sender, timestamp) VALUES (?, ?, ?, ?)'
    );
    stmt.run([
      message.body,
      message.recipient,
      message.sender,
      message.timestamp.toISOString(),
    ]);
    stmt.finalize();
  }

  getMessages(
    recipient: string,
    limit: MessagesLimit,
    sender?: string
  ): Promise<Message[]> {
    const filterClauses: string[] = [];
    const filterParams: string[] = [];

    filterClauses.push('WHERE recipient = ?');
    filterParams.push(recipient);

    if (sender) {
      filterClauses.push('AND sender = ?');
      filterParams.push(sender);
    }

    if (limit === MessagesLimit.LAST_30_DAYS) {
      filterClauses.push(`AND DATE(timestamp) > DATE('now', '-30 day')`);
    } else if (limit === MessagesLimit.LAST_100_MESSAGES) {
      filterClauses.push('LIMIT 100');
    }

    filterClauses.push('ORDER BY timestamp DESC');

    const query = filterClauses.reduce(
      (agg, curr) => `${agg} ${curr}`,
      'SELECT * FROM messages'
    );

    return new Promise((resolve) => {
      console.debug(
        `[messenger-persistence-service] executing query '${query}'`
      );
      const messages: Message[] = [];
      this.db.each(
        query,
        filterParams,
        (err, row) => {
          messages.push(row);
        },
        () => {
          resolve(messages);
        }
      );
    });
  }
}
