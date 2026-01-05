import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

export function randomInt(min: number, max: number) {
    return Math.floor(min + Math.random() * (max - min));
}

export function writeFileSync_safe(dir: string, data: any) {
    const path = dirname(dir);
    if (path && !existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }
    writeFileSync(dir, data);
}

export const make_pair = <T>(first: T, second: T) => { return { first, second }; }

export class PriorityQueue<T> extends Array<T> {
    constructor(
        private _cmp: ((a: T, b: T) => number)
    ) {
        super();
    }

    push(...items: T[]): number {
        const length = super.push(...items);
        this.sort(this._cmp);
        return length;
    }
}
