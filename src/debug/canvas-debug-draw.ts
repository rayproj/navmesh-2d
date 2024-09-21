import { Canvas, createCanvas, CanvasRenderingContext2D, CanvasGradient, CanvasPattern } from "canvas";
import { DebugDraw } from "./debug-draw";
import { 颜色 } from "./color";
import { new_vec2, Vec2 } from "../lib/geometry/vec2";
import { Polygon } from "../lib/geometry/polygon";
import { writeFileSync_safe } from "../lib/utils";
import { log } from "./log";

type TCanvasStyle = string | CanvasGradient | CanvasPattern;

class CanvasDebugDraw extends DebugDraw {
    private _width = 0;
    private _height = 0;
    private _canvas: Canvas = null;
    private _ctx: CanvasRenderingContext2D = null;

    init(width: number, height: number, clearColor = 颜色.白色) {
        this._width = width;
        this._height = height;
        this._canvas = createCanvas(width, height);
        this._ctx = this._canvas.getContext('2d');
        this.clear(clearColor);
    }

    clear(clearColor = 颜色.白色) {
        const ctx = this._ctx!;
        ctx.fillStyle = clearColor;
        ctx.fillRect(0, 0, this._width, this._height);
    }

    drawLine(a: Vec2, b: Vec2, strokeStyle: TCanvasStyle, lineWidth = 5) {
        const ctx = this._ctx!;
        ctx.beginPath();
        a = this.lb2tb(a);
        ctx.moveTo(a.x, a.y);
        b = this.lb2tb(b);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    drawText(str: string, x: number, y: number, fillStyle = 颜色.黑色, fontSize = 30, font = 'Arial') {
        const ctx = this._ctx!;
        ctx.fillStyle = fillStyle;
        ctx.font = `${fontSize}px ${font}`;
        ctx.fillText(str, x, y);
    }

    drawPoints(points: [number, number][],
        fillStyle?: TCanvasStyle, strokeStyle?: TCanvasStyle, lineWidth = 5, debugText = 30
    ) {
        const ctx = this._ctx!;
        ctx.beginPath();
        const startPoint = points[0];
        const start = this.lb2tb(new_vec2(startPoint[0], startPoint[1]));
        ctx.moveTo(start.x, start.y);
        let index = 1;
        while (index < points.length) {
            let tempPoint = points[index];
            let tempPos = new_vec2(tempPoint[0], tempPoint[1]);
            const pos = this.lb2tb(tempPos);
            ctx.lineTo(pos.x, pos.y);
            debugText && this.drawText(
                `${Math.floor(tempPos.x)},${Math.floor(tempPos.y)}`, pos.x, pos.y, 颜色.黑色, debugText);
            index++;
        }

        this.draw(fillStyle, strokeStyle, lineWidth);
    }

    drawPolygon(polygon: Polygon,
        fillStyle?: TCanvasStyle, strokeStyle?: TCanvasStyle, lineWidth = 5
    ) {
        const ctx = this._ctx!;
        let cur = polygon.getHead();
        let curPos = this.lb2tb(cur.pos!);
        ctx.beginPath();
        ctx.moveTo(curPos.x, curPos.y);

        do {
            cur = cur.next!;
            curPos = this.lb2tb(cur.pos!);
            ctx.lineTo(curPos.x, curPos.y);
        } while (!cur.isSameVert(polygon.getHead()));

        this.draw(fillStyle, strokeStyle, lineWidth);
    }

    out(path = '', name = '') {
        // const out = createWriteStream(`${path}${name}.png`);
        // const stream = this._canvas!.createPNGStream();
        // stream.pipe(out);
        // out.on('finish', () => {
        //     log('debug out finish...');
        // });
        const buffer = this._canvas!.toBuffer('image/png');
        writeFileSync_safe(`${path}${name}.png`, buffer);
        log(`[${path}${name}.png]`, 'debug out finish...');
    }

    private lb2tb(v: Vec2) {
        return new_vec2(v.x, this._height - v.y);
    }

    private draw(fillStyle: TCanvasStyle, strokeStyle: TCanvasStyle, lineWidth: number) {
        const ctx = this._ctx!;
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (!fillStyle && !strokeStyle) {
            strokeStyle = 颜色.黑色;
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    }
}

export const canvasDebugDrawer = new CanvasDebugDraw();