const test = require('node:test');
const assert = require('node:assert/strict');

const { ACCESSORY_MODE } = require('../src/settings');
const { __testing, ParseMode, ParseState } = require('../src/util');

const createPlatformStub = () => ({
  log: {
    debug: () => undefined,
    error: () => undefined,
  },
  config: {
    bridge_ip_address: '127.0.0.1',
  },
  requestQueue: Promise.resolve(),
  lastRequestAt: 0,
  lastResponseAt: 0,
  lastResponse: '',
  pendingRefresh: undefined,
  getGetDelay: () => 0,
  getSetDelay: () => 0,
  getGetCacheThreshold: () => 1000,
});

const wrapResponse = (rawLedStatus) => `<html><body>xxxlcdxxx${rawLedStatus}</body></html>`;

test.afterEach(() => {
  __testing.resetRequestImplementation();
});

test('ParseState decodes LED state from the AquaConnect payload', async () => {
  const platform = createPlatformStub();
  __testing.setRequestImplementation(async () => wrapResponse('E'));

  assert.equal(await ParseState(platform, 0, 'Pool Light', true), 'off');
  assert.equal(await ParseState(platform, 1, 'Pool Light', true), 'on');
});

test('ParseMode decodes pool, spa, and spillover modes from the raw response', async () => {
  const platform = createPlatformStub();

  __testing.setRequestImplementation(async () => wrapResponse('T'));
  assert.equal(await ParseMode(platform, 'Mode', true), ACCESSORY_MODE.POOL);

  __testing.setRequestImplementation(async () => wrapResponse('E'));
  assert.equal(await ParseMode(platform, 'Mode', true), ACCESSORY_MODE.SPA);

  __testing.setRequestImplementation(async () => wrapResponse('D'));
  assert.equal(await ParseMode(platform, 'Mode', true), ACCESSORY_MODE.SPILLOVER);
});

test('getResponse caches responses within the configured threshold', async () => {
  const platform = createPlatformStub();
  let requestCount = 0;

  __testing.setRequestImplementation(async () => {
    requestCount += 1;
    return wrapResponse('E');
  });

  const firstResponse = await __testing.getResponse(platform, 'CacheTest', false);
  const secondResponse = await __testing.getResponse(platform, 'CacheTest', false);

  assert.equal(firstResponse, secondResponse);
  assert.equal(requestCount, 1);
});

test('getResponse bypasses the cache when forceRefresh is true', async () => {
  const platform = createPlatformStub();
  let requestCount = 0;

  __testing.setRequestImplementation(async () => {
    requestCount += 1;
    return wrapResponse(requestCount === 1 ? 'E' : 'T');
  });

  await __testing.getResponse(platform, 'ForceRefresh', false);
  await __testing.getResponse(platform, 'ForceRefresh', true);

  assert.equal(requestCount, 2);
});

test('getResponse shares a pending refresh across concurrent callers', async () => {
  const platform = createPlatformStub();
  let requestCount = 0;

  __testing.setRequestImplementation(async () => {
    requestCount += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return wrapResponse('E');
  });

  const [firstResponse, secondResponse] = await Promise.all([
    __testing.getResponse(platform, 'ConcurrentA', true),
    __testing.getResponse(platform, 'ConcurrentB', true),
  ]);

  assert.equal(firstResponse, secondResponse);
  assert.equal(requestCount, 1);
});

test('queueRequest serializes concurrent work in submission order', async () => {
  const platform = createPlatformStub();
  const events = [];

  const first = __testing.queueRequest(platform, 0, async () => {
    events.push('first:start');
    await new Promise(resolve => setTimeout(resolve, 10));
    events.push('first:end');
    return 'first';
  });

  const second = __testing.queueRequest(platform, 0, async () => {
    events.push('second:start');
    events.push('second:end');
    return 'second';
  });

  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.equal(firstResult, 'first');
  assert.equal(secondResult, 'second');
  assert.deepEqual(events, [
    'first:start',
    'first:end',
    'second:start',
    'second:end',
  ]);
});

test('GetRawLedStatus throws when the response body is malformed', () => {
  assert.throws(() => __testing.GetRawLedStatus('<html><body>missing delimiters</body></html>'));
});
