了解！ご要望を反映して “agents.md v0.2（JS版）” をまとめました。まずはこれでUI実装の土台を固めて、次ステップで雛形コードを書き出します。

⸻

agents.md (v0.2, JavaScript版)

0. プロジェクト概要
	•	目的: 教師研修向けロールプレイUIの検証（3Dモデル＋チャット）。
	•	今回の範囲: UI/レイアウト・アクセシビリティ検証。API連携・採点ロジックはダミー。
	•	主要技術: React 18, Vite, JavaScript（型なし）, Chakra UI, three.js, @pixiv/three-vrm（VRMはユーザー提供のサンプル想定）, Zustand, React Router。
	•	非目標: 本番API（OpenAI/tts/ollama）, Node.js 接続, DB/本認証, 実採点。

1. レイアウト方針（レスポンシブ）
	•	PC/タブレット横: 3ペイン常時表示（左=シチュエーション / 中央=3D / 右=チャット）。
	•	スマホ/タブレット縦: 中央の3Dを最大化。左・右はドロワー/モーダルで開閉（ボタンで表示）。
	•	ブレイクポイント目安:
	•	≥ 1024px: 3ペイン固定表示
	•	768–1023px: 3ペイン（右はやや狭め）
	•	≤ 767px: 中央フル、左右は Drawer/Modal

2. 画面/コンポーネント

/src
  /components
    AppHeader.jsx
    AppFooter.jsx
    SidebarScenario.jsx         // 開始前のみ操作可（開始後はロック）
    VrmStage.jsx                // VRM表示＋擬似リップシンクUI
    ChatPanel.jsx               // 履歴＋入力（音声ボタンはダミー）
    AuthDummy.jsx               // ログイン/ログアウト/サインアップUIだけ
    TutorialDrawer.jsx          // 使い方
    ScorePerUtterance.jsx       // 1行ごとの採点結果ダミー表示（複合方式）
    ScoreSummary.jsx            // セッション全体の採点サマリー（ダミー）
    ProgressDashboard.jsx       // アカウントのスコア推移（ダミーチャート風UI）
    ResponsiveOverlays.jsx      // スマホのドロワートリガー群（設定/履歴）
  /features
    scenarios.js                // モックデータ（3〜5件）
    chatMock.js                 // 擬似応答
    scoringMock.js              // ベクトル内積＋チェックリスト“風”のダミー結果
  /store
    useAppStore.js              // { started, currentScenarioId, messages[], scores[] ... }
  /routes
    Root.jsx
  /theme
    index.js                    // Chakra テーマ
  main.jsx
  App.jsx

SidebarScenario.jsx
	•	開始前: シナリオ一覧→詳細→「この状況で開始」。
	•	開始後: 操作ロック（戻れない）。Reset は二重確認ダイアログ（「全履歴が消えます」）の上でのみ実行可。

VrmStage.jsx
	•	VRM読込：ユーザー提供のサンプル/既定モデル。
	•	OrbitControls、表情プリセット、擬似リップシンク（スライダで A/I/U/E/O 形状）。
	•	FPS/状態インジケータ小表示。

ChatPanel.jsx
	•	履歴（ユーザー/キャラ、時刻、ScorePerUtteranceを行ごとに下添え）。
	•	送信→chatMock.reply()→履歴追従スクロール。
	•	音声入力ボタン（UIのみ、録音中ダミー状態トグル）。
	•	下部にScoreSummary（今回セッションの暫定スコア）。

ProgressDashboard.jsx
	•	アカウント別のスコア推移（ライン/スパークライン風のダミー）。
	•	履歴セッション一覧（日時/シナリオ/総合評価）。

3. 状態・ルール
	•	started（boolean）: true以降は SidebarScenario をロック。
	•	messages[]: { id, role, text, timestamp, score }
	•	scores[]: { messageId, vectorScore, checklistScore, total }（UIダミー生成）
	•	resetSession() は確認ダイアログ必須。

4. アクセシビリティ（ARIA 反映）
	•	基本: まず意味論的HTML、足りない部分をARIAで補完。
	•	Drawer/Modal は role="dialog" + aria-modal="true"、ヘッダに aria-labelledby。
	•	チャット新着は aria-live="polite" のリージョンに挿入。
	•	重要でない装飾は aria-hidden="true"。
	•	フォーカストラップ（モーダル内Tab移動）/ Escで閉じる。
	•	参考: MDN/ARIA概要・使い方、W3C WAI-ARIA 概要/仕様。 ￼

5. エージェント定義（Codex CLI）
	•	Agent A: レイアウト/Chakra
	•	出力: App.jsx, AppHeader.jsx, AppFooter.jsx, ResponsiveOverlays.jsx, テーマ。
	•	ルール: ブレイクポイント実装、スマホは中央最大＋左右Drawer、PCは3ペイン固定。
	•	Agent B: 3D/VRM
	•	出力: VrmStage.jsx。VRMローダ、Orbit、擬似リップシンクUI。
	•	ルール: 外部TTS/音声解析の差し替え口（setViseme(type)）を用意。
	•	Agent C: チャット
	•	出力: ChatPanel.jsx, chatMock.js。Enter送信/Shift+Enter改行、自動スクロール。
	•	ルール: 受信時に scoringMock.score(message) を呼び、結果を行下にレンダ。
	•	Agent D: データ
	•	出力: scenarios.js。{ id, title, description, actors[], goals[], rubric[], sampleOpenings[] } を用意。
	•	Agent E: 採点UI
	•	出力: ScorePerUtterance.jsx, ScoreSummary.jsx, ProgressDashboard.jsx, scoringMock.js。
	•	ルール: ベクトル内積“風”数値＋チェックリスト（挨拶/傾聴/確認/説明/締め）を合算したダミーを描画。説明の根拠ラベルも見せる。

6. 受け入れ基準（更新）
	•	起動: npm run dev でビルドエラーなし、JSで動作。
	•	レイアウト:
	•	≤ 767px（スマホ）: 3Dビューが全幅/最大表示。設定/チャットはボタン→ドロワー/モーダルでアクセス。
	•	768–1023px（タブ縦/小型PC）: 3ペインが破綻なく配置（右ペインは最小幅確保）。
	•	≥ 1024px（PC/MacBook/Windows）: 左（~280px）/中央（フレキシブル）/右（~420px）が常時表示。
	•	いずれの幅でもスクロール/折返し/隠れ UI が発生しないこと。
	•	開始ロック: 「開始」後は SidebarScenario の選択系が無効／見た目もロック表示。Reset は二重確認のうえでのみ可能。
	•	3D: Orbit可、擬似リップシンクUIで見た目が変化。
	•	チャット: 送信→擬似応答→行ごとの採点UIが出る（ベクトル/チェックリスト/合算）。
	•	ダッシュボード: 直近セッションのスコア推移モックが表示。
	•	A11y: ARIA属性・フォーカストラップ・aria-live等が機能。キーボードのみで主要操作可能。
	•	デバイス: iPhone/Android/ iPad/PC（Windows/Mac）の想定ビューポートで崩れなし。

7. プロンプト（共通）

あなたはReact/Chakra/three.jsに精通したフロントエンド開発者です。
今回はJavaScriptで実装します（TypeScript禁止）。UIとアクセシビリティに集中し、
API連携や採点計算はダミーで表現します。開始後はシナリオ側をロックしてください。
スマホでは中央3D最大、左右はドロワ/モーダル。PCでは3ペイン常時表示。

8. 将来拡張（メモ）
	•	OpenAI TTS + 4o / ollama gemma3:4b 統合、Node接続、実採点、永続化。

