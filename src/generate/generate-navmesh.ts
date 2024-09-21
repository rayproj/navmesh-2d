import { log } from "../debug/log";
import { SearchPoint } from "../lib/astar/search-point";
import { Polygon } from "../lib/geometry/polygon";
import { Vertex } from "../lib/geometry/vertex";
import { writeFileSync_safe } from "../lib/utils";

export const OutPath = 'navmesh/';

class GenerateNavmesh {
    generate(
        polygons: Map<number, Polygon>, searchPoints: SearchPoint[],
        name: string
    ) {
        const serializePolygons = {} as { [key: number]: { polygon: Polygon, vertexs: Vertex[] } };
        for (const [key, polygon] of polygons) {
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

        const serializeStr = JSON.stringify({ serializePolygons, searchPoints });
        writeFileSync_safe(`${OutPath}${name}.json`, serializeStr);
        log(`generate ${OutPath}${name}.json success.`)
    }
}

export const generater_navmesh = new GenerateNavmesh();