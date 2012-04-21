
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.net.URLRequest;
import flash.Lib;
import flash.external.ExternalInterface;

import sandy.core.Scene3D;
import sandy.core.scenegraph.Camera3D;
import sandy.core.scenegraph.Group;
import sandy.events.QueueEvent;
import sandy.events.SandyEvent;
import sandy.materials.Appearance;
import sandy.materials.attributes.MaterialAttributes;
import sandy.materials.attributes.LineAttributes;
import sandy.materials.BitmapMaterial;
import sandy.primitive.SkyBox;
import sandy.primitive.Plane3D;
import sandy.util.LoaderQueue;
import sandy.materials.Material;

class CubePano extends Sprite{
  static var edgelen:Float = 300;  // Edge Length
  static var quality:UInt = 5;     // Plane Quality 7
  static var matprec:UInt = 5;     // Material Precision 10
  static var matrdep:UInt = 5;     // Materian Recurssion Depth 6
  static var faceids:Array<String> = ['right', 'left', 'top', 'bottom', 'back', 'front'];
  
  private var scene:Scene3D;
  private var cube:SkyBox;
  private var queue:LoaderQueue;
  private var camera:Camera3D;
  
  private var js_cb:String;
  private var js_id:String;
  
  private function getFace(i:UInt):Plane3D{
    switch(i){
    case 0: return cube.right;
    case 1: return cube.left;
    case 2: return cube.top;
    case 3: return cube.bottom;
    case 4: return cube.front;
    case 5: return cube.back;
    }
    return null;
  }
  
  public function new(){
    super();
    
    // Setup Params
    var p = flash.Lib.current.root.loaderInfo.parameters;
    js_cb = p.c;
    js_id = p.i;
    
    // Init View
    var root:Group = new Group("root");
    cube = new SkyBox("pano", edgelen, quality, quality);
    cube.enableBackFaceCulling = true;
    cube.bottom.rotateY = 0; // Fix Y rotation for Bottom face
    
    root.addChild(cube);
    
    camera = new Camera3D(640, 480);
    // We must reset the camera to coinside with the real camera
    camera.near = 0.01;
    camera.z = 0;
    camera.rotateY -= 130; // Just to make the start interesting
    scene = new Scene3D("scene", this, camera, root);
    
    if(ExternalInterface.available){
      ExternalInterface.addCallback("reDraw", reDraw);
      ExternalInterface.addCallback("reLoad", reLoad);
      ExternalInterface.call(js_cb, js_id, "ready");
    }
  }
  
  private function reLoad(s:String){
    var  src:Array<String> = s.split('\n');
    queue = new LoaderQueue();
    
    for(i in 0...src.length){
      queue.add(Std.string(i), new URLRequest(src[i]));
    }
    
    queue.addEventListener(QueueEvent.QUEUE_RESOURCE_LOADED, resourceLoaded);
    queue.addEventListener(SandyEvent.QUEUE_COMPLETE, loadComplete);
    
    setProgress(0);
    queue.start();
  }
  
  private function setProgress(num:UInt){
    if(ExternalInterface.available){
      ExternalInterface.call(js_cb, js_id, "load", num);
    }
  }
  
  private function resourceLoaded(event:QueueEvent){
    var num = Lambda.count(queue.data);
    if(num < 6){
      setProgress(num);
    }
  }
  
  private function loadComplete(event:QueueEvent){
    for(num in 0...6){
      var mat:BitmapMaterial = new BitmapMaterial(Reflect.field(queue.data.get(Std.string(num)), "bitmapData"), null, matprec);
      mat.repeat = false; // Fix for removing edges
      mat.smooth = true;
      mat.maxRecurssionDepth = matrdep;
      
      var face:Plane3D = getFace(num);
      face.enableClipping = true;
      face.appearance = new Appearance(mat);
    }
    setProgress(6);
  }
  
  private function reDraw(lon:Float, lat:Float, fov:Float){
    var phi:Float = -(90 - lat) * Math.PI / 180;
    var theta:Float = -lon * Math.PI / 180;
    
    camera.viewport.width = stage.stageWidth;
    camera.viewport.height = stage.stageHeight;
    
    camera.lookAt(100 * Math.sin(phi) * Math.cos(theta),
		  100 * Math.cos(phi),
		  100 * Math.sin(phi) * Math.sin(theta));
    camera.fov = fov;
    
    scene.render();
  }
  
  // Entry point for the application
  static function main(){
    Lib.current.stage.addChild(new CubePano());
  }
}
