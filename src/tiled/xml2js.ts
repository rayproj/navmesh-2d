import { readFileSync, writeFileSync } from "fs";
import { argv } from "process";
import { Parser } from "xml2js";
import { generateInterfaces } from "../generate/generateInterface";
import { Tiled } from "../../types/Tiled";
import { basename, extname } from "path";

let MapHeight = 0;

const xmlDir = argv[2];
const xmlStr = readFileSync(xmlDir, 'utf-8');
const parser = new Parser();
parser.parseString(xmlStr, (error, result: Tiled) => {
    // generateInterfaces('Tiled', result);

    const points: [number, number][] = [];
    let polygonVertexNum = 0;
    const holeVertexNum: number[] = [];
    const size = [0, 0];
    const name = basename(xmlDir, extname(xmlDir));

    const { width, height, tilewidth, tileheight } = result.map.$;
    const mapWidth = (+width + 0.5) * +tilewidth;
    const mapHeight = MapHeight = +tileheight + (+height - 1) * +tileheight * 0.5;

    points.push([0, 0], [mapWidth, 0], [mapWidth, mapHeight], [0, mapHeight]);
    polygonVertexNum = 4;
    size[0] = mapWidth, size[1] = mapHeight;

    const objGroup = result.map.objectgroup.find(value => {
        return value.$.name === '障碍';
    });
    const objs = objGroup.object;
    objs.forEach(obj => {
        if (obj.polygon) {
            const { x: px, y: py } = obj.$;
            let pps = parsePolygon(obj.polygon[0].$.points);
            pps = sortPolygonCounterClockwise(pps);
            pps.forEach(point => {
                points.push(lt2lb(+px + point.x, +py + point.y));
            });
            holeVertexNum.push(pps.length);
        } else {
            const { x: px, y: py, width: pw, height: ph } = obj.$;
            points.push(
                lt2lb(+px, +py),
                lt2lb(+px, +py + +ph),
                lt2lb(+px + +pw, +py + +ph),
                lt2lb(+px + +pw, +py),
            )
            holeVertexNum.push(4)
        }
    });

    const mapData = { points, polygonVertexNum, holeVertexNum, size, name };
    const mapStr = JSON.stringify(mapData);
    writeFileSync(xmlDir.replace('.tmx', '.json'), mapStr);
})

function lt2lb(x: number, y: number): [number, number] {
    return [x, MapHeight - y]
}

function parsePolygon(points: string) {
    return points.split(' ').map(point => {
        const [x, y] = point.split(',').map(Number);
        return { x, y };
    });
}

function computeCentroid(polygon: { x: number, y: number }[]) {
    const centroid = polygon.reduce(
        (acc, point) => {
            acc.x += point.x;
            acc.y += point.y;
            return acc;
        },
        { x: 0, y: 0 }
    );
    centroid.x /= polygon.length;
    centroid.y /= polygon.length;
    return centroid;
}

function sortPolygonCounterClockwise(polygon: { x: number, y: number }[]) {
    const centroid = computeCentroid(polygon);

    return polygon.sort((a, b) => {
        const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
        const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
        return angleB - angleA; // 将角度按照降序排列
    });
}