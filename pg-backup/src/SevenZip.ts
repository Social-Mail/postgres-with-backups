import { readFile } from "node:fs/promises";
import { spawnPromise } from "./spawnPromise.js";
import Mask from "./mask.js";

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

        return await spawnPromise(`7z`, ["a", output, input  + "/*", new Mask("-p" + password, 2)], {
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
        return await spawnPromise(`7z`, ["x", input, new Mask("-p" + password, 2), "-o" + output], {
            timeout: 15*60*1000
        });
    }

}