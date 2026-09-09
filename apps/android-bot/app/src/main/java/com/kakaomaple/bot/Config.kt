package com.kakaomaple.bot

import android.content.Context

object Config {
    private const val PREF = "bot_config"
    fun endpoint(c: Context) = c.getSharedPreferences(PREF, 0).getString("endpoint", "") ?: ""
    fun secret(c: Context) = c.getSharedPreferences(PREF, 0).getString("secret", "") ?: ""
    fun room(c: Context) = c.getSharedPreferences(PREF, 0).getString("room", "") ?: ""
    fun save(c: Context, endpoint: String, secret: String, room: String) = c.getSharedPreferences(PREF, 0).edit().putString("endpoint", endpoint.trim()).putString("secret", secret.trim()).putString("room", room.trim()).apply()
}
