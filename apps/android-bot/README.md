# Kakao Maple Bot Android

MessengerBot R 스크립트 대신 사용하는 고정형 Android 릴레이 앱입니다.

현재 범위:

- 카카오톡 알림에서 `!` 명령을 감지해 AWS `/v1/messages`로 전달
- 백엔드 `reply`를 카카오톡 알림의 답장 액션으로 전송
- 서울 시간 수요일 리마인더와 당일 테스트 슬롯
- endpoint·shared secret·허용 방을 앱 설정에 저장하며 저장소에는 넣지 않음

이 앱은 카카오톡 공식 봇 API가 아닙니다. Android Notification Listener와 카카오톡 알림의 답장 액션에 의존하므로, 알림 접근 권한·배터리 최적화 제외·카카오톡 알림 표시가 필요합니다. 대상 방의 최근 알림이 없어 답장 액션이 없으면 예약 발신을 수행할 수 없습니다.

Android Studio에서 `apps/android-bot`을 열고 SDK 35로 빌드합니다. 이 환경에는 Android SDK가 없어 APK 빌드는 아직 검증하지 않았습니다.
