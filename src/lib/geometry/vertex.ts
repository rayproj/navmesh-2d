import { Vec2 } from "./vec2";

export class Vertex {
    next: Vertex | null = null;
    prev: Vertex | null = null;

    constructor(
        public id: number,
        public pos: Vec2 | null
    ) { }

    isSameVert(vert: Vertex) {
        return vert.id === this.id && vert.pos!.equals(this.pos!);
    }

    isSamePos(vert: Vertex) {
        return vert.pos!.equals(this.pos!);
    }

    destroy() {
        this.next = this.prev = this.pos = null;
    }
}