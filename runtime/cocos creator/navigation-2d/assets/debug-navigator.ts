import { _decorator, Component, game, Node, NodeEventType } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('debug_navigator')
@executeInEditMode(true)
export class debug_navigator extends Component {
    protected start(): void {
        this.node.on(NodeEventType.TRANSFORM_CHANGED, () => {
            game.emit('Seek_Path');
        }, this)
    }
}


