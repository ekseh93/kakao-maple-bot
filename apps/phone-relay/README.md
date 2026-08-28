# MessengerBot R relay

`bot.js`는 MessengerBot R v40에서 명령어를 AWS Lambda/API Gateway endpoint로 전달하고, Lambda의 `reply`를 한 번만 전송하는 얇은 릴레이입니다.

실제 엔드포인트와 공유 비밀, 카카오톡 방 이름은 저장소에 넣지 않습니다. 앱 내부의 비공개 설정에서 다음 형태로 주입합니다.

```javascript
const BOT_CONFIG = {
  endpoint: 'https://your-api-id.execute-api.ap-northeast-1.amazonaws.com',
  sharedSecret: '지정된-비밀값',
  fixedRoomName: '동의한-방-이름',
};
```

실제 URL·비밀·카카오 식별자는 커밋하지 않습니다. 한 개 방만 사용하는 레거시 MessengerBot R 콜백에서 `room` 값이 발신자 이름으로 잘못 들어오는 환경을 대비해, 요청의 `roomId`는 `fixedRoomName`으로 보냅니다. 이 값은 공기계의 비공개 복사본에서만 실제 방 이름으로 교체합니다. 릴레이는 `!`로 시작하지 않는 메시지, 설정되지 않은 릴레이, 비정상 HTTP 응답에 답하지 않습니다. 명령 계산·API 호출·메뉴 데이터는 Lambda backend에만 둡니다.

스크립트는 MessengerBot R이 실행 중일 때 하루 1회 `/health`를 확인합니다. 백엔드가 응답하지 않으면 `noticeRooms`에 설정된 공지 채팅방에 점검 메시지를 한 번 보냅니다. 또한 60초마다 `/v1/sunday-alert`를 확인해 새 썬데이 게시글이 생긴 경우 게시글 링크와 공식 PNG 링크를 각각 한 번씩 보냅니다. MessengerBot R에는 앱을 강제 종료·재실행하거나 컴파일/런타임 버튼을 자동 조작하는 공식 API가 없으므로, 이 watchdog은 자동 재시작 기능이 아닙니다. 앱이 종료되거나 Android가 백그라운드 실행을 중지한 경우에는 배터리 최적화 제외와 앱 실행 상태를 직접 확인해야 합니다.

공기계 설치와 MessengerBot R 앱 컴파일은 실제 기기와 사용자 승인 후 운영 런북에 따라 별도로 검증합니다.
