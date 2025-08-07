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

## 🎯 プロジェクトの目的

Eveは以下の機能を提供するデスクトップアプリケーションです：
- **Google Gemini AIとのチャット機能**: Gemini 1.5 Flash, 2.0 Flash モデルによる高度な対話
- **複数APIキー管理**: 複数のAPIキーを暗号化保存、切り替え可能
- **高度なセッション管理**: 複数の会話並行管理、メタデータ付き履歴保存
- **会話履歴の永続化**: SQLiteベースの安全なローカル保存
- **企業級セキュリティ**: 多層暗号化によるAPIキー保護
- **初期設定ウィザード**: 初回起動時のガイド付きセットアップ
- **自動データベース管理**: マイグレーション、バックアップ、ヘルスチェック機能
- **モダンUI**: ガラスモーフィズムデザインによる美しいインターフェース
- **セキュアな通信**: プリロードスクリプトによる安全なIPC通信
- **クロスプラットフォーム対応**: Windows、macOS、Linux対応
- **リアルタイム状態管理**: 接続状態、ローディング状態の表示
- **確認ダイアログ**: 重要操作での安全性確保
- **インテリジェント機能**: 自動セッション命名、統計情報収集

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
5. **セキュリティシステム** (`src/crypto-utils.ts` - 567行): 多層暗号化、APIキー保護
6. **通信層**:
   - **IPCハンドラーシステム** (`src/ipc-handlers/` - 9ファイル構成): モジュール化されたプロセス間通信管理
   - **プリロードスクリプト** (`src/preload.ts` - 116行): セキュアなフロントエンド-バックエンドAPI
7. **UI層**:
   - **ウィンドウマネージャー** (`src/window-manager.ts` - 185行): Electronウィンドウの作成と管理
   - **フロントエンド** (`src/chat.ts` - 768行): チャットUI、セッション管理、ユーザーインタラクション
   - **初期設定UI** (`src/initial-setup.ts` - 283行): 初回起動時のセットアップウィザード
8. **設定管理**:
   - **SettingsManager** (`src/settings-manager.ts` - 255行): ユーザー設定と初期セットアップ状態管理
9. **HTMLファイル**: 
   - `chat.html` (811行): チャットインターフェース（AI会話、セッション管理）
   - `initial-setup.html` (397行): 初期設定ウィザード画面

### 技術スタック
```
フロントエンド: HTML + CSS + TypeScript
├── chat.html (811行): メインチャットUI、ガラスモーフィズムデザイン
├── initial-setup.html (397行): 初期設定ウィザードUI
├── chat.ts (768行): チャットロジック、セッション管理UI
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

セキュリティシステム: 多層暗号化
├── crypto-utils.ts (567行): 暗号化キー管理、データ暗号化、APIキー保存
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
#### `src/crypto-utils.ts` (567行)
- 暗号化キー管理（EncryptionKeyManager）
- 多層データ暗号化・復号化（DataEncryption）
- APIキーの安全な保存と読み込み（ApiKeyStorage）
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
#### `src/chat.ts` (768行) 
- チャットアプリケーションのフロントエンドロジック
- チャットUI の制御（メッセージ表示、入力処理）
- セッション管理UI（作成、切り替え、削除）
- APIキー管理UI（複数キー対応、暗号化保存）
- モーダルダイアログの制御
- 確認ダイアログ、フォームバリデーション

#### `src/initial-setup.ts` (283行)
- 初期設定ウィザードのフロントエンドロジック
- ステップ式ユーザーガイド（4ステップ）
- ユーザー名、AIサービス、モデル、APIキー設定
- バリデーション、エラーハンドリング
- セットアップ完了後のメインアプリ起動

#### `chat.html` (811行)
- メインのチャットインターフェース
- モダンなレスポンシブデザイン（ガラスモーフィズム）
- セッション管理UI、APIキー管理UI
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
セッション作成 → UUID生成 → SQLite初期化 → SessionManager登録 → UI更新
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
- **フォント**: Segoe UI、ヒラギノ角ゴ対応
- **レスポンシブ**: モバイル/デスクトップ対応
- **UI要素**: 
  - ボタン：丸角、ホバーエフェクト
  - カード：backdrop-filter、境界線
  - モーダル：オーバーレイ、中央配置
  - ステータス：色分け（成功：緑、エラー：赤、警告：オレンジ）

## 🛠️ 作業時の重要なポイント

### コーディング規約
1. **TypeScript厳格モード**: 型安全性を最優先
2. **Electronセキュリティ**: プリロードスクリプトによるセキュアな通信
3. **非同期処理**: async/await パターンの徹底
4. **エラーハンドリング**: try-catch による適切な例外処理
5. **データベース整合性**: トランザクション使用の徹底
6. **暗号化原則**: 機密データの多層保護

### ファイル構造の維持
- `src/`: TypeScriptソースコード（総計約3,360行 - リファクタリング後）
  - **コアシステム**: `main.ts`, `database-manager.ts`, `database-migration.ts`
  - **データベース管理**: `database-health-checker.ts`, `database-backup-manager.ts`, `database-logger.ts`
  - **AIシステム**: `ai-manager.ts`, `ai-service.ts`, `conversation-manager.ts` 
  - **セッション管理**: `session-manager.ts`, `session-storage.ts`
  - **セキュリティ**: `crypto-utils.ts`
  - **通信**: `ipc-handlers/` (モジュール化), `preload.ts`, `window-manager.ts`
  - **フロントエンド**: `chat.ts`
  - **設定**: `database-migrations-config.ts`
- `dist/`: コンパイル後のJavaScript（自動生成）
- `docs/`: ドキュメント
  - `AI_AGENT_GUIDE.md`: AIエージェント作業ガイド（本文書）
  - `TECHNICAL_REFERENCE.md`: 技術詳細リファレンス
  - `DEVELOPMENT_GUIDE.md`: 開発者向けガイド
- `assets/`: リソースファイル
- ルートディレクトリ: chat.html、設定ファイル

### 依存関係管理（2025年8月6日現在）
- **プロダクション依存関係**:
  - `@langchain/core@^0.3.66`, `@langchain/google-genai@^0.2.16`, `@langchain/langgraph@^0.4.2`: AI機能
  - `@langchain/langgraph-checkpoint-sqlite@^0.2.0`: 会話履歴の永続化
  - `langchain@^0.3.30`: LangChainフレームワーク
  - `uuid@^11.1.0`: セッションID生成
  - `better-sqlite3@^12.2.0`: SQLiteデータベース
  - `crypto-js@^4.2.0`: 暗号化ライブラリ
  - `crypto-js@^4.2.0`: 暗号化処理

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

### セキュリティ要件
- **APIキー**: 必ず多層暗号化で保存（Electron safeStorage + crypto-js）
- **contextIsolation**: 有効状態を維持
- **nodeIntegration**: 無効状態を維持
- **プリロードスクリプト**: セキュアAPIのみ公開
- **入力検証**: IPCハンドラーでの厳密な検証とサニタイズ

### AI開発要件
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

## 🔄 最新のリファクタリング完了事項（2025年8月7日）

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

---

**このドキュメントは、AIエージェントがEveプロジェクトで効率的に作業するための包括的なガイドです。作業開始前に必ずこのドキュメントを参照し、技術詳細が必要な場合は関連ドキュメントを確認してください。**

---
*最終更新: 2025年8月7日*  
*プロジェクトバージョン: 1.0.0*  
*総コード行数: 約3,360行（リファクタリング後）*  
*対応Node.js: v14以上*  
*対応Electron: ^37.2.5*  
*リファクタリング完了: DatabaseManager系（2025年8月7日）*
