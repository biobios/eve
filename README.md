# Eve - Electron + TypeScript + AI チャットアプリケーション

> **開発方針**: このリポジトリはAIのコーディングのみで開発することを目標としています。

EveはElectron + TypeScriptを使用して開発された、Google Gemini AIを活用したデスクトップチャットアプリケーションです。

## ✨ 主な機能

- **Google Gemini AIチャット**: Gemini 1.5 Flash / 2.0 Flash モデルとの高度な対話
- **複数APIキー管理**: 複数のAPIキーを暗号化保存、簡単切り替え
- **セッション管理**: 複数の会話を並行管理、履歴の永続保存
- **初期設定ウィザード**: 初回起動時のガイド付きセットアップ
- **企業級セキュリティ**: 多層暗号化によるAPIキー保護
- **自動データベース管理**: マイグレーション、バックアップ機能
- **モダンUI**: ガラスモーフィズムデザイン
- **クロスプラットフォーム**: Windows、macOS、Linux対応

## 🚀 はじめに

### 前提条件
- Node.js (v14以上)
- npm または yarn
- TypeScript基本知識

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/eve.git
cd eve
```

2. 依存関係をインストール
```bash
npm install
```

### 使用方法

#### 開発モード
```bash
# TypeScriptを自動コンパイルして実行
npm start

# 開発モード（ログ有効）
npm run dev

# ウォッチモード（ファイル変更を監視）
npm run dev:watch
```

#### TypeScriptコンパイル
```bash
# 一回だけコンパイル
npm run build:ts

# ウォッチモード
npm run build:ts:watch
```

#### ビルド
```bash
# すべてのプラットフォーム用にビルド
npm run build

# Windows用
npm run build:win

# macOS用
npm run build:mac

# Linux用
npm run build:linux
```

#### パッケージング（インストーラーなし）
```bash
npm run pack
```

## 📁 プロジェクト構造

```
eve/
├── src/                           # TypeScriptソースファイル
│   ├── main.ts                   # メインプロセス（128行）
│   ├── chat.ts                   # チャットフロントエンド（768行）
│   ├── initial-setup.ts          # 初期設定ウィザード（283行）
│   ├── ai-manager.ts             # AI統合管理（142行）
│   ├── conversation-manager.ts   # 会話管理（114行）
│   ├── session-manager.ts        # セッション管理（81行）
│   ├── session-storage.ts        # データ永続化（204行）
│   ├── settings-manager.ts       # 設定管理（255行）
│   ├── crypto-utils.ts           # 暗号化システム（567行）
│   ├── database-manager.ts       # DB統合管理（249行）
│   ├── database-migration.ts     # マイグレーション（332行）
│   ├── database-migrations-config.ts # マイグレーション定義（294行）
│   ├── ipc-handlers/              # IPCハンドラーシステム（モジュール化）
│   │   ├── ipc-handler-manager.ts# 統合管理（55行）
│   │   ├── base-handler.ts       # 基底クラス（35行）
│   │   ├── api-key-handler.ts    # APIキー管理（125行）
│   │   ├── session-handler.ts    # セッション管理（65行）
│   │   ├── chat-handler.ts       # チャット機能（75行）
│   │   ├── database-handler.ts   # DB管理（85行）
│   │   ├── initial-setup-handler.ts # 初期設定（65行）
│   │   ├── utility-handler.ts    # ユーティリティ（25行）
│   │   └── index.ts              # エクスポート（16行）
│   ├── window-manager.ts         # ウィンドウ管理（185行）
│   ├── preload.ts                # セキュアAPI（116行）
│   └── (その他のTypeScriptファイル)
├── dist/                         # コンパイル後のJavaScript（自動生成）
├── chat.html                     # メインチャットUI（811行）
├── initial-setup.html            # 初期設定UI（397行）
├── tsconfig.json                 # TypeScript設定
├── package.json                  # プロジェクト設定
├── assets/                       # 画像、アイコンなどのリソース
├── docs/                         # ドキュメント
│   ├── AI_AGENT_GUIDE.md         # AIエージェント作業ガイド
│   ├── DEVELOPMENT_GUIDE.md      # 開発者ガイド
│   ├── TECHNICAL_REFERENCE.md    # 技術リファレンス
│   └── TYPESCRIPT.md             # TypeScript開発ガイド
└── .vscode/                     # VS Code設定

**総コード行数**: 約5,430行
```

## 🛠️ 技術スタック

- **Electron**: デスクトップアプリケーションフレームワーク
- **TypeScript**: 型安全なJavaScript拡張
- **LangChain + LangGraph**: AI機能とワークフロー管理
- **Google Gemini API**: AI対話モデル（1.5 Flash / 2.0 Flash）
- **SQLite**: ローカルデータベース（better-sqlite3）
- **Crypto-js**: 暗号化ライブラリ
- **HTML/CSS**: フロントエンド技術（ガラスモーフィズムデザイン）
- **Electron Builder**: アプリケーションパッケージング

## 📋 詳細ドキュメント

- 📖 **[AI_AGENT_GUIDE.md](./docs/AI_AGENT_GUIDE.md)**: AIエージェント向け作業ガイド
- 🛠️ **[DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)**: 開発者向け実践ガイド
- 🔧 **[TECHNICAL_REFERENCE.md](./docs/TECHNICAL_REFERENCE.md)**: 技術仕様書
- 📝 **[TYPESCRIPT.md](./docs/TYPESCRIPT.md)**: TypeScript開発ガイド

## 🔐 セキュリティ機能

- **多層暗号化**: Electron safeStorage + crypto-js AES
- **プロセス分離**: contextIsolation有効、nodeIntegration無効
- **セキュアAPI**: プリロードスクリプトによる安全な通信
- **APIキー保護**: 暗号化された安全な保存と管理
- 開発者ツール統合
- ホットリロード対応

## 🔧 開発

### TypeScript開発
詳細な開発ガイドは [TYPESCRIPT.md](./docs/TYPESCRIPT.md) を参照してください。

### VS Code設定
プロジェクトには以下のVS Code設定が含まれています：
- TypeScript IntelliSense
- デバッグ設定
- タスク設定
- 推奨拡張機能
- 自動フォーマット設定

### デバッグ
VS Codeでデバッグを実行するには：
1. F5キーを押すか、「実行とデバッグ」パネルから「Electron: Main (TypeScript)」を選択
2. TypeScriptファイル上でブレークポイントを設定してデバッグ

## 📦 配布

Electron Builderを使用してアプリケーションを配布用にパッケージできます。

### Windows
- NSIS インストーラー (.exe)
- Portable アプリケーション

### macOS
- DMG イメージ
- App Store パッケージ（追加設定が必要）

### Linux
- AppImage
- DEB パッケージ
- RPM パッケージ

## 🤝 貢献

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🆘 サポート

問題や質問がある場合は、[GitHub Issues](https://github.com/yourusername/eve/issues)で報告してください。
