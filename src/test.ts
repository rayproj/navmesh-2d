import { existsSync, readFileSync } from "fs";
import { canvasDebugDrawer } from "./debug/canvas-debug-draw";
import { 颜色 } from "./debug/color";
import { generater } from "./generate/generate";
import { AStarNode } from "./lib/astar-node";
import { AStarQueue } from "./lib/astar-queue";
import { GeometryMath, make_pair, new_vec2, PriorityQueue, Vec2 } from "./lib/geometry-math";
import { Line } from "./lib/line";
import { Polygon } from "./lib/polygon";
import { SearchPoint } from "./lib/search-point";
import { Vertex } from "./lib/vertex";
import { unionPolygon } from "./lib/union-polygon";

export type TMapData = {
    points: [number, number][],
    polygonVertexNum: number,
    holeVertexNum: number[], size: [number, number],
    name: string
}

let VecArr = [
    new_vec2(100, 100),
    new_vec2(130, 70),
    new_vec2(170, 110),
    new_vec2(210, 100),
    new_vec2(240, 250),
    new_vec2(300, 50),
    new_vec2(330, 170),
    new_vec2(400, 300),
    new_vec2(420, 30),
    new_vec2(490, 50),
    new_vec2(600, 20),
    new_vec2(650, 100),
    new_vec2(680, 120),
    new_vec2(720, 130),
    new_vec2(730, 115),
    new_vec2(765, 170),
    new_vec2(800, 150),
    new_vec2(820, 160),
    new_vec2(855, 200),
    new_vec2(900, 175),
    new_vec2(930, 165),
    new_vec2(990, 230),
    new_vec2(1115, 320),
    new_vec2(1115, 620),
    new_vec2(100, 620),

    new_vec2(150, 120),
    new_vec2(170, 120),
    new_vec2(170, 550),
    new_vec2(150, 550),

    new_vec2(380, 330),
    new_vec2(420, 320),
    new_vec2(450, 380),
    new_vec2(350, 420),

    new_vec2(365, 450),
    new_vec2(500, 500),
    new_vec2(330, 500),

    new_vec2(300, 550),
    new_vec2(700, 500),
    new_vec2(800, 600),
    new_vec2(300, 600),

    new_vec2(1000, 350),
    new_vec2(1050, 550),
    new_vec2(900, 600),
    new_vec2(800, 300),

    new_vec2(500, 300),
    new_vec2(600, 370),
    new_vec2(550, 350),

    new_vec2(480, 250),
    new_vec2(525, 240),
    new_vec2(585, 275),
    new_vec2(645, 240),
    new_vec2(605, 290),
    new_vec2(555, 310),

    new_vec2(450, 100),
    new_vec2(550, 100),
    new_vec2(700, 220),
    new_vec2(680, 220),

    new_vec2(210, 150),
    new_vec2(270, 450),
    new_vec2(290, 120),
    new_vec2(350, 300),
    new_vec2(340, 420),
    new_vec2(320, 480),
    new_vec2(300, 530),
    new_vec2(290, 500),
    new_vec2(270, 550),
    new_vec2(240, 535),
    new_vec2(235, 500),
    new_vec2(230, 470),
    new_vec2(220, 460),
    new_vec2(200, 445),
];
let polygonVertexNum = 25;
let holeVertexNum = [4, 4, 3, 4, 4, 3, 6, 4, 14];
let maxWidth = 1200, maxHeight = 700;
let mapName = 'test';

const PolygonMaxVertex = 10;

