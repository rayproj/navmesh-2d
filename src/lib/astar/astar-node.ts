export class AStarNode {
    constructor(
        public searchPointIdx: number,
        public route: number,
        public heuristicCost: number,
        public srcPolygonIdx: number,
        public parentNode: AStarNode = null,
        public passedLineNums: number = 1
    ) {
    }

    getAStarCost() { return this.route + this.heuristicCost; }
}