import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../apps/phone-relay/bot.js', import.meta.url), 'utf8');

function createRelay({ replyBody = '{"reply":"ok"}' } = {}) {
  const intervals = [];
  const requests = [];
  const context = {
    JSON,
    Math,
    Date,
    String,
    encodeURIComponent,
    setInterval(callback, milliseconds) {
      intervals.push({ callback, milliseconds });
    },
    org: {
      jsoup: {
        Connection: {
          Method: { GET: 'GET', POST: 'POST' },
        },
        Jsoup: {
          connect(url) {
            const request = { url, headers: {}, body: '' };
            requests.push(request);
            return {
              header(name, value) {
                request.headers[name] = value;
              },
              requestBody(value) {
                request.body = value;
              },
              ignoreContentType() {},
              ignoreHttpErrors() {},
              timeout(value) {
                request.timeout = value;
              },
              method(value) {
                request.method = value;
              },
              execute() {
                return {
                  statusCode: () => 200,
                  body: () => replyBody,
                };
              },
            };
          },
        },
      },
    },
  };
  vm.runInNewContext(source, context, { filename: 'bot.js' });
  return { context, intervals, requests };
}

test('relay ignores non-command messages and registers scheduled checks', () => {
  const relay = createRelay();
  let replies = 0;
  relay.context.response('observed-room', 'hello', 'sender', false, {
    reply() {
      replies += 1;
    },
  });

  assert.equal(replies, 0);
  assert.equal(relay.requests.length, 0);
  assert.deepEqual(
    relay.intervals.map(({ milliseconds }) => milliseconds),
    [60000, 60000, 86400000],
  );
});

test('relay sends the configured fixed room and backend reply', () => {
  const relay = createRelay();
  const replies = [];
  relay.context.response('observed-room', '!도움말', 'sender', false, {
    reply(value) {
      replies.push(value);
    },
  });

  assert.deepEqual(replies, ['ok']);
  assert.equal(relay.requests.length, 1);
  const payload = JSON.parse(relay.requests[0].body);
  assert.equal(payload.roomId, 'YOUR_CONSENTED_ROOM_NAME');
  assert.equal(payload.senderId, 'sender');
  assert.equal(payload.message, '!도움말');
  assert.match(relay.requests[0].url, /\/v1\/messages$/);
});

test('relay preserves a long backend reply by splitting at newline boundaries', () => {
  const longReply = `${'A'.repeat(960)}\n${'B'.repeat(960)}`;
  const relay = createRelay({ replyBody: JSON.stringify({ reply: longReply }) });
  const replies = [];
  relay.context.response('observed-room', '!도움말', 'sender', false, {
    reply(value) {
      replies.push(value);
    },
  });

  assert.equal(replies.join('').replace(/\n/g, ''), longReply.replace(/\n/g, ''));
  assert.ok(replies.length >= 2);
  assert.equal(replies[0].endsWith('\n'), false);
  assert.ok(replies.every((part) => part.length <= 950));
});
