import { canvasDebugDrawer } from "../../debug/canvas-debug-draw";
import { 颜色 } from "../../debug/color";
import { OutPath } from "../../generate/generate-navmesh";
import { SearchPoint } from "../astar/search-point";
import { GeometryMath } from "../geometry/geometry-math";
import { Line } from "../geometry/line";
import { Polygon } from "../geometry/polygon";
import { Vec2 } from "../geometry/vec2";
import { Vertex } from "../geometry/vertex";
import { make_pair, PriorityQueue } from "../utils";

export interface IMapJsonData {
    points: [number, number][],
    polygonVertexNum: number,
    holeVertexNum: number[], size: [number, number],
    name: string
}

export interface INavmeshBuildData {
    in: {
        vecArr: Vec2[],
        polygonVertexNum: number, holeVertexNum: number[],
        mapWidth: number, mapHeight: number, mapName: string
    },

    out: {
        convexPolygons: Map<number, Polygon>, searchPoints: SearchPoint[]
    }

    debug: {
        enable: number,
        lineWidth?: number
    }
}

const PolygonMaxVertex = 10;

let maxWidth = 0, maxHeight = 0;
let t_mapName = '';
let debugEnable = false;
let debugLineWidth = 5;

let newPointId = 0;
let convexPolygonId = 1;

const polygons: Polygon[] = [];
const holes: Polygon[] = [];
const linkHoleLines: Line[] = [];
const clipLines = new PriorityQueue<Line>((a, b) => { return b.len - a.len; })
const closeClipLines: Line[] = [];

let t_convexPolygons: Map<number, Polygon> = null;
let t_searchPoints: SearchPoint[] = null;

export function navmeshBuild(data: INavmeshBuildData) {
    polygons.length = holes.length = linkHoleLines.length =
        clipLines.length = closeClipLines.length = 0;

    const {
        vecArr, polygonVertexNum, holeVertexNum,
        mapWidth, mapHeight, mapName
    } = data.in;
    const { convexPolygons, searchPoints } = data.out;

    maxWidth = mapWidth, maxHeight = mapHeight, t_mapName = mapName;
    t_convexPolygons = convexPolygons, t_searchPoints = searchPoints;
    debugEnable = data.debug.enable !== 0;
    debugLineWidth = data.debug.lineWidth || debugLineWidth;

    debugEnable && canvasDebugDrawer.init(mapWidth, mapHeight);

    const polygon = new Polygon();
    for (let i = 0; i < polygonVertexNum; i++) {
        const v1 = vecArr[i];
        polygon.insert(newPointId++, v1);
    }
    debugEnable && canvasDebugDrawer.drawPolygon(polygon, null, 颜色.品红, debugLineWidth);
    polygons.push(polygon);

    let posOffsetIdx = 0;
    holeVertexNum.forEach((num) => {
        const hole = new Polygon();
        for (let i = 0; i < num; i++) {
            const v1 = vecArr[polygonVertexNum + posOffsetIdx];
            hole.insert(newPointId++, v1);
            posOffsetIdx = posOffsetIdx + 1;
        }
        debugEnable && canvasDebugDrawer.drawPolygon(hole, 颜色.棕色);
        holes.push(hole);
    })
    const t_holes = holes.concat();
    drawOut();

    linkHole();
    drawOut();

    clipPolygon();
    drawOut();

    mergePolygon();
    drawClear();
    for (const [key, polygon] of t_convexPolygons) {
        debugEnable && canvasDebugDrawer.drawPolygon(polygon, null, 颜色.灰色, debugLineWidth);
    }
    t_holes.forEach(hole => {
        debugEnable && canvasDebugDrawer.drawPolygon(hole, 颜色.棕色);
    });
    drawOut();

    parseNavMeshData();
}

