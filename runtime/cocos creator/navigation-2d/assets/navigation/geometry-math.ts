import { v2, Vec2, Vec3 } from "cc";

const t_vec1 = v2(), t_vec2 = v2();

export class GeometryMath {
    /**
     * 检测水平射线（方向右）与线段是否相交
     * @param vR 水平射线起点
     * @param vL1 线段起点
     * @param vL2 线段终点
     * @returns 
     */
    static isRayIntersectLine(vR: Vec3 | Vec2, vL1: Vec3 | Vec2, vL2: Vec3 | Vec2) {
        // 线段水平，与射线重合或平行
        if (vL1.y === vL2.y) return false;
        // 线段在射线上方
        if (vL1.y > vR.y && vL2.y > vR.y) return false;
        // 线段在射线下方
        if (vL1.y < vR.y && vL2.y < vR.y) return false;

        // const minY = Math.min(vL1.y, vL2.y);
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

    static getVectorCross(a: Vec2, b: Vec2, c: Vec2) {
        const vectorBA = Vec2.subtract(t_vec1, a, b);
        const vectorBC = Vec2.subtract(t_vec2, c, b);
        return vectorBA.cross(vectorBC);
    }
}