// MessengerBot R v40 relay. Keep business rules in AWS Lambda.
const CONFIG = typeof BOT_CONFIG === 'object' ? BOT_CONFIG : { endpoint: '', sharedSecret: '' };

// eslint-disable-next-line no-unused-vars
function response(room, sender, message) {
  if (typeof message !== 'string' || message.trim().charAt(0) !== '!') return;
  if (!CONFIG.endpoint || !CONFIG.sharedSecret) return;
  const eventId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    const result = org.jsoup.Jsoup.connect(CONFIG.endpoint + '/v1/messages')
      .header('Authorization', 'Bearer ' + CONFIG.sharedSecret)
      .header('Content-Type', 'application/json')
      .requestBody(
        JSON.stringify({
          eventId,
          roomId: room,
          senderId: sender,
          message,
          sentAt: new Date().toISOString(),
        }),
      )
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .timeout(4500)
      .method(org.jsoup.Connection.Method.POST)
      .execute();
    if (result.statusCode() !== 200) return;
    const body = JSON.parse(result.body());
    if (body.reply) replier.reply(body.reply);
  } catch (error) {
    void error; /* Network failures are intentionally silent to avoid duplicate/noisy replies. */
  }
}
