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

interface ApiKeyInfo {
    id: number;
    serviceName: string;
    apiKey: string;
    aiModel?: string;
    description?: string;
    isActive: boolean;
    lastUsedAt?: string;
    createdAt: string;
    updatedAt: string;
}

class ChatApp {
    private isApiKeySet = false;
    private isLoading = false;
    private chatMessages: ChatMessage[] = [];
    private currentSession: ChatSession | null = null;
    private sessions: ChatSession[] = [];
    private confirmCallback: ((result: boolean) => void) | null = null;
    private apiKeys: ApiKeyInfo[] = [];
    private currentActiveApiKeyId: number | null = null;

    private elements = {
        apiKeySection: document.getElementById('apiKeySection') as HTMLDivElement,
        apiKeyInput: document.getElementById('apiKeyInput') as HTMLInputElement,
        saveApiKeyCheckbox: document.getElementById('saveApiKeyCheckbox') as HTMLInputElement,
        setApiKeyBtn: document.getElementById('setApiKeyBtn') as HTMLButtonElement,
        cancelApiKeyBtn: document.getElementById('cancelApiKeyBtn') as HTMLButtonElement,
        deleteSavedApiKeyBtn: document.getElementById('deleteSavedApiKeyBtn') as HTMLButtonElement,
        sessionSection: document.getElementById('sessionSection') as HTMLDivElement,
        sessionSelect: document.getElementById('sessionSelect') as HTMLSelectElement,
        newSessionBtn: document.getElementById('newSessionBtn') as HTMLButtonElement,
        deleteSessionBtn: document.getElementById('deleteSessionBtn') as HTMLButtonElement,
        // APIキー管理要素
        apiKeyManagementSection: document.getElementById('apiKeyManagementSection') as HTMLDivElement,
        toggleApiKeyManagement: document.getElementById('toggleApiKeyManagement') as HTMLButtonElement,
        apiKeyManagementContent: document.getElementById('apiKeyManagementContent') as HTMLDivElement,
        apiKeyList: document.getElementById('apiKeyList') as HTMLDivElement,
        showAddApiKeyFormBtn: document.getElementById('showAddApiKeyFormBtn') as HTMLButtonElement,
        addApiKeyForm: document.getElementById('addApiKeyForm') as HTMLDivElement,
        addApiKeyService: document.getElementById('addApiKeyService') as HTMLSelectElement,
        addApiKeyModel: document.getElementById('addApiKeyModel') as HTMLSelectElement,
        addApiKeyValue: document.getElementById('addApiKeyValue') as HTMLInputElement,
        addApiKeyDescription: document.getElementById('addApiKeyDescription') as HTMLInputElement,
        addApiKeyBtn: document.getElementById('addApiKeyBtn') as HTMLButtonElement,
        cancelAddApiKeyBtn: document.getElementById('cancelAddApiKeyBtn') as HTMLButtonElement,
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
        this.checkForSavedApiKey();
        this.updateUI();
    }

