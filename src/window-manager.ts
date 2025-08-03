/**
 * ウィンドウ管理クラス
 * Electronのメインウィンドウの作成と管理を担当
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { AIManager } from './ai-manager';

export class WindowManager {
    private mainWindow: BrowserWindow | null = null;
    private aiManager: AIManager;

    constructor(aiManager: AIManager) {
        this.aiManager = aiManager;
    }

    /**
     * メインウィンドウを作成
     */
    public createWindow(): void {
        // メインウィンドウを作成
        this.mainWindow = new BrowserWindow({
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
        this.mainWindow.loadFile(path.join(__dirname, '../chat.html'));

        // ウィンドウの準備ができたら表示
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();

            // 開発環境では開発者ツールを開く
            if (process.env.NODE_ENV === 'development') {
                this.mainWindow?.webContents.openDevTools();
            }

            // 保存されたAPIキーがあれば自動で初期化を試行
            this.aiManager.initializeFromStorage().then((initialized) => {
                if (initialized) {
                    console.log('AI initialized from saved API key');
                    // フロントエンドに初期化完了を通知
                    this.mainWindow?.webContents.send('ai-initialized', true);
                } else {
                    console.log('No saved API key found, user needs to set API key');
                    // フロントエンドに初期化が必要であることを通知
                    this.mainWindow?.webContents.send('ai-initialized', false);
                }
            }).catch((error) => {
                console.error('Failed to initialize AI from storage:', error);
                this.mainWindow?.webContents.send('ai-initialized', false);
            });
        });

        // ウィンドウが閉じられたときの処理
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // ウィンドウの状態をログ出力
        console.log('Main window created');
    }

    /**
     * メインウィンドウのインスタンスを取得
     */
    public getMainWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    /**
     * すべてのウィンドウが閉じられているかチェック
     */
    public static areAllWindowsClosed(): boolean {
        return BrowserWindow.getAllWindows().length === 0;
    }

    /**
     * セキュリティ設定: 新しいウィンドウの作成を制御
     */
    public static setupSecurityHandlers(): void {
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
    }
}
