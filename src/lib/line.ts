import { Vertex } from "./vertex";

export class Line {
    vert1: Vertex | null = null;
    vert2: Vertex | null = null;
    len: number = 0;
    // drawNode = null;

    constructor(vert1: Vertex, vert2: Vertex, len: number, /* drawNode */) {
        this.vert1 = new Vertex(vert1.id, vert1.pos);
        this.vert2 = new Vertex(vert2.id, vert2.pos);
        this.len = len;
        // this.drawNode = drawNode;
    }
}