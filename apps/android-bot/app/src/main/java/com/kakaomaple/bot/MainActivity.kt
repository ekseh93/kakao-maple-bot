package com.kakaomaple.bot

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val endpoint = EditText(this).apply { hint = "AWS endpoint"; setText(Config.endpoint(this@MainActivity)) }
        val secret = EditText(this).apply { hint = "shared secret"; setText(Config.secret(this@MainActivity)) }
        val room = EditText(this).apply { hint = "허용 방 이름"; setText(Config.room(this@MainActivity)) }
        val save = Button(this).apply { text = "저장"; setOnClickListener { Config.save(this@MainActivity, endpoint.text.toString(), secret.text.toString(), room.text.toString()) } }
        val permission = Button(this).apply { text = "알림 접근 권한 열기"; setOnClickListener { startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)) } }
        setContentView(LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; addView(endpoint); addView(secret); addView(room); addView(save); addView(permission) })
    }
}
