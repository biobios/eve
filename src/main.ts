import { app } from 'electron';
import { AIManager } from './ai-manager';
import { ApiKeyStorage, DataEncryption, EncryptionKeyManager } from './crypto-utils';
import { DatabaseManager } from './database-manager';
import { IPCHandlerManager } from './ipc-handlers/ipc-handler-manager';
import { SessionManager } from './session-manager';
import { SettingsManager } from './settings-manager';
import { WindowManager } from './window-manager';

// グローバルインスタンス
let databaseManager: DatabaseManager | null = null;
let apiKeyStorage: ApiKeyStorage | null = null;
let aiManager: AIManager | null = null;
let sessionManager: SessionManager | null = null;
let ipcHandlerManager: IPCHandlerManager | null = null;
let windowManager: WindowManager | null = null;
let settingsManager: SettingsManager | null = null;

// データベースシステムを初期化
const initializeDatabaseSystem = async (): Promise<void> => {
  try {
    databaseManager = DatabaseManager.getInstance();
    const result = await databaseManager.initialize();

    if (!result.success) {
      console.error('Database initialization failed:', result.errors);
      throw new Error('Database system initialization failed');
    }

    console.log('Database system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database system:', error);
    throw error;
  }
};

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
const initializeComponents = async (): Promise<void> => {
  if (!apiKeyStorage) {
    throw new Error('API key storage not initialized');
  }

  // 設定マネージャーを初期化
  settingsManager = SettingsManager.getInstance();
  await settingsManager.initialize();

  // 各コンポーネントを初期化
  aiManager = new AIManager(apiKeyStorage);
  sessionManager = new SessionManager();
  windowManager = new WindowManager(aiManager);
  ipcHandlerManager = new IPCHandlerManager(aiManager, sessionManager, apiKeyStorage, windowManager);

  // IPCハンドラーを設定
  ipcHandlerManager.setupAllHandlers();

  // セキュリティハンドラーを設定
  WindowManager.setupSecurityHandlers();
};

// Electronの初期化が完了したときに実行
app.whenReady().then(async () => {
  // データベースシステムを初期化
  await initializeDatabaseSystem();

  // APIキーストレージを初期化
  await initializeApiKeyStorage();

  // コンポーネントを初期化
  await initializeComponents();

  // メインウィンドウを作成
  await windowManager?.createWindow();

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
app.on('before-quit', async (event) => {
  console.log('Application is about to quit');

  // データベースシステムをシャットダウン
  try {
    if (databaseManager) {
      await databaseManager.shutdown();
    }
    if (settingsManager) {
      await settingsManager.shutdown();
    }
  } catch (error) {
    console.error('Error during database shutdown:', error);
  }
});
