import { new_vec2, Vec2 } from "./vec2";

export class GeometryMath {
    /**
     * 检测水平射线（方向右）与线段是否相交
     * @param vR 水平射线起点
     * @param vL1 线段起点
     * @param vL2 线段终点
     * @returns 
     */
    static isRayIntersectLine(vR: Vec2, vL1: Vec2, vL2: Vec2) {
        // 线段水平，与射线重合或平行
        if (vL1.y === vL2.y) return false;
        // 线段在射线上方
        if (vL1.y > vR.y && vL2.y > vR.y) return false;
        // 线段在射线下方
        if (vL1.y < vR.y && vL2.y < vR.y) return false;

        const minY = Math.min(vL1.y, vL2.y);
        const maxY = Math.max(vL1.y, vL2.y);
        /**
         * 线段 下方端点在射线上 \ 上方端点在射线上 只选择一种作为相交，另一种作为不相交，
         * 否则射线穿过多边形的交点数量判断会有问题
         * 即 minY 和 maxY 只选择一种做判断
         */
        if (maxY === vR.y) return false;

        /**
         * 线段两个端点分别在射线上下，求线段在射线上的 x 点
         * 判断 x 点和射线起点的 x 坐标
         */
        const offsetY = vL2.y - vR.y;
        const offsetX = offsetY / (vL2.y - vL1.y) * (vL2.x - vL1.x);
        const x = vL2.x - offsetX;
        return x >= vR.x;
    }

    /**
     * 点 c 在向量 ab 左边，则 ∠abc 小于 180°
     */
    static isInLeft(a: Vec2, b: Vec2, c: Vec2) {
        return this.getVectorCross(a, b, c) < 0;
    }

    /**
     * 点 c 在向量 ab 右边，则 ∠abc 大于 180°
     */
    static isInRight(a: Vec2, b: Vec2, c: Vec2) {
        return this.getVectorCross(a, b, c) > 0;
    }

    /**
     * 点 c 与向量 ab 共线，则 ∠abc 等于 180°
     */
    static isCollineation(a: Vec2, b: Vec2, c: Vec2) {
        return Math.abs(this.getVectorCross(a, b, c)) < 0.00001;
    }

    static getVectorCross(a: Vec2, b: Vec2, c: Vec2) {
        const vectorBA = a.subtract(new_vec2(), b);
        const vectorBC = c.subtract(new_vec2(), b);
        return vectorBA.cross(vectorBC);
    }

    /**
     * 如果 ∠abc 小于 180°，点 abc 是逆时针，判断 vb 在角内
     * 需要 vb 在 ab 的左侧并且在 bc 的左侧
     */
    static checkVectorInConvexAngle(v: Vec2, a: Vec2, b: Vec2, c: Vec2) {
        return this.isInLeft(a, b, v) && this.isInLeft(b, c, v);
    }

    /**
     * 如果 ∠abc 大于 180°，点 abc 是逆时针，判断 vb 在角内
     * 即 vb 不在 ∠abc 的外侧， 即 vb 不在 ∠cba 里
     */
    static checkVectorInConcaveAngle(v: Vec2, a: Vec2, b: Vec2, c: Vec2) {
        return !this.checkVectorInConvexAngle(v, c, b, a);
    }

    /**
     * vert 是否在 L12 之间
     */
    static isVertexInLine(vL1: Vec2, vL2: Vec2, vert: Vec2) {
        if (!this.isCollineation(vL1, vL2, vert)) return false;
        if (vL1.x === vL2.x) {
            return (vert.y >= Math.min(vL1.y, vL2.y)) && (vert.y <= Math.max(vL1.y, vL2.y));
        } else {
            return (vert.x >= Math.min(vL1.x, vL2.x)) && (vert.x <= Math.max(vL1.x, vL2.x));
        }
    }

    /**
     * 检查 ab 和 cd 是否相交
     */
    static checkTwoVectorIntersect(va: Vec2, vb: Vec2, vc: Vec2, vd: Vec2) {
        if (this.isStrictlyIntersect(va, vb, vc, vd)) {
            return true;
        }
        if (this.isVertexInLine(va, vb, vc)) {
            return true;
        }
        if (this.isVertexInLine(va, vb, vd)) {
            return true;
        }
        if (this.isVertexInLine(vc, vd, va)) {
            return true;
        }
        if (this.isVertexInLine(vc, vd, vb)) {
            return true;
        }
        return false;
    }

    /**
     * 检查 ab 和 cd 是否严格相交
     * 即 va vb 在 cd 的两侧 且 vc vd 在 ab 的两侧
     */
    static isStrictlyIntersect(va: Vec2, vb: Vec2, vc: Vec2, vd: Vec2) {
        if (this.isCollineation(va, vb, vc)) return false;
        if (this.isCollineation(va, vb, vd)) return false;
        if (this.isCollineation(vc, vd, va)) return false;
        if (this.isCollineation(vc, vd, vb)) return false;
        if (this.isInLeft(va, vb, vc) === this.isInLeft(va, vb, vd)) return false;
        if (this.isInLeft(vc, vd, va) === this.isInLeft(vc, vd, vb)) return false;
        return true;
    }
}

// 计算多边形中心点
function getCentroid(polygon: [number, number][]) {
    let x = 0, y = 0;
    const numPoints = polygon.length;
    polygon.forEach(point => {
        x += point[0];
        y += point[1];
    });
    return [x / numPoints, y / numPoints];
}

// 扩大多边形
export function scalePolygon(polygon: [number, number][], scale: number): [number, number][] {
    const centroid = getCentroid(polygon);
    return polygon.map(point => {
        return [
            centroid[0] + (point[0] - centroid[0]) * scale,
            centroid[1] + (point[1] - centroid[1]) * scale
        ];
    });
}

function computeCentroid(polygon: { x: number, y: number }[]) {
    const centroid = polygon.reduce(
        (acc, point) => {
            acc.x += point.x;
            acc.y += point.y;
            return acc;
        },
        { x: 0, y: 0 }
    );
    centroid.x /= polygon.length;
    centroid.y /= polygon.length;
    return centroid;
}

/**
 * 将多边形的顶点按照逆时针方向排列
 * 通过计算每个顶点相对于质心（中心点）的极角（polar angle）
 * 将顶点按照极角从大到小的顺序排列，结果即为逆时针排列的顶点顺序
 */
export function sortPolygonCounterClockwise(polygon: { x: number, y: number }[]) {
    const centroid = computeCentroid(polygon);

    return polygon.sort((a, b) => {
        const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
        const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
        return angleB - angleA;
    });
}