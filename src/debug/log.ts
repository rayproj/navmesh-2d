export function log(...msg: any[]) {
    console.log(`[${new Date().toLocaleString()}]`, ...msg);
}