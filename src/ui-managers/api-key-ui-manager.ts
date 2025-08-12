// APIキー管理機能を担当するクラス

export interface ApiKeyInfo {
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

export interface ApiKeyElements {
    // APIキー設定関連
    section: HTMLDivElement;
    input: HTMLInputElement;
    saveCheckbox: HTMLInputElement;
    setBtn: HTMLButtonElement;
    cancelBtn: HTMLButtonElement;
    deleteSavedBtn: HTMLButtonElement;

    // APIキー管理関連
    managementSection: HTMLDivElement;
    toggleManagement: HTMLButtonElement;
    managementContent: HTMLDivElement;
    list: HTMLDivElement;
    showAddFormBtn: HTMLButtonElement;
    addForm: HTMLDivElement;
    addService: HTMLSelectElement;
    addModel: HTMLSelectElement;
    addValue: HTMLInputElement;
    addDescription: HTMLInputElement;
    addBtn: HTMLButtonElement;
    cancelAddBtn: HTMLButtonElement;
}

/**
 * APIキー管理機能を担当するクラス
 * APIキーの設定、追加、削除、切り替えを行う
 */
export class ApiKeyUIManager {
    private elements: ApiKeyElements;
    private apiKeys: ApiKeyInfo[] = [];
    private currentActiveApiKeyId: number | null = null;

    constructor(elements: ApiKeyElements) {
        this.elements = elements;
    }

