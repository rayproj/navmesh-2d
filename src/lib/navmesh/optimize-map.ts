import { diff } from "martinez-polygon-clipping";
import { IMapJsonData } from "./navmesh-build";
import { canvasDebugDrawer } from "../../debug/canvas-debug-draw";
import { randomColor, 颜色 } from "../../debug/color";
import { scalePolygon } from "../geometry/geometry-math";
import { new_vec2, Vec2 } from "../geometry/vec2";
import { OutPath } from "../../generate/generate-navmesh";

const pScale = 1.0000001;

export interface IMapOptimizeData {
    vecArr: Vec2[], polygonVertexNum: number, holeVertexNum: number[]
}

export function optimizeMap(mapData: IMapJsonData, debugLineWidth = 1) {
    const mapPolygons: [number, number][][] = [];
    const holePolygons: [number, number][][] = [];

    const { polygonVertexNum, holeVertexNum, points, size } = mapData;

    const mapPolygon: [number, number][] = [];
    for (let i = 0; i < polygonVertexNum; i++) {
        mapPolygon.push(points[i]);
    }
    mapPolygon.push(mapPolygon[0]);
    mapPolygons.push(mapPolygon);

    let posOffsetIdx = 0;
    holeVertexNum.forEach((num) => {
        let holePolygon: [number, number][] = [];
        for (let i = 0; i < num; i++) {
            const p1 = points[polygonVertexNum + posOffsetIdx];
            holePolygon.push(p1);
            posOffsetIdx = posOffsetIdx + 1;
        }
        holePolygon = scalePolygon(holePolygon, pScale);
        holePolygon.push(holePolygon[0]);
        holePolygons.push(holePolygon);
    })

    let diffResult = mapPolygons as any as [number, number][][][];
    let index = 0;
    while (index < holePolygons.length) {
        diffResult = diff(diffResult, [holePolygons[index]]) as any;
        index++;
    }

    const optDatas: IMapOptimizeData[] = [];
    diffResult.forEach(diffMap => {
        const vecArr: Vec2[] = [];
        const holeVertexNum: number[] = [];
        const optData: IMapOptimizeData = {
            vecArr, holeVertexNum, polygonVertexNum: diffMap[0].length - 1
        }
        for (let g = 0; g < diffMap.length; g++) {
            const tPolygon = diffMap[g];
            for (let h = 0; h < tPolygon.length - 1; h++) {
                const tPoint = tPolygon[h];
                vecArr.push(new_vec2(tPoint[0], tPoint[1]));
            }
            if (g !== 0) {
                holeVertexNum.push(tPolygon.length - 1);
            }
        }
        optDatas.push(optData);
    });


    canvasDebugDrawer.init(size[0], size[1], 颜色.白色);
    diffResult.forEach(diffMap => {
        const color = randomColor();
        diffMap.forEach(tPolygon => {
            canvasDebugDrawer.drawPoints(tPolygon, null, color, debugLineWidth, 0);
        });
    });
    canvasDebugDrawer.out(OutPath, mapData.name + '_opt');

    return optDatas;
}