const EPSILON = 0.000001;

export class Vec2 {
    constructor(
        public x: number = 0,
        public y: number = 0
    ) { }

    cross(other: Vec2) {
        return this.x * other.y - this.y * other.x;
    }

    subtract(out: Vec2, other: Vec2) {
        out.x = this.x - other.x;
        out.y = this.y - other.y;
        return out;
    }

    equals(other: Vec2, epsilon = EPSILON) {
        return Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon
    }

    getMidpoint(out: Vec2, other: Vec2) {
        out.x = this.x + (other.x - this.x) * 0.5;
        out.y = this.y + (other.y - this.y) * 0.5;
        return out;
    }

    distance(other: Vec2) {
        const x = this.x - other.x;
        const y = this.y - other.y;
        return Math.sqrt(x * x + y * y);
    }

    distanceSqr(other: Vec2) {
        const x = this.x - other.x;
        const y = this.y - other.y;
        return x * x + y * y;
    }

    clone() {
        return new_vec2(this.x, this.y);
    }
}

export const new_vec2 = (x?: number, y?: number) => { return new Vec2(x, y) }