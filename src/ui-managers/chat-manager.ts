// チャット機能の管理を担当するクラス

export interface ChatMessage {
    type: 'user' | 'ai' | 'error';
    content: string;
    timestamp: Date;
}

export interface ChatElements {
    messagesContainer: HTMLDivElement;
    input: HTMLTextAreaElement;
    sendBtn: HTMLButtonElement;
    sendBtnText: HTMLSpanElement;
    sendBtnLoading: HTMLSpanElement;
    clearHistoryBtn: HTMLButtonElement;
}

/**
 * チャット機能の管理を担当するクラス
 * メッセージの送受信、表示、履歴管理を行う
 */
export class ChatManager {
    private elements: ChatElements;
    private messages: ChatMessage[] = [];
    private isLoading = false;
    private currentSessionId: string | null = null;

    constructor(elements: ChatElements) {
        this.elements = elements;
    }

    /**
     * メッセージを追加してUIに表示
     * @param message 追加するメッセージ
     */
    public addMessage(message: ChatMessage): void {
        this.messages.push(message);

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;

        // マークダウン風のテキストを簡単にフォーマット
        const formattedContent = this.formatMessageContent(message.content);
        messageElement.innerHTML = formattedContent;

        this.elements.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * メッセージ内容をフォーマット
     * @param content 元のメッセージ内容
     * @returns フォーマット済みHTML
     */
    private formatMessageContent(content: string): string {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    /**
     * チャットメッセージを送信
     * @param messageText 送信するメッセージ
     * @returns 送信結果
     */
    public async sendMessage(messageText: string): Promise<{ success: boolean; response?: string; error?: string }> {
        if (!messageText.trim()) {
            return { success: false, error: 'メッセージが空です' };
        }

        if (!this.currentSessionId) {
            return { success: false, error: 'セッションが選択されていません' };
        }

        // ユーザーメッセージを追加
        const userMessage: ChatMessage = {
            type: 'user',
            content: messageText,
            timestamp: new Date()
        };
        this.addMessage(userMessage);

        // 入力をクリア
        this.clearInput();

        // ローディング状態を設定
        this.setLoading(true);

        try {
            const response = await (window as any).electronAPI.sendMessage(messageText);

            // AI レスポンスを追加
            const aiMessage: ChatMessage = {
                type: 'ai',
                content: response,
                timestamp: new Date()
            };
            this.addMessage(aiMessage);

            return { success: true, response };

        } catch (error) {
            console.error('Send message error:', error);

            // エラーメッセージを追加
            const errorMessage: ChatMessage = {
                type: 'error',
                content: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            this.addMessage(errorMessage);

            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };

        } finally {
            this.setLoading(false);
            this.focusInput();
        }
    }

    /**
     * 会話履歴をクリア
     */
    public async clearHistory(): Promise<boolean> {
        if (!this.currentSessionId) {
            return false;
        }

        try {
            await (window as any).electronAPI.clearConversation();
            this.clearMessages();

            // 成功メッセージを表示
            this.addMessage({
                type: 'ai',
                content: '✅ 会話履歴がクリアされました。新しい会話を開始できます。',
                timestamp: new Date()
            });

            return true;

        } catch (error) {
            console.error('Clear history error:', error);
            this.addMessage({
                type: 'error',
                content: 'エラー: 会話履歴のクリアに失敗しました。',
                timestamp: new Date()
            });

            return false;
        }
    }

    /**
     * 会話履歴をロード
     * @param sessionId セッションID
     */
    public async loadConversationHistory(sessionId: string): Promise<void> {
        if (!sessionId) return;

        this.currentSessionId = sessionId;

        try {
            const history = await (window as any).electronAPI.getConversationHistory(sessionId);
            this.clearMessages();

            history.forEach((msg: any) => {
                this.addMessage({
                    type: msg.type,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp)
                });
            });

        } catch (error) {
            console.error('Load conversation history error:', error);
        }
    }

    /**
     * UIからメッセージをクリア
     */
    public clearMessages(): void {
        this.messages = [];
        this.elements.messagesContainer.innerHTML = '';
    }

    /**
     * ローディング状態を設定
     * @param loading ローディング状態
     */
    public setLoading(loading: boolean): void {
        this.isLoading = loading;

        if (loading) {
            this.elements.sendBtnText.style.display = 'none';
            this.elements.sendBtnLoading.style.display = 'inline-block';
        } else {
            this.elements.sendBtnText.style.display = 'inline';
            this.elements.sendBtnLoading.style.display = 'none';
        }
    }

    /**
     * 入力フィールドをクリア
     */
    public clearInput(): void {
        this.elements.input.value = '';
    }

    /**
     * 入力フィールドにフォーカス
     */
    public focusInput(): void {
        this.elements.input.focus();
    }

    /**
     * 入力内容を取得
     * @returns 入力内容
     */
    public getInputValue(): string {
        return this.elements.input.value.trim();
    }

    /**
     * チャットコンテナを最下部にスクロール
     */
    private scrollToBottom(): void {
        setTimeout(() => {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * ローディング状態を取得
     * @returns ローディング状態
     */
    public getIsLoading(): boolean {
        return this.isLoading;
    }

    /**
     * 現在のセッションIDを設定
     * @param sessionId セッションID
     */
    public setCurrentSession(sessionId: string | null): void {
        this.currentSessionId = sessionId;
    }

    /**
     * 現在のセッションIDを取得
     * @returns セッションID
     */
    public getCurrentSessionId(): string | null {
        return this.currentSessionId;
    }

    /**
     * メッセージ配列を取得
     * @returns メッセージ配列
     */
    public getMessages(): ChatMessage[] {
        return [...this.messages];
    }
}
