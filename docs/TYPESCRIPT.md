# TypeScript 開発ガイド

## 📁 プロジェクト構造

```
eve/
├── src/                    # TypeScriptソースファイル
│   ├── main.ts            # メインプロセス（TypeScript）
│   └── renderer.ts        # レンダラープロセス（TypeScript）
├── dist/                  # TypeScriptコンパイル後のJavaScript（自動生成）
│   ├── main.js
│   ├── main.js.map
│   ├── renderer.js
│   └── renderer.js.map
├── chat.html              # HTMLファイル
├── tsconfig.json          # TypeScript設定
├── package.json           # プロジェクト設定
└── .vscode/              # VS Code設定
    ├── tasks.json         # タスク設定
    ├── launch.json        # デバッグ設定
    ├── settings.json      # エディタ設定
    └── extensions.json    # 推奨拡張機能
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
   - `src/renderer.ts`: レンダラープロセスの機能

2. **自動コンパイル**
   ```bash
   npm run build:ts:watch
   ```

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
