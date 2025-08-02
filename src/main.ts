import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';

// ウィンドウの参照を保持
let mainWindow: BrowserWindow | null = null;

// Gemini AI インスタンス
let chatModel: ChatGoogleGenerativeAI | null = null;

// LangGraph workflow
let workflow: any = null;

// 会話履歴を保持
let conversationHistory: Array<HumanMessage | AIMessage> = [];

// チャット状態の型定義
interface ChatState {
  messages: Array<HumanMessage | AIMessage>;
}

// APIキーを設定してLangGraphワークフローを初期化
const initializeAI = (apiKey: string) => {
  try {
    chatModel = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: apiKey
    });

    // LangGraphワークフローを作成
    workflow = createChatWorkflow();

    return true;
  } catch (error) {
    console.error('AI initialization failed:', error);
    return false;
  }
};

// LangGraphワークフローを作成
const createChatWorkflow = () => {
  // チャットノード: AIモデルを呼び出してレスポンスを生成
  const chatNode = async (state: typeof MessagesAnnotation.State) => {
    if (!chatModel) {
      throw new Error('Chat model not initialized');
    }

    try {
      const response = await chatModel.invoke(state.messages);
      return { messages: [response] };
    } catch (error) {
      console.error('Chat node error:', error);
      throw error;
    }
  };

  // StateGraphを作成
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("chat", chatNode)
    .addEdge("__start__", "chat")
    .addEdge("chat", "__end__");

  return graph.compile();
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
    if (!workflow) {
      throw new Error('AI workflow not initialized. Please set API key first.');
    }

    try {
      // HumanMessageを作成
      const humanMessage = new HumanMessage({ content: message });
      
      // 会話履歴に追加
      conversationHistory.push(humanMessage);

      // LangGraphワークフローを実行（履歴を含む）
      const result = await workflow.invoke({
        messages: [...conversationHistory]
      });

      // 最後のメッセージ（AIの応答）を取得
      const lastMessage = result.messages[result.messages.length - 1];
      
      // AIの応答も履歴に追加
      const aiMessage = new AIMessage({ content: lastMessage.content });
      conversationHistory.push(aiMessage);
      
      return lastMessage.content;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  });

  // 会話履歴をクリアするハンドラー
  ipcMain.handle('clear-conversation', async (_event: IpcMainInvokeEvent) => {
    conversationHistory = [];
    return true;
  });

  // 会話履歴を取得するハンドラー
  ipcMain.handle('get-conversation-history', async (_event: IpcMainInvokeEvent) => {
    return conversationHistory.map(msg => ({
      type: msg instanceof HumanMessage ? 'user' : 'ai',
      content: msg.content,
      timestamp: new Date() // 実際の実装では、メッセージにタイムスタンプを含める必要があります
    }));
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
