function init(){
  scale = 1;
  longitude = 20;
  latitude = 50;
  mapa = new Mapeczka("shower","orthogonal",1,longitude,latitude);
  updateDiv();

  document.getElementById('files').addEventListener('change', readFiles, false);
  document.getElementById('erase').addEventListener('click',function(){mapa.removeMaps();});
  sel = document.getElementById('projectionselect');
  sel.selectedIndex = 0;
  sel.addEventListener('change',function(e){mapa.changeProjection(sel.options[sel.selectedIndex].value);});
  document.addEventListener("keydown", keyDown, false);
}
function updateDiv(){
    var div = document.getElementById("poka");
    div.innerHTML = "scale: "+scale.toFixed(3)+"<br/>"+"longitude: "+longitude.toFixed(3)+" degrees<br/>"+"latitude: "+latitude.toFixed(3)+" degrees<br/>";
}
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function keyDown(e){
   if(e.key=="z"){
       scale*=1.2;
       e.preventDefault();
   }
   if(e.key=="x"){
       scale/=1.2;
       e.preventDefault();
   }
   var speed = 6;
   if(e.key=="ArrowLeft"){
       longitude-=speed/scale;
       e.preventDefault();
   }
   if(e.key=="ArrowRight"){
       longitude+=speed/scale;
       e.preventDefault();
   }
   if(longitude<-180)
       longitude+=360;
   if(longitude>180)
       longitude-=360;
   if(e.key=="ArrowUp" && latitude<90){
       latitude+=speed/scale;
       e.preventDefault();
   }
   if(e.key=="ArrowDown" && latitude>-90){
       latitude-=speed/scale;
       e.preventDefault();
   }
   if(latitude>90)
       latitude = 90;
   if(latitude<-90)
       latitude = -90;
   if(e.key=='0'){
       scale = 1;
       longitude = 20;
       latitude = 50;
       e.preventDefault();
   }
   mapa.changeAttributes(scale,longitude,latitude);
   mapa.redraw();
   updateDiv();
}
function readFiles(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files;

    if (f[0]) {
        for(var i = 0;i<f.length;i++){
            var r = new FileReader();
            r.onload = function(e) {
                var contents = e.target.result;

                mapa.addGeoJSON(contents,getRandomColor(),"black");
                mapa.redraw();
            }
            r.readAsText(f[i]);
        }
    } else {
        alert("Failed to load file");
    }
}
