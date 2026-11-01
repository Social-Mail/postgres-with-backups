import { dirname, join, relative } from "node:path";
import S3Storage from "./storage/S3Storage.js"
// import { promises } from "node:timers";
import { spawnPromise } from "./spawnPromise.js";
import { opendir, writeFile } from "node:fs/promises";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "node:fs";
import FileHelper from "./FileHelper.js";
import SevenZip from "./SevenZip.js";

export default class Restore {

    storage = new S3Storage();

    constructor() {

    }

    async restore() {
        const folder = process.env.PG_RESTORE_DAY || (await this.storage.getConfig()).latest;
        if(!folder) {
            console.log(`No backups exist to restore... `)
            return;
        }

        const pgRestore = globalEnv.folders.restore;

        // await spawnPromise("mkdir", ["-p", dirname(pgRestore)]);

        // await FileHelper.clearFolder(pgRestore);

        // load all into a temp folder...
        const tmpRoot = "/tmp/backups/" + Date.now();

        // download everything...
        for await(const { cloudPath } of this.storage.list(folder)) {
            const sZipFilePath = join(tmpRoot, cloudPath) + "_downloaded.7z";
            await this.storage.download({ cloudPath, localPath: sZipFilePath });

            const localFolder = join(pgRestore, relative(folder, dirname(cloudPath)));

            await spawnPromise("mkdir", ["-p", localFolder]);

            await SevenZip.unzip({
                input: sZipFilePath,
                output: localFolder
            });

            await spawnPromise("rm", [sZipFilePath, "-rf"]);
        }

        const increments = [];

        using ds = await opendir(pgRestore, { recursive: true });
        for await(const d of ds) {
            if (d.isDirectory()) {
                const incFolder = join(d.parentPath, d.name);
                const manifest = join(incFolder, "backup_label");
                if (existsSync(manifest)) {
                    increments.push(incFolder);
                }
            }
        }
        increments.sort((a, b) => a.localeCompare(b));

        await writeFile(join(pgRestore, "restore.sh"), `#!/bin/sh
pg_combinebackup -o ${globalEnv.folders.data} ${increments.join(" ")}
`);

        await spawnPromise("chmod", ["+x", join(pgRestore, "restore.sh")]);


    }
}