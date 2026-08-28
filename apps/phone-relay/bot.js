// MessengerBot R v40 relay. Keep business rules in AWS Lambda.
// Replace only sharedSecret on the phone. Never commit the real value.
var CONFIG = {
  endpoint: 'https://zbzdl5d4tk.execute-api.ap-northeast-1.amazonaws.com',
  sharedSecret: 'REPLACE_ON_PHONE_ONLY',
  // Replace this local-only placeholder with the one consented room name.
  fixedRoomName: 'YOUR_CONSENTED_ROOM_NAME',
  noticeRooms: ['YOUR_CONSENTED_ROOM_NAME']
};
var knownNoticeUrls = [];
var noticeInitialized = false;
var noticePolling = false;
var sundayPolling = false;
var sundayInitialized = false;
var knownSundayUrl = '';
var runtimePolling = false;
var lastRuntimeAlertAt = 0;

// Kakao chat has a per-message length limit. Preserve the complete backend
// reply by sending newline-aligned chunks instead of truncating it.
function replyInChunks(replier, text) {
  var maxLength = 950;
  var remaining = String(text);
  while (remaining.length > maxLength) {
    var splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt <= 0) splitAt = maxLength;
    replier.reply(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n+/, '');
  }
  if (remaining.length > 0) replier.reply(remaining);
}

function pollNoticeAlerts() {
  if (noticePolling || !CONFIG.endpoint || !CONFIG.sharedSecret || !CONFIG.noticeRooms.length)
    return;
  noticePolling = true;
  try {
    var known = encodeURIComponent(knownNoticeUrls.join('|'));
    var url = CONFIG.endpoint + '/v1/notice-alerts?known=' + known;
    var connection = org.jsoup.Jsoup.connect(url);
    connection.header('Authorization', 'Bearer ' + CONFIG.sharedSecret);
    connection.ignoreContentType(true);
    connection.ignoreHttpErrors(true);
    connection.timeout(4500);
    connection.method(org.jsoup.Connection.Method.GET);
    var result = connection.execute();
    if (result.statusCode() !== 200) return;
    var body = JSON.parse(result.body());
    var allUrls = Array.isArray(body.allUrls) ? body.allUrls : [];
    if (!noticeInitialized) {
      knownNoticeUrls = allUrls.slice(-20);
      noticeInitialized = true;
      return;
    }
    var notices = Array.isArray(body.notices) ? body.notices : [];
    notices.forEach(function (notice) {
      if (!notice || typeof notice.title !== 'string' || typeof notice.url !== 'string') return;
      if (typeof Api !== 'undefined' && typeof Api.replyRoom === 'function') {
        CONFIG.noticeRooms.forEach(function (roomName) {
          Api.replyRoom(roomName, '[메이플 공지 알림]\n' + notice.title + '\n' + notice.url);
        });
      }
      knownNoticeUrls.push(notice.url);
    });
    knownNoticeUrls = knownNoticeUrls.slice(-20);
  } catch (error) {
    void error;
    return;
  } finally {
    noticePolling = false;
  }
}

if (typeof setInterval === 'function') setInterval(pollNoticeAlerts, 60000);

// Announces only a newly published current Sunday Maple event.
function pollSundayAlerts() {
  if (sundayPolling || !CONFIG.endpoint || !CONFIG.sharedSecret || !CONFIG.noticeRooms.length)
    return;
  sundayPolling = true;
  try {
    var connection = org.jsoup.Jsoup.connect(CONFIG.endpoint + '/v1/sunday-alert');
    connection.header('Authorization', 'Bearer ' + CONFIG.sharedSecret);
    connection.ignoreContentType(true);
    connection.ignoreHttpErrors(true);
    connection.timeout(4500);
    connection.method(org.jsoup.Connection.Method.GET);
    var result = connection.execute();
    if (result.statusCode() !== 200) return;
    var body = JSON.parse(result.body());
    var event = body && body.event;
    if (!event || typeof event.url !== 'string') return;
    if (!sundayInitialized) {
      knownSundayUrl = event.url;
      sundayInitialized = true;
      return;
    }
    if (event.url === knownSundayUrl) return;
    if (typeof Api !== 'undefined' && typeof Api.replyRoom === 'function') {
      CONFIG.noticeRooms.forEach(function (roomName) {
        Api.replyRoom(
          roomName,
          '[썬데이 메이플 새 게시글]\n' +
            (typeof event.title === 'string' ? event.title + '\n' : '') +
            event.url
        );
        if (typeof event.imageUrl === 'string' && event.imageUrl) {
          Api.replyRoom(roomName, '[썬데이 이미지]\n' + event.imageUrl);
        }
      });
    }
    knownSundayUrl = event.url;
  } catch (error) {
    void error;
    return;
  } finally {
    sundayPolling = false;
  }
}

if (typeof setInterval === 'function') setInterval(pollSundayAlerts, 60000);

// MessengerBot R cannot press its own compile/runtime controls. This watchdog
// checks the backend once a day while this script is active and reports outages.
function checkBackendRuntime() {
  if (runtimePolling || !CONFIG.endpoint || !CONFIG.noticeRooms.length) return;
  runtimePolling = true;
  try {
    var connection = org.jsoup.Jsoup.connect(CONFIG.endpoint + '/health');
    connection.ignoreContentType(true);
    connection.ignoreHttpErrors(true);
    connection.timeout(4500);
    connection.method(org.jsoup.Connection.Method.GET);
    var result = connection.execute();
    if (result.statusCode() === 200) return;
    if (Date.now() - lastRuntimeAlertAt < 86400000) return;
    if (typeof Api !== 'undefined' && typeof Api.replyRoom === 'function') {
      CONFIG.noticeRooms.forEach(function (roomName) {
        Api.replyRoom(
          roomName,
          '[봇 런타임 점검]\n백엔드 상태 확인에 실패했습니다. 공기계에서 MessengerBot R 실행 상태를 확인해 주세요.'
        );
      });
      lastRuntimeAlertAt = Date.now();
    }
  } catch (error) {
    void error;
    return;
  } finally {
    runtimePolling = false;
  }
}

if (typeof setInterval === 'function') setInterval(checkBackendRuntime, 86400000);

// MessengerBot R passes: room, message, sender, isGroupChat, replier, imageDB, packageName.
// eslint-disable-next-line no-unused-vars
function response(room, message, sender, isGroupChat, replier, imageDB, packageName) {
  if (typeof message !== 'string' || message.trim().charAt(0) !== '!') return;
  if (!CONFIG.endpoint || !CONFIG.sharedSecret) return;

  var eventId = Date.now().toString(36) + Math.random().toString(36).slice(2);

  try {
    var payload = JSON.stringify({
      eventId: eventId,
      roomId: CONFIG.fixedRoomName,
      senderId: sender,
      message: message,
      sentAt: new Date().toISOString()
    });

    var connection = org.jsoup.Jsoup.connect(CONFIG.endpoint + '/v1/messages');
    connection.header('Authorization', 'Bearer ' + CONFIG.sharedSecret);
    connection.header('Content-Type', 'application/json');
    connection.requestBody(payload);
    connection.ignoreContentType(true);
    connection.ignoreHttpErrors(true);
    connection.timeout(4500);
    connection.method(org.jsoup.Connection.Method.POST);

    var result = connection.execute();

    if (result.statusCode() !== 200) return;

    var body = JSON.parse(result.body());

    if (body.reply) {
      replyInChunks(replier, body.reply);
    }
  } catch (error) {
    void error;
    return;
  }
}
