// リファクタリング後のチャットアプリメインクラス
// 各マネージャーを統合して全体の制御を行う

import {
    ApiKeyElements,
    ApiKeyUIManager,
    ChatElements,
    ChatManager,
    ConfirmDialogElements,
    DialogManager,
    EventHandlers,
    SessionElements,
    SessionUIManager,
    SidebarElements,
    SidebarManager,
    StatusManager,
    UIElementManager,
    UIStateElements,
    UIStateManager
} from './ui-managers/index.js';

/**
 * 統合マネージャー - 各機能マネージャーを統合
 * 
 * 責務:
 * - 各マネージャーの初期化
 * - イベントハンドリングの調整
 * - アプリケーションライフサイクルの管理
 */
class ChatApp {
    // UI管理
    private uiElementManager!: UIElementManager;
    private statusManager!: StatusManager;
    private dialogManager!: DialogManager;
    private uiStateManager!: UIStateManager;
    private sidebarManager!: SidebarManager;

    // 機能管理
    private chatManager!: ChatManager;
    private sessionManager!: SessionUIManager;
    private apiKeyManager!: ApiKeyUIManager;

    constructor() {
        this.initializeManagers();
        this.init();
    }

    /**
     * 各マネージャーを初期化
     */
    private initializeManagers(): void {
        // UI要素管理の初期化
        this.uiElementManager = new UIElementManager();
        const elements = this.uiElementManager.getElements();

        // ステータス管理の初期化
        this.statusManager = new StatusManager(elements.status);

        // ダイアログ管理の初期化
        const confirmDialogElements: ConfirmDialogElements = {
            modal: elements.confirmModal,
            title: elements.confirmTitle,
            message: elements.confirmMessage,
            okBtn: elements.confirmOkBtn,
            cancelBtn: elements.confirmCancelBtn
        };
        this.dialogManager = new DialogManager(confirmDialogElements);

        // チャット管理の初期化
        const chatElements: ChatElements = {
            messagesContainer: elements.chatMessagesContainer,
            input: elements.chatInput,
            sendBtn: elements.sendBtn,
            sendBtnText: elements.sendBtnText,
            sendBtnLoading: elements.sendBtnLoading,
            clearHistoryBtn: elements.clearHistoryBtn
        };
        this.chatManager = new ChatManager(chatElements);

        // セッション管理の初期化
        const sessionElements: SessionElements = {
            section: elements.sessionSection,
            list: elements.sessionList,
            newBtn: elements.newConversationBtn,
            contextMenu: elements.sessionContextMenu,
            deleteMenuItem: elements.deleteSessionMenuItem
        };
        this.sessionManager = new SessionUIManager(sessionElements);

        // セッションクリックのコールバックを設定
        this.sessionManager.setOnSessionClickCallback(this.handleSessionSwitch.bind(this));

        // APIキー管理の初期化
        const apiKeyElements: ApiKeyElements = {
            section: elements.apiKeySection,
            input: elements.apiKeyInput,
            saveCheckbox: elements.saveApiKeyCheckbox,
            setBtn: elements.setApiKeyBtn,
            cancelBtn: elements.cancelApiKeyBtn,
            deleteSavedBtn: elements.deleteSavedApiKeyBtn,
            managementSection: elements.apiKeyManagementSection,
            toggleManagement: elements.toggleApiKeyManagement,
            managementContent: elements.apiKeyManagementContent,
            list: elements.apiKeyList,
            showAddFormBtn: elements.showAddApiKeyFormBtn,
            addForm: elements.addApiKeyForm,
            addService: elements.addApiKeyService,
            addModel: elements.addApiKeyModel,
            addValue: elements.addApiKeyValue,
            addDescription: elements.addApiKeyDescription,
            addBtn: elements.addApiKeyBtn,
            cancelAddBtn: elements.cancelAddApiKeyBtn
        };
        this.apiKeyManager = new ApiKeyUIManager(apiKeyElements);

        // サイドバー管理の初期化
        const sidebarElements: SidebarElements = {
            hamburgerBtn: elements.hamburgerBtn,
            sidebar: elements.sidebar,
            sidebarClose: elements.sidebarClose
        };
        this.sidebarManager = new SidebarManager(sidebarElements);
        this.sidebarManager.setupClickOutside();

        // UI状態管理の初期化
        const uiStateElements: UIStateElements = {
            apiKeySection: elements.apiKeySection,
            sessionSection: elements.sessionSection,
            apiKeyManagementSection: elements.apiKeyManagementSection,
            chatInput: elements.chatInput,
            sendBtn: elements.sendBtn,
            clearHistoryBtn: elements.clearHistoryBtn
        };
        this.uiStateManager = new UIStateManager(uiStateElements);
    }

