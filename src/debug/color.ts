import { randomInt } from "../lib/utils";

export const 颜色 = {
    白色: '#FFFFFF',
    黑色: '#000000',
    红色: '#FF0000',
    绿色: '#00FF00',
    蓝色: '#0000FF',
    黄色: '#FFFF00',
    青色: '#00FFFF',
    品红: '#FF00FF',
    灰色: '#808080',
    橙色: '#FFA500',
    紫色: '#800080',
    棕色: '#A52A2A',
    浅灰色: '#D3D3D3',
    深蓝色: '#00008B',
    粉红色: '#FFC0CB',
    米色: '#F5F5DC',
    浅绿色: '#90EE90',
    淡紫色: '#E6E6FA',
}

export function randomColor() {
    return `rgb(${randomInt(0, 255)}, ${randomInt(0, 255)}, ${randomInt(0, 255)})`;
}