export default abstract class BaseStorage {
    abstract download(a: {cloudPath: string, localPath: string}): Promise<void>;
    abstract upload(a: { cloudPath: string, localPath: string }): Promise<void>;

    abstract getConfig(): Promise<any>;
    abstract saveConfig(config: any): Promise<void>;

    abstract exists(cloudPath, localPath): Promise<boolean>;

    abstract list(cloudPath, signal?: AbortSignal, throwIfAborted?: boolean): AsyncGenerator<{ cloudPath: string }>;
    
}