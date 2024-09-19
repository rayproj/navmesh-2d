import { union } from "martinez-polygon-clipping";
import { TMapData } from "../test";

export function unionPolygon(mapData: TMapData) {
    const { holeVertexNum, polygonVertexNum, points } = mapData;
    const polygons = [];
    let posOffsetIdx = 0;
    holeVertexNum.forEach((num) => {
        const polygon = [];
        for (let i = 0; i < num; i++) {
            const point = points[polygonVertexNum + posOffsetIdx];
            polygon.push(point);
            posOffsetIdx = posOffsetIdx + 1;
        }
        polygon.push(polygon[0])
        polygons.push([polygon]);
    })

    // @ts-ignore
    let index = 1;
    let result = polygons[0];
    while (index < polygons.length) {
        result = union(result, polygons[index]);
        index++;
    }
    
    let unionPolygons: [number, number][][][] = result;
    const newHoleVertexNum = [];
    let newPoints = [];
    newPoints = newPoints.concat(points.slice(0, polygonVertexNum))
    unionPolygons.forEach(unionPolygon => {
        const upolygon = unionPolygon[0];
        upolygon.length -= 1;
        newHoleVertexNum.push(upolygon.length);
        newPoints = newPoints.concat(upolygon);
    });
    mapData.holeVertexNum = newHoleVertexNum;
    mapData.points = newPoints;
}