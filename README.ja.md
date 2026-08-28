# Kakao Maple Bot

[한국어 README](README.md) · [English README](README.en.md)

MessengerBot Rを実行する予備のAndroid端末をKakaoTalkの入口として利用する、個人用・非商用のポートフォリオ向けチャットボットです。MapleStoryの情報、シンボル計算、確率ベースのミニゲーム、各種おすすめ、天気、為替、ガソリン価格、読み取り専用の株価照会を提供します。

> 状態: Phase 0〜6の実装、自動検証、東京リージョンのAWSデプロイが完了しています。予備端末での運用はユーザーが確認した内容であり、CodexがAndroid端末のE2Eを独自に観測したものではありません。

## アーキテクチャ

```text
KakaoTalk
    ↕ Android通知・返信
予備端末上のMessengerBot R v40
    ↕ HTTPS + shared secret
API Gateway HTTP API
    ↓
AWS Lambda
    ├─ コマンドルーター
    ├─ Mapleアダプター ─ Nexon Open API
    ├─ 株価アダプター ─ Yahoo Finance / Tiingo
    ├─ 計算・乱数・メニュー
    └─ キャッシュ・タイムアウト・安全な監査ログ
```

端末側のスクリプトは薄い中継層に限定しています。コマンド規則、計算、キャッシュ、外部プロバイダー呼び出し、secretを利用した認証はTypeScript製Lambdaバックエンドで処理します。

## コマンドグループ

### MapleStory

`!정보 <ニックネーム>`, `!무릉 <ニックネーム>`, `!유니온 <ニックネーム>`, `!유챔 <ニックネーム>`, `!장비 <ニックネーム>`, `!경험치 <ニックネーム>`, `!심볼 <地域> <開始> <目標>`, `!심볼만렙`, `!보스`, `!보스보상`, `!보스렙뻥`, `!보스포뻥`, `!메카베리 <レベル>`, `!메포효율`, `!공지`, `!이벤트`, `!썬데이`, `!선데이`, `!인벤`, `!마빡도로시`, `!디코`を提供します。

MapleのキャラクターデータはNexon Open APIから取得します。Maple.GGとMaplescouterはリンク表示のみで、自動クロールや自動HTTPアクセスは行いません。

### ミニゲーム

`!부티크`, `!로얄`, `!원더베리`, `!루나스윗`, `!루나드림`, `!가위`, `!바위`, `!보`を提供します。

確率ベースのコマンドはシミュレーションのみです。キャッシュアイテムを購入・付与する機能ではありません。

### 一般機能

`!날씨 <地域>`, `!주식 <銘柄名>`, `!환율`, `!기름`, `!유가`, `!주유소 <地域>`, `!골라 <候補>`, `!뭐먹지`, `!ㅁㅁㅈ`, `!운세 <生年月日> <性別> <暦>`, `!로또`, `!넷플`, `!애니`, `!만화`, `!웹툰`, `!웹소설`, `!일본여행`, `!일본여행기`, `!일본음식점`, `!핫딜`, `!글카`, `!모니터`, `!금주의신상`, `!다이소 <商品>`, `!상태`を提供します。

`!주식`は情報提供のみで、注文・口座アクセスは行いません。`!운세`は生年月日、性別、暦、韓国標準時を使う決定的な娯楽機能であり、LLMやリモートの運勢MCPサーバーは呼び出しません。

## データ・安全ポリシー

- AWSリージョンは東京、`ap-northeast-1`に固定し、単一リージョンで費用管理の範囲を限定します。
- 個人用・無料枠を前提としたポートフォリオです。Free Tierは請求額ゼロを保証しないため、Budgetと利用量の監視が必要です。
- APIキー、shared secret、Kakao識別子、ルーム名、チャットログはGitにコミットしません。
- 公開掲示板の取得にはタイムアウト、キャッシュ、エラー分離、許可されたstale fallbackを使用します。プロキシ切替、IP変更、その他のアクセス制御回避は行いません。
- 端末リレーにはplaceholderのみを保存します。`sharedSecret`と同意済みルーム名のplaceholderは、非公開の端末コピーでのみ置き換えます。
- ユーザーの元のチャットスクリーンショットは公開リポジトリに含めません。

## ローカル開発

Node.js 22とpnpm 11を使用します。

```powershell
pnpm install --ignore-scripts
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm lambda:dry-run
pnpm format:check
pnpm policy:check
pnpm phone:check
pnpm audit
```

現在の検証結果はテスト149件が成功し、typecheck、lint、format、policy、端末スクリプト構文、Lambda dry-run、auditも成功しています。

## AWSデプロイ

AWS Lambda + API Gateway HTTP APIを使用し、純粋なCloudFormationとTerraformの設計を提供しています。SAM CLIは必須ではありません。Terraformの`plan`は確認手順であり、`apply`とデプロイには明示的な承認と有効なIAM Identity Center認証が必要です。

すべてのAWSリクエストは`ap-northeast-1`を対象にします。root ARNではなく、IAM Identity Centerのassumed roleを使用します。`terraform.tfvars`、APIキー、shared secretはGitの外で管理します。

過去に確認した`/health`と認証済みメッセージのsmoke testは別文書に記録しています。未観測の端末状態や新しいデプロイを、このREADMEで主張することはありません。

## ポートフォリオ証跡

- [個人情報を加工した韓国語の証跡画像](docs/assets/kakao-bot-evidence-redacted.png)
- [英語訳ポートフォリオ画像](docs/assets/kakao-bot-evidence-en.png)
- [日本語訳ポートフォリオ画像](docs/assets/kakao-bot-evidence-ja.png)
- [証跡と公開範囲](docs/17-portfolio-evidence.md)
- [トラブルシューティング記録](docs/13-troubleshooting.md)

英語・日本語画像は、表示用に作成した個人情報保護済みの翻訳・簡略化資料です。チャットボットのコマンドと応答の流れは示しますが、元のチャットログを正確にOCRした一次資料ではありません。

## ドキュメント

要件、アーキテクチャ、コマンド契約、APIポリシー、セキュリティ運用、テスト、リリースゲート、トラブルシューティング、端末E2Eチェックリストは[韓国語READMEのドキュメント一覧](README.md#문서)から確認できます。

## ライセンス

ライセンスは付与していません。別途ライセンスを追加するまでは、個人用・非商用のポートフォリオリポジトリです。
