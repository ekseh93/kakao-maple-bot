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

    if (body.reply) {
      replier.reply(body.reply);
    }
  } catch (error) {
    void error;
    return;
  }
}
