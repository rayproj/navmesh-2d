import { Canvas, createCanvas, CanvasRenderingContext2D, CanvasGradient, CanvasPattern } from "canvas";
import { DebugDraw } from "./debug-draw";
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs";
import { Polygon } from "../lib/polygon";
import { new_vec2, Vec2 } from "../lib/geometry-math";
import { 颜色 } from "./color";

type TCanvasStyle = string | CanvasGradient | CanvasPattern | null;

class CanvasDebugDraw extends DebugDraw {
    private _height = 0;
    private _canvas: Canvas | null = null;
    private _ctx: CanvasRenderingContext2D | null = null;
    private _clearColor: string | null = null;

    init(width: number, height: number, clearColor: string) {
        this._height = height;
        this._canvas = createCanvas(width, height);
        const ctx = this._ctx = this._canvas.getContext('2d');

        if (clearColor) {
            ctx.fillStyle = this._clearColor = clearColor;
            ctx.fillRect(0, 0, width, height);
        }
    }

    drawLine(a: Vec2, b: Vec2, strokeStyle: TCanvasStyle, lineWidth = 5) {
        const ctx = this._ctx!;
        ctx.beginPath();
        a = this.lb2tb(a);
        ctx.moveTo(a.x, a.y);
        b = this.lb2tb(b);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = strokeStyle!;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
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
        // ctx.closePath();

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

    out(path = '', hash = '') {
        // const out = createWriteStream(`debug${hash}.png`);
        // const stream = this._canvas!.createPNGStream();
        // stream.pipe(out);
        // out.on('finish', () => {
        //     console.log('debug out finish...');
        // });
        const buffer = this._canvas!.toBuffer('image/png');
        if (path && !existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
        writeFileSync(`${path}debug${hash}.png`, buffer);
        console.log('debug out finish...');
    }

    private lb2tb(v: Vec2) {
        return new_vec2(v.x, this._height - v.y);
    }
}

export const canvasDebugDrawer = new CanvasDebugDraw();