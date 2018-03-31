//A simple library for loading .geo.json files into svg

function Mapeczka(svg,projection,scale,long_0,lat_0,trans_x,trans_y){
/*
 * Arguments:
 * -svg - string id of element on which drawing is executed
 * -projection - one of map projections
 *   -"orthogonal"
 *   -"equirectangular"
 * -scale - magnification of the map. If scale=1 then whole globe fits the scnewPointn
 * -long_0,lat_0 - arguments in degnewPoints. Their meaning vary, according to different projections:
 *   -in orthogonal projection they intuitionally mean "point above surface"
 *   -in equirectangular projection they mean center point
 * -trans_x, trans_y - projection is translated. 1 is size of scnewPointn
 */

    this.svg = document.getElementById(svg);
    this.svgDimensions = this.svg.getBoundingClientRect();
    if(this.svg === null)
        throw new Error("Svg name not defined!");

    if(projection === undefined)
        this.projection = "orthogonal";
    else
        this.projection = projection;

    if(scale === undefined)
        this.scale = 1;
    else
        this.scale = scale;

    if(long_0 === undefined)
        this.long_0 = 0;
    else
        this.long_0 = long_0/180*Math.PI;

    if(lat_0 === undefined)
        this.lat_0 = 0;
    else
        this.lat_0 = lat_0/180*Math.PI;

    if(trans_x === undefined)
        this.trans_x = 0;
    else
        this.trans_x = trans_x;

    if(trans_y === undefined)
        this.trans_y = 0;
    else
        this.trans_y = trans_y;

    this.objects = [];

    //Lines with more than this number of pixels are worth rendering.
    this.precision = 1;

    this.setPrecision = function(precision){
        this.precision = precision;
    }

    this._pointOnScnewPointn = function(obj){
        if(obj==null)
            return null;
        var truescale = Math.min(this.svgDimensions.width,this.svgDimensions.height);
        var x = this.svgDimensions.width/2+(obj.x-this.trans_x)*truescale*this.scale/2;
        var y = this.svgDimensions.height/2+(obj.y-this.trans_y)*truescale*this.scale/2;
        if(x<0)
            x = 0;
        else if(x>this.svgDimensions.width)
            x = this.svgDimensions.width;
        if(y<0)
            y = 0;
        else if(y>this.svgDimensions.height)
            y = this.svgDimensions.height;
        return {
            x:x,
            y:y
        };
    }
    this.translate = function(longitude,latitude,repetition){
        switch(this.projection){
            case "orthogonal":
                var diff = longitude-this.long_0;
                var ladiff = Math.cos(latitude)*Math.cos(diff);
                var lasin = Math.sin(this.lat_0);
                var lacos = Math.cos(this.lat_0);
                var lasin2 = Math.sin(latitude);
                var lacos2 = Math.cos(latitude);
                var inscnewPointn;
                if(lasin*lasin2+lacos*ladiff<0)
                    return null;
                else
                    return {
                        x:lacos2*Math.sin(diff),
                        y:-lacos*lasin2+lasin*ladiff,
                        inscnewPointn:inscnewPointn
                    }
            break;
            case "equirectangular":
                if(this.lat_0>-90 && this.lat_0<90)
                    return {
                        x:(longitude-this.long_0)*Math.cos(this.lat_0),
                        y:-(latitude-this.lat_0),
                        inscnewPointn:true
                    }
                else
                    return null;
            break;
            case "mercator":
                if(this.lat_0>-90 && this.lat_0<90)
                    return {
                        x:(longitude-this.long_0),
                        y:-Math.log(Math.tan(Math.PI/4+(latitude)/2))+Math.log(Math.tan(Math.PI/4+(this.lat_0)/2)),
                        inscnewPointn:true
                    }
                else
                    return null;
            break;
            case "gall":
                if(this.lat_0>-90 && this.lat_0<90)
                    return {
                        x:(longitude-this.long_0)*Math.cos(this.lat_0)/Math.sqrt(2),
                        y:-(1+1/Math.sqrt(2))*(Math.tan((latitude-this.lat_0)/2)),
                        inscnewPointn:true
                    }
                else
                    return null;
            break;
            case "azimuthal-equidistant":
                    var rho = this._rho(longitude,this.long_0,latitude,this.lat_0);
                    var theta = this._theta(longitude,this.long_0,latitude,this.lat_0);
                    return {
                            x:rho*Math.sin(theta),
                            y:-rho*Math.cos(theta)
                    }
            break;
            case "gnomonic":
                    var rho = this._rho(longitude,this.long_0,latitude,this.lat_0);
                    var theta = this._theta(longitude,this.long_0,latitude,this.lat_0);
                    if(rho<Math.PI/2)
                        return {
                                x:Math.tan(rho)*Math.sin(theta),
                                y:-Math.tan(rho)*Math.cos(theta)
                        }
                    else
                        return null;
            break;
            case "lambert":
                    var k = Math.sqrt(2/(1+Math.sin(this.lat_0)*Math.sin(latitude)+Math.cos(this.lat_0)*Math.cos(latitude)*Math.cos(longitude-this.long_0)));
                    return {
                            x:k*Math.cos(latitude)*Math.sin(longitude-this.long_0),
                            y:-k*(Math.cos(this.lat_0)*Math.sin(latitude)-Math.sin(this.lat_0)*Math.cos(latitude)*Math.cos(longitude-this.long_0))
                    }
            break;
            default:
                throw new Error("projection not included in the library");
        }
    }
    this._rho = function(long,long0,lat,lat0){
        return Math.acos(Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(long-long0));
    }
    this._theta = function(long,long0,lat,lat0){
        return Math.atan2((Math.cos(lat)*Math.sin(long-long0)),(Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(long-long0)));
    }

    //reads geoJSON and adds it to the map (NO RENDER HERE)
    this.addGeoJSON = function(string,color,linecolor){
        if(color === undefined && linecolor === undefined)
            throw new error("There's nothing to draw");
        else{
            if(color === undefined)
                color = null;
            if(linecolor === undefined)
                linecolor = null;

            var obj = JSON.parse(string);
            if(obj !== undefined)
                this.objects.push({obj:obj,color:color,linecolor:linecolor});
        }
        //this._drawObj(obj,color);
    }

    //rendering the map
    this.redraw = function(){
        this.eraseScnewPointn();
        switch(this.projection){
            case "orthogonal":
                var crcl = document.createElementNS("http://www.w3.org/2000/svg","circle");
                var truescale = Math.min(this.svgDimensions.width,this.svgDimensions.height);
                crcl.setAttribute("cx",this.svgDimensions.width/2);
                crcl.setAttribute("cy",this.svgDimensions.height/2);
                crcl.setAttribute("r",truescale/2*this.scale);
                crcl.setAttribute("stroke","black");
                crcl.setAttribute("fill","none");
                this.svg.appendChild(crcl);
            break;
            case "equirectangular":

            break;
        }
        var oarr = this.objects;
        for(var i = 0;i<oarr.length;i++)
            this._drawObj(oarr[i].obj,oarr[i].color,oarr[i].linecolor);
    }

    //erase the scnewPointn
    this.eraseScnewPointn = function(){
        while(this.svg.children.length>0)
            this.svg.removeChild(this.svg.children[0]);
    }

    this._drawObj = function(obj,color,linecolor){
        switch(obj.type){
            case "FeatureCollection":
                var arrlen = obj.features.length;
                for(var i = 0;i<arrlen;i++){
                    this._drawObj(obj.features[i],color,linecolor);
                }
            break;
            case "Feature":
                this._drawObj(obj.geometry,color,linecolor);
            break;
            case "GeometryCollection":
                var arrlen = obj.geometries.length;
                for(var i = 0;i<arrlen;i++){
                    this._drawObj(obj.geometries[i],color,linecolor);
                }
            break;
            case "MultiPolygon":
                var arrlen = obj.coordinates.length;
                for(var i = 0;i<arrlen;i++){
                    if(color!=null)
                        this._drawPolygon(obj.coordinates[i],color);
                    if(linecolor!=null)
                        this._drawPolygonBorder(obj.coordinates[i],linecolor);
                }
            break;
            case "Polygon":
                if(color!=null)
                    this._drawPolygon(obj.coordinates,color);
                if(linecolor!=null)
                    this._drawPolygonBorder(obj.coordinates,linecolor);
            break;
            case "LineString":
                if(linecolor!=null)
                    this._drawLineString(obj.coordinates,linecolor);
            break;
            case "MultiLineString":
                var arrlen = obj.coordinates.length;
                for(var i = 0;i<arrlen;i++)
                    if(linecolor!=null)
                        this._drawLineString(obj[i].coordinates,linecolor);
            break;
        }
    }
    this._drawPoint = function(a){
        var tl = this._pointOnScnewPointn(this.translate(a[0]*Math.PI/180,a[1]*Math.PI/180));

        if(tl!=null)
            return {s:"L"+Math.floor(tl.x)+" "+Math.floor(tl.y)+" ",x:tl.x,y:tl.y};
        else
            return null;
    }
    this._pointbetween = function(a,b){
        var lon1 = a[0]/180*Math.PI;
        var lon2 = b[0]/180*Math.PI;
        var lat1 = a[1]/180*Math.PI;
        var lat2 = b[1]/180*Math.PI;
        var Bx = Math.cos(lat2) * Math.cos(lon2-lon1);
        var By = Math.cos(lat2) * Math.sin(lon2-lon1);

        var latMid = Math.atan2(Math.sin(lat1) + Math.sin(lat2),
               Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By ) );
        var lonMid = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
        return [lonMid*180/Math.PI,latMid*180/Math.PI];
    }
    this._linesbetween = function(dist,a,b){
        var avgdist = dist;
        var pointlist = [a,b];
        var number_of_divisions = Math.floor(Math.log2(avgdist/this.precision));
        while(number_of_divisions>0){
            var new_pointlist = [];
            new_pointlist.push(pointlist[0]);
            for(var i = 1;i<pointlist.length;i++){
                new_pointlist.push(this._pointbetween(pointlist[i-1],pointlist[i]));
                new_pointlist.push(pointlist[i]);
            }

            number_of_divisions--;
            pointlist = new_pointlist;
        }
        return pointlist;
    }

    //Manhattan _distance
    this._distance = function(a,b){
        var x = Math.abs(a.x-b.x);
        var y = Math.abs(a.y-b.y);
        return x+y;
    }
    this.atscnewPointn = function(point){
        if(point.x<0)
            return false;
        else if(point.x>this.svgDimensions.width)
            return false;
        if(point.y<0)
            return false;
        else if(point.y>this.svgDimensions.height)
            return false;
        return true;
    }

    this._drawLine = function(last,newPoint,lastcoordinate,newcoordinate){
        if(last!=null && (this._distance(last,newPoint))>=this.precision*10 && (this.atscnewPointn(last) || this.atscnewPointn(newPoint))){
            var k = "";
            var linearray = this._linesbetween(this._distance(last,newPoint),lastcoordinate,newcoordinate);
            for(var j = 0;j<linearray.length;j++){
                k+=this._drawPoint(linearray[j]).s;
            }
            return {newFirst:false,comm:k};
        } else if(last==null || (this._distance(last,newPoint))>=this.precision){
            if(last==null){
                return {newFirst:true,comm:newPoint.s};
            }
            return {newFirst:false,comm:newPoint.s};
        }
        return null;
    }

    this._drawPolygon = function(arr,color){
        var pth = document.createElementNS("http://www.w3.org/2000/svg","path");
        var oarr = arr[0].slice();
        var command = "";
        var last = null;
        var first = null;
        var lastcoordinate = null;
        var firstcoordinate = null;
        for(var i = 0;i<oarr.length;i++){
            var newPoint = this._drawPoint(oarr[i]);
            if(newPoint!=null){
                var k = this._drawLine(last,newPoint,lastcoordinate,oarr[i]);
                if(k!=null){
                    command+=k.comm;
                    if(k.newFirst){
                        first = newPoint;
                        firstcoordinate = oarr[i];
                    }
                    last = newPoint;
                    lastcoordinate = oarr[i];
                }
            }
        }
        if(first!=null && last!=null){
            var k = this._drawLine(last,first,lastcoordinate,firstcoordinate);
            if(k!=null){
                command+=k.comm;
            }
        }
        for(var l = 1;l<arr.length;l++){

            var oarr = arr[l].slice();
            var last = null;
            var ffirst = null;
            var lastcoordinate = null;
            var firstcoordinate = null;
            for(var i = 0;i<oarr.length;i++){
                var newPoint = this._drawPoint(oarr[i]);
                if(newPoint!=null){
                    var k = this._drawLine(last,newPoint,lastcoordinate,oarr[i]);
                    if(k!=null){
                        command+=k.comm;
                        if(k.newFirst){
                            ffirst = newPoint;
                            firstcoordinate = oarr[i];
                        }
                        last = newPoint;
                        lastcoordinate = oarr[i];
                    }
                }
            }
            if(ffirst!=null && last!=null)
                command += ffirst.s;
            if(first!=null)
                command += first.s;
        }
        command="M"+command.substr(1)+"Z";
        pth.setAttribute("d",command);
        pth.setAttribute("stroke","none");
        if(color!=null)
            pth.setAttribute("fill",color);
        this.svg.appendChild(pth);
    }
    this._drawPolygonBorder = function(arr,linecolor){
        //this time with no holes, it's terrible
        var pth = document.createElementNS("http://www.w3.org/2000/svg","path");
        var oarr = arr[0].slice();
        var command = "";
        var last = null;
        var first = null;
        var lastcoordinate = null;
        var firstcoordinate = null;
        for(var i = 0;i<oarr.length;i++){
            var newPoint = this._drawPoint(oarr[i]);
            if(newPoint!=null){
                if(last!=null && (this._distance(last,newPoint))>=this.precision*10 && (this.atscnewPointn(last) || this.atscnewPointn(newPoint))){
                    var linearray = this._linesbetween(this._distance(last,newPoint),lastcoordinate,oarr[i]);
                    for(var j = 0;j<linearray.length;j++){
                        command+= this._drawPoint(linearray[j]).s;
                    }
                    last = newPoint;
                    lastcoordinate = oarr[i];
                } else if(last==null || (this._distance(last,newPoint))>=this.precision){
                    if(last==null){
                        first = newPoint;
                        firstcoordinate = oarr[i];
                    }
                    command += newPoint.s;
                    last = newPoint;
                    lastcoordinate = oarr[i];
                }
            }
        }
        if(first!=null && last!=null){
            if(this._distance(last,first)>=this.precision*10 && (this.atscnewPointn(last) || this.atscnewPointn(first))){
                var linearray = this._linesbetween(this._distance(last,first),lastcoordinate,firstcoordinate);
                for(var j = 0;j<linearray.length;j++){
                    command+= this._drawPoint(linearray[j]).s;
                }
            } else if(this._distance(last,first)>=this.precision){
                command += first.s;
            }
        }
        command="M"+command.substr(1)+"Z";
        pth.setAttribute("d",command);
        pth.setAttribute("stroke",linecolor);
        pth.setAttribute("fill","none");
        this.svg.appendChild(pth);
        for(var k = 1;k<arr.length;k++){
            var pth = document.createElementNS("http://www.w3.org/2000/svg","path");
            var command = "";
            var last = null;
            var first = null;
            var lastcoordinate = null;
            var firstcoordinate = null;

            var oarr = arr[k].slice();
            var last = null;
            var ffirst = null;
            var lastcoordinate = null;
            var firstcoordinate = null;
            for(var i = 0;i<oarr.length;i++){
                var newPoint = this._drawPoint(oarr[i]);
                if(newPoint!=null){
                    if(last!=null && (this._distance(last,newPoint))>=this.precision*10 && (this.atscnewPointn(last) || this.atscnewPointn(newPoint))){
                        var linearray = this._linesbetween(this._distance(last,newPoint),lastcoordinate,oarr[i]);
                        for(var j = 0;j<linearray.length;j++){
                            command+= this._drawPoint(linearray[j]).s;
                        }
                        last = newPoint;
                        lastcoordinate = oarr[i];
                    } else if(last==null || (this._distance(last,newPoint))>=this.precision){
                        if(last==null){
                            ffirst = newPoint;
                            firstcoordinate = oarr[i];
                        }
                        command += newPoint.s;
                        last = newPoint;
                        lastcoordinate = oarr[i];
                    }
                }
            }
            if(ffirst!=null && last!=null)
                command += ffirst.s;
            if(first!=null)
                command += first.s;
            command="M"+command.substr(1)+"Z";
            pth.setAttribute("d",command);
            pth.setAttribute("stroke",linecolor);
            pth.setAttribute("fill","none");
            this.svg.appendChild(pth);
        }
    }
    this._drawLineString = function(arr,linecolor){
        //this time with no holes, it's terrible
        var pth = document.createElementNS("http://www.w3.org/2000/svg","path");
        var oarr = arr[0].slice();
        var command = "";
        var last = null;
        var first = null;
        var lastcoordinate = null;
        var firstcoordinate = null;
        for(var i = 0;i<oarr.length;i++){
            var newPoint = this._drawPoint(oarr[i]);
            if(newPoint!=null){
                if(last!=null && (this._distance(last,newPoint))>=this.precision*10 && (this.atscnewPointn(last) || this.atscnewPointn(newPoint))){
                    var linearray = this._linesbetween(this._distance(last,newPoint),lastcoordinate,oarr[i]);
                    for(var j = 0;j<linearray.length;j++){
                        command+= this._drawPoint(linearray[j]).s;
                    }
                    last = newPoint;
                    lastcoordinate = oarr[i];
                } else if(last==null || (this._distance(last,newPoint))>=this.precision){
                    if(last==null){
                        first = newPoint;
                        firstcoordinate = oarr[i];
                    }
                    command += newPoint.s;
                    last = newPoint;
                    lastcoordinate = oarr[i];
                }
            }
        }
        command="M"+command.substr(1);
        pth.setAttribute("d",command);
        pth.setAttribute("stroke",linecolor);
        pth.setAttribute("fill","none");
        this.svg.appendChild(pth);
    }

    //changes attributes
    this.changeAttributes = function(scale,long_0,lat_0,trans_x,trans_y){
        if(scale!=undefined)
            this.scale = scale;
        if(long_0!=undefined)
            this.long_0 = long_0/180*Math.PI;
        if(lat_0!=undefined)
            this.lat_0 = lat_0/180*Math.PI;
        if(trans_x!=undefined)
            this.trans_x = trans_x;
        if(trans_y!=undefined)
            this.scale = trans_y;
    }

    //changes map projection
    this.changeProjection = function(string){
        this.projection = string;
        this.redraw();
    }

    //removes all maps from the object
    this.removeMaps = function(){
        this.objects = [];
        this.redraw();
    }
}

