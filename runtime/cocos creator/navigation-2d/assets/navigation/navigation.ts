import { v2, Vec2, Vec3 } from "cc";
import { NavPolygon } from "./nav-polygon";
import { NavVertex } from "./nav-vertex";
import { SearchPoint } from "./search-point";
import { AStarQueue } from "./astar-queue";
import { AStarNode } from "./astar-node";

type TVec = Vec3 | Vec2;

interface INavmeshJsonDataArray {
    polygonsGroup: {
        [key: number]: [
            // Polygon[_convexPolygonId, _searchPointIdx, _head]
            [number, number[], number],
            // Vertex[id, [pos.x, pos.y], next, prev][]
            [number, [number, number], number, number][]
        ]
    }[],
    // SearchPoint[[vec1.x, vec1.y], [vec2.x, vec2.y], polygonId1, polygonId2][][]
    searchPointsGroup: [[number, number], [number, number], number, number, [number, number]][][]
}

class Navigation {
    private _mapPolygons: Map<number, NavPolygon>[] = [];
    private _mapSearchPoints: SearchPoint[][] = [];

    private _mapIndex = -1;
    private _openList = new AStarQueue();
    private _closeList = new AStarQueue();

    build(jsonData: string | any) {
        let navmeshData: INavmeshJsonDataArray;
        if (typeof jsonData === 'string') {
            navmeshData = JSON.parse(jsonData);
        } else {
            navmeshData = jsonData;
        }
        const { _mapPolygons, _mapSearchPoints } = this;
        const { polygonsGroup, searchPointsGroup } = navmeshData;
        polygonsGroup.forEach(serPolygons => {
            const convexPolygons: Map<number, NavPolygon> = new Map();
            for (const key in serPolygons) {
                const serPolygon = serPolygons[key];
                const serVertexs = serPolygon[1];
                const vertexs: NavVertex[] = [];
                for (let g = 0, h = serVertexs.length; g < h; g++) {
                    const serVertex = serVertexs[g];
                    const vertex = new NavVertex(
                        serVertex[0], v2(serVertex[1][0], serVertex[1][1])
                    );
                    vertex.next = serVertex[2] as any, vertex.prev = serVertex[3] as any;
                    vertexs[g] = vertex;
                }
                for (let g = 0, h = vertexs.length; g < h; g++) {
                    const vertex = vertexs[g];
                    vertex.next = vertexs[vertex.next as any];
                    vertex.prev = vertexs[vertex.prev as any];
                }
                const polygon = new NavPolygon();
                convexPolygons.set(+key, polygon);
                const serPolygon0 = serPolygon[0];
                polygon['_convexPolygonId'] = serPolygon0[0];
                polygon['_searchPointIdx'] = serPolygon0[1];
                polygon['_head'] = vertexs[serPolygon0[2]];
            }
            _mapPolygons.push(convexPolygons);
        });
        searchPointsGroup.forEach((serSearchPoints) => {
            const searchPoints: SearchPoint[] = [];
            for (let g = 0, h = serSearchPoints.length; g < h; g++) {
                const serSearchPoint = serSearchPoints[g];
                const searchPoint = new SearchPoint(
                    v2(serSearchPoint[0][0], serSearchPoint[0][1]),
                    v2(serSearchPoint[1][0], serSearchPoint[1][1]),
                    serSearchPoint[2], serSearchPoint[3],
                )
                searchPoints[g] = searchPoint;
            }
            _mapSearchPoints.push(searchPoints);
        })
    }

