import { GeometryMath, make_pair, new_vec2, Vec2 } from "./geometry-math";
import { Line } from "./line";
import { Vertex } from "./vertex";

export class Polygon {
    private _head: Vertex | null = null;

    getHead() { return this._head!; }

    insert(id: number, pos: Vec2) {
        const vert = new Vertex(id, pos);
        let head = this._head;
        if (head === null) {
            head = this._head = vert;
            head.next = vert;
            head.prev = vert;
        } else {
            const tail = head.prev!;
            tail.next = vert;
            vert.next = head;
            vert.prev = tail;
            head.prev = vert;
        }
    }

    destory() {
        const head = this._head;
        if (head === null) return;
        let cur = head.next!;
        while (!cur.isSameVert(head)) {
            cur = cur.next!;
            cur.destroy();
        }
        this._head!.destroy();
        this._head = null;
    }

    /**
     * 判断多边形 hole 是否被 polygon 完全包含
     */
    isInnerHole(hole: Polygon) {
        if (this._head === null) return false;
        let cur = hole.getHead();
        do {
            if (!this.isInnerVert(cur)) return false;
            cur = cur.next!;
        } while (!cur.isSameVert(hole.getHead()));
        return true;
    }

    /**
     * 判断点是否在多边形中
     */
    isInnerVert(vert: Vertex) {
        return this.isInnerVec2(vert.pos!);
    }

    isInnerVec2(vec: Vec2) {
        /**
         * 从顶点向右发射一条向右水平射线
         * 水平射线与所有边的交点数目，为奇数，则在内部，为偶数，则在外部
         */
        let cur = this._head!;
        let intersectLines = 0;
        do {
            if (GeometryMath.isRayIntersectLine(vec, cur.pos!, cur.next!.pos!)) {
                intersectLines++;
            }
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return intersectLines % 2 === 1;
    }

    /**
     * 判断 L12 是否在顶点 L2 所在的角内
     */
    isLineInInnerAngle(vertL1: Vertex, vertL2: Vertex) {
        if (vertL1.isSamePos(vertL2)) return false;
        if (vertL1.isSamePos(vertL2.prev!)) return false;
        if (vertL1.isSamePos(vertL2.next!)) return false;
        const vecL2Prev = vertL2.prev!.pos!;
        const vecL2 = vertL2.pos!;
        const vecL2Next = vertL2.next!.pos!;
        const vecL1 = vertL1.pos!;
        if (GeometryMath.isInLeft(vecL2Prev, vecL2, vecL2Next)) {
            return GeometryMath.checkVectorInConvexAngle(vecL1, vecL2Prev, vecL2, vecL2Next);
        }
        return GeometryMath.checkVectorInConcaveAngle(vecL1, vecL2Prev, vecL2, vecL2Next);
    }

    /**
     * 判断线段是否与多边形非相邻边相交
     */
    isVectorNoIntersectWithAdjacentEdge(vertL1: Vertex, vertL2: Vertex) {
        let cur = this._head!;
        do {
            // 防止 连接点 的相邻边与 新增线 重合
            if (!vertL1.isSamePos(cur) && !vertL1.isSamePos(cur.next!) &&
                !vertL2.isSamePos(cur) && !vertL2.isSamePos(cur.next!)) {

                if (GeometryMath.checkTwoVectorIntersect(
                    vertL1.pos!, vertL2.pos!, cur.pos!, cur.next!.pos!
                )) {
                    return false;
                }
            }
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return true;
    }

    findConcaveVertex() {
        let cur = this._head!;
        do {
            if (!GeometryMath.isInLeft(cur.prev!.pos!, cur.pos!, cur.next!.pos!))
                return cur;
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return null;
    }

    /**
     * 找到一个凹角顶点 a
     * 从 a 找到一个不相邻点 b 且能连接成完全在内部的对角线
     * 因为 a 为凹角，所以从 a 出发一定在 ∠a 内，则需要对角线在 ∠b 内，且不与任何非临边相交
     */
    findClipVert() {
        const srcVert = this.findConcaveVertex();
        if (srcVert === null) {
            return make_pair(null, null);
        }
        let tarVert = srcVert.next!.next!;
        do {
            if (!tarVert.isSamePos(srcVert) && !tarVert.isSamePos(srcVert.next!) &&
                !tarVert.isSamePos(srcVert.prev!)
            ) {
                const isInAngle = this.isLineInInnerAngle(srcVert, tarVert) &&
                    this.isLineInInnerAngle(tarVert, srcVert);
                const isNoIntersect = this.isVectorNoIntersectWithAdjacentEdge(srcVert, tarVert);
                if (isInAngle && isNoIntersect) return make_pair(srcVert, tarVert);
            }
            tarVert = tarVert.next!;
        } while (!tarVert.isSameVert(srcVert.prev!));
        return make_pair(null, null);
    }

    setHead(head: Vertex) {
        this._head = head;
    }

    getLinePrevVert(line: Line) {
        const vert1 = line.vert1!;
        const vert2 = line.vert2!;
        let cur = this._head!;
        do {
            if (cur.isSamePos(vert1) && cur.next!.isSamePos(vert2)) return cur.prev;
            if (cur.isSamePos(vert2) && cur.next!.isSamePos(vert1)) return cur.prev;
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return null;
    }

    hasLine(line: Line) {
        return this.getLinePrevVert(line) !== null;
    }

    getSize() {
        let num = 0;
        let cur = this._head!;
        do {
            num++;
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return num;
    }

    getVertVecData() {
        const data: Vec2[] = [];
        let cur = this._head!;
        do {
            data.push(cur.pos!);
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return data;
    }

    getInnerVec2() {
        const head = this._head!;
        const v1 = head.pos!.getMidpoint(new_vec2(), head.next!.pos!);
        const v2 = head.pos!.getMidpoint(new_vec2(), head.prev!.pos!);
        return v1.getMidpoint(new_vec2(), v2);
    }

    isV1BeforeV2(v1: Vec2, v2: Vec2) {
        let cur = this._head!;
        do {
            if (cur.pos!.equals(v1) && cur.next!.pos!.equals(v2)) return true;
            else if (cur.pos!.equals(v2) && cur.next!.pos!.equals(v1)) return false;
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
        return false;
    }

    display() {
        let cur = this._head!;
        do {
            console.log(`---------->> ${cur.id}, ${cur.pos!.x}, ${cur.pos!.y}`);
            cur = cur.next!;
        } while (!cur.isSameVert(this._head!));
    }
}