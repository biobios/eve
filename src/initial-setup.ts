/**
 * 初期設定画面のフロントエンドロジック
 */

class InitialSetupManager {
    private currentStep = 1;
    private totalSteps = 4;
    private selectedModel = '';

    private elements = {
        form: document.getElementById('setup-form') as HTMLFormElement,
        userNameGroup: document.getElementById('user-name-group') as HTMLDivElement,
        aiServiceGroup: document.getElementById('ai-service-group') as HTMLDivElement,
        aiModelGroup: document.getElementById('ai-model-group') as HTMLDivElement,
        apiKeyGroup: document.getElementById('api-key-group') as HTMLDivElement,
        prevBtn: document.getElementById('prev-btn') as HTMLButtonElement,
        nextBtn: document.getElementById('next-btn') as HTMLButtonElement,
        completeBtn: document.getElementById('complete-btn') as HTMLButtonElement,
        completeBtnText: document.getElementById('complete-btn-text') as HTMLSpanElement,
        completeBtnSpinner: document.getElementById('complete-btn-spinner') as HTMLDivElement,
        errorContainer: document.getElementById('error-container') as HTMLDivElement,
        successContainer: document.getElementById('success-container') as HTMLDivElement,
        userName: document.getElementById('userName') as HTMLInputElement,
        aiService: document.getElementById('aiService') as HTMLSelectElement,
        aiModel: document.getElementById('aiModel') as HTMLInputElement,
        apiKey: document.getElementById('apiKey') as HTMLTextAreaElement
    };

    constructor() {
        this.setupEventListeners();
        this.updateStepDisplay();
    }

    private setupEventListeners(): void {
        // 次へボタン
        this.elements.nextBtn.addEventListener('click', () => {
            this.handleNext();
        });

        // 戻るボタン
        this.elements.prevBtn.addEventListener('click', () => {
            this.handlePrevious();
        });

        // フォーム送信
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleComplete();
        });

        // AIサービス選択変更
        this.elements.aiService.addEventListener('change', () => {
            this.handleAiServiceChange();
        });

        // AIモデル選択
        const modelOptions = document.querySelectorAll('.ai-model-option');
        modelOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.handleModelSelection(option as HTMLDivElement);
            });
        });

        // 入力フィールドのEnterキーハンドリング
        [this.elements.userName, this.elements.apiKey].forEach(input => {
            input.addEventListener('keydown', (e) => {
                const keyEvent = e as KeyboardEvent;
                if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
                    e.preventDefault();
                    if (this.currentStep < this.totalSteps) {
                        this.handleNext();
                    } else {
                        this.handleComplete();
                    }
                }
            });
        });
    }

    private handleNext(): void {
        if (!this.validateCurrentStep()) {
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    private handlePrevious(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    private handleAiServiceChange(): void {
        const service = this.elements.aiService.value;
        if (service === 'gemini') {
            // Geminiモデルオプションを表示
            const modelOptions = document.querySelectorAll('.ai-model-option');
            modelOptions.forEach(option => {
                (option as HTMLElement).style.display = 'block';
            });
        }
    }

    private handleModelSelection(option: HTMLDivElement): void {
        // 既存の選択を解除
        document.querySelectorAll('.ai-model-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // 新しい選択を設定
        option.classList.add('selected');
        this.selectedModel = option.dataset.model || '';
        this.elements.aiModel.value = this.selectedModel;
    }

    private validateCurrentStep(): boolean {
        this.clearMessages();

        switch (this.currentStep) {
            case 1:
                if (!this.elements.userName.value.trim()) {
                    this.showError('お名前を入力してください');
                    this.elements.userName.focus();
                    return false;
                }
                break;

            case 2:
                if (!this.elements.aiService.value) {
                    this.showError('AIサービスを選択してください');
                    this.elements.aiService.focus();
                    return false;
                }
                break;

            case 3:
                if (!this.selectedModel) {
                    this.showError('AIモデルを選択してください');
                    return false;
                }
                break;

            case 4:
                if (!this.elements.apiKey.value.trim()) {
                    this.showError('APIキーを入力してください');
                    this.elements.apiKey.focus();
                    return false;
                }

                // APIキーの形式チェック（Geminiの場合）
                if (this.elements.aiService.value === 'gemini') {
                    const apiKey = this.elements.apiKey.value.trim();
                    if (!apiKey.startsWith('AIzaSy') || apiKey.length < 35) {
                        this.showError('有効なGoogle Gemini APIキーを入力してください');
                        this.elements.apiKey.focus();
                        return false;
                    }
                }
                break;
        }

        return true;
    }

    private updateStepDisplay(): void {
        // ステップインジケータを更新
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.classList.remove('active', 'completed');
                if (i < this.currentStep) {
                    stepElement.classList.add('completed');
                } else if (i === this.currentStep) {
                    stepElement.classList.add('active');
                }
            }
        }

        // フォームグループの表示/非表示
        this.elements.userNameGroup.style.display = this.currentStep === 1 ? 'block' : 'none';
        this.elements.aiServiceGroup.style.display = this.currentStep === 2 ? 'block' : 'none';
        this.elements.aiModelGroup.style.display = this.currentStep === 3 ? 'block' : 'none';
        this.elements.apiKeyGroup.style.display = this.currentStep === 4 ? 'block' : 'none';

        // ボタンの表示制御
        this.elements.prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        this.elements.nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        this.elements.completeBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';

        // フォーカス設定
        setTimeout(() => {
            switch (this.currentStep) {
                case 1:
                    this.elements.userName.focus();
                    break;
                case 2:
                    this.elements.aiService.focus();
                    break;
                case 4:
                    this.elements.apiKey.focus();
                    break;
            }
        }, 100);
    }

    private async handleComplete(): Promise<void> {
        if (!this.validateCurrentStep()) {
            return;
        }

        // ローディング状態に設定
        this.setLoading(true);

        try {
            const config = {
                userName: this.elements.userName.value.trim(),
                aiService: this.elements.aiService.value,
                aiModel: this.selectedModel,
                apiKey: this.elements.apiKey.value.trim()
            };

            const result = await (window as any).electronAPI.saveInitialSetup(config);

            if (result.success) {
                this.showSuccess('設定が完了しました！ チャット画面に移動します...');

                // 2秒後にメインアプリケーションを開く
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                this.showError(result.error || '設定の保存に失敗しました');
            }
        } catch (error) {
            console.error('Initial setup error:', error);
            this.showError('設定の保存中にエラーが発生しました');
        } finally {
            this.setLoading(false);
        }
    }

    private setLoading(loading: boolean): void {
        this.elements.completeBtn.disabled = loading;
        this.elements.completeBtnText.style.display = loading ? 'none' : 'inline';
        this.elements.completeBtnSpinner.style.display = loading ? 'inline-block' : 'none';
    }

    private showError(message: string): void {
        this.elements.errorContainer.innerHTML = `
            <div class="error-message">
                ${message}
            </div>
        `;
        this.elements.successContainer.innerHTML = '';
        this.elements.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    private showSuccess(message: string): void {
        this.elements.successContainer.innerHTML = `
            <div class="success-message">
                ${message}
            </div>
        `;
        this.elements.errorContainer.innerHTML = '';
        this.elements.successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    private clearMessages(): void {
        this.elements.errorContainer.innerHTML = '';
        this.elements.successContainer.innerHTML = '';
    }
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    new InitialSetupManager();
});
