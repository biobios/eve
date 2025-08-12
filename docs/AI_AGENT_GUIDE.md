# Eve プロジェクト - AIエージェント作業ガイド

> **重要**: このプロジェクトはAIのコーディングのみで開発することを目標としています。

## 📋 プロジェクト概要

**プロジェクト名**: Eve  
**種類**: Electron + TypeScript製デスクトップアプリケーション  
**主な機能**: Google Gemini AI を使用したチャットアシスタント  
**開発言語**: TypeScript  
**フレームワーク**: Electron  
**AI/ML**: LangChain + LangGraph + Google Gemini API  
**データベース**: SQLite（マイグレーション管理システム搭載）
**セキュリティ**: 多層暗号化システム

## 🎯 プロ- `src/`: TypeScriptソースコード（総計約2,600行 - サイドバーUI追加後）
  - **コアシステム**: `main.ts`, `database-manager.ts`, `database-migration.ts`
  - **データベース管理**: `database-health-checker.ts`, `database-backup-manager.ts`, `database-logger.ts`
  - **AIシステム**: `ai-manager.ts`, `ai-service.ts`, `conversation-manager.ts` 
  - **セッション管理**: `session-manager.ts`, `session-storage.ts`
  - **セキュリティ**: `crypto-utils/` (リファクタリング済み)
  - **通信**: `ipc-handlers/` (モジュール化), `preload.ts`, `window-manager.ts`
  - **フロントエンド**: 
    - `chat.ts` (484行 - サイドバー対応、統合オーケストレーター)
    - `ui-managers/` (8ファイル構成 - サイドバー管理含む専門UI管理クラス群)
      - `sidebar-manager.ts`: サイドバー開閉制御・ナビゲーション管理（新規）
      - `ui-element-manager.ts`: DOM要素管理・イベント処理
      - `status-manager.ts`: ステータス表示管理
      - `dialog-manager.ts`: ダイアログ管理
      - `chat-manager.ts`: チャット機能管理
      - `session-ui-manager.ts`: セッションUI管理
      - `api-key-ui-manager.ts`: APIキーUI管理
      - `ui-state-manager.ts`: UI状態管理
      - `index.ts`: モジュール統合エクスポート
  - **設定**: `database-migrations-config.ts`
Eveは以下の機能を提供するデスクトップアプリケーションです：
- **Google Gemini AIとのチャット機能**: Gemini 1.5 Flash, 2.0 Flash モデルによる高度な対話
- **複数APIキー管理**: 複数のAPIキーを暗号化保存、切り替え可能
- **高度なセッション管理**: 
  - 複数の会話並行管理、メタデータ付き履歴保存
  - 一覧表示による直感的なセッション選択
  - 右クリックメニューによるセッション削除
  - 選択的な画面リセット（削除対象セッションのみ）
- **会話履歴の永続化**: SQLiteベースの安全なローカル保存
- **企業級セキュリティ**: 多層暗号化によるAPIキー保護
- **初期設定ウィザード**: 初回起動時のガイド付きセットアップ
- **自動データベース管理**: マイグレーション、バックアップ、ヘルスチェック機能
- **モダンサイドバーUI**: ハンバーガーメニューによる左サイドバーナビゲーション
- **ガラスモーフィズムデザイン**: 美しい半透明インターフェース
- **セキュアな通信**: プリロードスクリプトによる安全なIPC通信
- **クロスプラットフォーム対応**: Windows、macOS、Linux対応
- **リアルタイム状態管理**: 接続状態、ローディング状態の表示
- **確認ダイアログ**: 重要操作での安全性確保（自動イベントリスナー設定）
- **動的セッション命名**: 最初のメッセージ内容に基づく自動セッション名生成
- **新しい会話モード**: セッション作成を遅延し、実際のメッセージ送信時に作成
- **レスポンシブ設計**: モバイル・タブレット対応UI

## 🏗️ アーキテクチャ

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

### 技術スタック
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

## 🔧 開発環境

### 必要な依存関係
- **プロダクション依存関係**:
  - `@langchain/core@^0.3.66`, `@langchain/google-genai@^0.2.16`, `@langchain/langgraph@^0.4.2`: AI機能
  - `@langchain/langgraph-checkpoint-sqlite@^0.2.0`: 会話履歴の永続化
  - `langchain@^0.3.30`: LangChainフレームワーク
  - `uuid@^11.1.0`: セッションID生成
  - `better-sqlite3@^12.2.0`: SQLiteデータベース
  - `crypto-js@^4.2.0`: 暗号化処理

