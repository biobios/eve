// チャットアプリ用のフロントエンド TypeScript ファイル

interface ChatMessage {
    type: 'user' | 'ai' | 'error';
    content: string;
    timestamp: Date;
}

class ChatApp {
    private isApiKeySet = false;
    private isLoading = false;
    private chatMessages: ChatMessage[] = [];

    private elements = {
        apiKeySection: document.getElementById('apiKeySection') as HTMLDivElement,
        apiKeyInput: document.getElementById('apiKeyInput') as HTMLInputElement,
        setApiKeyBtn: document.getElementById('setApiKeyBtn') as HTMLButtonElement,
        cancelApiKeyBtn: document.getElementById('cancelApiKeyBtn') as HTMLButtonElement,
        status: document.getElementById('status') as HTMLDivElement,
        chatMessagesContainer: document.getElementById('chatMessages') as HTMLDivElement,
        chatInput: document.getElementById('chatInput') as HTMLTextAreaElement,
        sendBtn: document.getElementById('sendBtn') as HTMLButtonElement,
        sendBtnText: document.getElementById('sendBtnText') as HTMLSpanElement,
        sendBtnLoading: document.getElementById('sendBtnLoading') as HTMLSpanElement
    };

    constructor() {
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.updateUI();
    }

    private setupEventListeners(): void {
        // API キー設定ボタン
        this.elements.setApiKeyBtn.addEventListener('click', () => this.handleSetApiKey());

        // API キー入力でEnterキー
        this.elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSetApiKey();
            }
        });

        // チャット送信ボタン
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());

        // チャット入力でEnterキー（Shift+Enterで改行）
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // チャット入力の自動リサイズ
        this.elements.chatInput.addEventListener('input', () => this.autoResizeTextarea());
    }

    private async handleSetApiKey(): Promise<void> {
        const apiKey = this.elements.apiKeyInput.value.trim();

        if (!apiKey) {
            this.showStatus('API キーを入力してください', 'error');
            return;
        }

        this.showStatus('API キーを設定中...', '');
        this.elements.setApiKeyBtn.disabled = true;

        try {
            const success = await (window as any).electronAPI.setApiKey(apiKey);

            if (success) {
                this.isApiKeySet = true;
                this.showStatus('✅ 接続完了！チャットを開始できます', 'connected');
                this.elements.apiKeySection.classList.add('hidden');
                this.elements.chatInput.disabled = false;
                this.elements.sendBtn.disabled = false;
                this.elements.chatInput.focus();

                // ウェルカムメッセージを追加
                this.addMessage({
                    type: 'ai',
                    content: 'API キーが正常に設定されました！何でもお聞きください。😊',
                    timestamp: new Date()
                });
            } else {
                this.showStatus('❌ API キーの設定に失敗しました', 'error');
            }
        } catch (error) {
            console.error('API Key setup error:', error);
            this.showStatus('❌ API キーの設定中にエラーが発生しました', 'error');
        } finally {
            this.elements.setApiKeyBtn.disabled = false;
        }
    }

    private async handleSendMessage(): Promise<void> {
        if (!this.isApiKeySet || this.isLoading) return;

        const messageText = this.elements.chatInput.value.trim();
        if (!messageText) return;

        // ユーザーメッセージを追加
        const userMessage: ChatMessage = {
            type: 'user',
            content: messageText,
            timestamp: new Date()
        };
        this.addMessage(userMessage);

        // 入力をクリア
        this.elements.chatInput.value = '';
        this.autoResizeTextarea();

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

        } catch (error) {
            console.error('Send message error:', error);

            // エラーメッセージを追加
            const errorMessage: ChatMessage = {
                type: 'error',
                content: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            this.addMessage(errorMessage);
        } finally {
            this.setLoading(false);
            this.elements.chatInput.focus();
        }
    }

    private addMessage(message: ChatMessage): void {
        this.chatMessages.push(message);

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;

        // マークダウン風のテキストを簡単にフォーマット
        let formattedContent = message.content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px;">$1</code>')
            .replace(/\n/g, '<br>');

        messageElement.innerHTML = formattedContent;

        this.elements.chatMessagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    private setLoading(loading: boolean): void {
        this.isLoading = loading;
        this.elements.sendBtn.disabled = loading || !this.isApiKeySet;
        this.elements.chatInput.disabled = loading;

        if (loading) {
            this.elements.sendBtnText.style.display = 'none';
            this.elements.sendBtnLoading.style.display = 'inline-block';
        } else {
            this.elements.sendBtnText.style.display = 'inline';
            this.elements.sendBtnLoading.style.display = 'none';
        }
    }

    private showStatus(message: string, type: '' | 'connected' | 'error'): void {
        this.elements.status.textContent = message;
        this.elements.status.className = `status ${type}`;
    }

    private autoResizeTextarea(): void {
        const textarea = this.elements.chatInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            this.elements.chatMessagesContainer.scrollTop = this.elements.chatMessagesContainer.scrollHeight;
        }, 100);
    }

    private updateUI(): void {
        this.elements.chatInput.disabled = !this.isApiKeySet;
        this.elements.sendBtn.disabled = !this.isApiKeySet;
    }
}

// アプリを初期化
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
