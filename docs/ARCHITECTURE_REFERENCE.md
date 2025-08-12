# Eve プロジェクト - アーキテクチャリファレンス

## 🏗️ 詳細アーキテクチャ

### メインコンポーネント
1. **メインプロセス** (`src/main.ts` - 128行): Electronアプリの起動、コンポーネント統合、ライフサイクル管理
2. **データベース管理システム**: 
   - **DatabaseManager** (`src/database-manager.ts` - 約130行): 統合データベース管理（リファクタリング済み）
   - **DatabaseHealthChecker** (`src/database-health-checker.ts` - 68行): データベースヘルスチェック専用
   - **DatabaseBackupManager** (`src/database-backup-manager.ts` - 70行): バックアップ管理専用
   - **DatabaseLogger** (`src/database-logger.ts` - 92行): ログ出力専用
   - **MigrationManager** (`src/database-migration.ts` - 332行): マイグレーション自動実行
   - **MigrationConfig** (`src/database-migrations-config.ts` - 294行): スキーマ定義
3. **AIシステム**:
   - **AIManager** (`src/ai-manager.ts` - 142行): Google Gemini AI統合、LangGraph実装
   - **AIService** (`src/ai-service.ts` - 81行): AI処理サービス
   - **ConversationManager** (`src/conversation-manager.ts` - 114行): 会話履歴管理
4. **セッション管理**:
   - **SessionManager** (`src/session-manager.ts` - 81行): セッション状態管理、ID生成
   - **SessionStorage** (`src/session-storage.ts` - 204行): セッションデータ永続化
5. **セキュリティシステム** (`src/crypto-utils/` - リファクタリング済み): 多層暗号化、APIキー保護
   - **EncryptionKeyManager** (`src/crypto-utils/encryption-key-manager.ts` - 93行): 暗号化キー管理専用
   - **DataEncryption** (`src/crypto-utils/data-encryption.ts` - 29行): データ暗号化・復号化専用
   - **ApiKeyStorage** (`src/crypto-utils/api-key-storage.ts` - 392行): APIキー保存・管理専用
6. **通信層**:
   - **IPCハンドラーシステム** (`src/ipc-handlers/` - 9ファイル構成): モジュール化されたプロセス間通信管理
   - **プリロードスクリプト** (`src/preload.ts` - 116行): セキュアなフロントエンド-バックエンドAPI
7. **UI層**:
   - **ウィンドウマネージャー** (`src/window-manager.ts` - 185行): Electronウィンドウの作成と管理
   - **フロントエンド** (`src/chat.ts` - 484行): チャットUI統合オーケストレーター（リファクタリング済み）
   - **UI管理システム** (`src/ui-managers/` - 新規・8ファイル構成): 専門化されたUI管理クラス群
   - **初期設定UI** (`src/initial-setup.ts` - 283行): 初回起動時のセットアップウィザード
8. **設定管理**:
   - **SettingsManager** (`src/settings-manager.ts` - 255行): ユーザー設定と初期セットアップ状態管理
9. **HTMLファイル**: 
   - `chat.html` (992行): サイドバー付きチャットインターフェース（ハンバーガーメニュー、AI会話、セッション管理）
   - `initial-setup.html` (397行): 初期設定ウィザード画面

