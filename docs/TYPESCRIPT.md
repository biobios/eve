# TypeScript 開発ガイド

## 📁 プロジェクト構造

```
eve/
├── src/                           # TypeScriptソースファイル
│   ├── main.ts                   # メインプロセス（TypeScript）
│   ├── chat.ts                   # チャットフロントエンド（TypeScript）
│   ├── initial-setup.ts          # 初期設定UI（TypeScript）
│   ├── preload.ts                # セキュアAPI（TypeScript）
│   ├── initial-setup-preload.ts  # 初期設定API（TypeScript）
│   ├── ai-manager.ts             # AI統合管理（TypeScript）
│   ├── ai-service.ts             # AI処理サービス（TypeScript）
│   ├── conversation-manager.ts   # 会話管理（TypeScript）
│   ├── session-manager.ts        # セッション管理（TypeScript）
│   ├── session-storage.ts        # データ永続化（TypeScript）
│   ├── settings-manager.ts       # 設定管理（TypeScript）
│   ├── crypto-utils.ts           # 暗号化システム（TypeScript）
│   ├── database-manager.ts       # DB統合管理（TypeScript）
│   ├── database-migration.ts     # マイグレーション（TypeScript）
│   ├── database-migrations-config.ts # マイグレーション定義（TypeScript）
│   ├── ipc-handlers.ts           # IPC通信ハンドラー（TypeScript）
│   └── window-manager.ts         # ウィンドウ管理（TypeScript）
├── dist/                         # TypeScriptコンパイル後のJavaScript（自動生成）
│   ├── main.js
│   ├── chat.js
│   ├── initial-setup.js
│   ├── (他の.jsファイル)
│   └── (対応する.js.mapファイル)
├── chat.html                     # メインチャットUI
├── initial-setup.html            # 初期設定UI
├── tsconfig.json                 # TypeScript設定
├── package.json                  # プロジェクト設定
└── .vscode/                     # VS Code設定
    ├── tasks.json                # タスク設定
    ├── launch.json               # デバッグ設定
    ├── settings.json             # エディタ設定
    └── extensions.json           # 推奨拡張機能
```

## 🚀 開発コマンド

### TypeScriptコンパイル
```bash
# 一回だけコンパイル
npm run build:ts

# ウォッチモード（ファイル変更を監視して自動コンパイル）
npm run build:ts:watch
```

### アプリケーション実行
```bash
# 本番モード（自動でTypeScriptをコンパイルしてから実行）
npm start

# 開発モード（デバッグログ有効）
npm run dev

# ウォッチモード（TypeScriptの変更を監視して自動でアプリを再起動）
npm run dev:watch
```

### ビルド
```bash
# distフォルダをクリーンアップ
npm run clean

# アプリケーションをパッケージング
npm run build
```

## 🛠️ 開発環境

### VS Code設定
プロジェクトには最適化されたVS Code設定が含まれています：

- **IntelliSense**: TypeScriptの型補完とエラー検出
- **デバッグ**: F5キーでElectronアプリをデバッグ実行
- **タスク**: Ctrl+Shift+P → "Tasks: Run Task"で各種タスクを実行
- **自動フォーマット**: ファイル保存時に自動でコードフォーマット

### 推奨拡張機能
以下の拡張機能を使用することを推奨します：
- TypeScript and JavaScript Language Features
- ESLint
- Prettier - Code formatter
- Path Intellisense
- Auto Rename Tag

## 🔧 TypeScript設定

### tsconfig.json
主要な設定：
- `target`: ES2020
- `module`: CommonJS
- `strict`: true（厳密な型チェック有効）
- `sourceMap`: true（デバッグ用ソースマップ生成）
- `outDir`: "./dist"（出力ディレクトリ）
- `rootDir`: "./src"（ソースディレクトリ）

### 型安全性
- すべての変数に型が推論または明示的に指定されています
- Electron APIの型定義が利用可能
- null/undefined安全性が有効

## 📝 開発ワークフロー

1. **TypeScriptファイルを編集**
   - `src/main.ts`: メインプロセスの機能
   - `src/chat.ts`: チャットフロントエンドの機能
   - `src/initial-setup.ts`: 初期設定UIの機能
   - `src/ai-manager.ts`: AI統合管理
   - `src/session-manager.ts`: セッション管理
   - `src/crypto-utils.ts`: セキュリティ機能
   - その他のTypeScriptファイル

