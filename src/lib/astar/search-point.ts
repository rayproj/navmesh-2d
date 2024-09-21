import { Vec2, new_vec2 } from "../geometry/vec2";

export class SearchPoint {
    vecMid: Vec2 = null;

    constructor(
        public vec1: Vec2,
        public vec2: Vec2,
        public polygonId1: number,
        public polygonId2: number
    ) {
        this.vecMid = vec1.getMidpoint(new_vec2(), vec2);
    }

    getToPolygonIdx(fromPolygonIdx: number) {
        return fromPolygonIdx === this.polygonId1 ? this.polygonId2 : this.polygonId1;
    }
}