### 技術スタック詳細
```
フロントエンド: HTML + CSS + TypeScript + サイドバーUI
├── chat.html (992行): サイドバー付きメインチャットUI、ガラスモーフィズムデザイン
├── initial-setup.html (397行): 初期設定ウィザードUI
├── chat.ts (484行): チャットUI統合オーケストレーター（リファクタリング済み）
├── ui-managers/ (8ファイル): 専門化されたUI管理クラス群（新規・ESモジュール対応）
│   ├── sidebar-manager.ts: サイドバー開閉制御、ナビゲーション管理
│   ├── ui-element-manager.ts: DOM要素管理・イベント処理
│   ├── status-manager.ts: ステータス表示管理
│   ├── dialog-manager.ts: ダイアログ管理
│   ├── chat-manager.ts: チャット機能管理
│   ├── session-ui-manager.ts: セッションUI管理
│   ├── api-key-ui-manager.ts: APIキーUI管理
│   └── ui-state-manager.ts: UI状態管理
└── initial-setup.ts (283行): セットアップウィザードロジック

Electron IPC: プリロードスクリプトによるセキュアな通信
├── preload.ts (116行): セキュアAPI、型安全な通信インターフェース
├── initial-setup-preload.ts (21行): セットアップ専用API
├── ipc-handlers/ (9ファイル): モジュール化されたIPCハンドラーシステム
│   ├── ipc-handler-manager.ts: 統合管理、ハンドラー制御
│   ├── base-handler.ts: 基底クラス、共通機能
│   ├── api-key-handler.ts: APIキー管理専用
│   ├── session-handler.ts: セッション管理専用
│   ├── chat-handler.ts: チャット機能専用
│   ├── database-handler.ts: データベース管理専用
│   ├── initial-setup-handler.ts: 初期設定専用
│   ├── utility-handler.ts: ユーティリティ機能専用
│   └── index.ts: モジュールエクスポート
└── main.ts (128行): アプリ起動、コンポーネント統合

データベースシステム: SQLite + 自動マイグレーション（リファクタリング済み）
├── database-manager.ts (約130行): 統合管理（簡素化）
├── database-health-checker.ts (68行): ヘルスチェック専用
├── database-backup-manager.ts (70行): バックアップ管理専用
├── database-logger.ts (92行): ログ出力専用
├── database-migration.ts (332行): マイグレーション自動実行、ロールバック
├── database-migrations-config.ts (294行): スキーマ定義、バージョン管理
└── session-storage.ts (204行): セッションデータ永続化

AIシステム: LangChain + LangGraph + Google Gemini
├── ai-manager.ts (142行): AI統合、LangGraphワークフロー
├── ai-service.ts (81行): AI処理サービス
├── conversation-manager.ts (114行): 会話履歴管理
└── Google Gemini 1.5 Flash, 2.0 Flash モデル

セキュリティシステム: 多層暗号化（リファクタリング済み）
├── crypto-utils/ (モジュール化された暗号化システム)
│   ├── encryption-key-manager.ts (93行): 暗号化キー管理、Electron safeStorage連携
│   ├── data-encryption.ts (29行): crypto-js AES暗号化・復号化
│   ├── api-key-storage.ts (392行): APIキー保存・管理、SQLite連携
│   └── index.ts (23行): 統合エクスポート
├── crypto-utils.ts (20行): 後方互換性のためのre-exportファイル
└── Electron safeStorage + crypto-js AES連携

セッション管理: UUID + メタデータ
├── session-manager.ts (81行): セッション状態管理
└── 会話履歴、統計情報、カスタム名前付け

設定管理: 永続化設定システム
├── settings-manager.ts (255行): ユーザー設定、初期セットアップ管理
└── SQLiteベース設定保存、バリデーション

パッケージング: Electron Builder
├── Windows (NSIS)、macOS (DMG)、Linux (AppImage)
└── クロスプラットフォーム対応
```

## 🔄 データフロー

### 基本チャットフロー
```
1. ユーザー入力 (chat.html)
    ↓
2. フロントエンドJS (chat.ts) - UIイベント処理、入力検証
    ↓
3. プリロードAPI (preload.ts) - セキュアなIPC通信
    ↓
4. IPC通信 - プロセス間通信
    ↓
5. IPCハンドラーシステム (ipc-handlers/) - モジュール化されたルーティング、エラーハンドリング
    ↓
6. AIマネージャー (ai-manager.ts) - LangGraph + Gemini AI処理
    ↓
7. ConversationManager - 会話履歴管理
    ↓
8. SessionStorage - SQLite永続化
    ↓
9. レスポンス返却（逆順）
    ↓
10. UIアップデート (chat.ts) - メッセージ表示、状態更新
```

### データベース管理フロー
```
アプリ起動 → DatabaseManager初期化 → 自動マイグレーション実行 → ヘルスチェック
         ↓
マイグレーション実行 → トランザクション開始 → スキーマ変更 → バージョン記録 → コミット
         ↓
エラー発生時 → ロールバック → エラーログ → 安全な状態復帰
```

### セッション管理フロー
```
「新しい会話」ボタンクリック → 新しい会話モード開始 → 入力フィールド有効化
         ↓
最初のメッセージ送信 → セッション作成 → UUID生成 → SQLite初期化 → SessionManager登録
         ↓
メッセージ内容解析 → 動的セッション名生成 → セッション名更新 → UI更新
セッション切り替え → 履歴ロード → ConversationManager復元 → UI状態変更 → 会話復元
セッション削除 → 確認ダイアログ → SQLiteクリア → SessionManager更新 → UI更新
```

### セキュリティフロー
```
APIキー設定 → 入力検証 → ElectronSafeStorage暗号化 → crypto-js二次暗号化 → SQLite保存
APIキー取得 → SQLite読み込み → crypto-js復号化 → ElectronSafeStorage復号化 → 使用
```

