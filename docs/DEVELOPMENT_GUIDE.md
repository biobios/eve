# Eve プロジェクト - 開発者ガイド

> **対象読者**: 開発者向けの実践的な開発手順とトラブルシューティング

## 🚀 開発環境セットアップ

### 1. 前提条件
```bash
# Node.js v14以上がインストールされていること
node --version

# npmまたはyarnが利用可能であること
npm --version
```

### 2. プロジェクトセットアップ
```bash
# 依存関係のインストール
npm install

# TypeScriptのコンパイル
npm run build:ts

# 開発モードでアプリケーション起動
npm run dev
```

### 3. VS Code設定
推奨拡張機能:
- TypeScript and JavaScript Language Features
- Electron Debug
- SQLite Viewer
- GitLens

## 🏗️ 開発ワークフロー

### 推奨開発手順
1. **ウォッチモードでの開発開始**
   ```bash
   npm run dev:watch
   ```

2. **新機能開発時の手順**
   - TypeScriptファイルを編集
   - 自動コンパイル → 自動再起動
   - Chrome DevTools でフロントエンドデバッグ
   - VS Code デバッガーでバックエンドデバッグ

3. **データベース変更時の手順**
   - `src/database-migrations-config.ts` にマイグレーション追加
   - アプリ再起動でマイグレーション自動実行
   - `npm run dev` でログ確認

## 📁 ファイル構造詳細

### 重要ディレクトリ
```
src/
├── main.ts                     # Electronアプリエントリーポイント
├── window-manager.ts           # ウィンドウライフサイクル管理
├── ipc-handlers.ts            # プロセス間通信集約
├── preload.ts                 # セキュアAPI公開
├── chat.ts                    # フロントエンドロジック
├── ai-manager.ts              # AI統合とワークフロー
├── session-manager.ts         # セッション状態管理
├── conversation-manager.ts    # 会話履歴管理
├── session-storage.ts         # データ永続化
├── crypto-utils.ts            # 暗号化システム
├── database-manager.ts        # データベース統合管理
├── database-migration.ts      # マイグレーション機能
└── database-migrations-config.ts  # マイグレーション定義
```

### 新機能追加時のファイル影響範囲

#### フロントエンド機能追加
1. `chat.html`: UI要素追加
2. `src/chat.ts`: ロジック実装
3. `src/preload.ts`: 必要に応じてAPI追加
4. `src/ipc-handlers.ts`: バックエンドハンドラー追加

#### AI機能拡張
1. `src/ai-manager.ts`: ワークフロー変更
2. `src/ai-service.ts`: サービスロジック追加
3. `src/conversation-manager.ts`: 履歴管理拡張

#### データベース変更
1. `src/database-migrations-config.ts`: マイグレーション定義
2. `src/database-manager.ts`: 必要に応じて管理ロジック追加

## 🔧 デバッグ手法

### 1. メインプロセスデバッグ
VS Codeでのブレークポイントデバッグ:
```json
// .vscode/launch.json に設定
{
    "type": "node",
    "request": "launch",
    "name": "Electron Main",
    "program": "${workspaceFolder}/dist/main.js",
    "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron"
}
```

### 2. レンダラープロセスデバッグ
Chrome DevTools使用:
- `Ctrl+Shift+I` (Windows/Linux)
- `Cmd+Opt+I` (macOS)

### 3. IPC通信デバッグ
```typescript
// デバッグログ追加例
console.log('IPC Request:', channel, ...args);
```

### 4. データベースデバッグ
```typescript
// SQLクエリログ出力
const result = db.prepare(query).all();
console.log('SQL Query:', query, 'Result:', result);
```

## 🗃️ データベース開発

### マイグレーション追加手順
1. **新しいマイグレーションの定義**
   ```typescript
   // src/database-migrations-config.ts
   {
       version: 4, // 次のバージョン番号
       description: 'Add new feature table',
       up: (db) => {
           db.exec(`
               CREATE TABLE IF NOT EXISTS new_feature (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   feature_data TEXT NOT NULL
               )
           `);
       },
       down: (db) => {
           db.exec(`DROP TABLE IF EXISTS new_feature`);
       }
   }
   ```

2. **マイグレーション実行**
   ```bash
   npm run dev  # アプリ起動時に自動実行
   ```

3. **確認**
   ```typescript
   // データベース状態の確認
   const manager = new DatabaseManager();
   const status = manager.getMigrationInfo();
   console.log(status);
   ```