    /**
     * アプリケーションを初期化
     */
    private async init(): Promise<void> {
        console.log('ChatApp initializing...');

        // イベントハンドラーを設定
        this.bindEvents();

        // APIキーの確認
        await this.checkApiKey();

        console.log('ChatApp initialized successfully');
    }

    /**
     * イベントハンドラーを設定
     */
    private bindEvents(): void {
        const handlers: EventHandlers = {
            // サイドバー関連
            onToggleSidebar: this.handleToggleSidebar.bind(this),
            onCloseSidebar: this.handleCloseSidebar.bind(this),

            // API関連
            onSetApiKey: this.handleSetApiKey.bind(this),
            onDeleteSavedApiKey: this.handleDeleteSavedApiKey.bind(this),
            onApiKeyEnter: this.handleKeyPress.bind(this),

            // APIキー管理関連
            onToggleApiKeyManagement: this.handleToggleApiKeyManagement.bind(this),
            onShowAddApiKeyForm: this.handleShowAddApiKeyForm.bind(this),
            onAddApiKey: this.handleAddApiKey.bind(this),
            onCancelAddApiKey: this.handleCancelAddApiKey.bind(this),

            // セッション関連
            onNewConversation: this.handleNewConversation.bind(this),
            onDeleteSession: this.handleDeleteSession.bind(this),

            // チャット関連
            onSendMessage: this.handleSendMessage.bind(this),
            onChatInputEnter: this.handleKeyPress.bind(this),
            onChatInputChange: () => { }, // 必要に応じて実装
            onClearHistory: this.handleClearHistory.bind(this)
        };

        this.uiElementManager.setupEventListeners(handlers);
    }    /**
     * APIキーの確認と初期化
     */
    private async checkApiKey(): Promise<void> {
        try {
            // 保存されたAPIキーの確認
            const hasSavedKey = await this.apiKeyManager.checkForSavedApiKey();

            if (hasSavedKey) {
                // APIキーが設定されている場合、セッション管理を表示
                this.uiStateManager.setApiKeyState(true);
                await this.loadSessions();
            } else {
                // APIキーが設定されていない場合、APIキー入力を表示
                this.uiStateManager.setApiKeyState(false);
            }
        } catch (error) {
            console.error('Failed to check API key:', error);
            this.statusManager.showErrorStatus('APIキーの確認に失敗しました');
        }
    }

    /**
     * セッション一覧をロード
     */
    private async loadSessions(): Promise<void> {
        try {
            await this.sessionManager.loadSessions();
            await this.apiKeyManager.loadActiveApiKeyId();
        } catch (error) {
            console.error('Failed to load sessions:', error);
            this.statusManager.showErrorStatus('セッションの読み込みに失敗しました');
        }
    }

    /**
     * セッション切り替えハンドラー（コールバック用）
     */
    private async handleSessionSwitch(sessionId: string): Promise<void> {
        const result = await this.sessionManager.switchSession(sessionId);
        if (result.success && result.session) {
            this.chatManager.setCurrentSession(sessionId);
            await this.chatManager.loadConversationHistory(sessionId);
            // 新しい会話モードを無効にして、セッション状態を有効に
            this.uiStateManager.setNewConversationMode(false);
            this.uiStateManager.setSessionState(true);
            this.statusManager.showConnectedStatus(`セッション: ${result.session.name}`);
        } else {
            this.statusManager.showErrorStatus(`セッションの切り替えに失敗しました${result.error ? ': ' + result.error : ''}`);
        }
    }

    // イベントハンドラー実装

    /**
     * 新しい会話開始イベントハンドラー
     * セッションは作成せず、UI状態のみリセット
     */
    private handleNewConversation(): void {
        try {
            // 現在のセッション状態をクリア
            this.chatManager.setCurrentSession(null);
            this.chatManager.clearMessages();
            this.sessionManager.clearCurrentSession();

            // UI状態を新しい会話モードに設定
            this.uiStateManager.setNewConversationMode(true);
            this.statusManager.showStatus('新しい会話を開始できます。メッセージを入力してください。');
        } catch (error) {
            console.error('New conversation error:', error);
            this.statusManager.showErrorStatus('新しい会話の開始に失敗しました');
        }
    }

