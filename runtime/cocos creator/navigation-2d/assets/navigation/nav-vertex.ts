import { Vec2 } from "cc";

export class NavVertex {
    next: NavVertex = null;
    prev: NavVertex = null;

    constructor(
        public id: number,
        public pos: Vec2
    ) { }

    isSameVert(vert: NavVertex) {
        return vert.id === this.id && vert.pos.equals(this.pos);
    }

    isSamePos(vert: NavVertex) {
        return vert.pos.equals(this.pos);
    }

    destroy() {
        this.next = this.prev = this.pos = null;
    }
}