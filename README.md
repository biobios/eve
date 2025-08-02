# Eve - Electron + TypeScript アプリケーション

> **開発方針**: このリポジトリはAIのコーディングのみで開発することを目標としています。

EveはElectron + TypeScriptを使用して開発されたデスクトップアプリケーションです。

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
├── src/                # TypeScriptソースファイル
│   ├── main.ts        # メインプロセス（TypeScript）
│   └── renderer.ts    # レンダラープロセス（TypeScript）
├── dist/              # コンパイル後のJavaScript（自動生成）
├── index.html         # レンダラープロセス（UI）
├── tsconfig.json      # TypeScript設定
├── package.json       # プロジェクト設定
├── assets/            # 画像、アイコンなどのリソース
├── docs/              # ドキュメント
│   └── TYPESCRIPT.md  # TypeScript開発ガイド
└── .vscode/          # VS Code設定
```

## 🛠️ 技術スタック

- **Electron**: デスクトップアプリケーションフレームワーク
- **TypeScript**: 型安全なJavaScript拡張
- **Node.js**: JavaScript ランタイム
- **HTML/CSS**: フロントエンド技術
- **Electron Builder**: アプリケーションパッケージング

## 📋 機能

- クロスプラットフォーム対応（Windows、macOS、Linux）
- TypeScriptによる型安全な開発環境
- モダンなUI/UX
- 通知機能
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
