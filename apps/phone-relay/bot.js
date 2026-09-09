// MessengerBot R v40 relay. Keep business rules in AWS Lambda.
// Replace only sharedSecret on the phone. Never commit the real value.
var CONFIG = {
  endpoint: 'https://YOUR_API_ID.execute-api.ap-northeast-1.amazonaws.com',
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
var lastScheduledSlot = '';
var cachedRoomBot = null;
var testReminderDate = null;
var lastTestReminderSlot = '';

function getRoomBot() {
  if (cachedRoomBot && typeof cachedRoomBot.send === 'function') return cachedRoomBot;
  if (typeof Bot !== 'undefined' && Bot && typeof Bot.send === 'function') {
    cachedRoomBot = Bot;
    return cachedRoomBot;
  }
  if (typeof BotManager !== 'undefined' && BotManager &&
      typeof BotManager.getCurrentBot === 'function') {
    try {
      var currentBot = BotManager.getCurrentBot();
      if (currentBot && typeof currentBot.send === 'function') {
        cachedRoomBot = currentBot;
        return cachedRoomBot;
      }
    } catch (error) {
      return null;
    }
  }
  return null;
}

// MessengerBot R API2 room sender. Api.replyRoom is a legacy API and is not
// available in every current MessengerBot R build. Bot.send supports both
// immediate and timer-triggered messages; keep all proactive sends here.
function sendRoom(roomName, text) {
  var roomBot = getRoomBot();
  if (!roomBot) return false;
  try {
    var sent = roomBot.send(roomName, text, 'com.kakao.talk');
    if (sent !== false) return true;
    // Some API2 builds infer the package and reject the optional third arg.
    return roomBot.send(roomName, text) !== false;
  } catch (error) {
    try {
      return roomBot.send(roomName, text) !== false;
    } catch (fallbackError) {
      return false;
    }
  }
}

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
      CONFIG.noticeRooms.forEach(function (roomName) {
        sendRoom(roomName, '[메이플 공지 알림]\n' + notice.title + '\n' + notice.url);
      });
      knownNoticeUrls.push(notice.url);
    });
    knownNoticeUrls = knownNoticeUrls.slice(-20);
  } catch (error) {
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
    CONFIG.noticeRooms.forEach(function (roomName) {
      sendRoom(
        roomName,
        '[썬데이 메이플 새 게시글]\n' +
          (typeof event.title === 'string' ? event.title + '\n' : '') +
          event.url
      );
      if (typeof event.imageUrl === 'string' && event.imageUrl) {
        sendRoom(roomName, '[썬데이 이미지]\n' + event.imageUrl);
      }
    });
    knownSundayUrl = event.url;
  } catch (error) {
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
    CONFIG.noticeRooms.forEach(function (roomName) {
      sendRoom(
        roomName,
        '[봇 런타임 점검]\n백엔드 상태 확인에 실패했습니다. 공기계에서 MessengerBot R 실행 상태를 확인해 주세요.'
      );
    });
    lastRuntimeAlertAt = Date.now();
  } catch (error) {
    return;
  } finally {
    runtimePolling = false;
  }
}

if (typeof setInterval === 'function') setInterval(checkBackendRuntime, 86400000);

// Sends the weekly 수로/플래그 reminder only to the explicitly configured
// notice rooms. The relay is the only component that can initiate a Kakao
// message; the backend remains request/response based.
function seoulDateParts(now) {
  var utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
  var seoul = new Date(utcMillis + 9 * 60 * 60000);
  return {
    day: seoul.getUTCDay(),
    hour: seoul.getUTCHours(),
    minute: seoul.getUTCMinutes(),
    date: seoul.getUTCFullYear() + '-' + (seoul.getUTCMonth() + 1) + '-' + seoul.getUTCDate()
  };
}

// One-day test schedule: every three minutes from 11:00 through 11:20 Seoul
// time. The date is captured when the script starts, so this never becomes a
// permanent daily broadcast.
function sendTestReminder() {
  if (!CONFIG.noticeRooms.length || !getRoomBot()) return;
  var parts = seoulDateParts(new Date());
  if (!testReminderDate) testReminderDate = parts.date;
  if (parts.date !== testReminderDate || parts.hour !== 11 || parts.minute > 20)
    return;
  if (parts.minute % 3 !== 0 && parts.minute !== 20) return;
  var slot = parts.date + '-' + parts.hour + ':' + parts.minute;
  if (slot === lastTestReminderSlot) return;
  CONFIG.noticeRooms.forEach(function (roomName) {
    sendRoom(roomName, '★보스☆수로☆ 플래그★');
  });
  lastTestReminderSlot = slot;
}

if (typeof setInterval === 'function') setInterval(sendTestReminder, 30000);

function sendWeeklyCourseReminder() {
  if (!CONFIG.noticeRooms.length || !getRoomBot()) return;
  var parts = seoulDateParts(new Date());
  if (parts.day !== 3) return;
  var scheduledSlots = [
    { hour: 18, minute: 0 },
    { hour: 22, minute: 0 },
    { hour: 22, minute: 30 },
    { hour: 22, minute: 38 },
    { hour: 22, minute: 42 },
    { hour: 22, minute: 48 },
    { hour: 23, minute: 0 }
  ];
  var currentMinutes = parts.hour * 60 + parts.minute;
  var matchedSlot = null;
  scheduledSlots.forEach(function (scheduled) {
    var targetMinutes = scheduled.hour * 60 + scheduled.minute;
    // Allow one minute of timer/Android scheduling jitter.
    if (currentMinutes >= targetMinutes && currentMinutes <= targetMinutes + 1)
      matchedSlot = scheduled;
  });
  if (!matchedSlot) return;
  var slot = parts.date + '-' + matchedSlot.hour + ':' + matchedSlot.minute;
  if (slot === lastScheduledSlot) return;
  CONFIG.noticeRooms.forEach(function (roomName) {
    sendRoom(roomName, '★보스☆수로☆ 플래그★');
  });
  lastScheduledSlot = slot;
}

if (typeof setInterval === 'function') setInterval(sendWeeklyCourseReminder, 30000);

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
    connection.timeout(15000);
    connection.method(org.jsoup.Connection.Method.POST);

    var result = connection.execute();

    if (result.statusCode() !== 200) return;

    var body = JSON.parse(result.body());

    if (body.reply) {
      replyInChunks(replier, body.reply);
    }
  } catch (error) {
    return;
  }
}
