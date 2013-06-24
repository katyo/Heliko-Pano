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

    AP = Array.prototype,
    join = AP.join,

    engines;

if(!body){
  body = doc.createElement('body');
}

var vendors = {
  webkit: '-webkit-',
  O: '-o-',
  MS:'-ms-',
  Moz:'-moz-'
};

function checkStyleProp(elm, sty, css, val){
  if(sty in elm.style){
    elm.style[sty] = val;
    val = global.getComputedStyle(elm).getPropertyValue(css);
    return und !== val && 'none' !== val;
  }
  return false;
}

function initStyleProp(sty, val){
  if(!global.getComputedStyle){
    return null;
  }

  var pfx,
      res = null,
      elm = doc.createElement('p'),
      css = sty.replace(/([A-Z])/g, '-$1').toLowerCase();

  /* Add it to the body to get the computed style.*/
  body.appendChild(elm);

  if(checkStyleProp(elm, sty, css, val)){
    res = {
      sty: sty,
      css: css
    };
  }else{
    sty = sty.charAt(0).toUpperCase() + sty.substr(1);
    css = '-' + css;

    for(pfx in vendors){
      if(checkStyleProp(elm, pfx + sty, vendors[pfx] + css, val)){
        res = {
          sty: pfx + sty,
          css: vendors[pfx] + css
        };
        break;
      }
    }
  }

  body.removeChild(elm);

  return res;
}

function dummy(){}

function HelikoPanoCube(){
  var self = this;

  self.node = null;
  self.type = '';
  self.e = null;
  self.s = [0, 0];
  self.l = [0, 0, 90];
  self.g = new Array(6);
}

function setupGeom(src){
  return new Function('M', 'PI', 'hPI', 'return M()' + src + '.$;')(Matrix3D, pi, h_pi);
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

function bound(self, func){
  return function(){
    self.func.apply(self, arguments);
  };
}

function imagesLoad(urls, cb){
  var i = 0, /* Currently loading image */
      c = urls.length, /* Amount of images */
      u, /* current url */
      m; /* current image */

  function next(){
    if(i < c){
      u = urls[i];
      i++;
      m = new Image();
      m.src = u;
      cb(null, false, i, c, m); /* start loading notification */
      if(m.complete){
        pass();
      }else{
        m.onload = pass;
        m.onerror = fail;
      }
    }
  }

  function pass(){
    cb(null, true, i, c, m); /* complete loaded notification */
    next();
  }

  function fail(){
    cb(new Error('The image could not be loaded.'), true, i, c, m); /* loading error notification */
    next();
  }

  next();
}

function Matrix3D(m){
  if(this instanceof Matrix3D){
    if(m){
      this.$ = m;
    }else{
      this.$ = mat4();
      this.i();
    }
  }else{
    return new Matrix3D(m);
  }
}

Matrix3D.prototype = {
  i: function(){
    mat4_identity(this.$);
    return this;
  },
  m: function(m){
    mat4_mul(this.$, this.$, m);
    return this;
  },
  t: function(x, y, z){
    var m = mat4();
    mat4_translate(m, x, y, z);
    return this.m(m);
  },
  s: function(x, y, z){
    var m = mat4();
    mat4_scale(m, x, y, z);
    return this.m(m);
  },
  r: function(x, y, z, a){
    var m = mat4();
    mat4_rotate(m, x, y, z, a);
    return this.m(m);
  },
  p: function(fov, aspect, znear, zfar){
    var m = mat4();
    mat4_perspective(m, fov, aspect, znear, zfar);
    return this.m(m);
  }
};
