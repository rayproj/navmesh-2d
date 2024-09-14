import { canvasDebugDrawer } from "./debug/canvas-debug-draw";
import { 颜色 } from "./debug/color";
import { new_vec2, Vec2 } from "./lib/geometry-math";
import { Polygon } from "./lib/polygon";

const VecArr = [
    new_vec2(100, 100),
    new_vec2(130, 70),
    new_vec2(170, 110),
    new_vec2(210, 100),
    new_vec2(240, 250),
    new_vec2(300, 50),
    new_vec2(330, 170),
    new_vec2(400, 300),
    new_vec2(420, 30),
    new_vec2(490, 50),
    new_vec2(600, 20),
    new_vec2(650, 100),
    new_vec2(680, 120),
    new_vec2(720, 130),
    new_vec2(730, 115),
    new_vec2(765, 170),
    new_vec2(800, 150),
    new_vec2(820, 160),
    new_vec2(855, 200),
    new_vec2(900, 175),
    new_vec2(930, 165),
    new_vec2(990, 230),
    new_vec2(1115, 320),
    new_vec2(1115, 620),
    new_vec2(100, 620),

    new_vec2(150, 120),
    new_vec2(170, 120),
    new_vec2(170, 550),
    new_vec2(150, 550),

    new_vec2(380, 330),
    new_vec2(420, 320),
    new_vec2(450, 380),
    new_vec2(350, 420),

    new_vec2(365, 450),
    new_vec2(500, 500),
    new_vec2(330, 500),

    new_vec2(300, 550),
    new_vec2(700, 500),
    new_vec2(800, 600),
    new_vec2(300, 600),

    new_vec2(1000, 350),
    new_vec2(1050, 550),
    new_vec2(900, 600),
    new_vec2(800, 300),

    new_vec2(500, 300),
    new_vec2(600, 370),
    new_vec2(550, 350),

    new_vec2(480, 250),
    new_vec2(525, 240),
    new_vec2(585, 275),
    new_vec2(645, 240),
    new_vec2(605, 290),
    new_vec2(555, 310),

    new_vec2(450, 100),
    new_vec2(550, 100),
    new_vec2(700, 220),
    new_vec2(680, 220),

    new_vec2(210, 150),
    new_vec2(270, 450),
    new_vec2(290, 120),
    new_vec2(350, 300),
    new_vec2(340, 420),
    new_vec2(320, 480),
    new_vec2(300, 530),
    new_vec2(290, 500),
    new_vec2(270, 550),
    new_vec2(240, 535),
    new_vec2(235, 500),
    new_vec2(230, 470),
    new_vec2(220, 460),
    new_vec2(200, 445),
];
const polygonVertexNum = 25;
const holeVertexNum = [4, 4, 3, 4, 4, 3, 6, 4, 14];
const maxWidth = 1200, maxHeight = 700;

canvasDebugDrawer.init(maxWidth, maxHeight, 颜色.白色);

function test() {
    const polygon = new Polygon();
    for (let i = 0; i < polygonVertexNum; i++) {
        const v1 = VecArr[i];
        let v2: Vec2;
        if (i == polygonVertexNum - 1) {
            v2 = VecArr[0];
        } else {
            v2 = VecArr[i + 1];
        }
        polygon.insert(i, v1);
    }
    canvasDebugDrawer.drawPolygon(polygon, null, 颜色.品红);
}

test();

canvasDebugDrawer.out();