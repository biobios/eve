// チャットアプリ用のフロントエンド TypeScript ファイル

interface ChatMessage {
    type: 'user' | 'ai' | 'error';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

class ChatApp {
    private isApiKeySet = false;
    private isLoading = false;
    private chatMessages: ChatMessage[] = [];
    private currentSession: ChatSession | null = null;
    private sessions: ChatSession[] = [];
    private confirmCallback: ((result: boolean) => void) | null = null;

    private elements = {
        apiKeySection: document.getElementById('apiKeySection') as HTMLDivElement,
        apiKeyInput: document.getElementById('apiKeyInput') as HTMLInputElement,
        setApiKeyBtn: document.getElementById('setApiKeyBtn') as HTMLButtonElement,
        cancelApiKeyBtn: document.getElementById('cancelApiKeyBtn') as HTMLButtonElement,
        sessionSection: document.getElementById('sessionSection') as HTMLDivElement,
        sessionSelect: document.getElementById('sessionSelect') as HTMLSelectElement,
        newSessionBtn: document.getElementById('newSessionBtn') as HTMLButtonElement,
        deleteSessionBtn: document.getElementById('deleteSessionBtn') as HTMLButtonElement,
        status: document.getElementById('status') as HTMLDivElement,
        chatMessagesContainer: document.getElementById('chatMessages') as HTMLDivElement,
        chatInput: document.getElementById('chatInput') as HTMLTextAreaElement,
        sendBtn: document.getElementById('sendBtn') as HTMLButtonElement,
        sendBtnText: document.getElementById('sendBtnText') as HTMLSpanElement,
        sendBtnLoading: document.getElementById('sendBtnLoading') as HTMLSpanElement,
        clearHistoryBtn: document.getElementById('clearHistoryBtn') as HTMLButtonElement,
        // 確認ダイアログ要素
        confirmModal: document.getElementById('confirmModal') as HTMLDivElement,
        confirmTitle: document.getElementById('confirmTitle') as HTMLHeadingElement,
        confirmMessage: document.getElementById('confirmMessage') as HTMLParagraphElement,
        confirmOkBtn: document.getElementById('confirmOkBtn') as HTMLButtonElement,
        confirmCancelBtn: document.getElementById('confirmCancelBtn') as HTMLButtonElement
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

        // セッション管理
        this.elements.sessionSelect.addEventListener('change', () => this.handleSessionSwitch());
        this.elements.newSessionBtn.addEventListener('click', () => this.handleNewSession());
        this.elements.deleteSessionBtn.addEventListener('click', () => this.handleDeleteSession());

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

        // 会話履歴クリアボタン
        this.elements.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());

        // 確認ダイアログ関連
        this.elements.confirmOkBtn.addEventListener('click', () => this.handleConfirmDialog(true));
        this.elements.confirmCancelBtn.addEventListener('click', () => this.handleConfirmDialog(false));

        // 確認モーダル外をクリックして閉じる
        this.elements.confirmModal.addEventListener('click', (e) => {
            if (e.target === this.elements.confirmModal) {
                this.handleConfirmDialog(false);
            }
        });
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
                this.showStatus('✅ 接続完了！セッションを作成してください', 'connected');
                this.elements.apiKeySection.classList.add('hidden');
                this.elements.sessionSection.classList.remove('hidden');

                // セッション一覧をロード
                await this.loadSessions();

