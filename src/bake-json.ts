import { existsSync, readFileSync } from "fs";
import { argv } from "process";
import { IMapJsonData } from "./lib/navmesh/navmesh-build";
import { log } from "./debug/log";
import { navmeshBake } from "./lib/navmesh/navmesh-bake";

const mapPath = argv[2];
const skipOpt = argv[3] === 'true';
if (existsSync(mapPath)) {
    const mapStr = readFileSync(mapPath, 'utf-8');
    if (mapStr) {
        let mapData: IMapJsonData = JSON.parse(mapStr);
        if (mapData) {
            log('load jsonmap success.')
            const navmeshData = navmeshBake(mapData, skipOpt);
        }
    }
}