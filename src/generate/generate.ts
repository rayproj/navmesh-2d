import { existsSync, mkdirSync, writeFileSync } from "fs";
import { Polygon } from "../lib/polygon";
import { Vertex } from "../lib/vertex";
import { SearchPoint } from "../lib/search-point";

class Generate {
    generatePolygons(
        polygons: Map<number, Polygon>, searchPoints: SearchPoint[],
        path: string, name: string
    ) {
        const serializePolygons = {} as { [key: number]: { polygon: Polygon, vertexs: Vertex[] } };
        for (const [key, polygon] of polygons) {
            const vertexs = polygon.getVertData();
            // if (Object.keys(serializePolygons).length == 0) {
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
            // }
        }

        const serializeStr = JSON.stringify({ serializePolygons, searchPoints });

        if (path && !existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
        writeFileSync(`${path}${name}.json`, serializeStr);
    }
}
export const generater = new Generate();