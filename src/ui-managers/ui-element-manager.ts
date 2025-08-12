// UI要素の管理とイベントリスナー設定を担当するクラス

export interface UIElements {
    // サイドバー関連
    hamburgerBtn: HTMLButtonElement;
    sidebar: HTMLDivElement;
    sidebarClose: HTMLButtonElement;

    // API関連
    apiKeySection: HTMLDivElement;
    apiKeyInput: HTMLInputElement;
    saveApiKeyCheckbox: HTMLInputElement;
    setApiKeyBtn: HTMLButtonElement;
    cancelApiKeyBtn: HTMLButtonElement;
    deleteSavedApiKeyBtn: HTMLButtonElement;

    // セッション関連
    sessionSection: HTMLDivElement;
    sessionSelect: HTMLSelectElement;
    newConversationBtn: HTMLButtonElement;
    deleteSessionBtn: HTMLButtonElement;

    // APIキー管理関連
    apiKeyManagementSection: HTMLDivElement;
    toggleApiKeyManagement: HTMLButtonElement;
    apiKeyManagementContent: HTMLDivElement;
    apiKeyList: HTMLDivElement;
    showAddApiKeyFormBtn: HTMLButtonElement;
    addApiKeyForm: HTMLDivElement;
    addApiKeyService: HTMLSelectElement;
    addApiKeyModel: HTMLSelectElement;
    addApiKeyValue: HTMLInputElement;
    addApiKeyDescription: HTMLInputElement;
    addApiKeyBtn: HTMLButtonElement;
    cancelAddApiKeyBtn: HTMLButtonElement;

    // チャット関連
    status: HTMLDivElement;
    chatMessagesContainer: HTMLDivElement;
    chatInput: HTMLTextAreaElement;
    sendBtn: HTMLButtonElement;
    sendBtnText: HTMLSpanElement;
    sendBtnLoading: HTMLSpanElement;
    clearHistoryBtn: HTMLButtonElement;

    // 確認ダイアログ関連
    confirmModal: HTMLDivElement;
    confirmTitle: HTMLHeadingElement;
    confirmMessage: HTMLParagraphElement;
    confirmOkBtn: HTMLButtonElement;
    confirmCancelBtn: HTMLButtonElement;
}

export type EventCallback = () => void;
export type KeyboardEventCallback = (e: KeyboardEvent) => void;
export type ChangeEventCallback = (e: Event) => void;
export type ClickEventCallback = (e: MouseEvent) => void;

export interface EventHandlers {
    // サイドバー関連
    onToggleSidebar: EventCallback;
    onCloseSidebar: EventCallback;

    // API関連
    onSetApiKey: EventCallback;
    onDeleteSavedApiKey: EventCallback;
    onApiKeyEnter: KeyboardEventCallback;

    // APIキー管理関連
    onToggleApiKeyManagement: EventCallback;
    onShowAddApiKeyForm: EventCallback;
    onAddApiKey: EventCallback;
    onCancelAddApiKey: EventCallback;

    // セッション関連
    onSessionSwitch: ChangeEventCallback;
    onNewConversation: EventCallback;
    onDeleteSession: EventCallback;

    // チャット関連
    onSendMessage: EventCallback;
    onChatInputEnter: KeyboardEventCallback;
    onChatInputChange: EventCallback;
    onClearHistory: EventCallback;

    // 確認ダイアログ関連
    onConfirmOk: EventCallback;
    onConfirmCancel: EventCallback;
    onConfirmModalClick: ClickEventCallback;

    // AI初期化
    onAiInitialized?: (initialized: boolean) => void;
}

/**
 * UI要素の取得と管理を担当するクラス
 * DOM要素の取得、イベントリスナーの設定を行う
 */
export class UIElementManager {
    private elements: UIElements;

    constructor() {
        this.elements = this.initializeElements();
    }

