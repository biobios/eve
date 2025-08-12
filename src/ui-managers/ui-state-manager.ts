// UI状態管理を担当するクラス

export interface UIStateElements {
    // セクション
    apiKeySection: HTMLDivElement;
    sessionSection: HTMLDivElement;
    apiKeyManagementSection: HTMLDivElement;

    // 入力・ボタン
    chatInput: HTMLTextAreaElement;
    sendBtn: HTMLButtonElement;
    clearHistoryBtn: HTMLButtonElement;
}

/**
 * アプリケーションのUI状態管理を担当するクラス
 * 各UI要素の有効/無効、表示/非表示を管理
 */
export class UIStateManager {
    private elements: UIStateElements;
    private isApiKeySet = false;
    private hasSession = false;
    private isLoading = false;
    private isNewConversationMode = false; // 新しい会話モードフラグ

    constructor(elements: UIStateElements) {
        this.elements = elements;
    }

    /**
     * APIキー設定状態を更新
     * @param isSet APIキーが設定されているかどうか
     */
    public setApiKeyState(isSet: boolean): void {
        this.isApiKeySet = isSet;
        this.updateUIState();

        if (isSet) {
            this.elements.apiKeySection.classList.add('hidden');
            this.elements.sessionSection.classList.remove('hidden');
            this.elements.apiKeyManagementSection.classList.remove('hidden');
        } else {
            this.elements.apiKeySection.classList.remove('hidden');
            this.elements.sessionSection.classList.add('hidden');
            this.elements.apiKeyManagementSection.classList.add('hidden');
        }
    }

    /**
     * セッション状態を更新
     * @param hasSession セッションが選択されているかどうか
     */
    public setSessionState(hasSession: boolean): void {
        this.hasSession = hasSession;
        if (hasSession) {
            this.isNewConversationMode = false; // セッションがあるときは新しい会話モードを無効化
        }
        this.updateUIState();
    }

    /**
     * 新しい会話モードを設定
     * @param isNewConversationMode 新しい会話モードかどうか
     */
    public setNewConversationMode(isNewConversationMode: boolean): void {
        this.isNewConversationMode = isNewConversationMode;
        if (isNewConversationMode) {
            this.hasSession = false; // 新しい会話モードではセッション状態をfalseに
        }
        this.updateUIState();
    }

    /**
     * ローディング状態を更新
     * @param isLoading ローディング中かどうか
     */
    public setLoadingState(isLoading: boolean): void {
        this.isLoading = isLoading;
        this.updateUIState();
    }

    /**
     * UI状態を全体的に更新
     */
    public updateUIState(): void {
        const isEnabled = this.isApiKeySet && this.hasSession && !this.isLoading;
        const isInputEnabled = this.isApiKeySet && (this.hasSession || this.isNewConversationMode) && !this.isLoading;

        // チャット関連の有効/無効
        this.elements.chatInput.disabled = !isInputEnabled;
        this.elements.sendBtn.disabled = !isInputEnabled;
        this.elements.clearHistoryBtn.disabled = !isEnabled;
    }

    /**
     * すべての状態を一度に設定
     * @param state 状態オブジェクト
     */
    public setState(state: {
        isApiKeySet?: boolean;
        hasSession?: boolean;
        isLoading?: boolean;
        isNewConversationMode?: boolean;
    }): void {
        if (state.isApiKeySet !== undefined) {
            this.isApiKeySet = state.isApiKeySet;
        }
        if (state.hasSession !== undefined) {
            this.hasSession = state.hasSession;
        }
        if (state.isLoading !== undefined) {
            this.isLoading = state.isLoading;
        }
        if (state.isNewConversationMode !== undefined) {
            this.isNewConversationMode = state.isNewConversationMode;
        }

        this.updateUIState();

        // APIキー設定時の表示制御
        if (state.isApiKeySet !== undefined) {
            if (state.isApiKeySet) {
                this.elements.apiKeySection.classList.add('hidden');
                this.elements.sessionSection.classList.remove('hidden');
                this.elements.apiKeyManagementSection.classList.remove('hidden');
            } else {
                this.elements.apiKeySection.classList.remove('hidden');
                this.elements.sessionSection.classList.add('hidden');
                this.elements.apiKeyManagementSection.classList.add('hidden');
            }
        }
    }

    /**
     * 現在の状態を取得
     * @returns 現在のUI状態
     */
    public getState(): { isApiKeySet: boolean; hasSession: boolean; isLoading: boolean; isNewConversationMode: boolean } {
        return {
            isApiKeySet: this.isApiKeySet,
            hasSession: this.hasSession,
            isLoading: this.isLoading,
            isNewConversationMode: this.isNewConversationMode
        };
    }

    /**
     * 初期化完了時のUI状態設定
     */
    public setInitializedState(): void {
        this.setState({
            isApiKeySet: true,
            hasSession: false,
            isLoading: false
        });
    }

    /**
     * リセット（初期状態に戻す）
     */
    public reset(): void {
        this.setState({
            isApiKeySet: false,
            hasSession: false,
            isLoading: false,
            isNewConversationMode: false
        });
    }

    /**
     * エラー状態の設定
     */
    public setErrorState(): void {
        this.setState({
            isLoading: false
        });
    }

    /**
     * 有効な状態かチェック
     * @returns 操作可能な状態かどうか
     */
    public isOperational(): boolean {
        return this.isApiKeySet && this.hasSession && !this.isLoading;
    }

    /**
     * 入力可能な状態かチェック
     * @returns 入力可能な状態かどうか
     */
    public isInputEnabled(): boolean {
        return this.isApiKeySet && (this.hasSession || this.isNewConversationMode) && !this.isLoading;
    }
}
