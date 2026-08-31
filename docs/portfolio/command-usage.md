# 익명 명령어 사용 통계

이 기능은 Lambda 요청마다 `anonymous-command-usage` 구조화 로그를 CloudWatch에 남깁니다. 기록 필드는 도쿄 기준 날짜, 내부 명령어 이름, 성공·실패·무시 결과, 캐시 상태, 응답 시간뿐입니다.

실행 중인 봇의 간단한 누적 횟수는 `!통계`로 확인합니다. 이 값은 DynamoDB의 `TOTAL` 단일 항목에 원자적으로 증가시키며, 통계를 추가하기 전의 과거 호출을 자동으로 복원하지 않습니다. 누적 카운터는 해당 DynamoDB 테이블이 배포된 시점부터 시작합니다.

다음 정보는 기록하지 않습니다.

- 카카오톡 방 이름과 방 ID
- 발신자 닉네임과 발신자 ID
- 메시지 원문, 캐릭터 닉네임, API 키, 토큰

## 로컬 집계

CloudWatch에서 감사 로그 JSON 또는 CloudWatch Logs export JSONL을 내려받은 뒤, 저장소에 넣지 않은 임시 경로에서 집계합니다.

```powershell
pnpm usage:aggregate -- --input .\usage-export-2026-08.jsonl --output .\artifacts\usage\command-usage-2026-08.json
```

집계 결과에는 날짜별 총 호출 수, 명령어별 호출 수, 성공·실패·무시 수, 평균·P50·P95·최대 응답 시간만 남습니다. `artifacts/usage/`와 `usage-export*.jsonl`은 Git에서 무시됩니다.

검토 후 포트폴리오에 공개할 때는 집계 JSON만 별도 커밋합니다. 실제 운영 통계는 자동으로 GitHub에 푸시하지 않습니다. GitHub 토큰을 Lambda에 넣지 않아 비밀 관리 범위와 외부 쓰기 위험을 줄였습니다.

## 포트폴리오 샘플

```powershell
pnpm usage:sample
```

위 명령은 실제 대화에서 추출하지 않은 고정 가상 데이터로 [command-usage.sample.json](./command-usage.sample.json)을 생성합니다. 파일의 `sample: true` 필드로 실제 운영 데이터와 구분합니다.
