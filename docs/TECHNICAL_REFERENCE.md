# Eve プロジェクト - 技術リファレンス

> **対象読者**: 開発者、システム管理者向けの詳細技術情報

## 📊 プロジェクト統計

### ファイル構成と行数（2025年8月6日現在）

#### フロントエンド
- `chat.html`: 811行 - メインチャットUI、ガラスモーフィズムデザイン
- `initial-setup.html`: 397行 - 初期設定ウィザードUI
- `src/chat.ts`: 768行 - チャットロジック、セッション管理UI
- `src/initial-setup.ts`: 283行 - セットアップウィザードロジック

#### バックエンド (TypeScript)
- `src/crypto-utils.ts`: 567行 - 暗号化とAPIキー保存
- `src/ipc-handlers.ts`: 377行 - IPC通信ハンドラー集約
- `src/database-migration.ts`: 332行 - マイグレーション管理システム
- `src/database-migrations-config.ts`: 294行 - データベースマイグレーション定義
- `src/settings-manager.ts`: 255行 - 設定管理システム
- `src/database-manager.ts`: 249行 - データベース統合管理
- `src/session-storage.ts`: 204行 - セッションデータ永続化
- `src/window-manager.ts`: 185行 - ウィンドウ管理、セキュリティ設定
- `src/ai-manager.ts`: 142行 - AI統合、LangGraphワークフロー
- `src/main.ts`: 128行 - アプリ起動、コンポーネント統合
- `src/preload.ts`: 116行 - セキュアAPI公開
- `src/conversation-manager.ts`: 114行 - 会話管理ロジック
- `src/ai-service.ts`: 81行 - AI処理サービス
- `src/session-manager.ts`: 81行 - セッション状態管理
- `src/initial-setup-preload.ts`: 21行 - 初期設定専用プリロード

**合計プロジェクトコード行数**: 約5,430行

## 🗃️ データベースアーキテクチャ

### マイグレーション管理システム
アプリケーションは複数の独立したSQLiteデータベースを使用し、自動マイグレーション機能を提供します。

#### データベース一覧
1. **encryption.db**: 暗号化キー管理
   - テーブル: `encryption_keys`
   - インデックス: `key_name`
   - マイグレーション: 2バージョン

2. **apikeys.db**: APIキー管理  
   - テーブル: `api_keys`
   - フィールド: `service_name`, `encrypted_api_key`, `ai_model`, `description`, `is_active`, `last_used_at`
   - インデックス: `service_name`
   - マイグレーション: 3バージョン

3. **conversations.db**: 会話履歴とメタデータ
   - テーブル: `conversation_metadata`, `conversation_statistics`
   - LangGraph Checkpointテーブル（自動管理）
   - インデックス: `archived`, `pinned`, `created_at`
   - マイグレーション: 3バージョン

4. **settings.db**: ユーザー設定と初期セットアップ
   - テーブル: `user_settings`
   - フィールド: `setting_key`, `setting_value`, `setting_type`, `description`
   - 初期セットアップ完了状態の管理

### マイグレーション機能
- **自動実行**: アプリ起動時に未適用マイグレーションを自動実行
- **トランザクション**: 各マイグレーションはトランザクション内で実行
- **ロールバック**: 指定バージョンへのロールバック機能
- **バックアップ**: マイグレーション前の自動バックアップ
- **ヘルスチェック**: データベースの状態監視
- **状態管理**: `schema_migrations`テーブルでバージョン追跡

## 🔐 セキュリティアーキテクチャ

### 暗号化システム
1. **階層化暗号化**:
   - レベル1: Electron safeStorage（OS統合）
   - レベル2: crypto-js AES暗号化
   - キー派生: マスターキー → サービス固有キー

2. **APIキー保護**:
   - サービス名での分離
   - 暗号化後データベース保存
   - メモリ上での最小滞在時間

3. **Electronセキュリティ**:
   - `contextIsolation`: 有効
   - `nodeIntegration`: 無効
   - プリロードスクリプト経由のセキュア通信

### IPC通信セキュリティ
- 型安全なプリロードAPI
- 入力検証とサニタイズ
- エラーハンドリングの標準化
- プロセス分離によるサンドボックス化

## 🔄 AI処理フロー

### LangGraph統合
```
ユーザー入力 → LangGraph State → Gemini API → Response → State Update → UI表示
```

