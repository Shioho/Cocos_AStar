import mapsData, { MapData, MapType } from "./MapCfg";


enum MoveDir{
    up=0,
    down,
    left,
    right
}

export default class AStarMgr {
    private static _inst = null;

    private _curPos:point = {x:0,y:0,parentNode:null};
    private _startPos:point = {x:0,y:0,parentNode:null};
    private _endPos:point = {x:0,y:0,parentNode:null};

    private _pathMapsData = [];

    private _cost =10;//直线移动代价
    private _defaultCost = 999;//默认代价

    private _openList:point[] = [];//open列表
    private _closeList:point[] = [];//close列表
    private _isSearchSuccess = false;

    private _moveList:point[] = [];

    constructor(){

    }

    public static getInst(){
        if(!this._inst){
            this._inst = new AStarMgr();
        }
        return this._inst;
    }

    public getMapData(){
        let length = mapsData.length;
        let mapId = Math.floor(Math.random()*length);
        let data:MapData = mapsData[mapId];

        this.initTempMapData(data);
        return data;
    }

    //生成辅助地图
    private initTempMapData(data:MapData){
        let row = data.row;
        let col = data.column;
        let map = data.map;
        for(let i=0;i<row;i++){
            if(!this._pathMapsData[i]){
                this._pathMapsData[i] = [];
            }
            for(let j=0;j<col;j++){
                let type = map[i][j];
                let isCanWalk = true;
                if(type == MapType.beginPos){
                    this._curPos.x = i;
                    this._curPos.y = j;
                    this._startPos = this._curPos;
                }else if(type == MapType.endPos){
                    this._endPos.x=i;
                    this._endPos.y=j;
                }else if(type==MapType.obstacle){
                    isCanWalk = false;
                }
                let aStarData:AStarData = {
                    isCanWalk:isCanWalk,
                    pointNode:{x:i,y:j,parentNode:null},
                    F:this._defaultCost,
                    G:this._defaultCost,
                    H:this._defaultCost
                }
                this._pathMapsData[i][j] = aStarData;
            }
        }
        this.aStarCalculate();
    }

    //开启a*算法搜索最短路径
    private aStarCalculate(){
        //1.0将初始点放入openList中
        this._openList.push(this._curPos);

        while(true){
            //2.0判断openList如果为空则搜索失败，如果存在目标点则搜索成功
            let length = this._openList.length;
            if(length<=0) {
                console.error('搜索失败!!!');
                this._isSearchSuccess = false;
                break;
            }
            if(this.checkIsInOpenList(this._endPos.x,this._endPos.y)>=0){
                console.log('搜索成功!!!');
                this._endPos.parentNode = this._curPos;
                this._closeList.push(this._endPos);
                this._isSearchSuccess = true;
                break;
            }

            //3.0从openList中选出F值最小的节点作为当前节点，并将其加入到closeList中
            let minNode:point = this.getMinFPointFromOpenList();
            let x = minNode.x;
            let y = minNode.y;
            this._curPos = minNode;
            let opIdx = this.checkIsInOpenList(x,y);
            this._openList.splice(opIdx,1);
            this._closeList.push(minNode);

            //4.0 计算当前节点的相邻的所有可到达节点，生成一组子节点

            for(let i=0;i<4;i++){
                switch(i){
                    case MoveDir.up:{                        
                        this.doCalculateCost(x,y+1);
                        break;
                    }
                    case MoveDir.down:{
                        this.doCalculateCost(x,y-1);
                        break;
                    }
                    case MoveDir.left:{
                        this.doCalculateCost(x-1,y);
                        break;
                    }
                    case MoveDir.right:{
                        this.doCalculateCost(x+1,y);
                        break;
                    }
                }
            }
        }
        this.setMoveList();
    }

    //判断openList中是否存在目标节点
    private checkIsInOpenList(x,y){
        for(let i=0;i<this._openList.length;i++){
            let point:point = this._openList[i];
            if(point.x==x&&point.y==y){
                return i;
            }
        }
        return -1;
    }