    /**
     * セッション削除イベントハンドラー
     */
    private async handleDeleteSession(): Promise<void> {
        const confirmed = await this.dialogManager.showDeleteConfirmDialog('セッション');
        if (confirmed) {
            // 現在表示中のセッションIDを取得
            const currentDisplayedSessionId = this.chatManager.getCurrentSessionId();

            const result = await this.sessionManager.deleteSession(); // sessionIdは右クリックメニューから取得
            if (result.success) {
                // 削除されたセッションが現在表示中のセッションと同じ場合のみ画面をリセット
                if (result.deletedSessionId && result.deletedSessionId === currentDisplayedSessionId) {
                    this.chatManager.setCurrentSession(null);
                    this.chatManager.clearMessages();
                    this.uiStateManager.setSessionState(false);
                    this.statusManager.showConnectedStatus('✅ 現在のセッションが削除されました');
                } else {
                    this.statusManager.showConnectedStatus('✅ セッションが削除されました');
                }
            } else {
                this.statusManager.showErrorStatus(`❌ セッションの削除に失敗しました${result.error ? ': ' + result.error : ''}`);
            }
        }
    }

    /**
     * メッセージ送信イベントハンドラー
     */
    private async handleSendMessage(): Promise<void> {
        const messageText = this.chatManager.getInputValue();
        if (!messageText) return;

        if (this.chatManager.getIsLoading()) {
            this.statusManager.showErrorStatus('メッセージ送信中です。しばらくお待ちください。');
            return;
        }

        this.uiStateManager.setLoadingState(true);
        this.statusManager.showStatus('メッセージを送信中...');

        try {
            // 現在のセッションが存在しない場合、新しいセッションを作成
            let currentSession = this.sessionManager.getCurrentSession();
            let isNewlyCreatedSession = false;

            if (!currentSession) {
                const result = await this.sessionManager.createNewSession();
                if (result.success && result.session) {
                    currentSession = result.session;
                    isNewlyCreatedSession = true;
                    this.chatManager.setCurrentSession(currentSession.id);
                    // 新しい会話モードを無効にして、セッション状態を有効に
                    this.uiStateManager.setNewConversationMode(false);
                    this.uiStateManager.setSessionState(true);
                    this.statusManager.showStatus('新しいセッションを作成しました...');
                } else {
                    this.statusManager.showErrorStatus(`新しいセッションの作成に失敗しました${result.error ? ': ' + result.error : ''}`);
                    this.uiStateManager.setLoadingState(false);
                    return;
                }
            }

            const result = await this.chatManager.sendMessage(messageText);
            if (result.success) {
                // メッセージ送信成功後は、セッション一覧を更新（動的セッション名反映）
                if (isNewlyCreatedSession) {
                    await this.sessionManager.loadSessions();
                }
                this.statusManager.showConnectedStatus('✅ メッセージを送信しました');
            } else {
                this.statusManager.showErrorStatus(`❌ ${result.error || 'メッセージの送信に失敗しました'}`);
            }
        } catch (error) {
            console.error('Send message error:', error);
            this.statusManager.showErrorStatus('❌ メッセージの送信中にエラーが発生しました');
        } finally {
            this.uiStateManager.setLoadingState(false);
        }
    }

    /**
     * 履歴クリアイベントハンドラー
     */
    private async handleClearHistory(): Promise<void> {
        const confirmed = await this.dialogManager.showClearConfirmDialog('会話履歴');
        if (confirmed) {
            const success = await this.chatManager.clearHistory();
            if (success) {
                this.statusManager.showConnectedStatus('✅ 会話履歴をクリアしました');
            } else {
                this.statusManager.showErrorStatus('❌ 会話履歴のクリアに失敗しました');
            }
        }
    }

