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
- Google Gemini AIとのチャット機能
- セッション管理（複数の会話を並行管理）
- 会話履歴の永続化（SQLite）
- クロスプラットフォーム対応（Windows、macOS、Linux）

## 🏗️ アーキテクチャ

### メインコンポーネント
1. **メインプロセス** (`src/main.ts`): Electron のメインプロセス、AI統合、IPC処理
2. **プリロードスクリプト** (`src/preload.ts`): セキュアなフロントエンド-バックエンドAPI
3. **フロントエンド** (`src/chat.ts`): チャットUI、セッション管理、ユーザーインタラクション
4. **HTMLファイル**: 
   - `index.html`: メインウィンドウ（ランディングページ）
   - `chat.html`: チャットインターフェース

### 技術スタック
```
フロントエンド: HTML + CSS + TypeScript
Electron IPC: プリロードスクリプトによるセキュアな通信
バックエンド: Node.js + TypeScript
AI処理: LangChain + LangGraph + Google Gemini
データ永続化: SQLite (LangGraph checkpoint)
パッケージング: Electron Builder
```

## 🔧 開発環境

### 必要な依存関係
- **プロダクション依存関係**:
  - `@langchain/core`, `@langchain/google-genai`, `@langchain/langgraph`: AI機能
  - `@langchain/langgraph-checkpoint-sqlite`: 会話履歴の永続化
  - `langchain`: LangChainフレームワーク
  - `uuid`: セッションID生成

- **開発依存関係**:
  - `electron`: Electronフレームワーク
  - `typescript`: TypeScript コンパイラ
  - `electron-builder`: アプリケーションパッケージング
  - `concurrently`, `wait-on`: 開発ワークフロー支援

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

### `src/main.ts` (338行)
- Electronメインプロセス
- Google Gemini AI の初期化と管理
- LangGraph ワークフローの実装
- IPC ハンドラー（API キー設定、メッセージ送信、セッション管理）
- SQLite を使用した会話履歴の永続化

### `src/chat.ts` (484行) 
- チャットアプリケーションのフロントエンドロジック
- チャットUI の制御（メッセージ表示、入力処理）
- セッション管理UI（作成、切り替え、削除）
- モーダルダイアログの制御
- APIキー設定フローの管理

### `src/preload.ts` (63行)
- セキュアなフロントエンド-バックエンド通信API
- IPC経由でメインプロセスの機能をフロントエンドに公開
- 型安全なAPIインターフェース

### `chat.html` (507行)
- メインのチャットインターフェース
- モダンなレスポンシブデザイン
- セッション管理UI
- モーダルダイアログ（セッション作成、確認）

## 🔄 データフロー

```
1. ユーザー入力 (chat.html)
    ↓
2. フロントエンドJS (chat.ts)
    ↓
3. プリロードAPI (preload.ts)
    ↓
4. IPC通信
    ↓
5. メインプロセス (main.ts)
    ↓
6. LangGraph + Gemini AI
    ↓
7. SQLite永続化
    ↓
8. レスポンス返却（逆順）
```

## 🎨 デザインテーマ

- **カラーパレット**: グラデーション（#667eea → #764ba2）
- **デザイン**: ガラスモーフィズム（blur + 半透明）
- **フォント**: Segoe UI
- **レスポンシブ**: モバイル/デスクトップ対応

## 🛠️ 作業時の重要なポイント

### コーディング規約
1. **TypeScript厳格モード**: 型安全性を最優先
2. **Electronセキュリティ**: プリロードスクリプトによるセキュアな通信
3. **非同期処理**: async/await パターンの徹底
4. **エラーハンドリング**: try-catch による適切な例外処理

### ファイル構造の維持
- `src/`: TypeScriptソースコード
- `dist/`: コンパイル後のJavaScript（自動生成）
- `docs/`: ドキュメント
- `assets/`: リソースファイル

### 依存関係管理
- LangChain関連パッケージのバージョン整合性を保つ
- Electronのセキュリティアップデートに注意
- TypeScript型定義の一貫性を維持

## 🔍 デバッグとテスト

### 開発用コマンド
```bash
# ウォッチモードで開発開始
npm run dev:watch

# TypeScriptエラーチェック
npm run build:ts

# クリーンビルド
npm run clean && npm run build:ts
```

### VS Codeデバッグ
- F5キーでElectronアプリのデバッグ実行
- TypeScriptファイルに直接ブレークポイント設定可能
- ソースマップによる正確なデバッグ

## 🚀 デプロイメント

### パッケージング
```bash
npm run build        # 全プラットフォーム
npm run build:win    # Windows (NSIS)
npm run build:mac    # macOS (DMG)
npm run build:linux  # Linux (AppImage)
```

## ⚠️ 注意事項

1. **APIキー管理**: Google Gemini APIキーはユーザーが設定する仕様
2. **データプライバシー**: 会話履歴はローカルSQLiteに保存
3. **クロスプラットフォーム**: パスやファイル操作に注意
4. **メモリ管理**: Electronの特性を考慮したリソース管理

## 📚 関連ドキュメント

- [README.md](../README.md): プロジェクトの基本情報
- [TYPESCRIPT.md](./TYPESCRIPT.md): TypeScript開発詳細ガイド
- [package.json](../package.json): 依存関係とスクリプト
- [tsconfig.json](../tsconfig.json): TypeScript設定

## 🆘 トラブルシューティング

### よくある問題
1. **TypeScriptコンパイルエラー**: 型定義の不整合
2. **Electron起動失敗**: メインプロセスのパスエラー
3. **AI API接続エラー**: APIキー設定またはネットワーク問題
4. **SQLiteエラー**: データベースファイルの権限問題

### 解決手順
1. `npm run clean` でビルドファイルクリア
2. `npm run build:ts` で再コンパイル
3. VS Codeの問題パネルでエラー確認
4. 開発者ツールでランタイムエラー調査

---

**このドキュメントは、AIエージェントがEveプロジェクトで効率的に作業するための包括的なガイドです。作業開始前に必ずこのドキュメントを参照してください。**
