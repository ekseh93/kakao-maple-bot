# Portfolio verification / 検証範囲

Review date: 2026-09-08. Tracking: [Issue #10](https://github.com/ekseh93/kakao-maple-bot/issues/10).

## Source and evidence

| Layer                       | Evidence                                                                                                           | Meaning                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Reviewed baseline           | [PR #9](https://github.com/ekseh93/kakao-maple-bot/pull/9), main commit `c57eb1415cae9e30768ff359e9de482b5ee8a82f` | Previously reviewed and merged source                                                       |
| Follow-up snapshot          | `d77fbd785a4181fce6b9ceb5bf3a2563756563eb`, 13 commits ahead of the baseline                                       | Existing work imported as a snapshot; its private literals are removed before integration   |
| Reproduced failure          | [CI run 34077121100](https://github.com/ekseh93/kakao-maple-bot/actions/runs/34077121100)                          | Formatting failed; later tests/build were skipped in that run                               |
| Local regression checks     | 196 Vitest tests: core 68, providers 56, Lambda 72                                                                 | Includes private-configuration default-deny and optional air-quality body/error regressions |
| Remote checks               | Follow the PR linked from Issue #10 and its Checks tab                                                             | Only a completed successful run for the reviewed revision is a pass                         |
| Historical AWS observations | [Change log](14-change-log.md)                                                                                     | Prior deployment records, not fresh observations during this review                         |
| Device                      | [E2E checklist](16-phone-e2e-checklist.md), [Issue #7](https://github.com/ekseh93/kakao-maple-bot/issues/7)        | Use is user-confirmed; independent recovery/24-hour checks remain open                      |

The test count is a dated local observation, not a permanent badge or a production success-rate measurement. CI logs are the revision-specific source for later test totals.

## Integration choices

- Start a new branch from main, import the follow-up snapshot, then sanitize and review the resulting files. Existing branches are not rewritten.
- Preserve the optional private command through `PRIVATE_COMMAND_SENDER` and `PRIVATE_COMMAND_REPLY`. Empty configuration returns no reply.
- Supply these values privately during a separately approved deployment. Terraform exposes sensitive variables `private_command_sender` and `private_command_reply`; this review does not populate them or update production.
- Private display-name matching is not strong identity authentication.
- Existing public branch history may still contain prior identity/content literals. Sanitizing the new snapshot does not remove them from that history. History rewriting and credential rotation are separate operations.
- The CloudFormation deployment helper is a legacy alternative and needs parameter reconciliation before use; the integration does not certify both deployment paths.

## 検証の読み方

「テスト成功」「AWSでの確認」「端末での利用確認」は別の証拠です。今回の文書・CI改善で本番へデプロイしたとは説明しません。AI支援によるコード生成と、要件判断・レビュー・実行した検証も区別します。

画像は編集された説明資料、匿名統計のsample JSONは仮想データです。画像やsampleの数値を稼働実績として引用しません。キャッシュは実行環境内のメモリであり、分散キャッシュの実績を示すものではありません。

## Follow-up priorities

1. Finish device recovery and bounded-duration reliability checks in Issue #7.
2. Measure latency/error ratios with anonymized logs before reporting performance improvements.
3. Add a credential-free Japanese fixture demo if recruiter access remains a practical obstacle.
4. Reconcile deployment tooling and record approved releases with source revision and smoke-test results.

These are pending tasks, not completed portfolio claims.
