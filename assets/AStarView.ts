import mapsData, { MapData, MapType } from "./MapCfg";
import AStarMgr, { point } from "./AStarMgr";


const {ccclass, property} = cc._decorator;

let WalkColor = {
    meColor :cc.color(45,214,219),
    tailColor : cc.color(248,79,189),
}


@ccclass
export default class AStarView extends cc.Component {


    @property(cc.Node)
    node_map: cc.Node = null;

    @property(cc.Prefab)
    pb_oneMap: cc.Prefab = null;

    @property(cc.Button)
    btn_start: cc.Button = null;

    private _mapData:MapData = null;
    private _curPos = cc.v2(0,0);
    private _endPos = cc.v2(0,0);
    private _timer = null;

    onLoad () {
        let data:MapData = AStarMgr.getInst().getMapData();
        if(!data) return;
        this._mapData = data;
        this.initMapView();

        this.btn_start.node.on('click',this.StartPathFinding.bind(this));

    }

    //生成地图
    private initMapView(){
        let row = this._mapData.row;
        let col = this._mapData.column;
        let mapData = this._mapData.map;

        let w = cc.winSize.width/col;
        let h = cc.winSize.height/row;

        this.node_map.x = -cc.winSize.width/2;
        this.node_map.y = cc.winSize.height/2;


        for(let i=0;i<row;i++){
            for(let j=0;j<col;j++){
                let type = mapData[i][j];
                this.createMap(i,j,w,h,type);
            }
        }
    }

    private createMap(i,j,w,h,type){
        let map = cc.instantiate(this.pb_oneMap);
        map.width = w;
        map.height = h;
        map.x = j*w;
        map.y = -i*h;
        this.node_map.addChild(map);
        map.name = i+'_'+j;

        // let node = new cc.Node()
        // node.parent = map;
        // node.addComponent(cc.Label).string = map.name;
        // node.color = cc.color(0,0,0);
        // node.position = cc.v2(w/2,-h/2); 

        // let f = new cc.Node()
        // f.parent = map;
        // f.addComponent(cc.Label).string = AStarMgr.getInst().getXYF(i,j);
        // f.color = cc.color(0,0,0);
        // f.position = cc.v2(w/2,-h/2+30); 

        let color = cc.color(255,255,255);
        switch(type){
            case MapType.obstacle:{
                color = cc.color(45,219,134);
                break;
            }
            case MapType.endPos:{
                color = cc.color(219,45,45);
                this._endPos.x = i;
                this._endPos.y = j;
                break;
            }
            case MapType.beginPos:{
                color = WalkColor.meColor;
                this._curPos.x = i;
                this._curPos.y = j;
                break;
            }
        }
        map.color = color;
    }

    private StartPathFinding(){
        this.btn_start.node.active = false;
        this._timer = setInterval(()=>{
            if(this._curPos.x==this._endPos.x&&this._curPos.y==this._endPos.y){
                this._timer&&clearInterval(this._timer);
                return;
            }
            let curNodeName = this._curPos.x +'_' +this._curPos.y;
            this.node_map.getChildByName(curNodeName).color = WalkColor.tailColor;
            let nextPoint:point = AStarMgr.getInst().doMove();
            this._curPos = cc.v2(nextPoint.x,nextPoint.y);
            let nextNodeName = nextPoint.x+'_'+nextPoint.y;
            this.node_map.getChildByName(nextNodeName).color = WalkColor.meColor;
        },500)
    }

}
