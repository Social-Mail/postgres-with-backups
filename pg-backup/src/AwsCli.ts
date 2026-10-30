/**
 * This is to keep backup script as small as possible
 * without having to rely on heavy node modules
 */

import { globalEnv } from "./globalEnv.js";
import { spawnPromise } from "./spawnPromise.js";

const { s3 } = globalEnv;

export default class AwsCli {

    /** get for text reading */
    static async getJson(path: string) {
        try {
            const result = await spawnPromise("aws", ["s3", "cp", `s3://${s3.bucket}/${s3.folder}/config.json`, "-", "--quite"]);
            const text = Buffer.concat(result.out).toString("utf-8");
            return JSON.parse(text);
        } catch (error) {
            console.error(error);
        }
    }

}