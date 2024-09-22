import { _decorator, Component, game, Graphics, JsonAsset, Node, v3, Vec3 } from 'cc';
import { navigation } from './navigation/navigation';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('navigation_scene')
@executeInEditMode(true)
export class navigation_scene extends Component {
    @property(JsonAsset)
    mapData: JsonAsset = null;

    start() {
        navigation.build(this.mapData.json);
        const startNode = this.node.getChildByName('player');
        const targetNode = this.node.getChildByName('target');
        const debug = this.node.getChildByName('debug').getComponent(Graphics);
        const startPos = v3(), targetPos = v3();
        const out: Vec3[] = [];
        game.on('Seek_Path', () => {
            out.length = 0;
            startNode.getPosition(startPos);
            targetNode.getPosition(targetPos);
            navigation.moveToPath(startPos, targetPos, out);

            debug.clear();
            debug.moveTo(startPos.x, startPos.y);
            for (let g = out.length - 1; g >= 0; g--) {
                const pos = out[g];
                debug.lineTo(pos.x, pos.y);
            }
            debug.stroke();
        }, this);
    }

    update(deltaTime: number) {

    }
}