const mapPath = `map/map.json`;
if (existsSync(mapPath)) {
    const mapStr = readFileSync(`map/map.json`, 'utf-8');
    if (mapStr) {
        let mapData: TMapData = null;
        try {
            mapData = JSON.parse(mapStr);
        } catch (error) {
            console.log('invalid map data, use default map data.')
        }
        if (mapData) {
            // union
            unionPolygon(mapData);

            VecArr = [];
            const points = mapData.points;
            for (let g = 0; g < points.length; g++) {
                const point = points[g];
                VecArr[g] = new_vec2(point[0], point[1]);
            }

            polygonVertexNum = mapData.polygonVertexNum;
            holeVertexNum = mapData.holeVertexNum;
            maxWidth = mapData.size[0];
            maxHeight = mapData.size[1];
            mapName = mapData.name;
            console.log('load map data success.')
        }
    }
}

function drawClear() {
    canvasDebugDrawer.init(maxWidth, maxHeight, 颜色.白色);
}
drawClear();
let drawHash = 1;
function drawOut() {
    canvasDebugDrawer.out('test/', `${mapName}${drawHash++}`);
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
                canvasDebugDrawer.drawLine(
                    verts.first.pos!, verts.second.pos!, 颜色.黑色, 1);

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
                    new Line(verts.first, verts.second, len, /* drawNode */)
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
            convexPolygons.set(convexPolygonId, polygon);
            convexPolygonId++;
        } else {
            canvasDebugDrawer.drawLine(
                verts.first.pos!, verts.second.pos!, 颜色.灰色, 1);
            const len = verts.first.pos!.distance(verts.second.pos!);
            clipLines.push(new Line(verts.first, verts.second, len, /* drawNode */));

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

    for (const [key, polygon] of convexPolygons) {
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
            convexPolygons.delete(secondPolygon.getConvexPolygonId());

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

function parseNavMeshData() {
    for (let g = 0; g < closeClipLines.length; g++) {
        const line = closeClipLines[g];
        let firstPolygon: Polygon = null;
        let secondPolygon: Polygon = null;
        for (const [value, polygon] of convexPolygons) {
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
        searchPoints.push(
            new SearchPoint(line.vert1.pos,
                line.vert2.pos,
                firstPolygon.getConvexPolygonId(),
                secondPolygon.getConvexPolygonId())
        );
    }
}

function moveToPath(srcVec: Vec2, vec: Vec2) {
    let curPolygonIdx = -1;
    let tarPolygonIdx = -1;
    for (const [key, polygon] of convexPolygons) {
        if (polygon.isInnerVec2(srcVec)) {
            curPolygonIdx = key;
        }
        if (polygon.isInnerVec2(vec)) {
            tarPolygonIdx = key;
        }
        if (curPolygonIdx >= 0 && tarPolygonIdx >= 0) break;

    }
    if (tarPolygonIdx < 0) {
        console.log('---------->> cannot move !!!!!!!');
        return;
    }

    openList.clear();
    closeList.clear();
    if (curPolygonIdx === tarPolygonIdx) {
        moveVec.push(vec);
    } else {
        aStarSearch(curPolygonIdx, tarPolygonIdx, srcVec, vec);
    }
}

function aStarSearch(
    curPolygonIdx: number, tarPolygonIdx: number,
    srcVec: Vec2, tarPos: Vec2
) {
    const curPolygon = convexPolygons.get(curPolygonIdx);
    const searchPointIdx = curPolygon.getSearchPointIdx();
    for (let g = 0; g < searchPointIdx.length; g++) {
        const idx = searchPointIdx[g];
        const searchPoint = searchPoints[idx];
        const route = srcVec.distanceSqr(searchPoint.vecMid);
        const heuristicCost = searchPoint.vecMid.distanceSqr(tarPos);
        openList.insert(new AStarNode(idx, route, heuristicCost, curPolygonIdx));
    }

    aStarAlgorithm(tarPolygonIdx, tarPos);
}

function aStarAlgorithm(tarPolygonIdx: number, tarPos: Vec2) {
    if (openList.empty()) return;
    const tempNode = openList.getExploredNode();
    closeList.insert(tempNode);
    const searchPoint = searchPoints[tempNode.searchPointIdx];
    const toPlygonIdx = searchPoint.getToPolygonIdx(tempNode.srcPolygonIdx);
    if (toPlygonIdx === tarPolygonIdx) {
        moveVec.push(tarPos);
        // if (PathSmoothing) {
        //     createSmoothPath(node, tarPos);
        // } else {
        createPath(tempNode, tarPos);
        // }
        return;
    }
    const toPolygon = convexPolygons.get(toPlygonIdx);
    const searchPointIdx = toPolygon.getSearchPointIdx();
    for (const idx of searchPointIdx) {
        if (closeList.getNode(idx) === null) {
            const route = tempNode.route + searchPoint.vecMid.distanceSqr(
                searchPoints[idx].vecMid);
            const openNode = openList.getNode(idx);
            if (openNode === null) {
                openList.insert(new AStarNode(
                    idx, route, searchPoints[idx].vecMid.distanceSqr(tarPos),
                    toPlygonIdx, tempNode, tempNode.passedLineNums + 1));
            } else if (route < openNode.route) {
                openNode.route = route;
                openNode.heuristicCost = searchPoints[idx].vecMid.distanceSqr(tarPos);
                openNode.srcPolygonIdx = toPlygonIdx;
                openNode.parentNode = tempNode;
                openNode.passedLineNums = tempNode.passedLineNums + 1;
            }
        }
    }
    aStarAlgorithm(tarPolygonIdx, tarPos);
}

function createPath(node: AStarNode, tarPos: Vec2) {
    let last: Vec2, next: Vec2;
    last = tarPos;
    do {
        next = searchPoints[node.searchPointIdx].vecMid;
        moveVec.push(next);
        last = next;
        node = node.parentNode;
    } while (node != null);
}

const polygons: Polygon[] = [];
const holes: Polygon[] = [];
let newPointId = 0;
const linkHoleLines: Line[] = [];
let convexPolygonId = 0;
const convexPolygons: Map<number, Polygon> = new Map();
const clipLines = new PriorityQueue<Line>((a, b) => { return b.len - a.len; })
const closeClipLines: Line[] = [];
const searchPoints: SearchPoint[] = [];
const openList: AStarQueue = new AStarQueue();
const closeList: AStarQueue = new AStarQueue();
const moveVec: Vec2[] = [];

function test() {
    newPointId = VecArr.length;
    convexPolygonId = 1;
    const polygon = new Polygon();
    for (let i = 0; i < polygonVertexNum; i++) {
        const v1 = VecArr[i];
        polygon.insert(i, v1);
    }
    canvasDebugDrawer.drawPolygon(polygon, null, 颜色.品红, 1);
    polygons.push(polygon);

    let posOffsetIdx = 0;
    holeVertexNum.forEach((num) => {
        const hole = new Polygon();
        for (let i = 0; i < num; i++) {
            const v1 = VecArr[polygonVertexNum + posOffsetIdx];
            hole.insert(polygonVertexNum + posOffsetIdx, v1);
            posOffsetIdx = posOffsetIdx + 1;
        }
        canvasDebugDrawer.drawPolygon(hole, 颜色.棕色, null);
        holes.push(hole);
    })

    drawOut();
    linkHole();
    drawOut();
    clipPolygon();
    drawOut();

    mergePolygon();
    drawClear();
    for (const [key, polygon] of convexPolygons) {
        canvasDebugDrawer.drawPolygon(polygon, null, 颜色.灰色, 1);
    }
    posOffsetIdx = 0;
    holeVertexNum.forEach((num) => {
        const hole = new Polygon();
        for (let i = 0; i < num; i++) {
            const v1 = VecArr[polygonVertexNum + posOffsetIdx];
            hole.insert(polygonVertexNum + posOffsetIdx, v1);
            posOffsetIdx = posOffsetIdx + 1;
        }
        canvasDebugDrawer.drawPolygon(hole, 颜色.棕色, null);
    })
    drawOut();

    parseNavMeshData();

    generater.generatePolygons(convexPolygons, searchPoints, 'test/', mapName)
}

test();