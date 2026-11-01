import { join } from "path";
import S3Storage from "./storage/S3Storage.js";
import { globalEnv } from "./globalEnv.js";
import { existsSync } from "fs";
import { spawnPromise } from "./spawnPromise.js";
import { mkdir, readFile, writeFile } from "fs/promises";
import SevenZip from "./SevenZip.js";


/**
 * Strategy changed.
 * 1. Assume s3 will retain backups
 * 2. Delete backups when uploaded to s3
 * 3. Save last manifest
 * 4. Clean local storage
 */
export class Backup {

    storage = new S3Storage();

    backupFolder: string;
    timeFolder: string;

    constructor(public folder: string, public time: string ) {
        this.backupFolder = join(globalEnv.folders.backup, folder);
        this.timeFolder = join(this.backupFolder, time);
    }

    async upload() {

        // take full backup only if it does not exist on server...

        // download and decrypt manifest...
        // this is an important step considering backups will resume from recovery at last known recovery
        // point

        await this.takeBackup(this.backupFolder);

        // upload all files...
        // await this.storage.sync({ cloudPath: this.folder, localPath: this.backupFolder });

        // await this.cleanUp();

    }

    // async cleanUp() {
    //     let current = void 0;
    //     const ds = await opendir(globalEnv.folders.backup);
    //     for await (const dir of ds) {
    //         if(dir.isDirectory()) {
    //             current = join(dir.parentPath, dir.name);
    //             if (current === this.backupFolder) {
    //                 current = void 0;
    //             }
    //         }
    //     }
    //     if (current) {
    //         if(existsSync(current)) {
    //             await spawnPromise("rm", ["-rf", current]);
    //         }
    //     }
    // }

    async takeBackup(folder: string) {


        const tempBackupFolder = "/tmp/pg-backup-" + Date.now();

        await mkdir(tempBackupFolder, { recursive: true });

        const latest = await this.storage.getConfig();

        let latestManifestPath;

        let diff = false;
        if(latest.latest === this.folder) {
            diff = true;
            // save manifest...
            latestManifestPath = tempBackupFolder + "_manifest";
            await writeFile(latestManifestPath, latest.manifest, "utf-8");
        }

        // check if latest is today...

        const type = diff ? "diff" : "full";

        console.log(`Taking ${type} backup at ${tempBackupFolder}`);

        const args = [
                "-h", globalEnv.source.socket ,
                "-D", tempBackupFolder,
                "-U", globalEnv.source.user,
                "-w",
                "-P",
                "-F", "t",
                "-s", "1"];

        if (diff) {

            if (!latest.time) {
                throw new Error("storage does not contain last config");
            }
            args.push("-i", latestManifestPath );
        } else {
            args.push("-R");

            // as we are going to run differential backup
            // immediately, there is no need to stream and hold the backup process
            args.push("-X", "n");
        }

        const { status, all } = await spawnPromise(
            "/usr/bin/pg_basebackup", args , {
                    env: {
                        PGPASSWORD: globalEnv.source.password
                    }
                });

        if (status) {
            try {
                await spawnPromise("rm", ["-rf", tempBackupFolder]);
            } catch (error) {
                console.error(error);
            }
            throw new Error(`backup failed ${status} ${all}`);
        }

        // check if manifest was generated...
        if(!existsSync(join(tempBackupFolder, "backup_manifest"))) {
            try {
                await spawnPromise("rm", ["-rf", tempBackupFolder]);
            } catch (error) {
                console.error(error);
            }
            throw new Error(`backup failed ${status} ${all}`);
        }

        // encrypt every file here...
        console.log(`Encrypting files`);

        let manifestPath = join(tempBackupFolder, "backup_manifest");

        const backupFile = tempBackupFolder + "_backup.7z";

        // compress and encrypt
        await SevenZip.zip({ input: tempBackupFolder, output: backupFile });

        const uploadFolder = diff ? join(this.folder, this.time) : this.folder;

        await this.storage.upload({
            cloudPath: join(uploadFolder, "backup.7z"),
            localPath: backupFile
        });

        // write latest as this one...
        await this.storage.saveConfig({
            latest: this.folder,
            time: this.time,
            manifest: await readFile(manifestPath, "utf-8")
        });

        // after success
        await spawnPromise("rm", [tempBackupFolder, "-rf"]);
        

    }

}