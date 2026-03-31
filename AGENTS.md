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
	•	右上の Tutorial ボタンと左下のトレーニング終了ボタンはモバイルでも常に画面上に固定表示。
	•	トレーニング終了ボタンはデスクトップ/タブレットでも左下に固定表示（画面全幅で共通動線）。

2. 画面/コンポーネント

/src
  /components
    AppHeader.jsx
    AppFooter.jsx
    AuthDummy.jsx               // 最上部でログインを要求。未ログイン時は他コンポーネント非表示
    SidebarScenario.jsx         // 開始前のみ操作可（開始後はロック）
    VrmStage.jsx                // VRM表示＋擬似リップシンクUI
    ChatPanel.jsx               // 履歴＋入力（音声ボタンはダミー）
    TutorialDrawer.jsx          // 使い方。ログイン後に常時右上ボタンで呼び出し
    ScorePerUtterance.jsx       // 1行ごとの採点結果ダミー表示（複合方式）
    ScoreSummary.jsx            // セッション全体の採点サマリー（ダミー）
    ProgressDashboard.jsx       // 採点結果の下に表示されるアカウント推移（ダミーチャート風UI）
    ResponsiveOverlays.jsx      // スマホのドロワートリガー群（設定/履歴/終了ボタン）
  /features
    scenarios.js                // モックデータ（3〜5件）
    chatMock.js                 // 擬似応答
    scoringMock.js              // ベクトル内積＋チェックリスト“風”のダミー結果
  /store
    useAppStore.js              // { isAuthenticated, started, trainingEnded, currentScenarioId, messages[], scores[] ... }
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
	•	VRM読込：`public/models/sample.vrm` / `public/models/trial_2.vrm` / `public/models/young_counsil.vrm` を利用し、ステージ左下のアイコンボタンで順番に切り替える。
	•	`trial_2.vrm` と `young_counsil.vrm` の初期カメラ位置は `sample.vrm` と同じ値を使い、正面ポーズ時のみモデル別プリセットで調整する。
	•	OrbitControls、表情プリセット、擬似リップシンク（スライダで A/I/U/E/O 形状）。
	•	FPS/状態インジケータ小表示。
	•	Canvas は完全透明化し、背後に `public/vrm-bg-imgs/` の背景画像（縦/横/教室の3種）を同じ縦幅で重ねる。
	•	左下にモデル切替アイコン、右下に `RepeatIcon` の背景切替ボタンを重ね、どちらもバッジ類とはレイヤーをずらす。

ChatPanel.jsx
	•	履歴（ユーザー/キャラ、時刻、ScorePerUtteranceを行ごとに下添え）。
	•	送信→chatMock.reply()→履歴追従スクロール。
	•	音声入力ボタン（UIのみ、録音中ダミー状態トグル）。
	•	下部にScoreSummary（トレーニング終了後に表示される暫定スコア）。

AuthDummy.jsx
	•	ページアクセス時に最上部でログイン/サインアップ/ログアウトのダミーフローを提供。
	•	未ログイン状態では他の UI は表示しない（AuthDummy だけ見える）。
	•	ログイン完了後にメイン UI を展開し、TutorialDrawer ボタンを表示開始。

ProgressDashboard.jsx
	•	アカウント別のスコア推移（ライン/スパークライン風のダミー）。
	•	履歴セッション一覧（日時/シナリオ/総合評価）。
	•	ScoreSummary の下に配置し、セッション採点の流れで続けて閲覧できるようにする。
	•	メイン3ペインとは別領域（ページ下部）に表示。

TutorialDrawer.jsx
	•	画面右上に固定されたアイコンボタンで開閉。
	•	ログイン後に常時利用可能。
	•	開いた際は最前面（最大 z-index）でフォーカストラップを適用。

ScoreSummary.jsx
	•	チャット欄下部に配置し、トレーニング終了後に展開。
	•	vectorScore / checklistScore / total をまとめて提示。
	•	確認モーダルで「はい」を押した後にのみ見える。

