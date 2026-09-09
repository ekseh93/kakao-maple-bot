package com.kakaomaple.bot

import android.app.Notification
import android.app.Notification.Action
import android.app.PendingIntent
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.text.TextUtils
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.Executors

class KakaoNotificationService : NotificationListenerService() {
    private val worker = Executors.newSingleThreadExecutor()
    private var lastRoom = ""
    private var lastAction: Action? = null
    private var lastSlot = ""

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName != "com.kakao.talk") return
        val extras = sbn.notification.extras ?: return
        val room = extras.getString(Notification.EXTRA_TITLE) ?: return
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: return
        if (Config.room(this).isBlank() || room != Config.room(this)) return
        lastRoom = room
        lastAction = findReplyAction(sbn.notification)
        if (text.trim().startsWith("!")) worker.submit { requestReply(room, text) }
    }

    override fun onListenerConnected() {
        Thread { while (!isDestroyed) { sendScheduled(); Thread.sleep(30000) } }.start()
    }

    private fun findReplyAction(notification: Notification): Action? = notification.actions?.firstOrNull { action -> action.remoteInputs?.isNotEmpty() == true }

    private fun requestReply(room: String, message: String) {
        val endpoint = Config.endpoint(this); val secret = Config.secret(this)
        if (endpoint.isBlank() || secret.isBlank() || lastAction == null) return
        try {
            val connection = URL("$endpoint/v1/messages").openConnection() as HttpURLConnection
            connection.requestMethod = "POST"; connection.connectTimeout = 15000; connection.readTimeout = 15000
            connection.setRequestProperty("Authorization", "Bearer $secret"); connection.setRequestProperty("Content-Type", "application/json"); connection.doOutput = true
            val payload = JSONObject().put("eventId", System.currentTimeMillis().toString()).put("roomId", room).put("message", message).toString()
            connection.outputStream.use { it.write(payload.toByteArray()) }
            if (connection.responseCode != 200) return
            val reply = JSONObject(connection.inputStream.bufferedReader().readText()).optString("reply")
            if (reply.isNotBlank()) sendWithAction(reply)
        } catch (_: Exception) { }
    }

    private fun sendWithAction(message: String) {
        val action = lastAction ?: return; val input = action.remoteInputs?.firstOrNull() ?: return
        val fill = Bundle().apply { putCharSequence(input.resultKey, message) }
        val intent = Intent().addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        android.app.RemoteInput.addResultsToIntent(arrayOf(input), intent, fill)
        try { action.actionIntent.send(this, 0, intent) } catch (_: PendingIntent.CanceledException) { }
    }

    private fun sendScheduled() {
        if (lastAction == null || lastRoom.isBlank()) return
        val now = ZonedDateTime.now(ZoneId.of("Asia/Seoul")); val minute = now.minute
        val weekly = now.dayOfWeek.value == 3 && ((now.hour == 18 && minute == 0) || (now.hour == 22 && minute in listOf(0, 30, 38, 42, 48)) || (now.hour == 23 && minute == 0))
        val test = (now.hour == 23 && minute in listOf(0, 3, 6, 9, 12, 15, 18, 20))
        if (!weekly && !test) return
        val slot = "${now.toLocalDate()}-${now.hour}:$minute"
        if (slot == lastSlot) return
        sendWithAction("★보스☆수로☆ 플래그★"); lastSlot = slot
    }
}
