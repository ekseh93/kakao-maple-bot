# MessengerBot R relay

`bot.js`는 MessengerBot R v40에서 명령어를 AWS Lambda/API Gateway endpoint로 전달하고, Lambda의 `reply`를 한 번만 전송하는 얇은 릴레이입니다.

실제 엔드포인트와 공유 비밀은 저장소에 넣지 않습니다. 앱 내부의 비공개 설정에서 다음 형태로 주입합니다.

```javascript
const BOT_CONFIG = {
  endpoint: 'https://your-api-id.execute-api.ap-northeast-1.amazonaws.com',
  sharedSecret: '지정된-비밀값',
};
```

실제 URL·비밀·카카오 식별자는 커밋하지 않습니다. 릴레이는 `!`로 시작하지 않는 메시지, 설정되지 않은 릴레이, 비정상 HTTP 응답에 답하지 않습니다. 명령 계산·API 호출·메뉴 데이터는 Lambda backend에만 둡니다.

공기계 설치와 MessengerBot R 앱 컴파일은 실제 기기와 사용자 승인 후 운영 런북에 따라 별도로 검증합니다.