ResponsiveOverlays.jsx
	•	モバイル時に以下の固定ボタンを提供:
		◦	左上: シナリオ Drawer。
		◦	右上: チャット Drawer。
		◦	右上最前面: TutorialDrawer アイコンボタン。
		◦	左下最前面: トレーニング終了ボタン（押下で確認モーダル）。
	•	トレーニング終了ボタン押下後に ScoreSummary / ProgressDashboard を表示する流れ。
	•	トレーニング終了ボタンは PC/タブレットでも画面左下に固定表示（共通コンポーネントで制御）。

3. 状態・ルール
	•	started（boolean）: true以降は SidebarScenario をロック。
	•	messages[]: { id, role, text, timestamp, score }
	•	scores[]: { messageId, vectorScore, checklistScore, total }（UIダミー生成）
	•	resetSession() は確認ダイアログ必須。
	•	isAuthenticated（boolean）: AuthDummy で true になるまで他 UI を表示しない。
	•	trainingEnded（boolean）: トレーニング終了ボタン押下で確認モーダル → true の後に採点サマリー/ダッシュボードを解放。

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
	•	ルール: ブレイクポイント実装、スマホは中央最大＋左右Drawer、PCは3ペイン固定。モバイル固定ボタン（シナリオ/チャット/チュートリアル/終了）配置。AuthDummy 前提の表示切替。
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
	•	ルール: ベクトル内積“風”数値＋チェックリスト（挨拶/傾聴/確認/説明/締め）を合算したダミーを描画。説明の根拠ラベルも見せる。ScoreSummary の下に ProgressDashboard を配置し、trainingEnded が true のときに表示。

6. 受け入れ基準（更新）
	•	起動: npm run dev でビルドエラーなし、JSで動作。
	•	ビルド: npm run build 実行時に /docs 配下へ成果物を書き出し（GitHub Pages 用）。
	•	デプロイ設定: Vite の base を https://igaki12.github.io/teacherSim-UI/ に合わせて調整（GitHub Pages）。
	•	レイアウト:
	•	≤ 767px（スマホ）: 3Dビューが全幅/最大表示。設定/チャットはボタン→ドロワー/モーダルでアクセス。
	•	768–1023px（タブ縦/小型PC）: 3ペインが破綻なく配置（右ペインは最小幅確保）。
	•	≥ 1024px（PC/MacBook/Windows）: 左（~280px）/中央（フレキシブル）/右（~420px）が常時表示。
	•	いずれの幅でもスクロール/折返し/隠れ UI が発生しないこと。
	•	Auth: ログイン完了までは AuthDummy のみ表示。他 UI は非表示。
	•	開始ロック: 「開始」後は SidebarScenario の選択系が無効／見た目もロック表示。Reset は二重確認のうえでのみ可能。
	•	トレーニング終了: 左下固定ボタン押下で確認モーダル。「これで採点してもよろしいですか？」に同意した後に ScoreSummary / ProgressDashboard を表示。
	•	モバイル固定導線: 左上シナリオ Drawer ボタン、右上チャット Drawer ボタン、右上チュートリアルアイコン、左下終了ボタンが常にアクセス可能。
	•	3D: Orbit可、擬似リップシンクUIで見た目が変化。
	•	3Dモデル切替: `sample.vrm` / `trial_2.vrm` / `young_counsil.vrm` をアイコンボタンで切り替えられ、追加モデルの初期カメラは `sample.vrm` と同じ位置で始まる。
	•	チャット: 送信→擬似応答→行ごとの採点UIが出る（ベクトル/チェックリスト/合算）。
	•	ダッシュボード: 採点サマリーの下に直近セッションのスコア推移モックが表示（trainingEnded 後）。
	•	A11y: ARIA属性・フォーカストラップ・aria-live等が機能。キーボードのみで主要操作可能。
	•	デバイス: iPhone/Android/ iPad/PC（Windows/Mac）の想定ビューポートで崩れなし。

7. プロンプト（共通）

あなたはReact/Chakra/three.jsに精通したフロントエンド開発者です。
今回はJavaScriptで実装します（TypeScript禁止）。UIとアクセシビリティに集中し、
API連携や採点計算はダミーで表現します。開始後はシナリオ側をロックしてください。
スマホでは中央3D最大、左右はドロワ/モーダル。PCでは3ペイン常時表示。

8. 将来拡張（メモ）
	•	OpenAI TTS + 4o / ollama gemma3:4b 統合、Node接続、実採点、永続化。
