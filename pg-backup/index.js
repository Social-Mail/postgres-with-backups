const oldLog = console.log;
console.log = (... a) => oldLog("[Backup]", ...a) ;

if (process.argv.includes("--restore")) {
    await import("./dist/restore-db.js");
} else {
    await import("./dist/index.js");
}