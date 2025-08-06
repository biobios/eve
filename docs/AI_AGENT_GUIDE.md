# Eve プロジェクト - AIエージェント作業ガイド

> **重要**: このプロジェクトはAIのコーディングのみで開発することを目標としています。

## 📋 プロジェクト概要

**プロジェクト名**: Eve  
**種類**: Electron + TypeScript製デスクトップアプリケーション  
**主な機能**: Google Gemini AI を使用したチャットアシスタント  
**開発言語**: TypeScript  
**フレームワーク**: Electron  
**AI/ML**: LangChain + LangGraph + Google Gemini API  

## 🎯 プロジェクトの目的

Eveは以下の機能を提供するデスクトップアプリケーションです：
- **Google Gemini AIとのチャット機能**: Gemini 1.5 Flash モデルによる高度な対話
- **セッション管理**: 複数の会話を並行管理、セッション別履歴保存
- **会話履歴の永続化**: SQLiteベースの安全なローカル保存
- **APIキーの暗号化保存**: Electronの安全な暗号化機能を活用
- **レスポンシブUI**: ガラスモーフィズムデザインによるモダンな見た目
- **セキュアな通信**: プリロードスクリプトによる安全なIPC通信
- **クロスプラットフォーム対応**: Windows、macOS、Linux対応
- **リアルタイム状態管理**: 接続状態、ローディング状態の表示
- **確認ダイアログ**: 重要操作での安全性確保
- **自動セッション命名**: 最初のメッセージから自動でセッション名生成

## 🏗️ アーキテクチャ

### メインコンポーネント
1. **メインプロセス** (`src/main.ts`): Electronアプリの起動、コンポーネント統合、ライフサイクル管理
2. **AIマネージャー** (`src/ai-manager.ts`): Google Gemini AI統合、LangGraph実装、会話履歴管理
3. **IPCハンドラー** (`src/ipc-handlers.ts`): プロセス間通信の集約、APIエンドポイント管理
4. **セッションマネージャー** (`src/session-manager.ts`): セッション状態管理、ID生成
5. **ウィンドウマネージャー** (`src/window-manager.ts`): Electronウィンドウの作成と管理
6. **暗号化ユーティリティ** (`src/crypto-utils.ts`): APIキーの安全な保存、暗号化処理
7. **プリロードスクリプト** (`src/preload.ts`): セキュアなフロントエンド-バックエンドAPI
8. **フロントエンド** (`src/chat.ts`): チャットUI、セッション管理、ユーザーインタラクション
9. **HTMLファイル**: 
   - `index.html`: ランディングページ（システム情報、機能紹介）
   - `chat.html`: チャットインターフェース（AI会話、セッション管理）

### 技術スタック
```
フロントエンド: HTML + CSS + TypeScript
├── chat.html (520行): メインチャットUI、ガラスモーフィズムデザイン
├── index.html (140行): ランディングページ、システム情報表示
└── chat.ts (458行): チャットロジック、セッション管理UI

Electron IPC: プリロードスクリプトによるセキュアな通信
├── preload.ts (70行): セキュアAPI、型安全な通信インターフェース
├── ipc-handlers.ts (132行): IPCハンドラー集約、エンドポイント管理
└── main.ts (78行): アプリ起動、コンポーネント統合

バックエンド: Node.js + TypeScript
├── ai-manager.ts (219行): AI統合、LangGraphワークフロー
├── session-manager.ts (70行): セッション状態管理
├── window-manager.ts (92行): ウィンドウ管理、セキュリティ設定
└── crypto-utils.ts (204行): 暗号化、APIキー保存

AI処理: LangChain + LangGraph + Google Gemini
├── Google Gemini 1.5 Flash モデル
├── LangGraph ワークフロー（状態管理、会話フロー）
└── HumanMessage ベースのメッセージング

データ永続化: SQLite (LangGraph checkpoint)
├── 会話履歴の永続化
├── セッション別データ管理
└── 暗号化されたAPIキー保存

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

# ウォッチ開発モード
npm run dev:watch

# ビルドファイルクリーンアップ
npm run clean
```

## 🧩 主要ファイルの役割

### `src/main.ts` (78行)
- Electronアプリケーションの起動とライフサイクル管理
- コンポーネントの初期化と統合
- APIキーストレージ、AIマネージャー、セッションマネージャーの組み立て
- セキュリティ設定とハンドラー設定

### `src/ai-manager.ts` (219行)
- Google Gemini AI の初期化と管理
- LangGraph ワークフローの実装
- セッション単位での会話履歴管理
- SQLite checkpointer を使用した永続化
- AI応答の生成とエラーハンドリング

### `src/ipc-handlers.ts` (132行)
- IPC（プロセス間通信）ハンドラーの集約
- API キー管理ハンドラー（設定、削除、確認）
- チャット機能ハンドラー（メッセージ送信、履歴取得）
- セッション管理ハンドラー（作成、切り替え、削除）

### `src/chat.ts` (458行) 
- チャットアプリケーションのフロントエンドロジック
- チャットUI の制御（メッセージ表示、入力処理）
- セッション管理UI（作成、切り替え、削除）
- モーダルダイアログの制御
- APIキー設定フローの管理

### `src/crypto-utils.ts` (204行)
- 暗号化キー管理（EncryptionKeyManager）
- データ暗号化・復号化（DataEncryption）
- APIキーの安全な保存と読み込み（ApiKeyStorage）
- ElectronのsafeStorageとcrypto-js連携

### `src/session-manager.ts` (70行)
- セッション作成と管理
- 現在のセッション状態追跡
- セッションIDの生成とバリデーション

