import { log } from "../debug/log";
import { SearchPoint } from "../lib/geometry/search-point";
import { Polygon } from "../lib/geometry/polygon";
import { Vertex } from "../lib/geometry/vertex";
import { IBakeNavmeshData, IBakeOptions } from "../lib/navmesh/navmesh-bake";
import { writeFileSync_safe } from "../lib/utils";

export const OutPath = 'navmesh/';

class GenerateNavmesh {
    generate(
        navmeshData: IBakeNavmeshData[], name: string,
        opts: IBakeOptions
    ) {
        const useArray = opts?.gen_useArray !== undefined ? opts.gen_useArray === '1' : false;
        const fixedFloat = opts?.gen_fixedFloat !== undefined ? parseInt(opts.gen_fixedFloat) : -1;

        const serializePolygonsGroup = [];
        const serializeSearchPointsGroup = [];
        navmeshData.forEach(navmeshData0 => {
            const { convexPolygons, searchPoints } = navmeshData0;

            if (!useArray) {
                const serializePolygons = {} as { [key: number]: { polygon: Polygon, vertexs: Vertex[] } };
                for (const [key, polygon] of convexPolygons) {
                    const vertexs = polygon.getVertData();
                    serializePolygons[key] = {
                        polygon: new Polygon(),
                        vertexs
                    };
                    const serializePolygon = serializePolygons[key].polygon;
                    serializePolygon['_convexPolygonId'] = polygon['_convexPolygonId'];
                    serializePolygon['_searchPointIdx'] = polygon['_searchPointIdx'];
                    // @ts-ignore
                    serializePolygon['_head'] = vertexs.indexOf(polygon['_head']);
                    for (let g = 0; g < vertexs.length; g++) {
                        const tempVertex = vertexs[g];
                        // @ts-ignore
                        tempVertex.prev = vertexs.indexOf(tempVertex.prev);
                        // @ts-ignore
                        tempVertex.next = vertexs.indexOf(tempVertex.next);
                    }
                }
                serializePolygonsGroup.push(serializePolygons);
                serializeSearchPointsGroup.push(searchPoints);
            } else {
                /**
                 * serializePolygons
                 * key : [
                 *  Polygon[_convexPolygonId, _searchPointIdx, _head], 
                 *  Vertex[id, [pos.x, pos.y], [next], [prev]][]
                 * ]
                 * 
                 * serializeSearchPoints
                 * SearchPoint[[vec1.x, vec1.y], [vec2.x, vec2.y], polygonId1, polygonId2, [vecMid.x, vecMid.y]][]
                 */
                const serializePolygons = {} as { [key: number]: any[] };
                const serializeSearchPoints = [];
                for (const [key, polygon] of convexPolygons) {
                    const vertexs = polygon.getVertData();
                    const serializePolygon = [];
                    const serializeVertexs = [];
                    serializePolygons[key] = [serializePolygon, serializeVertexs];

                    serializePolygon[0] = polygon['_convexPolygonId'];
                    serializePolygon[1] = polygon['_searchPointIdx'];
                    serializePolygon[2] = vertexs.indexOf(polygon['_head']);

                    for (let g = 0; g < vertexs.length; g++) {
                        const tempVertex = vertexs[g];
                        // @ts-ignore
                        tempVertex.prev = vertexs.indexOf(tempVertex.prev);
                        // @ts-ignore
                        tempVertex.next = vertexs.indexOf(tempVertex.next);
                        serializeVertexs.push(
                            [
                                tempVertex.id, [tempVertex.pos.x, tempVertex.pos.y],
                                tempVertex.next, tempVertex.prev
                            ])
                    }
                }
                searchPoints.forEach(sp => {
                    serializeSearchPoints.push([
                        [sp.vec1.x, sp.vec1.y],
                        [sp.vec2.x, sp.vec2.y],
                        sp.polygonId1, sp.polygonId2,
                        [sp.vecMid.x, sp.vecMid.y]
                    ])
                });
                serializePolygonsGroup.push(serializePolygons);
                serializeSearchPointsGroup.push(serializeSearchPoints);
            }

        });

        const serializeData = {
            polygonsGroup: serializePolygonsGroup,
            searchPointsGroup: serializeSearchPointsGroup
        };

        if (fixedFloat > -1) {
            fixedFloatInObj(serializeData, fixedFloat);
        }

        writeFileSync_safe(`${OutPath}${name}.json`, JSON.stringify(serializeData));
        log(`generate ${OutPath}${name}.json success.`)
    }
}

export const generater_navmesh = new GenerateNavmesh();

function fixedFloat(floatNumber: number, fixed: number) {
    const r = Math.pow(10, fixed);
    return Math.round(floatNumber * r) / r;
}

function fixedFloatInObj(obj: Object, fixed: number) {
    if (Array.isArray(obj)) {
        // 处理数组
        for (let i = 0; i < obj.length; i++) {
            if (Array.isArray(obj[i]) || (typeof obj[i] === 'object' && obj[i] !== null)) {
                // 如果是嵌套的数组或对象，递归处理
                fixedFloatInObj(obj[i], fixed);
            } else if (typeof obj[i] === 'number' && !Number.isInteger(obj[i])) {
                // 如果是浮点数，保留 1 位小数并原地修改
                obj[i] = fixedFloat(obj[i], fixed);
            }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        // 处理对象
        for (const key in obj) {
            if (Array.isArray(obj[key]) || (typeof obj[key] === 'object' && obj[key] !== null)) {
                // 如果是嵌套的数组或对象，递归处理
                fixedFloatInObj(obj[key], fixed);
            } else if (typeof obj[key] === 'number' && !Number.isInteger(obj[key])) {
                // 如果是浮点数，保留 1 位小数并原地修改
                obj[key] = fixedFloat(obj[key], fixed);
            }
        }
    }
}