- **開発依存関係**:
  - `electron@^37.2.5`: Electronフレームワーク
  - `typescript@^5.9.2`: TypeScript コンパイラ
  - `electron-builder@^26.0.12`: アプリケーションパッケージング
  - `concurrently@^9.2.0`, `wait-on@^8.0.4`: 開発ワークフロー支援
  - `@types/*`: TypeScript型定義

### VS Code タスク
```bash
# TypeScript コンパイル
npm run build:ts

# ウォッチモードでコンパイル  
npm run build:ts:watch

# アプリケーション起動
npm start

# 開発モード（ログ有効）
npm run dev

# ウォッチ開発モード（推奨）
npm run dev:watch

# ビルドファイルクリーンアップ
npm run clean

# 配布用ビルド
npm run build        # 全プラットフォーム
npm run build:win    # Windows (NSIS)
npm run build:mac    # macOS (DMG)
npm run build:linux  # Linux (AppImage)
```

## 🧩 主要ファイルの役割

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

## 🎨 デザインテーマ

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

## 🛠️ 作業時の重要なポイント

### コーディング規約
1. **TypeScript厳格モード**: 型安全性を最優先
2. **Electronセキュリティ**: プリロードスクリプトによるセキュアな通信
3. **非同期処理**: async/await パターンの徹底
4. **エラーハンドリング**: try-catch による適切な例外処理
5. **データベース整合性**: トランザクション使用の徹底
6. **モジュール設計**: 単一責任原則による責任分離
7. **ESモジュール**: フロントエンドでのモダンJavaScript仕様活用
8. **UI設計**: サイドバーナビゲーションによるクリーンなインターフェース

### ファイル構造の維持
- `src/`: TypeScriptソースコード（総計約2,600行 - サイドバーUI追加後）
  - **コアシステム**: `main.ts`, `database-manager.ts`, `database-migration.ts`
  - **データベース管理**: `database-health-checker.ts`, `database-backup-manager.ts`, `database-logger.ts`
  - **AIシステム**: `ai-manager.ts`, `ai-service.ts`, `conversation-manager.ts` 
  - **セッション管理**: `session-manager.ts`, `session-storage.ts`
  - **セキュリティ**: `crypto-utils/` (リファクタリング済み)
  - **通信**: `ipc-handlers/` (モジュール化), `preload.ts`, `window-manager.ts`
  - **フロントエンド**: 
    - `chat.ts` (484行 - サイドバー対応、統合オーケストレーター)
    - `ui-managers/` (8ファイル構成 - サイドバー管理含む専門UI管理クラス群)
  - **設定**: `database-migrations-config.ts`
- `dist/`: コンパイル後のJavaScript（自動生成 - 環境別構造）
  - `main/`: メインプロセス用（CommonJS）
  - `renderer/`: レンダラープロセス用（ESモジュール）
  - `preload/`: プリロードスクリプト用（CommonJS）
- `docs/`: ドキュメント
  - `AI_AGENT_GUIDE.md`: AIエージェント作業ガイド（本文書）
  - `TECHNICAL_REFERENCE.md`: 技術詳細リファレンス
  - `DEVELOPMENT_GUIDE.md`: 開発者向けガイド
- `assets/`: リソースファイル
- ルートディレクトリ: chat.html、設定ファイル

### セキュリティ要件
- **APIキー**: 必ず多層暗号化で保存（Electron safeStorage + crypto-js）
- **contextIsolation**: 有効状態を維持
- **nodeIntegration**: 無効状態を維持
- **プリロードスクリプト**: セキュアAPIのみ公開
- **入力検証**: IPCハンドラーでの厳密な検証とサニタイズ

### 依存関係管理（2025年8月12日現在）
- **プロダクション依存関係**:
  - `@langchain/core@^0.3.66`, `@langchain/google-genai@^0.2.16`, `@langchain/langgraph@^0.4.2`: AI機能
  - `@langchain/langgraph-checkpoint-sqlite@^0.2.0`: 会話履歴の永続化
  - `langchain@^0.3.30`: LangChainフレームワーク
  - `uuid@^11.1.0`: セッションID生成
  - `better-sqlite3@^12.2.0`: SQLiteデータベース
  - `crypto-js@^4.2.0`: 暗号化ライブラリ