function linkHole() {
    while (holes.length !== 0) {
        const hole = holes[0];
        holes.shift();
        if (polygons[0].isInnerHole(hole)) {
            const verts = getLinkHoleVertex(polygons[0], hole);
            if (verts.second === null || verts.first === null) {
                holes.push(hole);
            } else {
                debugEnable && canvasDebugDrawer.drawLine(
                    verts.first.pos!, verts.second.pos!, 颜色.黑色, debugLineWidth);

                let vPolygon = verts.first;
                const vertPolygonNext = vPolygon.next!;

                /**
                 * hole 的顶点需要顺时针插入 polygon
                 */
                let vHole = verts.second;
                do {
                    const vert = new Vertex(vHole.id, vHole.pos!.clone());
                    vPolygon.next = vert;
                    vert.prev = vPolygon;
                    vPolygon = vert;
                    vHole = vHole.prev!;
                } while (!vHole.isSameVert(verts.second));

                newPointId++;
                const newVHole = new Vertex(newPointId, verts.second.pos!.clone());
                newVHole.prev = vPolygon;
                vPolygon.next = newVHole;

                newPointId++;
                const newVPolygon = new Vertex(newPointId, verts.first.pos!.clone());
                newVHole.next = newVPolygon;
                newVPolygon.prev = newVHole;
                newVPolygon.next = vertPolygonNext;
                vertPolygonNext.prev = newVPolygon;

                const len = verts.first.pos!.distance(verts.second.pos!);
                linkHoleLines.push(
                    new Line(verts.first, verts.second, len)
                );
            }
        }
    }
}

/**
 * 从 hole 选择一个顶点 pA
 * 从 polygon 选择一个顶点 pB
 * pB 与 pA 连线不与 polygon 和 hole 上的任意非相邻边相交
 * 且连线在 pB 为顶点的角内部和 pA 为顶点的角外部
 */
function getLinkHoleVertex(polygon: Polygon, hole: Polygon) {
    let vertHole = hole.getHead();
    do {
        let vertPolygon = polygon.getHead();
        do {
            const isInAngle = polygon.isLineInInnerAngle(vertHole, vertPolygon) &&
                !hole.isLineInInnerAngle(vertPolygon, vertHole);
            if (isInAngle) {
                let noIntersect =
                    polygon.isVectorNoIntersectWithAdjacentEdge(vertPolygon, vertHole) &&
                    hole.isVectorNoIntersectWithAdjacentEdge(vertPolygon, vertHole);
                for (let g = 0; g < holes.length; g++) {
                    const tempHole = holes[g];
                    if (!tempHole.isVectorNoIntersectWithAdjacentEdge(vertPolygon, vertHole)) {
                        noIntersect = false;
                        break;
                    }
                }
                if (noIntersect) return make_pair(vertPolygon, vertHole);
            }
            vertPolygon = vertPolygon.next!;
        } while (!vertPolygon.isSameVert(polygon.getHead()));
        vertHole = vertHole.next!;
    } while (!vertHole.isSameVert(hole.getHead()));
    return make_pair(null, null);
}

function clipPolygon() {
    while (polygons.length !== 0) {
        const polygon = polygons[0];
        polygons.shift();
        const verts = polygon.findClipVert();
        if (verts.first === null || verts.second === null) {
            // 凸边形
            polygon.setConvexPolygonId(convexPolygonId);
            t_convexPolygons.set(convexPolygonId, polygon);
            convexPolygonId++;
        } else {
            debugEnable && canvasDebugDrawer.drawLine(
                verts.first.pos!, verts.second.pos!, 颜色.灰色, debugLineWidth);
            const len = verts.first.pos!.distance(verts.second.pos!);
            clipLines.push(new Line(verts.first, verts.second, len));

            const tarPrev = verts.second.prev!;
            const srcNext = verts.first.next!;
            verts.first.next = verts.second;
            verts.second.prev = verts.first;

            polygon.setHead(verts.first);

            const newPolygon = new Polygon();
            const tail = new Vertex(verts.first.id, verts.first.pos);
            tail.next = srcNext;
            srcNext.prev = tail;
            const head = new Vertex(verts.second.id, verts.second.pos);
            head.prev = tarPrev;
            head.next = tail;
            tarPrev.next = head;
            tail.prev = head;
            newPolygon.setHead(head);

            polygons.push(polygon);
            polygons.push(newPolygon);
        }
    }

    /**
     * 在分割完所有凸多边形后，把连接孔洞的线也加入分割线，作为合并多边形的判断
     */
    while (linkHoleLines.length !== 0) {
        clipLines.push(linkHoleLines[0]);
        linkHoleLines.shift();
    }
}