                // ウェルカムメッセージを追加
                this.addMessage({
                    type: 'ai',
                    content: 'API キーが正常に設定されました！新しいセッションを作成して会話を開始してください。😊\n\n💡 複数のセッションを作成して、異なる話題で会話を管理できます。',
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
        if (!this.isApiKeySet || this.isLoading || !this.currentSession) {
            if (!this.currentSession) {
                this.showStatus('❌ セッションを選択してください', 'error');
            }
            return;
        }

        const messageText = this.elements.chatInput.value.trim();
        if (!messageText) return;

        // セッションが「新しい会話」の場合、最初のメッセージになるかチェック
        const isFirstMessage = this.currentSession.name === '新しい会話' && this.chatMessages.length === 0;

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

            // 最初のメッセージの場合、セッション一覧を更新してセッション名を更新
            if (isFirstMessage) {
                await this.loadSessions();
                this.updateSessionSelect();
            }

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
        const hasSession = !!this.currentSession;
        this.elements.sendBtn.disabled = loading || !this.isApiKeySet || !hasSession;
        this.elements.chatInput.disabled = loading || !hasSession;
        this.elements.clearHistoryBtn.disabled = loading || !this.isApiKeySet || !hasSession;

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

    private async restoreConversationHistory(): Promise<void> {
        // このメソッドは新しいセッション管理システムで削除されました
        // loadConversationHistory()を使用してください
    }

    private async handleClearHistory(): Promise<void> {
        if (!this.isApiKeySet || !this.currentSession) return;

        const confirmed = await this.showConfirmDialog(
            '会話履歴クリア',
            '現在のセッションの会話履歴をクリアしてもよろしいですか？この操作は取り消せません。'
        );

        if (!confirmed) return;

        try {
            await (window as any).electronAPI.clearConversation();

            // UI上の会話履歴もクリア
            this.clearMessages();

            // 成功メッセージを表示
            this.addMessage({
                type: 'ai',
                content: '✅ 会話履歴がクリアされました。新しい会話を開始できます。',
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Clear history error:', error);
            this.addMessage({
                type: 'error',
                content: 'エラー: 会話履歴のクリアに失敗しました。',
                timestamp: new Date()
            });
        }
    }

    private updateUI(): void {
        this.elements.chatInput.disabled = !this.isApiKeySet;
        this.elements.sendBtn.disabled = !this.isApiKeySet;
        this.elements.clearHistoryBtn.disabled = !this.isApiKeySet;
    }

    // セッション管理メソッド
    private async loadSessions(): Promise<void> {
        try {
            this.sessions = await (window as any).electronAPI.getSessions();
            this.updateSessionSelect();
        } catch (error) {
            console.error('Load sessions error:', error);
        }
    }

    private updateSessionSelect(): void {
        // セッション選択肢をクリア
        this.elements.sessionSelect.innerHTML = '<option value="">セッションを選択...</option>';

        // 各セッションを追加
        this.sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = session.name;
            if (this.currentSession && this.currentSession.id === session.id) {
                option.selected = true;
            }
            this.elements.sessionSelect.appendChild(option);
        });

        // UI状態を更新
        this.updateUIState();
    }

    private async handleSessionSwitch(): Promise<void> {
        const selectedSessionId = this.elements.sessionSelect.value;

        if (!selectedSessionId) {
            this.currentSession = null;
            this.clearMessages();
            this.updateUIState();
            return;
        }

        try {
            const success = await (window as any).electronAPI.switchSession(selectedSessionId);
            if (success) {
                this.currentSession = this.sessions.find(s => s.id === selectedSessionId) || null;
                await this.loadConversationHistory();
                this.updateUIState();
                this.showStatus(`✅ セッション "${this.currentSession?.name}" に切り替えました`, 'connected');
            }
        } catch (error) {
            console.error('Session switch error:', error);
            this.showStatus('❌ セッションの切り替えに失敗しました', 'error');
        }
    }

    private async handleNewSession(): Promise<void> {
        try {
            const newSession = await (window as any).electronAPI.createSession();
            this.currentSession = newSession;
            this.sessions.push(newSession);
            this.updateSessionSelect();
            this.clearMessages();
            this.showStatus(`✅ 新しいセッション "${newSession.name}" を作成しました`, 'connected');
        } catch (error) {
            console.error('New session error:', error);
            this.showStatus('❌ セッションの作成に失敗しました', 'error');
        }
    }

    private async handleDeleteSession(): Promise<void> {
        if (!this.currentSession) {
            this.showStatus('❌ 削除するセッションを選択してください', 'error');
            return;
        }

        const confirmed = await this.showConfirmDialog(
            'セッション削除',
            `セッション "${this.currentSession.name}" を削除しますか？この操作は取り消せません。`
        );

        if (!confirmed) return;

        try {
            const success = await (window as any).electronAPI.deleteSession(this.currentSession.id);
            if (success) {
                // セッション一覧から削除
                this.sessions = this.sessions.filter(s => s.id !== this.currentSession!.id);
                this.currentSession = null;
                this.updateSessionSelect();
                this.clearMessages();
                this.showStatus('✅ セッションを削除しました', 'connected');
            }
        } catch (error) {
            console.error('Delete session error:', error);
            this.showStatus('❌ セッションの削除に失敗しました', 'error');
        }
    }

    private clearMessages(): void {
        this.chatMessages = [];
        this.elements.chatMessagesContainer.innerHTML = '';
    }

    private updateUIState(): void {
        const hasSession = !!this.currentSession;
        this.elements.chatInput.disabled = !hasSession || this.isLoading;
        this.elements.sendBtn.disabled = !hasSession || this.isLoading;
        this.elements.clearHistoryBtn.disabled = !hasSession || this.isLoading;
        this.elements.deleteSessionBtn.disabled = !hasSession;
    }

    private async loadConversationHistory(): Promise<void> {
        if (!this.currentSession) return;

        try {
            const history = await (window as any).electronAPI.getConversationHistory(this.currentSession.id);
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

    // 確認ダイアログ関連メソッド
    private showConfirmDialog(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.confirmCallback = resolve;
            this.elements.confirmTitle.textContent = title;
            this.elements.confirmMessage.textContent = message;
            this.elements.confirmModal.classList.add('show');
        });
    }

    private handleConfirmDialog(result: boolean): void {
        this.elements.confirmModal.classList.remove('show');
        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }
}

// アプリを初期化
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