    /**
     * APIキーを設定
     * @param apiKey APIキー
     * @param saveKey 保存するかどうか
     * @returns 設定結果
     */
    public async setApiKey(apiKey: string, saveKey: boolean): Promise<{ success: boolean; error?: string }> {
        if (!apiKey.trim()) {
            return { success: false, error: 'API キーを入力してください' };
        }

        this.elements.setBtn.disabled = true;

        try {
            const success = await (window as any).electronAPI.setApiKey(apiKey, saveKey);
            return { success };
        } catch (error) {
            console.error('API Key setup error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        } finally {
            this.elements.setBtn.disabled = false;
        }
    }

    /**
     * 保存されたAPIキーがあるかチェック
     * @returns APIキーが保存されているかどうか
     */
    public async checkForSavedApiKey(): Promise<boolean> {
        try {
            const hasSavedKey = await (window as any).electronAPI.hasSavedApiKey();
            if (hasSavedKey) {
                this.elements.deleteSavedBtn.style.display = 'block';
                this.elements.saveCheckbox.checked = true;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking saved API key:', error);
            return false;
        }
    }

    /**
     * 保存されたAPIキーを削除
     * @returns 削除結果
     */
    public async deleteSavedApiKey(): Promise<{ success: boolean; error?: string }> {
        try {
            const success = await (window as any).electronAPI.deleteSavedApiKey();
            if (success) {
                this.elements.deleteSavedBtn.style.display = 'none';
                this.elements.saveCheckbox.checked = false;
                return { success: true };
            } else {
                return { success: false, error: 'APIキーの削除に失敗しました' };
            }
        } catch (error) {
            console.error('Error deleting saved API key:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * APIキー管理パネルをトグル
     */
    public toggleApiKeyManagement(): void {
        const content = this.elements.managementContent;
        const isVisible = content.classList.contains('show');

        if (isVisible) {
            content.classList.remove('show');
            this.elements.toggleManagement.textContent = '管理';
        } else {
            content.classList.add('show');
            this.elements.toggleManagement.textContent = '閉じる';
            this.loadApiKeys(); // 開いたときにAPIキー一覧を更新
        }
    }

    /**
     * APIキー一覧をロード
     */
    public async loadApiKeys(): Promise<void> {
        try {
            this.apiKeys = await (window as any).electronAPI.getAllApiKeys();
            this.renderApiKeyList();
        } catch (error) {
            console.error('Error loading API keys:', error);
            throw error;
        }
    }

    /**
     * アクティブなAPIキーIDをロード
     */
    public async loadActiveApiKeyId(): Promise<void> {
        try {
            this.currentActiveApiKeyId = await (window as any).electronAPI.getActiveApiKeyId();
        } catch (error) {
            console.error('Error loading active API key ID:', error);
        }
    }

    /**
     * APIキー一覧をレンダリング
     */
    public renderApiKeyList(): void {
        const container = this.elements.list;
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

    /**
     * APIキー追加フォームを表示
     */
    public showAddApiKeyForm(): void {
        this.elements.addForm.classList.add('show');
        this.elements.showAddFormBtn.style.display = 'none';
        this.elements.addValue.focus();
    }

    /**
     * APIキー追加フォームを隠す
     */
    public hideAddApiKeyForm(): void {
        this.elements.addForm.classList.remove('show');
        this.elements.showAddFormBtn.style.display = 'block';
        this.clearAddApiKeyForm();
    }

    /**
     * APIキー追加フォームをクリア
     */
    public clearAddApiKeyForm(): void {
        this.elements.addValue.value = '';
        this.elements.addDescription.value = '';
        this.elements.addService.selectedIndex = 0;
        this.elements.addModel.selectedIndex = 0;
    }

    /**
     * APIキーを追加
     * @returns 追加結果
     */
    public async addApiKey(): Promise<{ success: boolean; error?: string }> {
        const service = this.elements.addService.value;
        const model = this.elements.addModel.value;
        const apiKey = this.elements.addValue.value.trim();
        const description = this.elements.addDescription.value.trim();

        if (!apiKey) {
            return { success: false, error: 'APIキーを入力してください' };
        }

        if (!apiKey.startsWith('AIzaSy')) {
            return { success: false, error: '有効なGoogle Gemini APIキーを入力してください' };
        }

        try {
            this.elements.addBtn.disabled = true;

            const result = await (window as any).electronAPI.addApiKey(service, apiKey, model, description);

            if (result.success) {
                this.hideAddApiKeyForm();
                await this.loadApiKeys(); // リストを更新
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error adding API key:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        } finally {
            this.elements.addBtn.disabled = false;
        }
    }

    /**
     * アクティブなAPIキーを設定
     * @param apiKeyId APIキーID
     * @returns 設定結果
     */
    public async setActiveApiKey(apiKeyId: number): Promise<{ success: boolean; error?: string }> {
        if (apiKeyId === this.currentActiveApiKeyId) {
            return { success: true }; // 既にアクティブ
        }

        try {
            const result = await (window as any).electronAPI.setActiveApiKey(apiKeyId);

            if (result.success) {
                this.currentActiveApiKeyId = apiKeyId;
                this.renderApiKeyList(); // リストを更新
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error setting active API key:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * APIキーを削除
     * @param apiKeyId APIキーID
     * @returns 削除結果
     */
    public async deleteApiKey(apiKeyId: number): Promise<{ success: boolean; error?: string }> {
        // アクティブなAPIキーは削除できない
        if (apiKeyId === this.currentActiveApiKeyId) {
            return { success: false, error: 'アクティブなAPIキーは削除できません' };
        }

        try {
            const result = await (window as any).electronAPI.deleteApiKeyById(apiKeyId);

            if (result.success) {
                await this.loadApiKeys(); // リストを更新
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error deleting API key:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * 入力値を取得
     * @returns APIキー入力値
     */
    public getApiKeyInput(): string {
        return this.elements.input.value.trim();
    }

    /**
     * 保存チェックボックスの状態を取得
     * @returns 保存するかどうか
     */
    public getSaveKeyCheckbox(): boolean {
        return this.elements.saveCheckbox.checked;
    }

    /**
     * 現在のアクティブAPIキーIDを取得
     * @returns アクティブAPIキーID
     */
    public getCurrentActiveApiKeyId(): number | null {
        return this.currentActiveApiKeyId;
    }

    /**
     * APIキー一覧を取得
     * @returns APIキー一覧
     */
    public getApiKeys(): ApiKeyInfo[] {
        return [...this.apiKeys];
    }
}
