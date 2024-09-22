import { canvasDebugDrawer } from "../../debug/canvas-debug-draw";
import { randomColor, 颜色 } from "../../debug/color";
import { OutPath } from "../../generate/generate-navmesh";
import { SearchPoint } from "../astar/search-point";
import { Polygon } from "../geometry/polygon";
import { new_vec2, Vec2 } from "../geometry/vec2";
import { IMapJsonData, INavmeshBuildData, navmeshBuild } from "./navmesh-build";
import { IMapOptimizeData, optimizeMap, pScaleOptimize } from "./optimize-map";

export interface IBakeOptions {
    opt_skip?: string, opt_pScale?: string,
    debug_lineWidth?: string
}

export function parseOptions(optStr: string): IBakeOptions {
    const pairs = optStr.split(',');
    const obj = {};

    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        obj[key] = value;
    });
    return obj;
}

export function navmeshBake(mapData: IMapJsonData, opt: IBakeOptions) {
    const { size, name } = mapData;

    const skipOpt = opt?.opt_skip === '1';
    const pScaleOpt = +opt?.opt_pScale || pScaleOptimize;
    const debugLineWidth = +opt?.debug_lineWidth || 1;

    let optDatas: IMapOptimizeData[];
    if (skipOpt) {
        optDatas = [];
        const vecArr: Vec2[] = [];
        mapData.points.forEach(p => {
            vecArr.push(new_vec2(p[0], p[1]));
        })
        optDatas.push({
            vecArr, holeVertexNum: mapData.holeVertexNum, polygonVertexNum: mapData.polygonVertexNum
        })
    } else {
        optDatas = optimizeMap(mapData, pScaleOpt, debugLineWidth);
    }
    const debugEnable = optDatas.length === 1 ? 1 : 0;

    if (!debugEnable) {
        canvasDebugDrawer.init(size[0], size[1], 颜色.白色);
        optDatas.forEach(optData => {
            const color = randomColor();
            const { vecArr, polygonVertexNum, holeVertexNum } = optData;
            let posOffsetIdx = 0;
            holeVertexNum.forEach(num => {
                const hole = new Polygon();
                for (let i = 0; i < num; i++) {
                    const v1 = vecArr[polygonVertexNum + posOffsetIdx];
                    hole.insert(polygonVertexNum + posOffsetIdx, v1);
                    posOffsetIdx = posOffsetIdx + 1;
                }
                canvasDebugDrawer.drawPolygon(hole, color);
            });
        });
    }

    const navmeshData: {
        convexPolygons: Map<number, Polygon>, searchPoints: SearchPoint[]
    }[] = []
    optDatas.forEach(optData => {
        const convexPolygons: Map<number, Polygon> = new Map();
        const searchPoints: SearchPoint[] = [];
        const data: INavmeshBuildData = {
            in: {
                vecArr: optData.vecArr,
                polygonVertexNum: optData.polygonVertexNum, holeVertexNum: optData.holeVertexNum,
                mapWidth: size[0], mapHeight: size[1], mapName: name
            },
            out: { convexPolygons, searchPoints },
            debug: { enable: debugEnable, lineWidth: debugLineWidth }
        }
        navmeshBuild(data);
        navmeshData.push({ convexPolygons, searchPoints });
    });

    if (!debugEnable) {
        navmeshData.forEach(navmeshData0 => {
            const { convexPolygons } = navmeshData0;
            for (const [key, polygon] of convexPolygons) {
                canvasDebugDrawer.drawPolygon(polygon, 颜色.白色, 颜色.灰色, debugLineWidth);
            }
        });
        canvasDebugDrawer.out(OutPath, `${name}4`);
    }

    return navmeshData;
}