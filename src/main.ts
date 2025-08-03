import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EncryptionKeyManager, DataEncryption, ApiKeyStorage } from './crypto-utils';

// ウィンドウの参照を保持
let mainWindow: BrowserWindow | null = null;

// Gemini AI インスタンス
let chatModel: ChatGoogleGenerativeAI | null = null;

// LangGraph workflow
let workflow: any = null;

// SQLite checkpointer for conversation persistence
let checkpointer: SqliteSaver | null = null;

// 現在のセッションID
let currentSessionId: string | null = null;

// APIキーストレージインスタンス
let apiKeyStorage: ApiKeyStorage | null = null;

// セッション管理用の型定義
interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  lastMessageAt: Date;
}

// チャット状態の型定義
interface ChatState {
  messages: Array<HumanMessage | AIMessage>;
}

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

// 保存されたAPIキーを使用してAIを初期化
const initializeAIFromStorage = async (): Promise<boolean> => {
  if (!apiKeyStorage) {
    return false;
  }

  try {
    const savedApiKey = apiKeyStorage.getApiKey('gemini');
    if (savedApiKey) {
      console.log('Found saved API key, initializing AI...');
      return await initializeAI(savedApiKey);
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize AI from storage:', error);
    return false;
  }
};

// APIキーを設定してLangGraphワークフローを初期化
const initializeAI = async (apiKey: string, saveKey: boolean = false) => {
  try {
    chatModel = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: apiKey
    });

    // SqliteSaverを初期化（アプリのデータディレクトリを使用）
    const dbPath = path.join(app.getPath('userData'), 'conversations.db');
    checkpointer = SqliteSaver.fromConnString(dbPath);

    // LangGraphワークフローを作成
    workflow = createChatWorkflow();

    // APIキーを保存する場合
    if (saveKey && apiKeyStorage) {
      apiKeyStorage.saveApiKey('gemini', apiKey);
      console.log('API key saved to storage');
    }

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

  // StateGraphを作成（checkpointerを設定）
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("chat", chatNode)
    .addEdge("__start__", "chat")
    .addEdge("chat", "__end__");

  return graph.compile({ checkpointer: checkpointer! });
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

    // 保存されたAPIキーがあれば自動で初期化を試行
    initializeAIFromStorage().then((initialized) => {
      if (initialized) {
        console.log('AI initialized from saved API key');
        // フロントエンドに初期化完了を通知
        mainWindow?.webContents.send('ai-initialized', true);
      } else {
        console.log('No saved API key found, user needs to set API key');
        // フロントエンドに初期化が必要であることを通知
        mainWindow?.webContents.send('ai-initialized', false);
      }
    }).catch((error) => {
      console.error('Failed to initialize AI from storage:', error);
      mainWindow?.webContents.send('ai-initialized', false);
    });
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
  // APIキーを設定するハンドラー（保存オプション付き）
  ipcMain.handle('set-api-key', async (_event: IpcMainInvokeEvent, apiKey: string, saveKey: boolean = false) => {
    return await initializeAI(apiKey, saveKey);
  });

  // 保存されたAPIキーが存在するかチェック
  ipcMain.handle('has-saved-api-key', async (_event: IpcMainInvokeEvent) => {
    if (!apiKeyStorage) {
      return false;
    }
    
    try {
      const savedKey = apiKeyStorage.getApiKey('gemini');
      return savedKey !== null;
    } catch (error) {
      console.error('Error checking saved API key:', error);
      return false;
    }
  });

  // 保存されたAPIキーを削除
  ipcMain.handle('delete-saved-api-key', async (_event: IpcMainInvokeEvent) => {
    if (!apiKeyStorage) {
      return false;
    }
    
    try {
      apiKeyStorage.deleteApiKey('gemini');
      console.log('Saved API key deleted');
      return true;
    } catch (error) {
      console.error('Error deleting saved API key:', error);
      return false;
    }
  });

  // AIの初期化状態をチェック
  ipcMain.handle('is-ai-initialized', async (_event: IpcMainInvokeEvent) => {
    return workflow !== null && chatModel !== null;
  });

  // 新しいセッションを作成するハンドラー
  ipcMain.handle('create-session', async (_event: IpcMainInvokeEvent) => {
    try {
      const sessionId = uuidv4();
      currentSessionId = sessionId;

      const session: ChatSession = {
        id: sessionId,
        name: '新しい会話',
        createdAt: new Date(),
        lastMessageAt: new Date()
      };

      return session;
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  });

  // セッションを切り替えるハンドラー
  ipcMain.handle('switch-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      currentSessionId = sessionId;
      return true;
    } catch (error) {
      console.error('Session switch error:', error);
      throw error;
    }
  });

  // メッセージを送信するハンドラー
  ipcMain.handle('send-message', async (_event: IpcMainInvokeEvent, message: string) => {
    if (!workflow) {
      throw new Error('AI workflow not initialized. Please set API key first.');
    }

    if (!currentSessionId) {
      throw new Error('No active session. Please create or select a session first.');
    }

    try {
      // HumanMessageを作成
      const humanMessage = new HumanMessage({ content: message });

      // LangGraphワークフローを実行（SessionIDをthreadIdとして使用）
      const result = await workflow.invoke(
        { messages: [humanMessage] },
        { configurable: { thread_id: currentSessionId } }
      );

      // 最後のメッセージ（AIの応答）を取得
      const lastMessage = result.messages[result.messages.length - 1];

      return lastMessage.content;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  });

  // 会話履歴を取得するハンドラー
  ipcMain.handle('get-conversation-history', async (_event: IpcMainInvokeEvent, sessionId?: string) => {
    if (!workflow || !checkpointer) {
      return [];
    }

    try {
      const threadId = sessionId || currentSessionId;
      if (!threadId) {
        return [];
      }

      // checkpointerから会話履歴を取得
      const checkpoint = await checkpointer.get({ configurable: { thread_id: threadId } });

      if (checkpoint && checkpoint.channel_values && checkpoint.channel_values.messages) {
        const messages = checkpoint.channel_values.messages;
        if (Array.isArray(messages)) {
          return messages.map((msg: any) => ({
            type: msg._getType() === 'human' ? 'user' : 'ai',
            content: msg.content,
            timestamp: new Date() // 実際のタイムスタンプの実装は追加できます
          }));
        }
      }

      return [];
    } catch (error) {
      console.error('Get conversation history error:', error);
      return [];
    }
  });

  // セッション一覧を取得するハンドラー
  ipcMain.handle('get-sessions', async (_event: IpcMainInvokeEvent) => {
    if (!checkpointer) {
      return [];
    }

    try {
      // checkpointerからすべてのセッションを取得
      const sessions: ChatSession[] = [];
      const checkpoints = await checkpointer.list({});

      const seenThreadIds = new Set<string>();

      for await (const checkpoint of checkpoints) {
        if (checkpoint.config && checkpoint.config.configurable && checkpoint.config.configurable.thread_id) {
          const sessionId = checkpoint.config.configurable.thread_id;

          // 重複を避ける
          if (seenThreadIds.has(sessionId)) {
            continue;
          }
          seenThreadIds.add(sessionId);

          // 会話履歴を取得してセッション名を決定
          let sessionName = '新しい会話';
          try {
            const fullCheckpoint = await checkpointer.get({ configurable: { thread_id: sessionId } });
            if (fullCheckpoint && fullCheckpoint.channel_values && fullCheckpoint.channel_values.messages) {
              const messages = fullCheckpoint.channel_values.messages;
              if (Array.isArray(messages) && messages.length > 0) {
                // 最初のユーザーメッセージを探す
                const firstUserMessage = messages.find((msg: any) => msg._getType() === 'human');
                if (firstUserMessage && firstUserMessage.content) {
                  // 最初の30文字を取得（改行や余分な空白を除去）
                  const content = firstUserMessage.content.replace(/\s+/g, ' ').trim();
                  sessionName = content.length > 30 ? content.substring(0, 30) + '...' : content;
                }
              }
            }
          } catch (err) {
            // エラーが発生した場合は、デフォルトの名前を使用
            console.warn('Failed to get session name for', sessionId, err);
          }

          // セッション情報を構築
          const session: ChatSession = {
            id: sessionId,
            name: sessionName,
            createdAt: new Date(),
            lastMessageAt: new Date()
          };

          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error('Get sessions error:', error);
      return [];
    }
  });

  // セッションを削除するハンドラー
  ipcMain.handle('delete-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      // SQLiteからセッションデータを永久削除
      if (checkpointer) {
        await checkpointer.deleteThread(sessionId);
      }

      // 現在のセッションが削除された場合はリセット
      if (currentSessionId === sessionId) {
        currentSessionId = null;
      }

      return true;
    } catch (error) {
      console.error('Delete session error:', error);
      return false;
    }
  });

  // 会話履歴をクリアするハンドラー（レガシー互換性のため）
  ipcMain.handle('clear-conversation', async (_event: IpcMainInvokeEvent) => {
    if (!currentSessionId) {
      return true;
    }

    return await ipcMain.emit('delete-session', _event, currentSessionId);
  });

  // バージョン情報を取得するハンドラー
  ipcMain.handle('get-version', async (_event: IpcMainInvokeEvent) => {
    return process.versions.electron;
  });
};

// Electronの初期化が完了したときに実行
app.whenReady().then(async () => {
  // APIキーストレージを初期化
  await initializeApiKeyStorage();
  
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
  
  // データベース接続を閉じる
  try {
    EncryptionKeyManager.closeDatabase();
    ApiKeyStorage.closeDatabase();
  } catch (error) {
    console.error('Error closing databases:', error);
  }
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
