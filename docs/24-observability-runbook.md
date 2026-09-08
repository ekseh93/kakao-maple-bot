# 익명 통계 운영 관측 런북

이 문서는 운영 중인 Lambda의 익명 명령어 통계를 검토 가능한 형태로 추출하는 절차를 설명합니다. 이 작업은 관측 자료를 만드는 절차이며, 배포·성능 개선·가용성 달성을 의미하지 않습니다.

## 관측 범위

Lambda가 기록하는 `anonymous-command-usage` 이벤트에는 도쿄 기준 날짜, 내부 명령어 이름, 결과(`success`·`error`·`bypass`), 캐시 상태, 응답 시간과 제한된 provider 분류가 포함됩니다.

다음 값은 기록·공개 대상이 아닙니다.

- 카카오톡 방 이름·방 ID·발신자 닉네임·발신자 ID
- 메시지 원문·캐릭터 닉네임·API 키·토큰
- request ID가 남아 있는 원본 로그

`!통계`의 DynamoDB 누적 카운터와 CloudWatch 기간별 통계는 서로 다른 값입니다. 전자는 테이블 생성·배포 이후의 누적 수이고, 후자는 선택한 로그 기간의 집계입니다.

## 1. 사전 확인

운영 담당자는 승인된 AWS SSO 프로필로만 읽기 작업을 수행합니다. 프로필 이름과 실제 리전은 로컬 설정에서 확인하며, 문서나 로그에 자격 증명을 출력하지 않습니다.

```powershell
aws sso login --profile <approved-profile>
aws sts get-caller-identity --profile <approved-profile>
```

`get-caller-identity` 결과가 예상 계정·역할인지 확인한 뒤 다음 단계로 진행합니다. SSO가 만료되었거나 계정이 다르면 중단합니다.

## 2. 원본 로그 임시 추출

Lambda 기본 로그 그룹은 `/aws/lambda/<project-name>` 형식입니다. 아래 예시는 최근 24시간만 조회하며, 출력 파일은 저장소 밖의 임시 경로에 둡니다.

```powershell
$logGroup = '/aws/lambda/<project-name>'
$fromMs = [DateTimeOffset]::Now.AddHours(-24).ToUnixTimeMilliseconds()
$toMs = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$rawPath = Join-Path ([System.IO.Path]::GetTempPath()) 'usage-export.jsonl'

aws logs filter-log-events `
  --profile <approved-profile> `
  --region ap-northeast-1 `
  --log-group-name $logGroup `
  --start-time $fromMs `
  --end-time $toMs `
  --filter-pattern '"anonymous-command-usage"' `
  --output json | Set-Content -Encoding utf8 $rawPath
```

원본 파일은 공유·커밋하지 않습니다. 기간이 길면 하루 단위로 나누고, 필요 기간이 아닌 원본은 즉시 삭제합니다.

## 3. 로컬에서 정제·집계

저장소의 [집계 스크립트](../scripts/aggregate-usage.mjs)는 JSONL과 CloudWatch envelope 안의 JSON을 읽고, 허용된 필드·날짜·결과·응답 시간만 남깁니다. 잘못된 레코드는 폐기하며 발견값 자체를 오류 메시지로 출력하지 않습니다.

```powershell
$reportPath = Join-Path ([System.IO.Path]::GetTempPath()) 'command-usage-report.json'
pnpm usage:aggregate -- `
  --input $rawPath `
  --output $reportPath
```

집계 산출물에는 날짜별 호출 수, 명령어별 호출 수, 결과별 수, 평균·P50·P95·최대 응답 시간이 포함됩니다. 실제 운영 산출물을 공개할 때는 먼저 아래 점검을 통과해야 합니다.

```powershell
Get-Content -Raw $reportPath | Select-String -Pattern 'room|sender|nickname|token|secret|message' -CaseSensitive:$false
```

출력된 항목이 있으면 공개를 중단하고 원인을 확인합니다. 이 검색은 보조 점검이며, 집계 스크립트의 허용 필드 검증을 대체하지 않습니다.

## 4. 공개 여부 검토

운영 통계를 포트폴리오에 공개할 때는 다음을 모두 확인합니다.

1. `sample: false`인지, 실제 집계 기간과 생성 시각이 기록되어 있는지 확인합니다.
2. 집계 전 원본 로그와 request ID가 산출물에 남지 않았는지 확인합니다.
3. 방·발신자·메시지·캐릭터를 식별할 수 있는 값이 없는지 확인합니다.
4. 호출량이 사용자의 전체 활동량이나 서비스 품질을 대표한다고 쓰지 않습니다.
5. P95·오류율·가용성을 주장할 경우 측정 기간, 분모, 제외 규칙을 함께 기록합니다.
6. 운영 자료와 [고정 가상 샘플](portfolio/command-usage.sample.json)을 분리합니다.

실제 운영 통계는 자동으로 GitHub에 push하지 않습니다. 공개가 필요하면 정제 결과를 별도 검토하고, 대상 커밋과 근거 기간을 PR에 남깁니다.

## 실패 시 처리

- SSO 만료·권한 오류: 재로그인 전에 계정과 역할을 확인하고, 권한 확대를 임의로 요청하지 않습니다.
- 로그 그룹·기간 오류: 명령을 반복하기 전에 대상 리전·함수명·기간을 재확인합니다.
- JSON 파싱·필드 검증 실패: 원본을 공개하지 않고 집계 결과에서 해당 레코드를 제외합니다.
- 개인정보 포함 의심: 산출물과 임시 원본을 폐기하고 보안 검토를 먼저 진행합니다.

이 런북은 저장소 검증, AWS 관측, 공기계 E2E를 분리합니다. AWS 명령을 실행하지 않은 상태에서는 운영 통계나 성능을 확인했다고 기록하지 않습니다.