    private setupEventListeners(): void {
        // API キー設定ボタン
        this.elements.setApiKeyBtn.addEventListener('click', () => this.handleSetApiKey());

        // 保存済みAPIキー削除ボタン
        this.elements.deleteSavedApiKeyBtn.addEventListener('click', () => this.handleDeleteSavedApiKey());

        // API キー入力でEnterキー
        this.elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSetApiKey();
            }
        });

        // APIキー管理トグル
        this.elements.toggleApiKeyManagement.addEventListener('click', () => this.toggleApiKeyManagement());

        // APIキー追加フォーム表示
        this.elements.showAddApiKeyFormBtn.addEventListener('click', () => this.showAddApiKeyForm());

        // APIキー追加
        this.elements.addApiKeyBtn.addEventListener('click', () => this.handleAddApiKey());

        // APIキー追加キャンセル
        this.elements.cancelAddApiKeyBtn.addEventListener('click', () => this.hideAddApiKeyForm());

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

        // AI初期化状態のリスナーを設定
        if ((window as any).electronAPI?.onAiInitialized) {
            (window as any).electronAPI.onAiInitialized((initialized: boolean) => {
                this.handleAiInitialized(initialized);
            });
        }
    }

    private async handleSetApiKey(): Promise<void> {
        const apiKey = this.elements.apiKeyInput.value.trim();
        const saveKey = this.elements.saveApiKeyCheckbox.checked;

        if (!apiKey) {
            this.showStatus('API キーを入力してください', 'error');
            return;
        }

        this.showStatus('API キーを設定中...', '');
        this.elements.setApiKeyBtn.disabled = true;

        try {
            const success = await (window as any).electronAPI.setApiKey(apiKey, saveKey);

            if (success) {
                this.isApiKeySet = true;
                const saveMessage = saveKey ? '（暗号化保存されました）' : '';
                this.showStatus(`✅ 接続完了！セッションを作成してください ${saveMessage}`, 'connected');
                this.elements.apiKeySection.classList.add('hidden');
                this.elements.sessionSection.classList.remove('hidden');
                this.elements.apiKeyManagementSection.classList.remove('hidden');

                // APIキー情報とセッション一覧をロード
                await Promise.all([
                    this.loadApiKeys(),
                    this.loadActiveApiKeyId(),
                    this.loadSessions()
                ]);

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

    /**
     * 保存されたAPIキーがあるかチェックして、自動初期化を試行
     */
    private async checkForSavedApiKey(): Promise<void> {
        try {
            const hasSavedKey = await (window as any).electronAPI.hasSavedApiKey();
            if (hasSavedKey) {
                this.elements.deleteSavedApiKeyBtn.style.display = 'block';
                this.elements.saveApiKeyCheckbox.checked = true; // デフォルトでチェック

                // AIが既に初期化されているかチェック
                const isInitialized = await (window as any).electronAPI.isAiInitialized();
                if (isInitialized) {
                    this.handleAiInitialized(true);
                }
            }
        } catch (error) {
            console.error('Error checking saved API key:', error);
        }
    }

    /**
     * AI初期化状態が変更されたときの処理
     */
    private handleAiInitialized(initialized: boolean): void {
        if (initialized) {
            this.isApiKeySet = true;
            this.showStatus('✅ 保存されたAPIキーで接続完了！', 'connected');
            this.elements.apiKeySection.classList.add('hidden');
            this.elements.sessionSection.classList.remove('hidden');
            this.elements.apiKeyManagementSection.classList.remove('hidden');

            // APIキー情報とセッション一覧をロード
            Promise.all([
                this.loadApiKeys(),
                this.loadActiveApiKeyId(),
                this.loadSessions()
            ]).then(() => {
                // ウェルカムメッセージを追加
                this.addMessage({
                    type: 'ai',
                    content: '保存されたAPIキーで正常に接続されました！セッションを選択するか、新しいセッションを作成して会話を開始してください。😊',
                    timestamp: new Date()
                });
            });
        } else {
            this.showStatus('APIキーを設定してください', '');
        }
    }

    /**
     * 保存されたAPIキーを削除
     */
    private async handleDeleteSavedApiKey(): Promise<void> {
        const confirmed = await this.showConfirmDialog(
            '保存されたAPIキーの削除',
            '保存されているAPIキーを削除しますか？\n次回起動時にAPIキーの入力が必要になります。'
        );

        if (confirmed) {
            try {
                const success = await (window as any).electronAPI.deleteSavedApiKey();
                if (success) {
                    this.elements.deleteSavedApiKeyBtn.style.display = 'none';
                    this.elements.saveApiKeyCheckbox.checked = false;
                    this.showStatus('保存されたAPIキーを削除しました', 'connected');
                } else {
                    this.showStatus('APIキーの削除に失敗しました', 'error');
                }
            } catch (error) {
                console.error('Error deleting saved API key:', error);
                this.showStatus('APIキーの削除中にエラーが発生しました', 'error');
            }
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

    // APIキー管理メソッド
    private toggleApiKeyManagement(): void {
        const content = this.elements.apiKeyManagementContent;
        const isVisible = content.classList.contains('show');

        if (isVisible) {
            content.classList.remove('show');
            this.elements.toggleApiKeyManagement.textContent = '管理';
        } else {
            content.classList.add('show');
            this.elements.toggleApiKeyManagement.textContent = '閉じる';
            this.loadApiKeys(); // 開いたときにAPIキー一覧を更新
        }
    }

    private async loadApiKeys(): Promise<void> {
        try {
            this.apiKeys = await (window as any).electronAPI.getAllApiKeys();
            this.renderApiKeyList();
        } catch (error) {
            console.error('Error loading API keys:', error);
            this.showStatus('APIキー一覧の読み込みに失敗しました', 'error');
        }
    }

    private async loadActiveApiKeyId(): Promise<void> {
        try {
            this.currentActiveApiKeyId = await (window as any).electronAPI.getActiveApiKeyId();
        } catch (error) {
            console.error('Error loading active API key ID:', error);
        }
    }

    private renderApiKeyList(): void {
        const container = this.elements.apiKeyList;
        container.innerHTML = '';

        if (this.apiKeys.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #718096;">登録されたAPIキーがありません</div>';
            return;
        }

        this.apiKeys.forEach(apiKey => {
            const item = document.createElement('div');
            item.className = `api-key-item ${apiKey.id === this.currentActiveApiKeyId ? 'active' : ''}`;

            // APIキーの最初と最後の数文字のみ表示
            const keyPreview = `${apiKey.apiKey.substring(0, 8)}...${apiKey.apiKey.substring(apiKey.apiKey.length - 4)}`;

            item.innerHTML = `
                <div class="api-key-info">
                    <div class="api-key-model">${apiKey.aiModel || 'gemini-1.5-flash'}</div>
                    <div class="api-key-description">${apiKey.description || 'No description'}</div>
                    <div class="api-key-key-preview">${keyPreview}</div>
                </div>
                <div class="api-key-actions">
                    <button class="api-key-btn ${apiKey.id === this.currentActiveApiKeyId ? 'active' : ''}" 
                            onclick="chatApp.setActiveApiKey(${apiKey.id})" 
                            ${apiKey.id === this.currentActiveApiKeyId ? 'disabled' : ''}>
                        ${apiKey.id === this.currentActiveApiKeyId ? 'アクティブ' : '使用する'}
                    </button>
                    <button class="api-key-btn delete" onclick="chatApp.deleteApiKey(${apiKey.id})">削除</button>
                </div>
            `;

            container.appendChild(item);
        });
    }

    private showAddApiKeyForm(): void {
        this.elements.addApiKeyForm.classList.add('show');
        this.elements.showAddApiKeyFormBtn.style.display = 'none';
        this.elements.addApiKeyValue.focus();
    }

    private hideAddApiKeyForm(): void {
        this.elements.addApiKeyForm.classList.remove('show');
        this.elements.showAddApiKeyFormBtn.style.display = 'block';
        this.clearAddApiKeyForm();
    }

    private clearAddApiKeyForm(): void {
        this.elements.addApiKeyValue.value = '';
        this.elements.addApiKeyDescription.value = '';
        this.elements.addApiKeyService.selectedIndex = 0;
        this.elements.addApiKeyModel.selectedIndex = 0;
    }

    private async handleAddApiKey(): Promise<void> {
        const service = this.elements.addApiKeyService.value;
        const model = this.elements.addApiKeyModel.value;
        const apiKey = this.elements.addApiKeyValue.value.trim();
        const description = this.elements.addApiKeyDescription.value.trim();

        if (!apiKey) {
            this.showStatus('APIキーを入力してください', 'error');
            return;
        }

        if (!apiKey.startsWith('AIzaSy')) {
            this.showStatus('有効なGoogle Gemini APIキーを入力してください', 'error');
            return;
        }

        try {
            this.elements.addApiKeyBtn.disabled = true;
            this.showStatus('APIキーを追加中...', '');

            const result = await (window as any).electronAPI.addApiKey(service, apiKey, model, description);

            if (result.success) {
                this.showStatus('✅ APIキーが追加されました', 'connected');
                this.hideAddApiKeyForm();
                await this.loadApiKeys(); // リストを更新
            } else {
                this.showStatus(`❌ APIキーの追加に失敗しました: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error adding API key:', error);
            this.showStatus('❌ APIキーの追加中にエラーが発生しました', 'error');
        } finally {
            this.elements.addApiKeyBtn.disabled = false;
        }
    }

    public async setActiveApiKey(apiKeyId: number): Promise<void> {
        if (apiKeyId === this.currentActiveApiKeyId) {
            return; // 既にアクティブ
        }

        try {
            this.showStatus('APIキーを切り替え中...', '');

            const result = await (window as any).electronAPI.setActiveApiKey(apiKeyId);

            if (result.success) {
                this.currentActiveApiKeyId = apiKeyId;
                this.showStatus('✅ APIキーが切り替わりました', 'connected');
                this.renderApiKeyList(); // リストを更新
            } else {
                this.showStatus(`❌ APIキーの切り替えに失敗しました: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error setting active API key:', error);
            this.showStatus('❌ APIキーの切り替え中にエラーが発生しました', 'error');
        }
    }

    public async deleteApiKey(apiKeyId: number): Promise<void> {
        // アクティブなAPIキーは削除できない
        if (apiKeyId === this.currentActiveApiKeyId) {
            this.showStatus('❌ アクティブなAPIキーは削除できません', 'error');
            return;
        }

        const confirmed = await this.showConfirmDialog(
            'APIキーの削除',
            'このAPIキーを削除しますか？この操作は取り消せません。'
        );

        if (!confirmed) return;

        try {
            this.showStatus('APIキーを削除中...', '');

            const result = await (window as any).electronAPI.deleteApiKeyById(apiKeyId);

            if (result.success) {
                this.showStatus('✅ APIキーが削除されました', 'connected');
                await this.loadApiKeys(); // リストを更新
            } else {
                this.showStatus(`❌ APIキーの削除に失敗しました: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting API key:', error);
            this.showStatus('❌ APIキーの削除中にエラーが発生しました', 'error');
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
