// MessengerBot R v40 relay. Keep business rules in AWS Lambda.
// Replace only sharedSecret on the phone. Never commit the real value.
var CONFIG = {
  endpoint: 'https://zbzdl5d4tk.execute-api.ap-northeast-1.amazonaws.com',
  sharedSecret: ''
};

// MessengerBot R passes: room, message, sender, isGroupChat, replier, imageDB, packageName.
// eslint-disable-next-line no-unused-vars
function response(room, message, sender, isGroupChat, replier, imageDB, packageName) {
  if (typeof message !== 'string' || message.trim().charAt(0) !== '!') return;
  if (!CONFIG.endpoint || !CONFIG.sharedSecret) return;
  var eventId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    var result = org.jsoup.Jsoup.connect(CONFIG.endpoint + '/v1/messages')
      .header('Authorization', 'Bearer ' + CONFIG.sharedSecret)
      .header('Content-Type', 'application/json')
      .requestBody(
        JSON.stringify({
          eventId: eventId,
          roomId: room,
          senderId: sender,
          message: message,
          sentAt: new Date().toISOString()
        })
      )
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .timeout(4500)
      .method(org.jsoup.Connection.Method.POST)
      .execute();
    if (result.statusCode() !== 200) return;
    var body = JSON.parse(result.body());
    if (body.reply) replier.reply(body.reply);
  } catch (error) {
    void error;
    return; /* Network failures are intentionally silent to avoid duplicate replies. */
  }
}