    /**
     * 全てのDOM要素を取得して初期化
     */
    private initializeElements(): UIElements {
        return {
            // サイドバー関連
            hamburgerBtn: this.getElement('hamburgerBtn') as HTMLButtonElement,
            sidebar: this.getElement('sidebar') as HTMLDivElement,
            sidebarClose: this.getElement('sidebarClose') as HTMLButtonElement,

            // API関連
            apiKeySection: this.getElement('apiKeySection') as HTMLDivElement,
            apiKeyInput: this.getElement('apiKeyInput') as HTMLInputElement,
            saveApiKeyCheckbox: this.getElement('saveApiKeyCheckbox') as HTMLInputElement,
            setApiKeyBtn: this.getElement('setApiKeyBtn') as HTMLButtonElement,
            cancelApiKeyBtn: this.getElement('cancelApiKeyBtn') as HTMLButtonElement,
            deleteSavedApiKeyBtn: this.getElement('deleteSavedApiKeyBtn') as HTMLButtonElement,

            // セッション関連
            sessionSection: this.getElement('sessionSection') as HTMLDivElement,
            sessionSelect: this.getElement('sessionSelect') as HTMLSelectElement,
            newConversationBtn: this.getElement('newConversationBtn') as HTMLButtonElement,
            deleteSessionBtn: this.getElement('deleteSessionBtn') as HTMLButtonElement,

            // APIキー管理関連
            apiKeyManagementSection: this.getElement('apiKeyManagementSection') as HTMLDivElement,
            toggleApiKeyManagement: this.getElement('toggleApiKeyManagement') as HTMLButtonElement,
            apiKeyManagementContent: this.getElement('apiKeyManagementContent') as HTMLDivElement,
            apiKeyList: this.getElement('apiKeyList') as HTMLDivElement,
            showAddApiKeyFormBtn: this.getElement('showAddApiKeyFormBtn') as HTMLButtonElement,
            addApiKeyForm: this.getElement('addApiKeyForm') as HTMLDivElement,
            addApiKeyService: this.getElement('addApiKeyService') as HTMLSelectElement,
            addApiKeyModel: this.getElement('addApiKeyModel') as HTMLSelectElement,
            addApiKeyValue: this.getElement('addApiKeyValue') as HTMLInputElement,
            addApiKeyDescription: this.getElement('addApiKeyDescription') as HTMLInputElement,
            addApiKeyBtn: this.getElement('addApiKeyBtn') as HTMLButtonElement,
            cancelAddApiKeyBtn: this.getElement('cancelAddApiKeyBtn') as HTMLButtonElement,

            // チャット関連
            status: this.getElement('status') as HTMLDivElement,
            chatMessagesContainer: this.getElement('chatMessages') as HTMLDivElement,
            chatInput: this.getElement('chatInput') as HTMLTextAreaElement,
            sendBtn: this.getElement('sendBtn') as HTMLButtonElement,
            sendBtnText: this.getElement('sendBtnText') as HTMLSpanElement,
            sendBtnLoading: this.getElement('sendBtnLoading') as HTMLSpanElement,
            clearHistoryBtn: this.getElement('clearHistoryBtn') as HTMLButtonElement,

            // 確認ダイアログ関連
            confirmModal: this.getElement('confirmModal') as HTMLDivElement,
            confirmTitle: this.getElement('confirmTitle') as HTMLHeadingElement,
            confirmMessage: this.getElement('confirmMessage') as HTMLParagraphElement,
            confirmOkBtn: this.getElement('confirmOkBtn') as HTMLButtonElement,
            confirmCancelBtn: this.getElement('confirmCancelBtn') as HTMLButtonElement
        };
    }

    /**
     * 要素を安全に取得するヘルパーメソッド
     */
    private getElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Element with ID "${id}" not found`);
        }
        return element;
    }

    /**
     * イベントハンドラーを設定
     */
    public setupEventListeners(handlers: EventHandlers): void {
        // サイドバー関連
        this.elements.hamburgerBtn.addEventListener('click', handlers.onToggleSidebar);
        this.elements.sidebarClose.addEventListener('click', handlers.onCloseSidebar);

        // API関連
        this.elements.setApiKeyBtn.addEventListener('click', handlers.onSetApiKey);
        this.elements.deleteSavedApiKeyBtn.addEventListener('click', handlers.onDeleteSavedApiKey);
        this.elements.apiKeyInput.addEventListener('keypress', handlers.onApiKeyEnter);

        // APIキー管理関連
        this.elements.toggleApiKeyManagement.addEventListener('click', handlers.onToggleApiKeyManagement);
        this.elements.showAddApiKeyFormBtn.addEventListener('click', handlers.onShowAddApiKeyForm);
        this.elements.addApiKeyBtn.addEventListener('click', handlers.onAddApiKey);
        this.elements.cancelAddApiKeyBtn.addEventListener('click', handlers.onCancelAddApiKey);

        // セッション関連
        this.elements.sessionSelect.addEventListener('change', handlers.onSessionSwitch);
        this.elements.newConversationBtn.addEventListener('click', handlers.onNewConversation);
        this.elements.deleteSessionBtn.addEventListener('click', handlers.onDeleteSession);

        // チャット関連
        this.elements.sendBtn.addEventListener('click', handlers.onSendMessage);
        this.elements.chatInput.addEventListener('keypress', handlers.onChatInputEnter);
        this.elements.chatInput.addEventListener('input', handlers.onChatInputChange);
        this.elements.clearHistoryBtn.addEventListener('click', handlers.onClearHistory);

        // 確認ダイアログ関連
        this.elements.confirmOkBtn.addEventListener('click', handlers.onConfirmOk);
        this.elements.confirmCancelBtn.addEventListener('click', handlers.onConfirmCancel);
        this.elements.confirmModal.addEventListener('click', handlers.onConfirmModalClick);

        // AI初期化状態のリスナーを設定
        if (handlers.onAiInitialized && (window as any).electronAPI?.onAiInitialized) {
            (window as any).electronAPI.onAiInitialized(handlers.onAiInitialized);
        }
    }

    /**
     * UI要素への安全なアクセスを提供
     */
    public getElements(): UIElements {
        return this.elements;
    }

    /**
     * 特定の要素のフォーカスを設定
     */
    public focusElement(elementName: keyof UIElements): void {
        const element = this.elements[elementName];
        if (element && 'focus' in element) {
            (element as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement).focus();
        }
    }

    /**
     * テキストエリアの自動リサイズ
     */
    public autoResizeTextarea(): void {
        const textarea = this.elements.chatInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    /**
     * チャットコンテナを最下部にスクロール
     */
    public scrollToBottom(): void {
        setTimeout(() => {
            this.elements.chatMessagesContainer.scrollTop = this.elements.chatMessagesContainer.scrollHeight;
        }, 100);
    }
}
