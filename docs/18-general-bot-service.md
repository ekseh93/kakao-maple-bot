# 별도 일반 기능 봇 서비스

## 목적

두 번째 공기계 MessengerBot R에서 메이플스토리 명령어를 제외한 기존 일반 기능만 제공하는 별도 서비스를 운영합니다. 기존 Maple Bot과 AWS 리소스·API URL·Terraform state·사용량 테이블·공기계 secret을 분리합니다.

## 제공 범위

- 일반 사칙연산·메소 수수료/n빵 계산기
- 가위바위보, 메뉴 선택, `!뭐먹지`
- 운세, 로또, 일본여행·여행 게시글·음식점, 넷플릭스·애니·만화·웹툰·웹소설
- 날씨, 주식, 환율, 유가·주유소, 다이소
- 누적 통계와 관리자 상태

`!보스`, `!시드링`, `!칠흑깡`, 캐릭터·장비·심볼·경험치·메이플 이벤트/게시판·메이플 캐시 미니게임 등 MapleStory 명령어는 `MAPLE_COMMANDS_ENABLED=false`에서 무응답 처리합니다. `!도움말`도 일반 기능만 표시합니다.

## 배포 구조

`infra/terraform-general`이 `infra/terraform` 리소스 모듈을 별도 상태로 호출하고, `project_name = "kakao-general-bot"`과 `MAPLE_COMMANDS_ENABLED=false`를 고정합니다. 새 서비스는 기존 Lambda를 덮어쓰지 않고 별도 Lambda, API Gateway, IAM role, DynamoDB 테이블을 생성합니다.

```text
apps/phone-relay/general-bot.js
        ↓ HTTPS + second-service Bearer secret
infra/terraform-general
        ↓ module ../terraform (maple_commands_enabled=false)
AWS Lambda kakao-general-bot + API Gateway + DynamoDB
```

## 배포 전 필수 입력

새 톡방의 정확한 이름과 두 번째 서비스 전용 `BOT_SHARED_SECRET`을 `infra/terraform-general/terraform.tfvars`에 로컬로 설정해야 합니다. 두 값은 Git에 커밋하지 않습니다. 별도 서비스 endpoint가 발급되면 `apps/phone-relay/general-bot.js`의 `endpoint`와 `allowedRooms`를 공기계에서 설정하고 MessengerBot R을 재로드합니다.

## 검증 계약

배포 전 `pnpm lambda:package`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm phone:check`를 실행합니다. 배포 후 `/health`, 일반 `!도움말`, `!계산기`, `!뭐먹지`를 확인하고, `!보스`가 무응답인지 별도로 확인합니다.
