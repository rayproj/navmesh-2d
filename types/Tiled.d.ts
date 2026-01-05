export interface Tiled_Map_$ {
  version: string;
  tiledversion: string;
  orientation: string;
  renderorder: string;
  width: string;
  height: string;
  tilewidth: string;
  tileheight: string;
  infinite: string;
  hexsidelength: string;
  staggeraxis: string;
  staggerindex: string;
  nextlayerid: string;
  nextobjectid: string;
}

export interface Tiled_Map_ObjectgroupItem_$ {
  id: string;
  name: string;
}

export interface Tiled_Map_ObjectgroupItem_ObjectItem_$ {
  id: string;
  x: string;
  y: string;
  width: string;
  height: string;
}

export interface Tiled_Map_ObjectgroupItem_ObjectItem_PolygonItem_$ {
  points: string;
}

export interface Tiled_Map_ObjectgroupItem_ObjectItem_PolygonItem {
  $: Tiled_Map_ObjectgroupItem_ObjectItem_PolygonItem_$;
}

export interface Tiled_Map_ObjectgroupItem_ObjectItem {
  $: Tiled_Map_ObjectgroupItem_ObjectItem_$;
  polygon: Tiled_Map_ObjectgroupItem_ObjectItem_PolygonItem[];
}

export interface Tiled_Map_ObjectgroupItem {
  $: Tiled_Map_ObjectgroupItem_$;
  object: Tiled_Map_ObjectgroupItem_ObjectItem[];
}

export interface Tiled_Map {
  $: Tiled_Map_$;
  objectgroup: Tiled_Map_ObjectgroupItem[];
}

export interface Tiled {
  map: Tiled_Map;
}