    private checkIsInCloseList(x,y){
        for(let i=0;i<this._closeList.length;i++){
            let point = this._closeList[i];
            if(point.x==x&&point.y==y){
                return i;
            }
        }
        return -1;
    }

    private getMinFPointFromOpenList():point{
        let F = this._defaultCost+1;
        let p  = this._curPos;
        for(let i=0;i<this._openList.length;i++){
            let point:point = this._openList[i];
            let x= point.x;
            let y = point.y;
            let data = this.getPathMapDataByXY(x,y);
            if(!data) continue;
            let curF = data.F;
            if(F>curF){
                F = curF;
                p = point;
            }
        }
        return p;
    }

    private getPathMapDataByXY(x,y){
        let iData = this._pathMapsData[x];
        if(!iData) return null;
        let data:AStarData = this._pathMapsData[x][y];
        return data;
    }


    //计算代价
    private doCalculateCost(x,y){
        //如果该节点在close列表中，则不检查
        let idx = this.checkIsInCloseList(x,y);
        if(idx>=0){
            return;
        }

        let data = this.getPathMapDataByXY(x,y);
        if(!data) return;
        if(!data.isCanWalk) return;


        //如果该节点在open列表中，则检查其通过当前节点计算得到的F值是否更小,如果更小则更新其F值，并将其父节点设置为当前节点
        let opIdx = this.checkIsInOpenList(x,y);
        if(opIdx>=0){
            //监测点的F值
            let point:point = this._openList[opIdx];
            let curF = data.F;

            //当前节点父节点的值
            let pNode = this._curPos.parentNode;
            let pData = this.getPathMapDataByXY(pNode.x,pNode.y);
            let pF = pData.F;

            if(curF<pF){
                this._curPos.parentNode = point;
            }

        }else{
            //如果该节点不在open列表中，则将其加入到open列表，并计算F值，设置其父节点为当前节点。
            let point:point = {
                x:x,
                y:y,
                parentNode:this._curPos
            }
            data.G = (Math.abs(this._startPos.x-x)+Math.abs(this._startPos.y-y))*this._cost;
            data.H = (Math.abs(this._endPos.x-x)+Math.abs(this._endPos.y-y))*this._cost;
            data.F = data.G+data.H;
            this._pathMapsData[x][y] = data;
            this._openList.push(point);
        }
    }


    public getXYF(x,y){
        let F = this._defaultCost;
        let data = this.getPathMapDataByXY(x,y);
        if(data){
            F = data.F
        }
        return F;
    }

    public doMove(){
        if(!this._isSearchSuccess){
            console.error('寻路搜索失败！！！');
            return;
        } 

        let length = this._moveList.length;
        if(length>0){
            let idx = length-1;
            let point = this._moveList[idx];
            this._moveList.splice(idx,1);
            return point;
        }else{
            return this._curPos;
        }

    }

    private setMoveList(){
        let endPosX = this._endPos.x;
        let endPosY = this._endPos.y;

        let idx = this.checkIsInCloseList(endPosX,endPosY);
        let curPoint = this._closeList[idx];

        this._moveList.push(curPoint);

        let parentNode = curPoint.parentNode;

        let pX = parentNode.x;
        let pY = parentNode.y;

        while(true){
            idx = this.checkIsInCloseList(pX,pY);
            curPoint = this._closeList[idx];
            this._moveList.push(curPoint);
            parentNode = curPoint.parentNode;
            if(!parentNode)break;
            pX = parentNode.x;
            pY = parentNode.y;
            if(curPoint.x==this._startPos.x&&curPoint.y==this._startPos.y){
                break;
            }

        }
        return this._moveList;
    }



}

export interface point{
    x:number,
    y:number,
    parentNode:point
}
export interface AStarData{
    isCanWalk:boolean;       //这个点是否能走
    pointNode:point,         //当前节点数据
    F:number,   //当前点到终点的代价
    G:number,   //起点到当前点的代价
    H:number    //当前点到终点的预估代价（忽略障碍，计算直线距离的代价值）
}