import { Vec2, Vec3 } from "cc";
import { GeometryMath } from "./geometry-math";
import { NavVertex } from "./nav-vertex";

export class NavPolygon {
    private _head: NavVertex = null;
    private _convexPolygonId = 0;
    private _searchPointIdx: number[] = [];

    isInnerVec2(vec: Vec3 | Vec2) {
        /**
         * 从顶点向右发射一条向右水平射线
         * 水平射线与所有边的交点数目，为奇数，则在内部，为偶数，则在外部
         */
        let cur = this._head;
        let intersectLines = 0;
        do {
            if (GeometryMath.isRayIntersectLine(vec, cur.pos, cur.next.pos)) {
                intersectLines++;
            }
            cur = cur.next;
        } while (!cur.isSameVert(this._head));
        return intersectLines % 2 === 1;
    }

    getSearchPointIdx() { return this._searchPointIdx; };
}