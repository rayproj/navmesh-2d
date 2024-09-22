# Navmesh-2D

![License](https://img.shields.io/github/license/rayproj/navmesh-2d)![GitHub stars](https://img.shields.io/github/stars/rayproj/navmesh-2d?style=social)

基于 node.js 构建的路径导航系统，根据输入顶点数据生成离线寻路网格，在 runtime 阶段由 navigation 系统反序列化后用于路径规划。
![](README\1.png)
![](README\2.png)
![](README\3.png)

## 说明

1. 目录说明

   - map `输入目录，存放各种地图数据，提供输入顶点数据`
   - navmesh `输出目录，存放生成的 navmesh 数据和 debug 数据`
   - runtime `客户端导航系统，实现客户端寻路`
     - cocos creator 3.x `creator 客户端 navigation 示例`

2. options 说明

   生成任务的输入，除 地图数据路径 外，还支持以下选项，多个选项用 `,` 相连，例如 `gen_fixedFloat=0,gen_useArray=1,...`。它们的具体定义在 `navmesh-bake.ts > IBakeOptions`

   | 选项                 | 说明                                                         |
   | -------------------- | ------------------------------------------------------------ |
   | opt_skip=0           | bake 时跳过顶点检查和优化，默认不跳过                        |
   | opt_pScale=1.0000001 | 孔洞多边形扩大倍数，仅开启顶点检查优化有效                   |
   | debug_lineWidth=1]   | debug 图片中连线的宽度                                       |
   | gen_useArray=1       | 设置 生成的 navmesh 数据类型为纯数组，文件大小更小，默认关闭 |
   | gen_fixedFloat=0     | 设置 bake navmesh 时位置数据的浮点数精度，默认关闭           |

## 开始

1. clone 后  `npm i` 安装包依赖

2. `npm run 任务名`  执行 默认任务

   | 默认任务               |                                              |
   | ---------------------- | -------------------------------------------- |
   | bake-json / bake-json2 | 读取默认的 json 地图数据，生成 navmesh 数据  |
   | bake-tiled             | 读取默认的 tiled map 数据，生成 navmesh 数据 |

3. 自定义任务

   - json 地图数据

     `npx tsc && node dist/bake-json 地图数据 选项`

     注意：bake-json 是内置的 json 类型地图处理器，需按照以下结构 组织 输入 json 数据

     ```json
     {
         // 地图多边形顶点和所有孔洞多边形顶点
         "points": [
             // 地图多边形
             [0, 0], [1200, 0], [1200, 700], [0, 720],
     
             // 孔洞多边形
             [100, 100], [200, 100], [200, 200], [100, 200],
             [200, 200], [300, 200], [300, 300], [200, 300],
     
             [400, 100], [500, 100], [500, 200], [400, 200],
             [450, 150], [550, 150], [550, 250], [450, 250],
     
             [750, 100], [800, 150], [750, 200], [700, 150],
             [800, 150], [850, 200], [800, 250], [750, 200]
         ],
         // 地图多边形顶点数量，对应 points 中的 0 ~ n - 1
         "polygonVertexNum": 4,
         // 所有的孔洞多边形，每个代表孔洞的顶点数量，对应 points 中 polygonVertexNum + n + n...
         "holeVertexNum": [4, 4, 4, 4, 4, 4],
         // 地图矩形宽高，用于 debug
         "size": [1200, 700],
         // 地图名称
         "name": "3"
     }
     ```

   - tiled map 地图数据

     `npx tsc && node dist/bake-tiled 地图数据 选项`

     注意：内置的 bake-tiled 处理器中，默认查询地图中名为 `障碍` 的 ObjectGroup 下所有多边形对象为孔洞多边形，以供参考
   
4. 将 navmesh 目录下生成的数据拷贝到 runtime 目录下的客户端工程（assets/map/），重启 navigation 场景，editor窗口中拖动 [player] [target] 节点查看路径生成

## 参考

[^Meadow Mapping]: [DiveRecastNav-Lab1-MeadowMapping](https://github.com/liubai01/DiveRecastNav-Lab1-MeadowMapping)
[^AI - Navmesh 寻路]: [AI - Navmesh 寻路](https://blog.csdn.net/Mhypnos/article/details/134540691)
