import { readFileSync } from "fs";
import { argv } from "process";
import { Parser } from "xml2js";
import { generateInterfaces } from "./generate/generate-interface";
import { Tiled } from "../types/Tiled";
import { basename, extname } from "path";
import { sortPolygonCounterClockwise } from "./lib/geometry/geometry-math";
import { log } from "./debug/log";
import { navmeshBake, parseOptions } from "./lib/navmesh/navmesh-bake";
import { generater_navmesh } from "./generate/generate-navmesh";

let t_mapHeight = 0;

const mapPath = argv[2];
const opts = argv[3] ? parseOptions(argv[3]) : null;
const mapStr = readFileSync(mapPath, 'utf-8');
const parser = new Parser();
parser.parseString(mapStr, (error, result: Tiled) => {
    log('load tiledmap success.')
    // generateInterfaces('Tiled', result);

    const points: [number, number][] = [];
    let polygonVertexNum = 0;
    const holeVertexNum: number[] = [];
    const size: [number, number] = [0, 0];
    const name = basename(mapPath, extname(mapPath));

    const { width, height, tilewidth, tileheight } = result.map.$;
    const mapWidth = (+width + 0.5) * +tilewidth;
    const mapHeight = t_mapHeight = +tileheight + (+height - 1) * +tileheight * 0.5;

    points.push([0, 0], [mapWidth, 0], [mapWidth, mapHeight], [0, mapHeight]);
    polygonVertexNum = 4;
    size[0] = mapWidth, size[1] = mapHeight;

    const objGroup = result.map.objectgroup.find(value => {
        return value.$.name === '障碍';
    });
    const objs = objGroup.object;
    objs.forEach(obj => {
        if (obj.polygon) {
            const { x: ltX, y: ltY } = obj.$;
            let holePoints = parsePolygon(obj.polygon[0].$.points);
            holePoints = sortPolygonCounterClockwise(holePoints);
            holePoints.forEach(point => {
                points.push(lt2lb(+ltX + point.x, +ltY + point.y));
            });
            holeVertexNum.push(holePoints.length);
        } else {
            const { x: ltX, y: ltY, width: pw, height: ph } = obj.$;
            points.push(
                lt2lb(+ltX, +ltY),
                lt2lb(+ltX, +ltY + +ph),
                lt2lb(+ltX + +pw, +ltY + +ph),
                lt2lb(+ltX + +pw, +ltY),
            )
            holeVertexNum.push(4)
        }
    });

    const mapData = { points, polygonVertexNum, holeVertexNum, size, name };
    const navmeshData = navmeshBake(mapData, opts);
    generater_navmesh.generate(navmeshData, name, opts);
})

function lt2lb(x: number, y: number): [number, number] {
    return [x, t_mapHeight - y]
}

function parsePolygon(points: string) {
    return points.split(' ').map(point => {
        const [x, y] = point.split(',').map(Number);
        return { x, y };
    });
}