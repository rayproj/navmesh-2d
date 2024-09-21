import { SearchPoint } from "../astar/search-point";
import { Polygon } from "../geometry/polygon";
import { new_vec2, Vec2 } from "../geometry/vec2";
import { IMapJsonData, INavmeshBuildData, navmeshBuild } from "./navmesh-build";
import { IMapOptimizeData, optimizeMap } from "./optimize-map";

type TOptFineshHandler = (optDatas: IMapOptimizeData[]) => void;
let _optFinishHandler: TOptFineshHandler = null;
export function setOptFinish(handler: TOptFineshHandler) {
    _optFinishHandler = handler;
}

export function navmeshBake(mapData: IMapJsonData, skipOpt = false, debugLineWidth = 1) {
    const { size, name } = mapData;
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
        optDatas = optimizeMap(mapData, debugLineWidth);
        if (_optFinishHandler) {
            _optFinishHandler(optDatas);
            _optFinishHandler = null;
        }
    }
    const debugEnable = optDatas.length === 1 ? 1 : 0;
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
    return navmeshData;
}