- **開発依存関係**:
  - `electron@^37.2.5`: Electronフレームワーク
  - `typescript@^5.9.2`: TypeScript コンパイラ
  - `electron-builder@^26.0.12`: アプリケーションパッケージング
  - `concurrently@^9.2.0`, `wait-on@^8.0.4`: 開発ワークフロー支援
  - `@types/*`: TypeScript型定義

### データベース開発要件
- **マイグレーション**: 新機能は必ずマイグレーションを通じて実装
- **トランザクション**: データ整合性のため全変更でトランザクション使用
- **バックアップ**: 重要な変更前は自動バックアップ実行
- **テスト**: マイグレーションは up/down 両方向でテスト

### AI開発要件
- **LangGraph**: 状態管理とワークフローを活用
- **Checkpointer**: SQLiteベースで会話履歴を自動保存
- **エラーハンドリング**: AI API障害に対する適切な復旧処理
- **セッション分離**: セッション間でのデータ混在防止

## 📖 基本的な使用方法

### 新しい会話の開始
1. **「新しい会話」ボタンをクリック**
   - サイドバーまたはメインエリアの「新しい会話」ボタンを押す
   - この時点ではまだセッションは作成されない（新しい会話モード開始）
   - 入力フィールドが有効化される

2. **最初のメッセージを送信**
   - メッセージを入力してEnterキーまたは送信ボタンを押す
   - この時点でセッションが自動作成される
   - メッセージ内容を解析して動的にセッション名を生成
   - AI応答が返され、会話が開始される

### セッション管理
1. **セッション一覧の確認**
   - サイドバーでセッション一覧を確認
   - セッション名は最初のメッセージから自動生成される
   - 一覧形式で各セッションの名前と最終メッセージ日時を表示

2. **セッション切り替え**
   - サイドバーのセッション項目をクリック
   - 選択したセッションの会話履歴が読み込まれる
   - アクティブなセッションは視覚的にハイライト表示

3. **セッション削除**
   - セッション項目を右クリック
   - 表示されるコンテキストメニューから「削除」を選択
   - 確認ダイアログで削除を承認
   - 現在表示中のセッション以外を削除しても画面はリセットされない

### APIキー管理
1. **APIキー設定**
   - サイドバーの「APIキー管理」をクリック
   - Google Gemini APIキーを入力
   - 多層暗号化で安全に保存される

2. **APIキー変更**
   - 既存のAPIキーを新しいキーで上書き可能
   - 暗号化された状態で保存される

### サイドバーナビゲーション
1. **サイドバー開閉**
   - 画面左上のハンバーガーメニュー（≡）をクリック
   - またはESCキーでサイドバーを閉じる
   - サイドバー外エリアをクリックでも閉じる

2. **機能へのアクセス**
   - 新しい会話作成
   - セッション管理：一覧表示とクリック選択
   - セッション削除：右クリックメニュー
   - APIキー設定
   - アプリケーション設定

### 会話の継続
- 既存セッションを選択すると会話履歴が復元される
- メッセージは時系列順に表示される
- AI応答は流れるように表示される（ストリーミング）

### データの安全性
- 会話履歴はすべてローカルのSQLiteデータベースに保存
- APIキーは二重暗号化で保護
- 外部サーバーへのデータ送信なし（APIキー利用時のみ）

### TypeScript設定（環境別対応）

**概要**: メインプロセス、レンダラープロセス、プリロードスクリプトに応じた最適化

#### 基本設定 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### メインプロセス用 (`tsconfig.main.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "./dist/main",
    "types": ["node"]
  },
  "include": [
    "src/main.ts",
    "src/database-*.ts",
    "src/ai-*.ts",
    "src/conversation-manager.ts",
    "src/session-*.ts",
    "src/settings-manager.ts",
    "src/window-manager.ts",
    "src/crypto-utils/**/*",
    "src/ipc-handlers/**/*"
  ]
}
```

#### レンダラープロセス用 (`tsconfig.renderer.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "es2022",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist/renderer",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "src/chat.ts",
    "src/initial-setup.ts",
    "src/ui-managers/**/*"
  ]
}
```

#### プリロードスクリプト用 (`tsconfig.preload.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist/preload",
    "types": ["node"]
  },
  "include": [
    "src/*preload*.ts"
  ]
}
```

**ビルドコマンド**:
```bash
# 全環境コンパイル
npm run build:ts