### `src/window-manager.ts` (92行)
- Electronウィンドウの作成と管理
- セキュリティ設定（nodeIntegration無効、contextIsolation有効）
- ウィンドウのライフサイクル管理

### `src/preload.ts` (70行)
- セキュアなフロントエンド-バックエンド通信API
- IPC経由でメインプロセスの機能をフロントエンドに公開
- 型安全なAPIインターフェース
- イベントリスナーの管理

### `chat.html` (520行)
- メインのチャットインターフェース
- モダンなレスポンシブデザイン（ガラスモーフィズム）
- セッション管理UI
- モーダルダイアログ（セッション作成、確認）
- リアルタイムステータス表示

### `index.html` (140行)
- ランディングページ
- システム情報表示（Node.js、Electron、Chromiumバージョン）
- 機能紹介とナビゲーション
- チャットページへのリンク

## 🔄 データフロー

```
1. ユーザー入力 (chat.html)
    ↓
2. フロントエンドJS (chat.ts) - UIイベント処理、入力検証
    ↓
3. プリロードAPI (preload.ts) - セキュアなIPC通信
    ↓
4. IPC通信 - プロセス間通信
    ↓
5. IPCハンドラー (ipc-handlers.ts) - ルーティング、エラーハンドリング
    ↓
6. AIマネージャー (ai-manager.ts) - LangGraph + Gemini AI処理
    ↓
7. セッションマネージャー (session-manager.ts) - セッション状態管理
    ↓
8. SQLite永続化 - 会話履歴、checkpointer
    ↓
9. レスポンス返却（逆順）
    ↓
10. UIアップデート (chat.ts) - メッセージ表示、状態更新
```

### セッション管理フロー
```
セッション作成 → UUID生成 → SQLite初期化 → UI更新
セッション切り替え → 履歴ロード → UI状態変更 → 会話復元
セッション削除 → 確認ダイアログ → SQLiteクリア → UI更新
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

### ファイル構造の維持
- `src/`: TypeScriptソースコード
  - `main.ts`: アプリケーション起動とコンポーネント統合
  - `ai-manager.ts`: AI処理とLangGraphワークフロー
  - `ipc-handlers.ts`: IPC通信ハンドラー集約
  - `session-manager.ts`: セッション管理
  - `window-manager.ts`: ウィンドウ管理
  - `crypto-utils.ts`: 暗号化とAPIキー保存
  - `preload.ts`: セキュアAPI公開
  - `chat.ts`: フロントエンドロジック
- `dist/`: コンパイル後のJavaScript（自動生成）
- `docs/`: ドキュメント
- `assets/`: リソースファイル
- ルートディレクトリ: HTML、設定ファイル

### 依存関係管理
- LangChain関連パッケージのバージョン整合性を保つ
- Electronのセキュリティアップデートに注意
- TypeScript型定義の一貫性を維持
- 新機能追加時は依存関係の影響を検証

### セキュリティ要件
- APIキーの暗号化保存（crypto-js + Electron safeStorage）
- contextIsolation有効、nodeIntegration無効
- プリロードスクリプトによるセキュアAPI公開
- IPCハンドラーでの入力検証とエラーハンドリング

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

## 🚀 デプロイメント

### パッケージング
```bash
npm run build        # 全プラットフォーム
npm run build:win    # Windows (NSIS)
npm run build:mac    # macOS (DMG)
npm run build:linux  # Linux (AppImage)
```

## ⚠️ 注意事項

1. **APIキー管理**: Google Gemini APIキーはユーザーが設定する仕様、暗号化保存対応
2. **データプライバシー**: 会話履歴はローカルSQLiteに保存、外部送信なし
3. **セキュリティ**: プリロードスクリプトによるセキュアAPI、contextIsolation有効
4. **クロスプラットフォーム**: パスやファイル操作に注意、Electronビルダー対応
5. **メモリ管理**: Electronの特性を考慮したリソース管理、長時間実行対応
6. **エラーハンドリング**: 各層でのtry-catch、ユーザーフレンドリーなエラーメッセージ
7. **セッション管理**: 複数セッション並行、UUIDベースのID管理

## 📚 関連ドキュメント

- [README.md](../README.md): プロジェクトの基本情報
- [TYPESCRIPT.md](./TYPESCRIPT.md): TypeScript開発詳細ガイド
- [package.json](../package.json): 依存関係とスクリプト
- [tsconfig.json](../tsconfig.json): TypeScript設定

## 🆘 トラブルシューティング

### よくある問題
1. **TypeScriptコンパイルエラー**: 型定義の不整合、tsconfig.json設定確認
2. **Electron起動失敗**: メインプロセスのパスエラー、distフォルダ確認
3. **AI API接続エラー**: APIキー設定またはネットワーク問題
4. **SQLiteエラー**: データベースファイルの権限問題、パス確認
5. **IPC通信エラー**: プリロードスクリプトの型不整合、ハンドラー未登録
6. **セッション管理エラー**: UUID生成失敗、checkpointer初期化問題
7. **暗号化エラー**: safeStorage利用不可、キー管理問題

### 解決手順
1. `npm run clean` でビルドファイルクリア
2. `npm run build:ts` で再コンパイル
3. VS Codeの問題パネルでエラー確認
4. 開発者ツールでランタイムエラー調査
5. ログファイル確認（コンソール出力）
6. 依存関係の再インストール（`npm install`）
7. Electronキャッシュクリア（`%APPDATA%/eve`削除）

---

**このドキュメントは、AIエージェントがEveプロジェクトで効率的に作業するための包括的なガイドです。作業開始前に必ずこのドキュメントを参照してください。**

---
*最終更新: 2025年8月6日*  
*プロジェクトバージョン: 1.0.0*  
*対応Node.js: v14以上*  
*対応Electron: ^37.2.5*
