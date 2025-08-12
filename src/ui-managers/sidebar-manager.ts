// サイドバーの表示・非表示を管理するクラス

export interface SidebarElements {
    hamburgerBtn: HTMLButtonElement;
    sidebar: HTMLDivElement;
    sidebarClose: HTMLButtonElement;
}

/**
 * サイドバーの表示・非表示制御を担当するクラス
 */
export class SidebarManager {
    private elements: SidebarElements;
    private isOpen: boolean = false;

    constructor(elements: SidebarElements) {
        this.elements = elements;
        this.initializeSidebar();
    }

    /**
     * サイドバーの初期状態を設定
     */
    private initializeSidebar(): void {
        // 初期状態では閉じている
        this.closeSidebar();
    }

    /**
     * サイドバーを開く
     */
    public openSidebar(): void {
        this.elements.sidebar.classList.add('open');
        this.elements.hamburgerBtn.classList.add('active');
        this.isOpen = true;
    }

    /**
     * サイドバーを閉じる
     */
    public closeSidebar(): void {
        this.elements.sidebar.classList.remove('open');
        this.elements.hamburgerBtn.classList.remove('active');
        this.isOpen = false;
    }

    /**
     * サイドバーの開閉を切り替え
     */
    public toggleSidebar(): void {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * サイドバーの状態を取得
     */
    public isOpenState(): boolean {
        return this.isOpen;
    }

    /**
     * サイドバーのクリック外エリアを設定
     * メインコンテンツエリアクリック時にサイドバーを閉じる
     */
    public setupClickOutside(): void {
        document.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // サイドバー内、ハンバーガーボタンをクリックした場合は何もしない
            if (this.elements.sidebar.contains(target) ||
                this.elements.hamburgerBtn.contains(target)) {
                return;
            }

            // サイドバーが開いている場合のみ閉じる
            if (this.isOpen) {
                this.closeSidebar();
            }
        });

        // ESCキーでサイドバーを閉じる
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });
    }
}