2. **自動コンパイル**
   ```bash
   npm run build:ts:watch
   ```

## 🚀 アプリケーション起動フロー

### 初回起動
1. **初期設定チェック**: SettingsManagerが初期設定完了をチェック
2. **初期設定ウィザード**: 未完了の場合、`initial-setup.html`を表示
3. **ユーザー情報設定**: 名前、AIサービス、APIキーを設定
4. **メインアプリ起動**: 設定完了後、`chat.html`に移行

### 通常起動
1. **データベース初期化**: 全データベースのマイグレーション実行
2. **APIキー自動読み込み**: 保存されたAPIキーで自動初期化
3. **セッション復元**: 前回のセッション状態を復元
4. **チャットUI表示**: メインインターフェースを表示

## 🔧 型安全性と開発支援

### 厳密な型チェック
- **strict**: true - 全ての厳密性オプションを有効
- **noImplicitAny**: true - 暗黙的any型を禁止
- **strictNullChecks**: true - null/undefined安全性
- **noImplicitReturns**: true - 戻り値の型明示を強制

### インターフェース定義
```typescript
// セッション情報の型定義
interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

// APIキー情報の型定義
interface ApiKeyInfo {
    id: number;
    serviceName: string;
    apiKey: string;
    aiModel?: string;
    description?: string;
    isActive: boolean;
}

// 設定情報の型定義
interface UserSetting {
    setting_key: string;
    setting_value: string;
    setting_type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
}
```

## 🐛 デバッグとトラブルシューティング

### ログ出力
- **メインプロセス**: VS Code コンソール、またはターミナル出力
- **レンダラープロセス**: Chrome DevTools コンソール（F12）
- **開発モード**: `npm run dev` でより詳細なログ出力

### よくある問題
1. **TypeScriptコンパイルエラー**: `npm run build:ts` で詳細確認
2. **データベースエラー**: アプリ再起動でマイグレーション自動実行
3. **APIキーエラー**: 設定画面で再設定を試行

## 🧩 主要TypeScriptモジュール

### メインプロセス
- **main.ts**: Electronアプリケーションのエントリーポイント
- **window-manager.ts**: ウィンドウの作成と管理
- **ipc-handlers.ts**: プロセス間通信のハンドラー集約

### AIシステム
- **ai-manager.ts**: AI機能の統合管理
- **ai-service.ts**: Google Gemini API連携
- **conversation-manager.ts**: 会話履歴とLangGraph

### データ管理
- **database-manager.ts**: データベース統合管理
- **session-storage.ts**: セッションデータ永続化
- **settings-manager.ts**: アプリ設定管理

### セキュリティ
- **crypto-utils.ts**: 暗号化とAPIキー保護

### フロントエンド
- **chat.ts**: メインチャットインターフェース
- **initial-setup.ts**: 初期設定ウィザード
- **preload.ts**: セキュアAPIブリッジ

3. **アプリケーション実行**
   ```bash
   npm run dev:watch
   ```

4. **デバッグ**
   - VS CodeでF5キーを押してデバッグ実行
   - ブレークポイントの設定が可能
   - ソースマップによりTypeScriptファイルでデバッグ

## 🎯 型定義

### Electronイベント
```typescript
import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  // 型安全なElectron API使用
});
```

### レンダラープロセス
```typescript
interface ElectronVersions {
  node: string;
  chrome: string;
  electron: string;
}

// 型安全なDOM操作
const element = document.getElementById('node-version');
if (element) {
  element.textContent = process.versions.node;
}
```

## 🐛 デバッグ

### VS Codeデバッグ
1. F5キーまたは「実行とデバッグ」パネルから「Electron: Main (TypeScript)」を選択
2. ブレークポイントを設定
3. TypeScriptファイル上でデバッグ可能

### ログ出力
```typescript
console.log('デバッグ情報:', { data: 'example' });
```

## 🔄 自動リロード

開発効率を向上させるため、以下の自動化が設定されています：
- TypeScriptファイルの変更監視
- 自動コンパイル
- アプリケーションの自動再起動（dev:watchモード）

## 📦 本番ビルド

TypeScriptコードは本番ビルド時に自動でコンパイルされ、最適化されたJavaScriptが出力されます：

```bash
npm run build        # すべてのプラットフォーム
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```