    moveToPath(start: TVec, target: TVec, out: TVec[]) {
        let curPolygonIdx = -1, curMapIndex = -1;
        let tarPolygonIdx = -1, tarMapIndex = -1;
        const _mapPolygons = this._mapPolygons;
        for (let g = 0, h = _mapPolygons.length; g < h; g++) {
            const _convexPolygons = _mapPolygons[g];
            for (const [key, polygon] of _convexPolygons) {
                if (polygon.isInnerVec2(start)) {
                    curMapIndex = g;
                    curPolygonIdx = key;
                }
                if (polygon.isInnerVec2(target)) {
                    tarMapIndex = g;
                    tarPolygonIdx = key;
                }
                if (curPolygonIdx >= 0 && tarPolygonIdx >= 0) break;
            }
            if (curPolygonIdx >= 0 && tarPolygonIdx >= 0) break;
        }
        if (curMapIndex < 0 || tarMapIndex < 0) {
            console.log('[cannot move] invalid map index.');
            return;
        }
        if (curMapIndex !== tarMapIndex) {
            console.log('[cannot move] not same map index.');
            return;
        }
        if (tarPolygonIdx < 0) {
            console.log('[cannot move] invalid target position.');
            return;
        }
        this._mapIndex = tarMapIndex;
        this._openList.clear();
        this._closeList.clear();
        if (curPolygonIdx === tarPolygonIdx) {
            out.push(target);
        } else {
            this.aStarSearch(curPolygonIdx, tarPolygonIdx, start, target, out);
        }
    }

    private aStarSearch(curPolygonIdx: number, tarPolygonIdx: number,
        startPos: TVec, tarPos: TVec, out: TVec[]) {
        const _mapIndex = this._mapIndex;
        const curPolygon = this._mapPolygons[_mapIndex].get(curPolygonIdx);
        const searchPoints = this._mapSearchPoints[_mapIndex];
        const searchPointIdx = curPolygon.getSearchPointIdx();
        const _openList = this._openList;
        for (let g = 0; g < searchPointIdx.length; g++) {
            const idx = searchPointIdx[g];
            const searchPoint = searchPoints[idx];
            const route = Vec2.squaredDistance(startPos, searchPoint.vecMid);
            const heuristicCost = Vec2.squaredDistance(searchPoint.vecMid, tarPos);
            _openList.insert(new AStarNode(idx, route, heuristicCost, curPolygonIdx));
        }

        this.aStarAlgorithm(tarPolygonIdx, tarPos, out);
    }

    private aStarAlgorithm(tarPolygonIdx: number, tarPos: TVec, out: TVec[]) {
        const { _openList, _closeList } = this;
        const _mapIndex = this._mapIndex;
        const convexPolygons = this._mapPolygons[_mapIndex];
        const searchPoints = this._mapSearchPoints[_mapIndex];
        if (_openList.empty()) return;
        const tempNode = _openList.getExploredNode();
        _closeList.insert(tempNode);
        const searchPoint = searchPoints[tempNode.searchPointIdx];
        const toPlygonIdx = searchPoint.getToPolygonIdx(tempNode.srcPolygonIdx);
        if (toPlygonIdx === tarPolygonIdx) {
            out.push(tarPos);
            // if (PathSmoothing) {
            //     createSmoothPath(node, tarPos);
            // } else {
            this.createPath(tempNode, out);
            // }
            return;
        }
        const toPolygon = convexPolygons.get(toPlygonIdx);
        const searchPointIdx = toPolygon.getSearchPointIdx();
        for (const idx of searchPointIdx) {
            if (_closeList.getNode(idx) === null) {
                const route = tempNode.route +
                    Vec2.squaredDistance(searchPoint.vecMid, searchPoints[idx].vecMid);
                const openNode = _openList.getNode(idx);
                if (openNode === null) {
                    _openList.insert(new AStarNode(
                        idx, route,
                        Vec2.squaredDistance(tarPos, searchPoints[idx].vecMid),
                        toPlygonIdx, tempNode, tempNode.passedLineNums + 1));
                } else if (route < openNode.route) {
                    openNode.route = route;
                    openNode.heuristicCost = Vec2.squaredDistance(tarPos, searchPoints[idx].vecMid);
                    openNode.srcPolygonIdx = toPlygonIdx;
                    openNode.parentNode = tempNode;
                    openNode.passedLineNums = tempNode.passedLineNums + 1;
                }
            }
        }
        this.aStarAlgorithm(tarPolygonIdx, tarPos, out);
    }

    private createPath(node: AStarNode, out: TVec[]) {
        const _mapIndex = this._mapIndex;
        const searchPoints = this._mapSearchPoints[_mapIndex];

        let next: TVec;
        do {
            next = searchPoints[node.searchPointIdx].vecMid;
            out.push(next);
            node = node.parentNode;
        } while (node !== null);
    }
}

export const navigation = new Navigation();

