const forceEnv = (name) => {
    const v = process.env[name];
    if (v === null || v === void 0) {
        throw new Error(`Environment variable ${name} is not specified`);
    }
    return v;
}

export const globalEnv = {

    s3: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_DEFAULT_REGION || "us-east-1",
        bucket: process.env.AWS_S3_BUCKET,
        endpoint: process.env.AWS_ENDPOINT_URL_S3,
        folder: (process.env.AWS_S3_BUCKET_FOLDER || "pg-backups") + "/backups",
    },
    source: {
        host: process.env.PG_BACKUP_HOST,
        port: process.env.PG_BACKUP_PORT,
        socket: process.env.PG_BACKUP_SOCKET || "/var/run/postgresql",
        user: process.env.PG_BACKUP_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD
    },
    folders: {
        backup: process.env.PG_BACKUP_FOLDER || "/cache",
        restore: process.env.PG_RESTORE || "/cache/restore",
        get data() {
            return forceEnv("PGDATA");
        }
    },
};