### データベースバックアップ
```typescript
// プログラムでのバックアップ
const manager = new DatabaseManager();
const result = await manager.createBackup();
console.log('Backup paths:', result.backupPaths);
```

## 🔐 セキュリティ開発

### APIキー実装
```typescript
// 新しいAPIキーサービス追加例
import { ApiKeyStorage } from './crypto-utils';

const storage = new ApiKeyStorage();

// キーの保存
await storage.storeApiKey('new-service', 'api-key-value');

// キーの取得
const apiKey = await storage.getApiKey('new-service');
```

### 暗号化実装
```typescript
// カスタム暗号化
import { DataEncryption } from './crypto-utils';

const encryption = new DataEncryption();
const encrypted = await encryption.encrypt('sensitive-data');
const decrypted = await encryption.decrypt(encrypted);
```

## 🎨 UI開発

### デザインシステム
カラーパレット:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --glass-bg: rgba(255, 255, 255, 0.1);
    --glass-border: rgba(255, 255, 255, 0.2);
    --success-color: #10b981;
    --error-color: #ef4444;
    --warning-color: #f59e0b;
}
```

ガラスモーフィズム効果:
```css
.glass-effect {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
}
```

### レスポンシブ対応
```css
/* モバイル対応 */
@media (max-width: 768px) {
    .chat-container {
        padding: 1rem;
    }
}
```

## 🧪 テスト手法

### 手動テスト手順
1. **基本機能テスト**
   - アプリケーション起動
   - APIキー設定
   - チャット送信
   - セッション作成・切り替え・削除

2. **エラーハンドリングテスト**
   - 無効なAPIキー
   - ネットワーク切断
   - データベースエラー

3. **セキュリティテスト**
   - APIキー暗号化確認
   - プロセス分離確認

### デバッグログ活用
```typescript
// 段階的ログレベル
if (process.env.NODE_ENV === 'development') {
    console.log('Debug:', data);
}
```

## 📦 ビルド・配布

### 開発ビルド
```bash
# 型チェック付きコンパイル
npm run build:ts

# クリーンビルド
npm run clean && npm run build:ts
```

### 配布用ビルド
```bash
# 全プラットフォーム
npm run build

# 特定プラットフォーム
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### ビルド成果物確認
```bash
# ビルド後のファイル構造確認
ls -la dist/

# パッケージサイズ確認
du -sh dist/*.exe dist/*.dmg dist/*.AppImage
```

## 🚨 トラブルシューティング

### よくある問題と解決策

#### 1. TypeScriptコンパイルエラー
```bash
# 問題: 型エラー
# 解決: 
npm run clean
npm run build:ts
# TypeScript設定確認
cat tsconfig.json
```

#### 2. Electron起動失敗
```bash
# 問題: メインプロセスエラー
# 解決:
# dist/main.js存在確認
ls -la dist/main.js
# パス設定確認
grep "main" package.json
```

#### 3. データベースエラー
```bash
# 問題: SQLiteエラー
# 解決:
# ユーザーデータディレクトリ確認（Windows）
echo %APPDATA%\eve
# データベースファイル権限確認
ls -la "%APPDATA%\eve\*.db"
```

#### 4. IPC通信エラー
```typescript
// 問題: プリロードAPI未定義
// 解決: プリロードスクリプト確認
console.log('Available APIs:', Object.keys(window.electronAPI));
```

#### 5. AI API接続エラー
```typescript
// 問題: Gemini API接続失敗
// 解決:
// APIキー確認
const hasKey = await window.electronAPI.hasApiKey('gemini');
console.log('API Key exists:', hasKey);

// ネットワーク接続確認
fetch('https://generativelanguage.googleapis.com/v1beta/models')
    .then(r => console.log('API reachable:', r.status))
    .catch(e => console.error('API unreachable:', e));
```

#### 6. パフォーマンス問題
```bash
# メモリ使用量確認
# Chrome DevTools → Performance タブ
# メインプロセスメモリ確認（VS Code デバッガー）
```

### ログファイル場所
- **Windows**: `%APPDATA%\eve\logs\`
- **macOS**: `~/Library/Application Support/eve/logs/`
- **Linux**: `~/.config/eve/logs/`

### サポートチャンネル
- GitHub Issues: プロジェクトリポジトリ
- 技術文書: `docs/TECHNICAL_REFERENCE.md`
- 設定リファレンス: `package.json`, `tsconfig.json`

---

*最終更新: 2025年8月6日*  
*対応バージョン: Eve v1.0.0*