# 環境別コンパイル
npm run build:main     # メインプロセス
npm run build:renderer # レンダラープロセス（ESモジュール）
npm run build:preload  # プリロードスクリプト
```

### モジュール使用例

#### ui-managers使用例（ESモジュール）
```typescript
// 統合インポート（推奨）
import {
  UIElementManager,
  StatusManager,
  DialogManager,
  ChatManager,
  SessionUIManager,
  ApiKeyUIManager,
  UIStateManager
} from './ui-managers/index.js';

// 個別インポート
import { UIElementManager } from './ui-managers/ui-element-manager.js';
import { ChatManager } from './ui-managers/chat-manager.js';

// 使用例
const uiManager = new UIElementManager();
const elements = uiManager.getElements();
const chatManager = new ChatManager(elements.chat);
```

#### crypto-utils使用例（CommonJS）
```typescript
// 統合インポート（後方互換性）
import { EncryptionKeyManager, DataEncryption, ApiKeyStorage } from './crypto-utils';

// 個別インポート（新しい方法）
import { EncryptionKeyManager } from './crypto-utils/encryption-key-manager';
import { DataEncryption } from './crypto-utils/data-encryption';
import { ApiKeyStorage } from './crypto-utils/api-key-storage';

// 使用例
const encryptionKey = await EncryptionKeyManager.getOrCreateEncryptionKey('api_keys');
const dataEncryption = new DataEncryption(encryptionKey);
const apiKeyStorage = new ApiKeyStorage(dataEncryption);
```
- **LangGraph**: 状態管理とワークフローを活用
- **Checkpointer**: SQLiteベースで会話履歴を自動保存
- **エラーハンドリング**: AI API障害に対する適切な復旧処理
- **セッション分離**: セッション間でのデータ混在防止

## 🔍 デバッグとテスト

### 開発用コマンド
```bash
# ウォッチモードで開発開始（推奨）
npm run dev:watch

# 開発モード（ログ有効）
npm run dev

# TypeScriptコンパイル
npm run build:ts

# ウォッチモードでコンパイル
npm run build:ts:watch

# アプリケーション起動
npm start

# クリーンビルド
npm run clean && npm run build:ts

# 配布用ビルド
npm run build
```

### VS Codeデバッグ
- F5キーでElectronアプリのデバッグ実行
- TypeScriptファイルに直接ブレークポイント設定可能
- ソースマップによる正確なデバッグ
- 開発者ツールでフロントエンドデバッグ
- メインプロセスとレンダラープロセスの両方をデバッグ可能

### ログとモニタリング
- コンソール出力でエラーとデバッグ情報を確認
- IPC通信のトレーシング
- AI API呼び出しのログ
- セッション管理の状態変化追跡
- SQLiteクエリのデバッグ情報
- データベースマイグレーションの詳細ログ
- 暗号化・復号化処理のトレース

### データベース管理
- **ヘルスチェック**: アプリ内でのデータベース状態確認
- **マイグレーション状態**: 各データベースのバージョン確認
- **自動バックアップ**: 重要な操作前の自動バックアップ
- **ロールバック**: 問題のあるマイグレーションの巻き戻し

## 🚀 デプロイメント

### パッケージング
```bash
# 全プラットフォームビルド
npm run build

# プラットフォーム別ビルド
npm run build:win      # Windows (NSIS)
npm run build:mac      # macOS (DMG) 
npm run build:linux    # Linux (AppImage)

