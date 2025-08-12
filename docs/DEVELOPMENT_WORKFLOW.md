# Eve プロジェクト - 開発ワークフロー

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

---

*参照元: AI_AGENT_GUIDE.md - 開発ワークフロー詳細を分離*
