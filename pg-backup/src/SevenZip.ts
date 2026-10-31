import { readFile } from "node:fs/promises";
import { spawnPromise } from "./spawnPromise.js";

export default class SevenZip {

    static async zip({
        input,
        output
    }: {
        input: string,
        output: string
    }) {
        const timeout = 15*60*1000;

        const password = await readFile("/app/.pwd-hash", "utf-8");

        return await spawnPromise(`7z`, ["a", output, input, "-p" + password], {
            timeout,
            logCommand: true
        });
    }


    static async unzip({
        input,
        output,
    }: {
        input: string,
        output: string,
        password?: string
    }) {
        const password = await readFile("/app/.pwd-hash", "utf-8");
        return await spawnPromise(`7z`, ["x", input, "-p" + password, "-o" + output], {
            timeout: 15*60*1000
        });
    }

}