# 開発用パッケージング（インストーラーなし）
npm run pack
```

### 配布成果物
- **Windows**: 
  - `dist/Eve Setup.exe` (NISインストーラー)
  - アーキテクチャ: x64, ia32
- **macOS**:
  - `dist/Eve.dmg` (DMGパッケージ)
  - アーキテクチャ: x64, arm64 (Universal Binary)
- **Linux**:
  - `dist/Eve.AppImage` (AppImageポータブル)
  - アーキテクチャ: x64

## ⚠️ 注意事項

1. **APIキー管理**: Google Gemini APIキーはユーザーが設定する仕様、多層暗号化保存対応
2. **データプライバシー**: 会話履歴はローカルSQLiteに保存、外部送信なし
3. **セキュリティ**: プリロードスクリプトによるセキュアAPI、contextIsolation有効
4. **データベース整合性**: マイグレーション機能により自動スキーマ管理、手動変更禁止
5. **クロスプラットフォーム**: パスやファイル操作に注意、Electronビルダー対応
6. **メモリ管理**: Electronの特性を考慮したリソース管理、長時間実行対応
7. **エラーハンドリング**: 各層でのtry-catch、ユーザーフレンドリーなエラーメッセージ
8. **セッション管理**: 複数セッション並行、UUIDベースのID管理
9. **マイグレーション**: up/downマイグレーションの両方向実装必須
10. **暗号化**: APIキーは必ず二重暗号化（ElectronSafeStorage + crypto-js）で保存

## 📚 関連ドキュメント

- [README.md](../README.md): プロジェクトの基本情報と使用方法
- [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md): 技術詳細リファレンス（統計情報、アーキテクチャ詳細）
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md): 開発者向けガイド（セットアップ、デバッグ、トラブルシューティング）
- [TYPESCRIPT.md](./TYPESCRIPT.md): TypeScript開発詳細ガイド
- [package.json](../package.json): 依存関係とスクリプト（最新版）
- [tsconfig.json](../tsconfig.json): TypeScript設定

## 🆘 トラブルシューティング

### よくある問題（2025年8月6日版）
1. **TypeScriptコンパイルエラー**: 型定義の不整合、tsconfig.json設定確認
2. **Electron起動失敗**: メインプロセスのパスエラー、distフォルダ確認
3. **AI API接続エラー**: APIキー設定またはネットワーク問題
4. **データベースマイグレーションエラー**: スキーマ変更失敗、バックアップから復旧
5. **SQLiteファイル権限エラー**: データベースファイルの権限問題、パス確認
6. **IPC通信エラー**: プリロードスクリプトの型不整合、ハンドラー未登録
7. **セッション管理エラー**: UUID生成失敗、checkpointer初期化問題
8. **暗号化エラー**: safeStorage利用不可、キー管理問題
9. **マイグレーションロールバック必要**: 不正なスキーマ変更、手動復旧
10. **セキュリティコンテキストエラー**: contextIsolation設定問題

### 解決手順
1. `npm run clean` でビルドファイルクリア
2. `npm run build:ts` で再コンパイル
3. VS Codeの問題パネルでエラー確認
4. 開発者ツールでランタイムエラー調査
5. データベースヘルスチェック実行（アプリ内機能）
6. マイグレーションステータス確認
7. バックアップからの復旧（必要に応じて）
8. ログファイル確認（コンソール出力）
9. 依存関係の再インストール（`npm install`）
10. Electronキャッシュクリア（`%APPDATA%/eve`削除）

### 緊急時対応
- **データベース破損**: 自動バックアップからの復旧機能を使用
- **マイグレーション失敗**: ロールバック機能で前バージョンに復帰
- **暗号化キー紛失**: 新規インストール手順で復旧（データ損失あり）

### 詳細なトラブルシューティング
詳細な開発環境での問題解決については、[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) のトラブルシューティングセクションを参照してください。

## 🔄 最新のリファクタリング完了事項（2025年8月12日）

### chat.ts系のリファクタリング（ESモジュール対応）

**目的**: 単一責任原則に基づく責任分離、ESモジュール移行、コードの保守性向上

**変更内容**:
1. **chat.ts** (1,646行 → 468行): 統合オーケストレーターとして特化、各UI管理機能を分離
2. **新規作成ディレクトリ**: `src/ui-managers/`
3. **新規作成ファイル**:
   - **UIElementManager** (`ui-element-manager.ts`): DOM要素管理・イベント処理専用
   - **StatusManager** (`status-manager.ts`): ステータス表示管理専用
   - **DialogManager** (`dialog-manager.ts`): ダイアログ管理専用
   - **ChatManager** (`chat-manager.ts`): チャット機能管理専用
   - **SessionUIManager** (`session-ui-manager.ts`): セッションUI管理専用
   - **ApiKeyUIManager** (`api-key-ui-manager.ts`): APIキーUI管理専用
   - **UIStateManager** (`ui-state-manager.ts`): UI状態管理専用
   - **統合エクスポート** (`index.ts`): モジュール統合とエクスポート

**モジュールシステム移行**:
- **CommonJS → ESモジュール**: フロントエンド（レンダラープロセス）をESモジュールに移行
- **TypeScript設定分離**: 環境別のtsconfig.json作成
  - `tsconfig.main.json`: メインプロセス用（CommonJS）
  - `tsconfig.renderer.json`: レンダラープロセス用（ESモジュール）
  - `tsconfig.preload.json`: プリロードスクリプト用（CommonJS）
- **ビルドシステム最適化**: 環境別コンパイルとdist構造の改善

**アーキテクチャ改善**:
- **関心の分離**: 各マネージャーが単一の責任を持つように分離
- **モジュール化**: ESモジュールによる明示的な依存関係管理
- **保守性向上**: コード変更時の影響範囲を最小化
- **テスト容易性**: 各機能を独立してテスト可能
- **可読性向上**: 各クラスの役割が明確で理解しやすい

**技術的改善**:
- **ESモジュール対応**: HTML内で`type="module"`使用
- **インポート文**: `.js`拡張子を使用したESモジュールインポート
- **型安全性**: TypeScriptの型チェックを活用した安全なモジュール間通信
- **ビルド最適化**: 環境別コンパイルによる最適化

**互換性**: 
- 機能的互換性: 元と同じ動作を維持
- APIインターフェース: マネージャー間の適切な責任分離
- モジュールシステム: 環境に応じた最適なモジュール形式

**効果**:
- **コード行数削減**: 1,646行 → 468行（約72%削減）
- **責任分離**: 7つの専門マネージャーによる明確な役割分担
- **ESモジュール**: モダンなJavaScript仕様への対応
- **保守性向上**: 変更時の影響範囲を最小化
- **将来の拡張**: 新機能追加時の設計指針確立

### crypto-utils系のリファクタリング

**目的**: 単一責任原則に基づく責任分離とコードの保守性向上

**変更内容**:
1. **crypto-utils.ts** (568行 → 20行): 後方互換性のためのre-exportファイルに特化
2. **新規作成ファイル**:
   - **EncryptionKeyManager** (`encryption-key-manager.ts` - 93行): 暗号化キー管理専用
   - **DataEncryption** (`data-encryption.ts` - 29行): データ暗号化・復号化専用
   - **ApiKeyStorage** (`api-key-storage.ts` - 392行): APIキー保存・管理専用
   - **統合エクスポート** (`index.ts` - 23行): モジュール統合とエクスポート

**アーキテクチャ改善**:
- **関心の分離**: 各クラスが単一の責任を持つように分離
- **保守性向上**: コード変更時の影響範囲を最小化
- **テスト容易性**: 各機能を独立してテスト可能
- **可読性向上**: 各クラスの役割が明確で理解しやすい

**互換性**: 
- パブリックAPIは変更なし（後方互換性維持）
- 既存の使用箇所は修正不要
- 型定義は自動的に新しい実装に対応

**効果**:
- コードの重複排除
- エラーハンドリングの統一化
- 暗号化処理の責任分離
- 将来の機能拡張への対応力向上

### DatabaseManager系のリファクタリング

**目的**: 単一責任原則に基づく責任分離とコードの保守性向上

**変更内容**:
1. **DatabaseManager** (249行 → 約130行): 統合管理機能のみに特化
2. **新規作成ファイル**:
   - **DatabaseHealthChecker** (68行): ヘルスチェック専用
   - **DatabaseBackupManager** (70行): バックアップ管理専用  
   - **DatabaseLogger** (92行): ログ出力専用

**アーキテクチャ改善**:
- **関心の分離**: 各クラスが単一の責任を持つように分離
- **保守性向上**: コード変更時の影響範囲を最小化
- **テスト容易性**: 各機能を独立してテスト可能
- **可読性向上**: 各クラスの役割が明確で理解しやすい

**互換性**: 
- パブリックAPIは変更なし（後方互換性維持）
- 既存の使用箇所は修正不要
- 型定義は自動的に新しい実装に対応

**効果**:
- コードの重複排除
- エラーハンドリングの統一化
- ログ出力の構造化
- 将来の機能拡張への対応力向上

### サイドバーUI系の新規実装

**目的**: モダンなナビゲーションUIの実装とユーザビリティ向上

**変更内容**:
1. **HTMLレイアウト** (`chat.html`): 画面上部のUI要素を左サイドバーに移動（811行 → 992行）
2. **新規作成ファイル**:
   - **SidebarManager** (`src/ui-managers/sidebar-manager.ts`): サイドバー開閉制御・ナビゲーション管理専用
3. **既存ファイル更新**:
   - **UIElementManager**: サイドバー要素とイベントハンドラーを追加
   - **ChatApp** (`chat.ts`): サイドバー管理機能を統合（468行 → 484行）

**UI/UX改善**:
- **ハンバーガーメニュー**: 3本線アイコンによる直感的なナビゲーション
- **左サイドバー**: セッション管理（一覧表示・右クリック削除）・APIキー管理を統合配置
- **アニメーション**: スムーズなスライドイン・アウト、アイコン変形
- **レスポンシブ対応**: モバイル・タブレット・デスクトップ最適化
- **クリック外エリア対応**: サイドバー外クリック・ESCキーで閉じる

**技術的改善**:
- **CSS**: ガラスモーフィズム + サイドバートランジション
- **TypeScript**: SidebarManager クラスによる状態管理
- **ESモジュール**: モダンなモジュール統合

**効果**:
- **画面スペース効率化**: メインエリアの最大活用
- **ナビゲーション改善**: 直感的でモダンなUI操作
- **ユーザビリティ向上**: 必要時のみサイドバー表示
- **コード可読性**: 専門化されたサイドバー管理クラス

### 新しい会話モード実装（2025年8月12日）

**目的**: セッション作成タイミングの最適化とユーザビリティ向上

**変更内容**:
1. **UI変更**:
   - 「新規」ボタン → 「新しい会話」ボタンに変更
   - ボタンID: `newSessionBtn` → `newConversationBtn`
2. **セッション管理の変更**:
   - ボタンクリック時はセッション作成せず、新しい会話モードのみ開始
   - 最初のメッセージ送信時に実際のセッション作成を実行
3. **動的セッション命名**:
   - メッセージ内容を解析して自動的にセッション名を生成
   - 手動でのセッション名更新APIを削除（`updateSessionName`）
4. **UI状態管理の強化**:
   - `isNewConversationMode`フラグをUIStateManagerに追加
   - 新しい会話モード時の入力フィールド有効化ロジック改善

**技術的変更**:
- **chat.ts**: `handleNewConversation`メソッド追加、`handleSendMessage`の拡張
- **UIStateManager**: 新しい会話モード対応
- **UIElementManager**: 新しいボタンのイベントハンドラー対応
- **IPCハンドラー**: `updateSessionName`API削除（session-handler.ts、preload.ts、ai-manager.ts）

**UX改善効果**:
- **シンプルな操作**: ボタンクリック → メッセージ入力 → セッション自動作成
- **自動命名**: メッセージ内容から適切なセッション名を自動生成
- **遅延作成**: 実際に会話を開始するまでセッションを作成しない
- **直感的**: ユーザーの意図に沿った自然なワークフロー

**後方互換性**: 既存のセッション管理機能はすべて維持、新機能の追加のみ

---

**このドキュメントは、AIエージェントがEveプロジェクトで効率的に作業するための包括的なガイドです。作業開始前に必ずこのドキュメントを参照し、技術詳細が必要な場合は関連ドキュメントを確認してください。**

---
*最終更新: 2025年8月12日*  
*プロジェクトバージョン: 1.0.0*  
*総コード行数: 約2,600行（サイドバーUI追加後）*  
*対応Node.js: v14以上*  
*対応Electron: ^37.2.5*  
*リファクタリング完了: 新しい会話モード（2025年8月12日）、サイドバーUI（2025年8月12日）、chat.ts系（ESモジュール対応・2025年8月12日）、DatabaseManager系（2025年8月7日）、crypto-utils系（2025年8月7日）*