## 🎨 デザインテーマ詳細

- **カラーパレット**: グラデーション（#667eea → #764ba2）
- **デザイン**: ガラスモーフィズム（blur + 半透明背景）
- **サイドバーナビゲーション**: ハンバーガーメニューによる左サイドバー
- **フォント**: Segoe UI、ヒラギノ角ゴ対応
- **レスポンシブ**: モバイル/タブレット/デスクトップ対応
- **UI要素**: 
  - ハンバーガーボタン：アニメーション付き3本線アイコン
  - サイドバー：スライドイン・アウト、背景ブラー
  - ボタン：丸角、ホバーエフェクト、トランジション
  - カード：backdrop-filter、境界線
  - モーダル：オーバーレイ、中央配置（自動イベントリスナー対応）
  - ステータス：色分け（成功：緑、エラー：赤、警告：オレンジ）
  - セッション一覧：クリック選択、ホバーエフェクト、アクティブ状態表示
  - 右クリックメニュー：コンテキストメニュー、削除オプション
- **アニメーション**: 
  - サイドバー開閉：スムーズなスライドトランジション
  - ハンバーガーアイコン：X字への変形アニメーション
  - fadeInUp：メッセージ表示時の上昇フェードイン
  - セッション選択：アクティブ状態のスムーズな切り替え

## 🧩 主要ファイルの詳細役割

### コアシステム
#### `src/main.ts` (128行)
- Electronアプリケーションの起動とライフサイクル管理
- 全コンポーネントの初期化と統合
- DatabaseManager、AIManager、SessionManagerの組み立て
- セキュリティ設定とハンドラー設定

#### `src/database-manager.ts` (約130行) - リファクタリング済み
- 複数データベースの統合管理（簡素化済み）
- 他のデータベース管理クラスの統合
- システム初期化と終了処理
- 開発用マイグレーション制御

#### `src/database-health-checker.ts` (68行) - 新規作成
- データベースヘルスチェック専用クラス
- 個別およびシステム全体の状態診断
- エラー状況の詳細分析
- 状態レポート生成

#### `src/database-backup-manager.ts` (70行) - 新規作成  
- データベースバックアップ専用クラス
- 全データベースおよび個別バックアップ
- バックアップファイル管理
- エラーハンドリングとレポート

#### `src/database-logger.ts` (92行) - 新規作成
- データベース関連ログ出力専用クラス
- 初期化、終了、マイグレーション、エラーログ
- 構造化されたログフォーマット
- デバッグ情報の整理

#### `src/database-migration.ts` (332行)
- マイグレーション自動実行システム
- トランザクション管理とロールバック機能
- スキーマバージョン管理
- エラーハンドリングと状態追跡

#### `src/database-migrations-config.ts` (294行)
- 全データベースのマイグレーション定義
- スキーマ変更履歴の管理
- 暗号化、APIキー、会話履歴データベース設定

### AIシステム
#### `src/ai-manager.ts` (142行)
- AI関連コンポーネントの統合管理
- Google Gemini AI の初期化とAPIキー管理
- LangGraphワークフローの設定
- セッション管理との連携
- 複数AIモデル対応（Gemini 1.5 Flash, 2.0 Flash）

#### `src/ai-service.ts` (81行)
- Google Gemini API との直接連携
- AIモデルの初期化とAPIキー設定
- ChatGoogleGenerativeAI インスタンス管理
- エラーハンドリングと回復処理

#### `src/conversation-manager.ts` (114行)
- 会話履歴の管理とメタデータ処理
- LangGraphワークフローの実行
- セッション統計情報の収集
- 会話検索とフィルタリング機能

### セッション・ストレージ
#### `src/session-manager.ts` (81行)
- セッション作成と管理
- 現在のセッション状態追跡
- セッションIDの生成とバリデーション

#### `src/session-storage.ts` (204行)
- セッションデータの永続化
- 会話履歴の効率的な保存・読み込み
- データベース接続の管理

### セキュリティ
#### `src/crypto-utils/` (リファクタリング済み暗号化システム)
- **EncryptionKeyManager** (`encryption-key-manager.ts` - 93行): 暗号化キー管理、Electron safeStorage連携
- **DataEncryption** (`data-encryption.ts` - 29行): crypto-js AES暗号化・復号化
- **ApiKeyStorage** (`api-key-storage.ts` - 392行): APIキー保存・管理、SQLite連携
- **統合エクスポート** (`index.ts` - 23行): モジュール統合、型定義エクスポート
- **後方互換性** (`crypto-utils.ts` - 20行): 既存コードとの互換性維持
- ElectronのsafeStorageとcrypto-js連携
- 複数APIキーの管理と切り替え機能

