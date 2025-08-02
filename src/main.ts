import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';

// ウィンドウの参照を保持
let mainWindow: BrowserWindow | null = null;

// Gemini AI インスタンス
let chatModel: ChatGoogleGenerativeAI | null = null;

// APIキーを設定
const initializeAI = (apiKey: string) => {
  try {
    chatModel = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: apiKey
    });
    return true;
  } catch (error) {
    console.error('AI initialization failed:', error);
    return false;
  }
};

function createWindow(): void {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,  // セキュリティのため無効化
      contextIsolation: true,  // セキュリティのため有効化
      preload: path.join(__dirname, 'preload.js'),  // プリロードスクリプトを指定
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png'), // アイコンファイルがある場合
    show: false, // 準備完了まで非表示
    titleBarStyle: 'default'
  });

  // chat.htmlファイルをロード
  mainWindow.loadFile(path.join(__dirname, '../chat.html'));

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // 開発環境では開発者ツールを開く
    if (process.env.NODE_ENV === 'development') {
      mainWindow?.webContents.openDevTools();
    }
  });

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ウィンドウの状態をログ出力
  console.log('Main window created');
}

// IPC ハンドラーを設定
const setupIPCHandlers = () => {
  // APIキーを設定するハンドラー
  ipcMain.handle('set-api-key', async (_event: IpcMainInvokeEvent, apiKey: string) => {
    return initializeAI(apiKey);
  });

  // メッセージを送信するハンドラー
  ipcMain.handle('send-message', async (_event: IpcMainInvokeEvent, message: string) => {
    if (!chatModel) {
      throw new Error('AI model not initialized. Please set API key first.');
    }

    try {
      const response = await chatModel.invoke(message);
      return response.content;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  });

  // バージョン情報を取得するハンドラー
  ipcMain.handle('get-version', async (_event: IpcMainInvokeEvent) => {
    return process.versions.electron;
  });
};

// Electronの初期化が完了したときに実行
app.whenReady().then(() => {
  createWindow();
  setupIPCHandlers();

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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// アプリケーション終了時の処理
app.on('before-quit', (event) => {
  console.log('Application is about to quit');
});

// セキュリティ: 新しいウィンドウの作成を制御
app.on('web-contents-created', (_event, contents) => {
  // 外部URLは既定のブラウザで開く
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
});
