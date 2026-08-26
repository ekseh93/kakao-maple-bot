# ADR-001: 공기계 개인 계정 릴레이

상태: Accepted  
일자: 2026-08-26

## 배경

사용자는 별도 Android 공기계와 카카오 계정을 사용해 일반 채팅방에서 답하는 봇을 원합니다. Kakao OpenBuilder는 공식 채널형 챗봇에는 적합하지만 이 사용자 경험과 동일하지 않습니다.

## 결정

MVP는 MessengerBot R v40 알림 기반 릴레이를 사용합니다. Kakao Developers/OpenBuilder 템플릿은 사용하지 않습니다.

## 결과

장점:

- 사용자가 원하는 일반 계정 채팅 경험
- 기존 MessengerBot R 사례와 문서 활용
- 공기계 한 대로 시작 가능

위험:

- Kakao가 공식 지원한 일반 계정 봇 경로가 아님
- 계정·메시지 제한 가능성
- Android·Kakao 업데이트와 절전 정책 영향

완화:

- 제한된 동의 기반 방
- 명령에만 수동적 응답
- rate limit과 kill switch
- 광고·대량 발송·초대 기능 금지

계정 위험을 수용할 수 없게 되면 공식 Kakao 채널/OpenBuilder 방식으로 제품 경험을 재설계합니다.

