/**
 * データベースヘルスチェック管理クラス
 * データベースの状態監視と診断を担当
 */

import { MigrationManager } from './database-migration';
import { getDatabaseConfigs } from './database-migrations-config';

export interface DatabaseHealthStatus {
    overall: boolean;
    databases: { [name: string]: { healthy: boolean; error?: string } }
}

export class DatabaseHealthChecker {
    private migrationManager: MigrationManager;

    constructor(migrationManager: MigrationManager) {
        this.migrationManager = migrationManager;
    }

    /**
     * データベースのヘルスチェック
     */
    public async checkHealth(): Promise<DatabaseHealthStatus> {
        const result: DatabaseHealthStatus = {
            overall: true,
            databases: {}
        };

        const configs = getDatabaseConfigs();

        for (const config of configs) {
            try {
                const migrator = this.migrationManager.getMigrator(config.name);
                if (migrator) {
                    // マイグレーターが存在する場合はステータスを取得
                    const status = migrator.getStatus();
                    result.databases[config.name] = {
                        healthy: true,
                        error: undefined
                    };
                } else {
                    result.databases[config.name] = {
                        healthy: false,
                        error: 'Migrator not found'
                    };
                    result.overall = false;
                }
            } catch (error) {
                result.databases[config.name] = {
                    healthy: false,
                    error: `Health check failed: ${error}`
                };
                result.overall = false;
            }
        }

        return result;
    }

    /**
     * 個別データベースのヘルスチェック
     */
    public async checkDatabaseHealth(dbName: string): Promise<{ healthy: boolean; error?: string }> {
        try {
            const migrator = this.migrationManager.getMigrator(dbName);
            if (migrator) {
                const status = migrator.getStatus();
                return {
                    healthy: true,
                    error: undefined
                };
            } else {
                return {
                    healthy: false,
                    error: 'Migrator not found'
                };
            }
        } catch (error) {
            return {
                healthy: false,
                error: `Health check failed: ${error}`
            };
        }
    }
}
