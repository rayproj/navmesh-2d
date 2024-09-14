import { Canvas, createCanvas, CanvasRenderingContext2D, CanvasGradient, CanvasPattern } from "canvas";
import { DebugDraw } from "./debug-draw";
import { createWriteStream } from "fs";
import { Polygon } from "../lib/polygon";
import { new_vec2, Vec2 } from "../lib/geometry-math";
import { 颜色 } from "./color";

type TCanvasStyle = string | CanvasGradient | CanvasPattern | null;

class CanvasDebugDraw extends DebugDraw {
    private _height = 0;
    private _canvas: Canvas | null = null;
    private _ctx: CanvasRenderingContext2D | null = null;

    init(width: number, height: number, clearColor?: string) {
        this._height = height;
        this._canvas = createCanvas(width, height);
        const ctx = this._ctx = this._canvas.getContext('2d');

        if (clearColor) {
            ctx.fillStyle = clearColor;
            ctx.fillRect(0, 0, width, height);
        }
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

    out() {
        const out = createWriteStream('debug.png');
        const stream = this._canvas!.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
            console.log('debug out finish...');
        });
    }

    private lb2tb(v: Vec2) {
        return new_vec2(v.x, this._height - v.y);
    }
}

export const canvasDebugDrawer = new CanvasDebugDraw();