### 対応AIモデル
- **Gemini 1.5 Flash**: 高速レスポンス、コスト効率重視
- **Gemini 2.0 Flash**: 最新モデル、より高精度な応答
- 複数APIキー管理による柔軟なモデル切り替え

### セッション管理フロー
```
セッション作成 → UUID生成 → SQLite初期化 → Checkpointer設定 → AI準備完了
```

### 会話履歴管理
- LangGraph Checkpointer: 自動永続化
- メタデータ: 手動管理（名前、タグ、アーカイブ状態）
- 統計情報: メッセージ数、トークン数、応答時間
- 複数セッション並行管理

## 🛠️ 開発ツールチェーン

### TypeScript設定
- **厳格モード**: 全オプション有効
- **ターゲット**: ES2020
- **モジュール**: CommonJS（Electronとの互換性）
- **ソースマップ**: 開発用デバッグ対応

### ビルドプロセス
```bash
TypeScript (.ts) → JavaScript (.js) → Electron実行
```

### VS Codeタスク
- `build:ts`: TypeScriptコンパイル
- `build:ts:watch`: ウォッチモードコンパイル
- `start`: アプリケーション起動
- `dev`: 開発モード（ログ有効）
- `dev:watch`: ウォッチ開発モード
- `clean`: ビルドファイルクリーンアップ

## 📦 パッケージング

### Electron Builder設定
- **Windows**: NSIS インストーラー（x64, ia32）
- **macOS**: DMG パッケージ（x64, arm64）
- **Linux**: AppImage（x64）

### ビルド成果物
```
dist/
├── win-unpacked/     # Windows実行ファイル
├── mac/              # macOSアプリバンドル
├── linux-unpacked/   # Linux実行ファイル
└── *.exe, *.dmg, *.AppImage  # 配布用パッケージ
```

## 🧪 テスト・デバッグ

### 開発環境デバッグ
- **メインプロセス**: VS Codeデバッガー対応
- **レンダラープロセス**: Chrome DevTools
- **IPC通信**: メッセージトレーシング
- **データベース**: SQLiteクエリログ

### ログ管理
- コンソール出力: 開発モード
- エラーハンドリング: 全層での例外捕捉
- セッション状態: リアルタイム追跡

## 🚀 パフォーマンス

### メモリ管理
- データベース接続プール
- 会話履歴の適切なガベージコレクション
- AI応答の効率的なストリーミング

### リソース最適化
- 必要時のみデータベース接続
- セッション別でのメモリ分離
- 適切なイベントリスナーのクリーンアップ

## 📋 依存関係詳細

### プロダクション依存関係
```json
{
  "@langchain/core": "^0.3.66",
  "@langchain/google-genai": "^0.2.16",
  "@langchain/langgraph": "^0.4.2", 
  "@langchain/langgraph-checkpoint-sqlite": "^0.2.0",
  "better-sqlite3": "^12.2.0",
  "crypto-js": "^4.2.0",
  "langchain": "^0.3.30",
  "uuid": "^11.1.0"
}
```

### 開発依存関係
```json
{
  "@types/better-sqlite3": "^7.6.13",
  "@types/crypto-js": "^4.2.2",
  "@types/node": "^24.1.0",
  "@types/uuid": "^10.0.0",
  "concurrently": "^9.2.0",
  "electron": "^37.2.5",
  "electron-builder": "^26.0.12",
  "rimraf": "^6.0.1",
  "ts-node": "^10.9.2",
  "typescript": "^5.9.2",
  "wait-on": "^8.0.4"
}
```

## 🔧 システム要件

### 最小動作環境
- **Node.js**: v14.0.0以上
- **Electron**: v37.2.5
- **TypeScript**: v5.9.2以上
- **OS**: Windows 10, macOS 10.14, Ubuntu 18.04以上

### 推奨動作環境
- **RAM**: 4GB以上
- **ストレージ**: 500MB以上の空き容量
- **ネットワーク**: インターネット接続（AI API通信用）

## 📚 API参考

### Google Gemini API
- **モデル**: Gemini 1.5 Flash
- **認証**: APIキー
- **リクエスト制限**: プロバイダー規定に準拠

### LangChain API
- **バージョン**: v0.3系
- **チェーン**: Conversational
- **メモリ**: SQLite Checkpoint

---

*最終更新: 2025年8月6日*  
*対応バージョン: Eve v1.0.0*
