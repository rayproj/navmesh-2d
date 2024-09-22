import { existsSync, readFileSync } from "fs";
import { argv } from "process";
import { IMapJsonData } from "./lib/navmesh/navmesh-build";
import { log } from "./debug/log";
import { navmeshBake, parseOptions } from "./lib/navmesh/navmesh-bake";

const mapPath = argv[2];
const opts = argv[3] ? parseOptions(argv[3]) : null;
if (existsSync(mapPath)) {
    const mapStr = readFileSync(mapPath, 'utf-8');
    if (mapStr) {
        let mapData: IMapJsonData = JSON.parse(mapStr);
        if (mapData) {
            log('load jsonmap success.')
            const navmeshData = navmeshBake(mapData, opts);
        }
    }
}