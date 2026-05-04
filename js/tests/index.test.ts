import { isDisposable, check, checkMany, getDomain, getBlocklist } from '../src/index';

describe('getDomain', () => {
  it('extracts domain from valid email', () => {
    expect(getDomain('user@mailinator.com')).toBe('mailinator.com');
  });
  it('returns null for invalid emails', () => {
    expect(getDomain('notanemail')).toBeNull();
    expect(getDomain('@domain.com')).toBeNull();
    expect(getDomain('user@')).toBeNull();
    expect(getDomain('user@nodot')).toBeNull();
  });
  it('is case-insensitive', () => {
    expect(getDomain('USER@MAILINATOR.COM')).toBe('mailinator.com');
  });
});

describe('isDisposable', () => {
  it('returns true for known disposable domains', () => {
    expect(isDisposable('test@mailinator.com')).toBe(true);
    expect(isDisposable('user@guerrillamail.com')).toBe(true);
    expect(isDisposable('foo@yopmail.com')).toBe(true);
  });
  it('returns false for real domains', () => {
    expect(isDisposable('user@gmail.com')).toBe(false);
    expect(isDisposable('user@yahoo.com')).toBe(false);
    expect(isDisposable('user@outlook.com')).toBe(false);
  });
  it('is case-insensitive', () => {
    expect(isDisposable('USER@MAILINATOR.COM')).toBe(true);
    expect(isDisposable('Test@YopMail.com')).toBe(true);
  });
  it('returns false for invalid email', () => {
    expect(isDisposable('notanemail')).toBe(false);
  });
});

describe('check', () => {
  it('returns full result for disposable email', () => {
    const result = check('test@mailinator.com');
    expect(result).toEqual({
      email: 'test@mailinator.com',
      domain: 'mailinator.com',
      isDisposable: true,
      reason: 'blocklist',
    });
  });
  it('returns full result for legitimate email', () => {
    const result = check('user@gmail.com');
    expect(result).toEqual({
      email: 'user@gmail.com',
      domain: 'gmail.com',
      isDisposable: false,
      reason: null,
    });
  });
  it('returns invalid_email reason for bad input', () => {
    const result = check('notanemail');
    expect(result).toEqual({
      email: 'notanemail',
      domain: null,
      isDisposable: false,
      reason: 'invalid_email',
    });
  });
  it('is case-insensitive', () => {
    const result = check('USER@MAILINATOR.COM');
    expect(result.isDisposable).toBe(true);
    expect(result.domain).toBe('mailinator.com');
  });
});

describe('checkMany', () => {
  it('processes multiple emails', () => {
    const results = checkMany(['test@mailinator.com', 'user@gmail.com', 'bad']);
    expect(results).toHaveLength(3);
    expect(results[0].isDisposable).toBe(true);
    expect(results[1].isDisposable).toBe(false);
    expect(results[2].reason).toBe('invalid_email');
  });
  it('handles empty array', () => {
    expect(checkMany([])).toEqual([]);
  });
});

describe('getBlocklist', () => {
  it('returns sorted array of domains', () => {
    const list = getBlocklist();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(100);
    for (let i = 1; i < list.length; i++) {
      expect(list[i] >= list[i - 1]).toBe(true);
    }
  });
  it('includes known domains', () => {
    const list = getBlocklist();
    expect(list).toContain('mailinator.com');
    expect(list).toContain('yopmail.com');
  });
});
