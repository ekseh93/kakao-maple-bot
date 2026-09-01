# Issue・PR・レビュー運用

この文書は、KakaoTalkやゲームの知識がなくても、採用担当者が「問題をどう定義し、変更をどう検証したか」を追跡できるようにするための開発フローです。

```text
Issue
  ↓ problem / acceptance criteria / evidence boundary
Branch (`codex/issue-N-short-name`)
  ↓ focused implementation and documentation
Draft PR (`Closes #N`)
  ├─ deterministic CI: format / policy / audit / lint / typecheck / test / build
  └─ advisory AI review: architecture / risk / missing cases
        ↓ author evaluates and responds
Fix + re-run checks
  ↓
Squash merge to protected main
  ↓
Change log / troubleshooting / deployment evidence
```

## 1. Issueで先に決めること

- 問題と利用者への影響
- 対象範囲と非対象範囲
- 観測可能なacceptance criteria
- セキュリティ、個人情報、費用、外部provider規約のリスク
- repository、AWS、Android/KakaoTalkを分けた検証計画

実装済みの過去作業を後からIssue化して活動量を演出しません。新しい変更はIssueから開始し、途中で仮説が変わった場合はIssueまたはPRへ理由を残します。

## 2. Branchとcommit

- 1 Issueにつき1つのfocused branchを基本とします。
- branch名は `codex/issue-N-short-name`、commitは `type: short reason` を使います。
- unrelated changes、生成物、secret、実際のroom名、会話原文を同じcommitへ含めません。
- 大きな変更は、設計・実装・検証をレビュー可能な単位へ分割します。

## 3. Pull Request

PR本文は「変更ファイルの一覧」ではなく、問題、設計判断、trade-off、検証結果、残るリスクを説明します。完了時は `Closes #N` でIssueと接続します。

検証結果は次の3層を混同しません。

| Evidence layer | 例                                           | 言えること                  |
| -------------- | -------------------------------------------- | --------------------------- |
| Repository     | test、typecheck、build、policy check         | コードと静的契約が通過した  |
| AWS-observed   | API response、CloudWatch、deployment version | 指定したAWS境界で観測できた |
| User device    | Android relay、実KakaoTalk response          | 端末を含むE2Eで確認した     |

`/health`のHTTP 200だけを、端末を含むE2E成功とは扱いません。

## 4. CIとAI reviewの役割

- GitHub Actionsの`verify`はmerge判断の必須条件です。
- CodeRabbitは日本語の補助レビューとして、見落とし、境界条件、文書と実装の不一致を指摘します。
- AIコメントは自動的に正解とは扱いません。採用、修正、却下の判断と理由をPRへ残します。
- AI reviewをrequired checkにはせず、外部サービス障害で保守作業が停止しないようにします。
- secret、個人情報、非公開会話はissue、PR、AI reviewへ送信しません。

## 5. main branchの保護方針

- mainへの変更はPR経由
- `verify`成功とconversation解決を要求
- force pushとbranch deletionを禁止
- linear historyを維持し、原則squash merge
- 個人開発のため自己承認を形式的に要求せず、レビュー内容と検証証拠を重視

## 6. トラブルシューティングの残し方

障害は[トラブルシューティング記録](13-troubleshooting.md)のテンプレートで、症状、再現証拠、原因、修正、検証、再発防止、未確認範囲を記録します。Issue、PR、commit、deploymentが存在する場合だけ実リンクを追加し、存在しない過去リンクは作りません。

## 한국어 운영 요약

- 문제를 Issue로 먼저 정의하고, 완료 조건과 증거 범위를 적습니다.
- 하나의 작업 브랜치와 PR에서 해결하며 `Closes #N`으로 연결합니다.
- 기존 `verify` CI가 합격 기준이고, AI 리뷰는 누락 탐색을 돕는 보조 수단입니다.
- 리뷰 지적은 무조건 수용하지 않고 수용·수정·기각 판단과 이유를 PR에 남깁니다.
- 저장소 검사, AWS 관측, 사용자 기기 E2E를 서로 다른 증거로 기록합니다.
- 실제로 없었던 과거 Issue·PR 이력을 꾸며 만들지 않습니다.