### 通信・UI管理
#### `src/ipc-handlers/` (モジュール化されたIPCハンドラーシステム - 2025年8月7日リファクタリング完了)
- **BaseHandler** (`base-handler.ts` - 35行): IPCハンドラーの基底クラス、共通機能提供
- **ApiKeyHandler** (`api-key-handler.ts` - 125行): APIキー管理専用ハンドラー
- **SessionHandler** (`session-handler.ts` - 65行): セッション管理専用ハンドラー  
- **ChatHandler** (`chat-handler.ts` - 75行): チャット機能専用ハンドラー
- **DatabaseHandler** (`database-handler.ts` - 85行): データベース管理専用ハンドラー
- **InitialSetupHandler** (`initial-setup-handler.ts` - 65行): 初期設定専用ハンドラー
- **UtilityHandler** (`utility-handler.ts` - 25行): ユーティリティ機能専用ハンドラー
- **IPCHandlerManager** (`ipc-handler-manager.ts` - 55行): 統合管理クラス
- **Index** (`index.ts` - 16行): モジュールエクスポート設定

#### `src/window-manager.ts` (185行)
- Electronウィンドウの作成と管理
- セキュリティ設定（nodeIntegration無効、contextIsolation有効）
- ウィンドウのライフサイクル管理
- 初期設定ウィンドウの管理

#### `src/preload.ts` (116行)
- セキュアなフロントエンド-バックエンド通信API
- IPC経由でメインプロセスの機能をフロントエンドに公開
- 型安全なAPIインターフェース
- イベントリスナーの管理

#### `src/initial-setup-preload.ts` (21行)
- 初期設定専用のプリロードスクリプト
- セットアップ機能のセキュアAPI公開

### 設定管理
#### `src/settings-manager.ts` (255行)
- ユーザー設定の永続化管理
- 初期セットアップ完了状態の追跡
- 設定値のバリデーションと型安全性
- SQLiteベースの設定保存

### フロントエンド
#### `src/chat.ts` (484行 - リファクタリング済み)
- チャットアプリケーションの統合オーケストレーター
- 各UI管理マネージャーの初期化と調整
- サイドバー制御とナビゲーション管理
- アプリケーションライフサイクルの管理
- ESモジュールベースのモジュール統合

#### `src/ui-managers/` (新規ディレクトリ - 8ファイル構成・ESモジュール対応)
- **SidebarManager** (`sidebar-manager.ts`): サイドバー開閉制御・ナビゲーション管理専用
- **UIElementManager** (`ui-element-manager.ts`): DOM要素管理・イベント処理専用  
- **StatusManager** (`status-manager.ts`): ステータス表示管理専用
- **DialogManager** (`dialog-manager.ts`): ダイアログ管理専用
- **ChatManager** (`chat-manager.ts`): チャット機能管理専用
- **SessionUIManager** (`session-ui-manager.ts`): セッションUI管理専用
- **ApiKeyUIManager** (`api-key-ui-manager.ts`): APIキーUI管理専用
- **UIStateManager** (`ui-state-manager.ts`): UI状態管理専用（新しい会話モード対応）
- **Index** (`index.ts`): モジュール統合エクスポート

#### `src/initial-setup.ts` (283行)
- 初期設定ウィザードのフロントエンドロジック
- ステップ式ユーザーガイド（4ステップ）
- ユーザー名、AIサービス、モデル、APIキー設定
- バリデーション、エラーハンドリング
- セットアップ完了後のメインアプリ起動

#### `chat.html` (992行 - サイドバーUI対応)
- サイドバー付きメインチャットインターフェース
- ハンバーガーメニューによる左サイドバーナビゲーション
- モダンなレスポンシブデザイン（ガラスモーフィズム）
- サイドバー内セッション管理・APIキー管理UI
- モーダルダイアログ（セッション作成、確認）
- リアルタイムステータス表示

#### `initial-setup.html` (397行)
- 初期設定ウィザードのUI
- プログレスインジケーター付きマルチステップフォーム
- モダンなカードベースデザイン
- レスポンシブ対応、アニメーション効果

---

*参照元: AI_AGENT_GUIDE.md - アーキテクチャ詳細を分離*
