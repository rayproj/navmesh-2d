import { v2, Vec2 } from "cc";

function getMid(out: Vec2, v1: Vec2, v2: Vec2) {
    out.x = v1.x + (v2.x - v1.x) * 0.5;
    out.y = v1.y + (v2.y - v1.y) * 0.5;
    return out;
}

export class SearchPoint {
    vecMid: Vec2 = null;

    constructor(
        public vec1: Vec2,
        public vec2: Vec2,
        public polygonId1: number,
        public polygonId2: number
    ) {
        this.vecMid = getMid(v2(), vec1, vec2);
    }

    getToPolygonIdx(fromPolygonIdx: number) {
        return fromPolygonIdx === this.polygonId1 ? this.polygonId2 : this.polygonId1;
    }
}