import { AStarNode } from "./astar-node";

export class AStarQueue {
    private _map: Map<number, AStarNode> = new Map();

    insert(aNode: AStarNode) { this._map.set(aNode.searchPointIdx, aNode); }

    getExploredNode() {
        const map = this._map;
        if (map.size === 0) return null;
        let aNode = map.values().next().value as AStarNode;
        for (const [key, tempNode] of map) {
            if (tempNode.getAStarCost() < aNode.getAStarCost()) {
                aNode = tempNode;
            }
        }
        map.delete(aNode.searchPointIdx);
        return aNode;
    }

    empty() { return this._map.size === 0; }

    getNode(searchPointIdx: number) {
        const tempNode = this._map.get(searchPointIdx);
        if (tempNode) return tempNode;
        return null;
    }

    clear() {
        this._map.clear();
    }
}