    /**
     * キー押下イベントハンドラー
     */
    private handleKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSendMessage();
        }
    }

    /**
     * APIキー設定イベントハンドラー
     */
    private async handleSetApiKey(): Promise<void> {
        const apiKey = this.apiKeyManager.getApiKeyInput();
        const saveKey = this.apiKeyManager.getSaveKeyCheckbox();

        if (!apiKey) {
            this.statusManager.showErrorStatus('APIキーを入力してください');
            return;
        }

        this.statusManager.showStatus('APIキーを設定中...');

        const result = await this.apiKeyManager.setApiKey(apiKey, saveKey);
        if (result.success) {
            this.uiStateManager.setApiKeyState(true);
            await this.loadSessions();
            this.statusManager.showConnectedStatus('✅ APIキーが設定されました');
        } else {
            this.statusManager.showErrorStatus(`❌ APIキーの設定に失敗しました${result.error ? ': ' + result.error : ''}`);
        }
    }

    /**
     * APIキー設定キャンセルイベントハンドラー
     */
    private handleCancelApiKey(): void {
        // 必要に応じて実装
        console.log('Cancel API key setup');
    }

    /**
     * 保存されたAPIキー削除イベントハンドラー
     */
    private async handleDeleteSavedApiKey(): Promise<void> {
        const confirmed = await this.dialogManager.showDeleteConfirmDialog('保存されたAPIキー');
        if (confirmed) {
            const result = await this.apiKeyManager.deleteSavedApiKey();
            if (result.success) {
                this.statusManager.showConnectedStatus('✅ 保存されたAPIキーが削除されました');
            } else {
                this.statusManager.showErrorStatus(`❌ APIキーの削除に失敗しました${result.error ? ': ' + result.error : ''}`);
            }
        }
    }

    /**
     * APIキー管理トグルイベントハンドラー
     */
    private handleToggleApiKeyManagement(): void {
        this.apiKeyManager.toggleApiKeyManagement();
    }

    /**
     * APIキー追加フォーム表示イベントハンドラー
     */
    private handleShowAddApiKeyForm(): void {
        this.apiKeyManager.showAddApiKeyForm();
    }

    /**
     * APIキー追加イベントハンドラー
     */
    private async handleAddApiKey(): Promise<void> {
        const result = await this.apiKeyManager.addApiKey();
        if (result.success) {
            this.statusManager.showConnectedStatus('✅ APIキーが追加されました');
        } else {
            this.statusManager.showErrorStatus(`❌ APIキーの追加に失敗しました${result.error ? ': ' + result.error : ''}`);
        }
    }

    /**
     * APIキー追加キャンセルイベントハンドラー
     */
    private handleCancelAddApiKey(): void {
        this.apiKeyManager.hideAddApiKeyForm();
    }

    /**
     * サイドバー開閉切り替えイベントハンドラー
     */
    private handleToggleSidebar(): void {
        this.sidebarManager.toggleSidebar();
    }

    /**
     * サイドバー閉じるイベントハンドラー
     */
    private handleCloseSidebar(): void {
        this.sidebarManager.closeSidebar();
    }

    /**
     * アクティブAPIキー設定（グローバル関数として呼び出される）
     */
    public async setActiveApiKey(apiKeyId: number): Promise<void> {
        const result = await this.apiKeyManager.setActiveApiKey(apiKeyId);
        if (result.success) {
            this.statusManager.showConnectedStatus('✅ APIキーが切り替わりました');
        } else {
            this.statusManager.showErrorStatus(`❌ APIキーの切り替えに失敗しました${result.error ? ': ' + result.error : ''}`);
        }
    }

    /**
     * APIキー削除（グローバル関数として呼び出される）
     */
    public async deleteApiKey(apiKeyId: number): Promise<void> {
        const confirmed = await this.dialogManager.showDeleteConfirmDialog('APIキー');

        if (confirmed) {
            const result = await this.apiKeyManager.deleteApiKey(apiKeyId);
            if (result.success) {
                this.statusManager.showConnectedStatus('✅ APIキーが削除されました');
            } else {
                this.statusManager.showErrorStatus(`❌ APIキーの削除に失敗しました${result.error ? ': ' + result.error : ''}`);
            }
        }
    }
}

// グローバルなChatAppインスタンス（HTMLから呼び出すため）
let chatApp: ChatApp;

// アプリを初期化
document.addEventListener('DOMContentLoaded', () => {
    chatApp = new ChatApp();
    // グローバルに公開（HTMLのonclick属性から呼び出すため）
    (window as any).chatApp = chatApp;
});
