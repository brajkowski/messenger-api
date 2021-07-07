import { instanceOfIncomingMessage } from '../../src/messenger/message';

describe('instanceOfIncomingMessage', () => {
  it('should return false when object lacks recipient field', () => {
    const o = { body: '' };
    expect(instanceOfIncomingMessage(o)).toBeFalsy();
  });

  it('should return false when object lacks body field', () => {
    const o = { recipient: '' };
    expect(instanceOfIncomingMessage(o)).toBeFalsy();
  });

  it('should return false when object lacks recipient and body field', () => {
    const o = {};
    expect(instanceOfIncomingMessage(o)).toBeFalsy();
  });

  it('should return true when object has required fields', () => {
    const o = { recipient: '', body: '' };
    expect(instanceOfIncomingMessage(o)).toBeTruthy();
  });
});
