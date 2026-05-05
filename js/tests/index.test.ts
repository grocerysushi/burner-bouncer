import {
  isDisposable, check, checkMany, getDomain, getBlocklist,
  isFreeProvider, isRoleAddress, suggest, getFreeProviders, checkWithDns,
} from '../src/index';

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

describe('isFreeProvider', () => {
  it('returns true for free email providers', () => {
    expect(isFreeProvider('user@gmail.com')).toBe(true);
    expect(isFreeProvider('user@yahoo.com')).toBe(true);
    expect(isFreeProvider('user@hotmail.com')).toBe(true);
    expect(isFreeProvider('user@protonmail.com')).toBe(true);
  });
  it('returns false for business or disposable domains', () => {
    expect(isFreeProvider('user@company.com')).toBe(false);
    expect(isFreeProvider('user@mailinator.com')).toBe(false);
  });
  it('returns false for invalid email', () => {
    expect(isFreeProvider('notanemail')).toBe(false);
  });
});

describe('isRoleAddress', () => {
  it('returns true for role-based prefixes', () => {
    expect(isRoleAddress('admin@example.com')).toBe(true);
    expect(isRoleAddress('noreply@example.com')).toBe(true);
    expect(isRoleAddress('support@example.com')).toBe(true);
    expect(isRoleAddress('info@example.com')).toBe(true);
    expect(isRoleAddress('no-reply@example.com')).toBe(true);
  });
  it('returns false for personal addresses', () => {
    expect(isRoleAddress('john@example.com')).toBe(false);
    expect(isRoleAddress('alice@gmail.com')).toBe(false);
  });
  it('handles plus-addressing', () => {
    expect(isRoleAddress('admin+tag@example.com')).toBe(true);
  });
});

describe('suggest', () => {
  it('suggests a correction for a typo', () => {
    expect(suggest('user@gmial.com')).toBe('user@gmail.com');
    expect(suggest('user@yaho.com')).toBe('user@yahoo.com');
    expect(suggest('user@outlok.com')).toBe('user@outlook.com');
  });
  it('returns null when domain is already correct', () => {
    expect(suggest('user@gmail.com')).toBeNull();
  });
  it('returns null for invalid email', () => {
    expect(suggest('notanemail')).toBeNull();
  });
  it('returns null when no close match exists', () => {
    expect(suggest('user@zzzzzzz.com')).toBeNull();
  });
});

describe('check', () => {
  it('returns full result for disposable email', () => {
    const result = check('test@mailinator.com');
    expect(result).toMatchObject({
      email: 'test@mailinator.com',
      domain: 'mailinator.com',
      isDisposable: true,
      isFreeProvider: false,
      isRoleAddress: false,
      reason: 'blocklist',
    });
  });
  it('returns full result for legitimate email', () => {
    const result = check('user@gmail.com');
    expect(result).toMatchObject({
      email: 'user@gmail.com',
      domain: 'gmail.com',
      isDisposable: false,
      isFreeProvider: true,
      isRoleAddress: false,
      reason: null,
    });
  });
  it('flags role address', () => {
    const result = check('admin@example.com');
    expect(result.isRoleAddress).toBe(true);
  });
  it('returns invalid_email reason for bad input', () => {
    const result = check('notanemail');
    expect(result).toMatchObject({
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

describe('getFreeProviders', () => {
  it('returns sorted array including common providers', () => {
    const list = getFreeProviders();
    expect(Array.isArray(list)).toBe(true);
    expect(list).toContain('gmail.com');
    expect(list).toContain('yahoo.com');
    expect(list).toEqual([...list].sort());
  });
});

describe('checkWithDns', () => {
  it('returns hasMx field', async () => {
    const result = await checkWithDns('user@gmail.com');
    expect(typeof result.hasMx).toBe('boolean');
    expect(result.hasMx).toBe(true);
  }, 10000);
  it('returns hasMx null for invalid email', async () => {
    const result = await checkWithDns('notanemail');
    expect(result.hasMx).toBeNull();
  });
});
