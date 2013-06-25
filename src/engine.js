/**
 * Cube Planes:
 * u - up
 * d - down
 * f - front
 * b - back
 * l - left
 * r - right
 *
 * Geometry Specification:
 *
 * z y
 * |/_x
 *
 * Non-tiled right coord system:
 * [
 *   '+y', // front
 *   '+x', // right
 *   '-y', // back
 *   '-x', // left
 *   '+z', // top
 *   '-z'  // bottom
 * ]
 *
 * z  x
 * | /
 * |/_ _ y
 *
 * Non-tiled left coord system:
 * [
 *   '+y', // front
 *   '+x', // right
 *   '-y', // back
 *   '-x', // left
 *   '+z', // top
 *   '-z'  // bottom
 * ]
 */

var global = window,

    und,
    doc = global.document,
    body = doc.body,

    engines;

if(!body){
  body = doc.createElement('body');
}

function HelikoPanoCube(){
  var self = this;

  self.node = null;
  self.type = '';
  self.e = null;
  self.s = [0, 0];
  self.l = [0, 0, 90];
  self.g = new Array(6);
}

HelikoPanoCube.prototype = {
  geom: function(geom){
    var i,
        g = this.g;

    for(i = 0; i < 6; i++){
      g[i] = setupGeom(geom[i]);
    }
  },
  /*
   * Change Renderer
   */
  render: function(type, geom){
    if(0 === arguments.length){
      /* currently used engine */
      return this.type;
    }
    if(this.node){ /* cleanup already used engine */
      this.node.parentNode.removeChild(this.node);
      this.node = null;
    }
    var engine;
    if('*' === type || '' === type){ /* select first available engine */
      for(type in engines){
        if(engines[type]){
          engine = engines[type];
          break;
        }
      }
    }else if(type){ /* select required engine */
      engine = engines[type];
    }
    if(engine){
      this.type = type;
      this.geom(geom);
      var inst = this.e = new engine(this.g);
      this.node = inst.view;
      inst.size.apply(inst, this.s);
      inst.look.apply(inst, this.l);
      return true;
    }else{
      this.type = '';
      this.e = null;
    }
    return false;
  },
  /*
   * Resize view
   */
  size: function(width, height){
    if(!arguments.length){
      return this.s;
    }
    this.s[0] = width;
    this.s[1] = height;
    if(this.e){
      this.e.size(width, height);
      return true;
    }
    return false;
  },
  /*
   * Navigate and change view angle
   */
  look: function(latitude, longitude, viewangle){
    if(!arguments.length){
      return this.l;
    }
    this.l[0] = latitude;
    this.l[1] = longitude;
    this.l[2] = viewangle;
    if(this.e){
      this.e.look(latitude, longitude, viewangle);
      return true;
    }
    return false;
  },
  load: function(urls, cb, pc){
    if(this.e){
      this.e.load(urls, cb || dummy, pc || dummy);
      return true;
    }
    return false;
  }
};

engines = HelikoPanoCube.engines = {};

HelikoPanoCube.engine = function(name, test, cook){
  var engine = {};
  if(test.call(engine)){
    engine = cook.call(engine);
  }
  engines[name] = engine;
}