function mergePolygon() {
    while (clipLines.length !== 0) {
        /**
         * 获取最长的分割边
         */
        const line = clipLines[0];
        clipLines.shift();

        let firstPolygon: Polygon;
        let secondPolygon: Polygon;
        let vert1: Vertex;
        let vert2: Vertex;

        const info = getMergeInfo(line);
        firstPolygon = info[0];
        secondPolygon = info[1];
        vert1 = info[2];
        vert2 = info[3];

        if (firstPolygon === null) {
            closeClipLines.push(line);
        } else {
            t_convexPolygons.delete(secondPolygon.getConvexPolygonId());

            let cur = vert1.next;
            let mergeEnd = vert1.next.next;
            let next = vert2.next.next.next;
            do {
                let vNext = new Vertex(next.id, next.pos);
                cur.next = vNext;
                vNext.prev = cur;
                cur = cur.next;
                next = next.next;
            } while (!next.isSameVert(vert2.next));
            cur.next = mergeEnd;
            mergeEnd.prev = cur;
        }
    }
}

/**
 * 判断分割边分割的两个凸多边形合并仍是凸多边形
 * 即分割边两个共享点在合并的凸多边形里是 凸点
 */
function checkMergeLineAngle(linePrevVert1: Vertex, linePrevVert2: Vertex) {
    /**
     * 求合并的新凸多边形，公共边对应的两个角的顶点
     */
    const v1Prev = linePrevVert1.pos;
    const v1 = linePrevVert1.next.pos;
    const v1Next = linePrevVert2.next.next.next.pos;
    const v2Prev = linePrevVert2.pos;
    const v2 = linePrevVert2.next.pos;
    const v2Next = linePrevVert1.next.next.next.pos;
    if (GeometryMath.isInRight(v1Prev, v1, v1Next)) return false;
    if (GeometryMath.isInRight(v2Prev, v2, v2Next)) return false;
    return true;
}

/**
 * 获取分割边分割的凸多边形
 */
function getMergeInfo(line: Line): [Polygon, Polygon, Vertex, Vertex] {
    let firstPolygon: Polygon;
    let secondPolygon: Polygon;
    let vert1: Vertex;
    let vert2: Vertex;

    for (const [key, polygon] of t_convexPolygons) {
        const linePrev = polygon.getLinePrevVert(line);
        if (linePrev !== null) {
            if (firstPolygon === undefined) {
                firstPolygon = polygon;
                vert1 = linePrev;
            } else {
                secondPolygon = polygon;
                vert2 = linePrev;
                break;
            }
        }
    }

    /**
     * 能合并最大多边形判断
     */
    if (firstPolygon.getSize() + secondPolygon.getSize() - 2 > PolygonMaxVertex) {
        return [null, null, null, null];
    }
    if (!checkMergeLineAngle(vert1, vert2)) {
        return [null, null, null, null];
    }
    return [firstPolygon, secondPolygon, vert1, vert2];
}

function parseNavMeshData() {
    for (let g = 0; g < closeClipLines.length; g++) {
        const line = closeClipLines[g];
        let firstPolygon: Polygon = null;
        let secondPolygon: Polygon = null;
        for (const [value, polygon] of t_convexPolygons) {
            if (polygon.hasLine(line)) {
                if (firstPolygon === null) {
                    firstPolygon = polygon;
                } else if (secondPolygon === null) {
                    secondPolygon = polygon;
                    break;
                }
            }
        }
        firstPolygon.insertSearchPointIdx(g);
        secondPolygon.insertSearchPointIdx(g);
        t_searchPoints.push(
            new SearchPoint(line.vert1.pos,
                line.vert2.pos,
                firstPolygon.getConvexPolygonId(),
                secondPolygon.getConvexPolygonId())
        );
    }
}

function drawClear() {
    debugEnable && canvasDebugDrawer.clear(颜色.白色);
}

let drawHash = 1;
function drawOut() {
    debugEnable && canvasDebugDrawer.out(OutPath, `${t_mapName}${drawHash++}`);
}