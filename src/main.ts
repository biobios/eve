import { app } from 'electron';
import { AIManager } from './ai-manager';
import { ApiKeyStorage, DataEncryption, EncryptionKeyManager } from './crypto-utils';
import { IPCHandlers } from './ipc-handlers';
import { SessionManager } from './session-manager';
import { WindowManager } from './window-manager';

// グローバルインスタンス
let apiKeyStorage: ApiKeyStorage | null = null;
let aiManager: AIManager | null = null;
let sessionManager: SessionManager | null = null;
let ipcHandlers: IPCHandlers | null = null;
let windowManager: WindowManager | null = null;

// APIキーストレージを初期化
const initializeApiKeyStorage = async (): Promise<void> => {
  try {
    // 暗号化キーを取得または作成
    const encryptionKey = await EncryptionKeyManager.getOrCreateEncryptionKey('api_keys');

    // データ暗号化インスタンスを作成
    const dataEncryption = new DataEncryption(encryptionKey);

    // APIキーストレージを初期化
    apiKeyStorage = new ApiKeyStorage(dataEncryption);

    console.log('API key storage initialized');
  } catch (error) {
    console.error('Failed to initialize API key storage:', error);
    throw error;
  }
};

// アプリケーションのコンポーネントを初期化
const initializeComponents = (): void => {
  if (!apiKeyStorage) {
    throw new Error('API key storage not initialized');
  }

  // 各コンポーネントを初期化
  aiManager = new AIManager(apiKeyStorage);
  sessionManager = new SessionManager();
  ipcHandlers = new IPCHandlers(aiManager, sessionManager, apiKeyStorage);
  windowManager = new WindowManager(aiManager);

  // IPCハンドラーを設定
  ipcHandlers.setupHandlers();

  // セキュリティハンドラーを設定
  WindowManager.setupSecurityHandlers();
};

// Electronの初期化が完了したときに実行
app.whenReady().then(async () => {
  // APIキーストレージを初期化
  await initializeApiKeyStorage();

  // コンポーネントを初期化
  initializeComponents();

  // メインウィンドウを作成
  windowManager?.createWindow();

  console.log('Electron app is ready');
  console.log('Node version:', process.versions.node);
  console.log('Electron version:', process.versions.electron);
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  // macOS以外では、すべてのウィンドウが閉じられたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOSでDockアイコンがクリックされた場合、ウィンドウがなければ作成
  if (WindowManager.areAllWindowsClosed()) {
    windowManager?.createWindow();
  }
});

// アプリケーション終了時の処理
app.on('before-quit', (event) => {
  console.log('Application is about to quit');

  // データベース接続を閉じる
  try {
    EncryptionKeyManager.closeDatabase();
    ApiKeyStorage.closeDatabase();
  } catch (error) {
    console.error('Error closing databases:', error);
  }
});
