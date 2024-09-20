import { union } from "martinez-polygon-clipping";
import { TMapData } from "../test";

// 扩边
const Scale = 1.0001;
// 计算多边形中心点
function getCentroid(polygon: [number, number][]) {
    let x = 0, y = 0;
    const numPoints = polygon.length;
    polygon.forEach(point => {
        x += point[0];
        y += point[1];
    });
    return [x / numPoints, y / numPoints];
}

// 扩大多边形
function scalePolygon(polygon: [number, number][], scale: number): [number, number][] {
    const centroid = getCentroid(polygon);
    return polygon.map(point => {
        return [
            centroid[0] + (point[0] - centroid[0]) * scale,
            centroid[1] + (point[1] - centroid[1]) * scale
        ];
    });
}

export function unionPolygon(mapData: TMapData) {
    const { holeVertexNum, polygonVertexNum, points } = mapData;
    const polygons = [];
    let posOffsetIdx = 0;
    holeVertexNum.forEach((num) => {
        let polygon: [number, number][] = [];
        for (let i = 0; i < num; i++) {
            const point = points[polygonVertexNum + posOffsetIdx];
            polygon.push(point);
            posOffsetIdx = posOffsetIdx + 1;
        }
        polygon = scalePolygon(polygon, Scale);
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

    if (polygons.length > 1) {
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
}