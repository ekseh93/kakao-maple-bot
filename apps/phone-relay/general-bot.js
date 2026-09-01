// MessengerBot R v40 relay for the separate general-purpose bot.
// MapleStory commands are blocked by the dedicated backend service.
// Keep the real sharedSecret on the phone only; never commit it.
var CONFIG = {
  endpoint: 'REPLACE_WITH_GENERAL_BOT_API_URL',
  sharedSecret: 'REPLACE_ON_PHONE_ONLY',
  allowedRooms: ['YOUR_CONSENTED_ROOM_NAME']
};

function isAllowedRoom(room) {
  return CONFIG.allowedRooms.indexOf(room) !== -1;
}

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

// MessengerBot R passes: room, message, sender, isGroupChat, replier, imageDB, packageName.
// eslint-disable-next-line no-unused-vars
function response(room, message, sender, isGroupChat, replier, imageDB, packageName) {
  if (typeof message !== 'string' || message.trim().charAt(0) !== '!') return;
  if (!CONFIG.endpoint || !CONFIG.sharedSecret || !isAllowedRoom(room)) return;

  var eventId = Date.now().toString(36) + Math.random().toString(36).slice(2);

  try {
    var payload = JSON.stringify({
      eventId: eventId,
      roomId: room,
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
    if (body.reply) replyInChunks(replier, body.reply);
  } catch (error) {
    void error;
    return;
  }
}
