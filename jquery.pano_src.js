;(function($){
  var tick_timeout = 1000/60, next_tick, $$ = {};

  next_tick = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback, element) {
        window.setTimeout(callback, tick_timeout);
      };
  })();
  /*
    next_tick = (function(){
      var timer = null,
      lastcb = null,
      clear_timer = function(){
        clearTimeout(timer);
        timer = null;
        if(lastcb){
          lastcb();
          lastcb = null;
        }
      };

      return function(cb){
        if(timer){
          lastcb = cb;
        }else{
          timer = setTimeout(clear_timer, tick_timeout);
          cb();
        }
      };
    })();
  */

  $$.loadlib = function(name, path, cb, once){
    var pool = window;
    if(typeof name == 'string'){
      name = name.split('.');
    }
    for(var i = 0; i < name.length; i++){
      pool = pool[name[i]];
      if(!pool && !once){ // try to load library
        $.getScript(path, function(){
          $$.loadlib(name, path, cb, true);
        });
        return false;
      }
    }
    if(typeof cb == 'function'){
      cb(pool);
    }
    return true;
  };

  /*
   *  Batch preloading of textures
   */
  $$.preload = function(self, src, cb){
    var all = [], amount, img = null, proc = function(){
      if(typeof cb == 'function'){
	cb(img, amount - all.length, amount, all.length);
      }
      if(img){
	img = null;
      }
      if(all.length){
	img = new Image();
	img.onload = proc;
	img.src = all.shift();
      }
    };
    for(var i in src){
      all.push(src[i]);
    }
    amount = all.length;
    proc();
  };

  var dummy = function(e){
    e.preventDefault();
    return false;
  }, overlay_events = {
    mousedown:function(e){
      var self = $(this), coord = [e.clientX, e.clientY];
      self.data('move.state', true);
      self.data('move.coord', coord);
    },
    mouseup:function(e){
      var self = $(this);
      self.data('move.state', false);
    },
    mousemove:function(e){
      var self = $(this), cont = self.parent(), p = cont.data('pano.data').p, f = 0.5*Math.PI*p.fov;
      if(self.data('move.state')){
	var _coord = self.data('move.coord'), coord = [e.clientX, e.clientY],
	delta = [coord[0] - _coord[0], coord[1] - _coord[1]];
        delta[0] *= -f/self.innerWidth();
        delta[1] *= f/self.innerHeight();
	cont.trigger('pano.move', delta);
	self.data('move.coord', coord);
      }
    },
    mouseleave:function(e){
      var self = $(this);
      self.data('move.state', false);
    },
    mousewheel:function(e, d){
      var self = $(this), cont = self.parent();
      cont.trigger('pano.zoom', [d > 0 ? -10 : 10]);
      e.preventDefault();
    },
    dragstart: dummy,
    dragend: dummy
  };

  $$.overlay = function(self){
    self.append('<div class="pano-overlay pano-notouch"></div>');
    var overlay = self.find('div.pano-overlay').hide();
    for(var e in overlay_events){
      overlay.bind(e, overlay_events[e]);
    }
    self.bind('pano.load', function(e, ct, num, all, end){
      if(ct == 'p' && !num){
        overlay.show();
      }
    });
    return overlay;
  };

  $$.progress = function(self, overlay){
    overlay.append('<div class="pano-progress pano-notouch"></div>');

    var progress = overlay.find('div.pano-progress');

    self.bind('pano.load', function(e, ct, num, all, end){
      progress.text('Loading '+num+' of '+all+'…');
      if(!num){
	progress.show();
      }
      if(!end){
	progress.hide();
      }
    });

    return progress.hide();
  };

  $$.interact = function(self, overlay){
    overlay.append('<div class="pano-move"><div class="pano-zoom"></div><div class="pano-maxmin"></div>');

    var n, cont = overlay.parent(),
        move = overlay.find('.pano-move'),
        zoom = overlay.find('.pano-zoom'),
        move_elems = { up:[0,10], down:[0,-10], left:[-10,0], right:[10,0] },
        zoom_elems = { plus:10, minus:-10 };

    for(n in move_elems){
      move.append('<div class="pano-move-'+n+'"></div>');
      move.find('.pano-move-'+n).click(function(){
        cont.trigger('pano.move', move_elems[n]);
      });
    }

    for(n in zoom_elems){
      zoom.append('<div class="pano-zoom-'+n+'"></div>');
      zoom.find('.pano-zoom-'+n).click(function(){
        cont.trigger('pano.zoom', zoom_elems[n]);
      });
    }

    zoom.append('<div class="pano-zoom-slidebar"><div class="pano-zoom-slider"></div></dev>');
    var zoombar = zoom.find('.pano-zoom-slidebar'), slider = zoom.find('.pano-zoom-slider');

  };

  var engine_select = function(self, d){ // d - pano data
    var ens = $$.type[d.t].engine;
    for(var i in ens){
      if(ens[i].check()){
	d.n = i;
	d.e = ens[d.n];
        if(d.e.require){
          for(var name in d.e.require){
            var path = d.e.require[name];
            $$.loadlib(name, path, function(pool){
              if(pool){
                d.e.init.call(self, d.d, d.s);
              }
            });
          }
        }else{
	  d.e.init.call(self, d.d, d.s);
        }
	break;
      }
    }
  };

  $$.type = {};

  $$.type.cube = {
    range: [20, 120],
    event:{
      init: function(e, opt){
	var self = $(this), d = self.data('pano.data');
	d.p = {fov:60, lon:0, lat:0}; // pano params
	d.s = {p:opt.preview, f:opt.fullview}; //'rlsgbf'.split(''));
	// image sources: [p f] = [right left sky ground back front]
      },
      move: function(e, lon, lat, abs){
	var self = $(this), d = self.data('pano.data'), p = d.p;
        if(typeof abs === 'number'){ // -1..0..1
          lon = 180 * lon;
          lat = 90 * lat;
        }
	if(abs){
	  p.lon = lon;
	  p.lat = lat;
	}else{
	  p.lon += lon;
	  p.lat += lat;
	}
	p.lat = Math.max(-85, Math.min(85, p.lat));
	self.trigger('pano.draw');
      },
      zoom: function(e, fov, abs){
	var self = $(this), d = self.data('pano.data'), p = d.p, r = $.pano.type.cube.range;
        if(typeof abs === 'number'){ // 0..1
          fov = r[0] + (r[1] - r[0]) * fov;
        }
	if(abs){
	  p.fov = fov;
	}else{
          p.fov += fov;
	}
	p.fov = Math.max(Math.min(p.fov, r[1]), r[0]);
	self.trigger('pano.draw');
      },
      draw: function(e){
	var self = $(this), d = self.data('pano.data');
	if(typeof d.e.draw == 'function'){
          //d.e.draw.call(self, d.d, d.p);
	  next_tick(function(){d.e.draw.call(self, d.d, d.p);});
	}
      }
    },
    engine: {}
  };

  $.pano = $$;

  $.fn.pano = function(opt){
    var type = opt.type || 'plane', entype = $$.type[type];
    if(typeof entype != 'object'){
      return this;
    }
    return this.each(function(){
      var self = $(this), d = {
	t:type, // pano type
	n:'', // engine name
        e:null, // engine
	d:{} // engine data
      };
      self.addClass('pano-placeholder').data('pano.data', d);
      for(var e in entype.event){ // Bind Pano Special Events
	self.bind('pano.'+e, entype.event[e]);
      }
      self.trigger('pano.init', [opt]); // Init Pano Engine
      engine_select(self, d);
      var overlay = $$.overlay(self);
      $$.progress(self, overlay);
      $$.interact(self, overlay);
    });
  };
})(jQuery);

//#ifdef WITH_THREE
;(function($){ // THREE-based cube pano viewer
  var $$ = $.pano, $$$ = {
    require: {
      THREE: 'three.js'
    },
    draw: function(e, p){ // engine data, parameters
      var self = this, phi = (90 - p.lat) * Math.PI / 180, theta = p.lon * Math.PI / 180;

      if(p.fov != e.fov){
	e.fov = p.fov;
	e.camera.projectionMatrix = THREE.Matrix4.makePerspective(e.fov, self.innerWidth()/self.innerHeight(), 1, 1100);
      }

      var t = e.camera.target.position;
      t.x = 500 * Math.sin(phi) * Math.cos(theta);
      t.y = 500 * Math.cos(phi);
      t.z = 500 * Math.sin(phi) * Math.sin(theta);

      e.renderer.render(e.scene, e.camera);
    },
    _init: function(e, s, r){ // engine data, source images
      var self = this;

      e.fov = 60;
      //e.rendtype = $$$.rendtype();
      e.rendtype = r;

      e.scene = new THREE.Scene();
      e.camera = new THREE.Camera(e.fov, self.innerWidth()/self.innerHeight(), 1, 1100);

      e.renderer = new THREE[e.rendtype+'Renderer']();

      e.renderer.setSize(self.innerWidth(), self.innerHeight());
      self.append(e.renderer.domElement);

      var preloader = function(img, num, all, end){
	var ct = e.cube?'f':'p';
	self.trigger('pano.load', [ct, num, all, end]);
	if(!num){
	  e.imgs = [];
	}else{
	  e.imgs.push(img);
	}
	if(!end){
	  if(ct == 'f'){ // Remove Preview Cube
	    e.scene.removeObject(e.cube);
	    e.cube = null;
	  }
	  if(e.rendtype == 'Canvas'){
	    var mats = [];
	    for(var i in e.imgs){
	      var tex = new THREE.Texture(e.imgs[i]),
	      mat = new THREE.MeshBasicMaterial({map:tex});
	      mats.push(mat);
	    }
	    e.cube = new THREE.Mesh(new THREE.Cube(300, 300, 300, 7, 7, 7, mats, true), new THREE.MeshFaceMaterial());
	    e.scene.addObject(e.cube);
	    //e.cube = THREE.SceneUtils.addPanoramaCube(e.scene, 300, imgs);
	  }
	  if(e.rendtype == 'WebGL'){
	    var tex = new THREE.Texture(e.imgs, new THREE.CubeRefractionMapping());
	    tex.needsUpdate = true;
	    e.cube = THREE.SceneUtils.addPanoramaCubeWebGL(e.scene, 300, tex);
	  }
	  e.cube.overdraw = true;
	  self.trigger('pano.draw');
	  if(ct == 'p'){ // Load Full Cube
	    setTimeout(function(){$$.preload(self, s.f, preloader);}, 10);
	  }
	}
      };

      // Load Preview Cube
      $$.preload(self, s.p, preloader);
    }
  };

  $$.type.cube.engine.webgl = $.extend({
    init: function(e, s){
      $$$._init.call(this, e, s, 'WebGL');
    },
    check: function(){
      var canvas = document.createElement('canvas'),
          names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl", "3d"],
          gl = null;
      for (var i = 0; i < names.length; i++) {
        try {
          gl = canvas.getContext(names[i]);
        } catch(e) {}
        if (gl) {
          return true;
        }
      }
      return false;
    }
  }, $$$);

  $$.type.cube.engine.canvas = $.extend({
    init: function(e, s){
      $$$._init.call(this, e, s, 'Canvas');
    },
    check: function(){
      try{
        var canvas = document.createElement('canvas');x
	return !!canvas && !!canvas.getContext('2d');
      }catch(e){
	return false;
      }
    }
  }, $$$);

})(jQuery);
//#endif

//#ifdef WITH_FLASH
;(function($){
  var fl = {
    ini: false,
    has: false,
    cv: '',
    ie: false,
    init: function(){
      if(fl.ini){
        return;
      }
      fl.ini = true;
      // Do some browser and flash version checking.
      var p = navigator.plugins;
      if (p && p.length) {
        var f = p['Shockwave Flash'];
        if(f){
          fl.has = true;
          if(f.description){
            fl.cv = f.description.replace(/([a-zA-Z]|\s)+/, "").replace(/(\s+r|\s+b[0-9]+|\s+d+)/, ".").split(".");
          }
        }
        if(p['Shockwave Flash 2.0']){
          fl.has = true;
          fl.cv = '2.0.0.11';
        }
      }else{
        try{
          var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
        }catch(e){
          try{
            var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
            fl.cv = [6, 0, 21];
            fl.has = true;
          }catch(e){}
          try{
            fl.axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
          }catch(e){}
        }
        if(axo != null){
          fl.cv = axo.GetVariable("$version").split(" ")[1].split(",");
          fl.has = true;
          fl.ie = true;
        }
      }
    },
    info: function(){
      fl.init();
      return {has:fl.has, ver:fl.cv};
    }
  }, $$ = $.pano, $$$ = {
    require: {
      swfobject: 'swfobject.js'
    },
    serial: 0,
    pool: {},
    keys: function(o){
      var r = [];
      for(var k in o){
        r.push(k);
      }
      return r;
    },
    mkid: function(n){
      if(!n){
        $$$.serial++;
        n = $$$.serial;
      }
      return 'flash-object-'+n;
    },
    src: 'CubePano.swf',
    attrs: {
    },
    params: {
      allowscriptaccess: 'always',
      wmode: 'transparent',
      scale: 'noscale',
      quality: 'high'
    },
    check: function(){
      var i = fl.info();
      return i.has && parseInt(i.ver[0], 10) > 9;
    },
    trig: function(id, ev){
      var self = $$$.pool[id], args = [];
      for(var i = 2; i<arguments.length; i++){
        args.push(arguments[i]);
      }
      if(self && self.length){
        self.trigger('flash.'+ev, args);
      }
    },
    draw: function(e, p){
      var self = this, a = e.a.get(0);
      a.reDraw(p.lon, p.lat, p.fov);
    },
    init: function(e, s){
      var self = this, id = $$$.mkid(), vars = {c:'jQuery.pano.type.cube.engine.flash.trig',i:id}, f = false;
      $$$.pool[id] = self;

      self.bind('flash.load', function(_, num){
        var p = f?'f':'p', all = s[p].length, end = all - num;
        self.trigger('pano.load', [p, num, all, end]);
        if(!end){
          self.trigger('pano.draw');
          if(!f){ // preview loaded
            f = true;
            e.a.get(0).reLoad(s.f.join('\n'));
          }
        }
      }).bind('flash.ready', function(){
        e.a = self.find('#'+id);
        e.a.get(0).reLoad(s.p.join('\n'));
      }).append('<div id="'+id+'">');
      swfobject.embedSWF($$$.src, id, self.innerWidth(), self.innerHeight(), "9.0.0", $$$.eis, vars, $$$.params, $$$.attrs);
    }
  };
  //$$.type.cube.engine = {}; // for test only this type
  $$.type.cube.engine.flash = $$$;
})(jQuery);
//#endif

//#ifdef WITH_JAVA
;(function($){ // JavaOGL-based cube pano viewer
  var embed_opts = function(opts){
    var html = [];
    for(var i in opts){
      html.push('<param name="'+i+'" value="'+opts[i]+'"/>');
    }
    return html.join('');
  }, embed_java = function(self, opts){
    var unid = 'embed-java-applet', html = [];
    html.push('<object id="'+unid+'" pluginspage="http://java.com/download/index.jsp" ');
    if($.browser.msie){
      html.push('classid="clsid:8AD9C840-044E-11D1-B3E9-00805F499D93"');
    }else{
      html.push('type="application/x-java-applet"');
    }
    html.push('>');
    html.push(embed_opts(opts));
    html.push('</object>');

    self.append(html.join(''));
    return self.find('#'+unid);
  }, $$ = $.pano, $$$ = {
    opts: {
      wmode: 'transparent',
      scriptable: 'true',
      mayscript: 'false',
      code:'CubePanoApplet.class'
      //codebase:'./'
    },
    check: function(){
      return navigator.javaEnabled();
    },
    draw: function(e, p){ // engine data, parameters
      var self = this;
      console.log('java draw', e.a);
    },
    init: function(e, s){ // engine data, source images
      var self = this, java_opts = $.extend({p:s.p.join(';'),f:s.f.join(';')}, $$$.opts);
      e.a = embed_java(self, java_opts);
      self.append('<iframe frameborder="0" src="javascript:false;" allowtransparency="true"></iframe>');
      var f = self.find('iframe');
      f.find('body').css({backgroundColor:'transparent'});

      console.log('java init', e.a);
    }
  };
  //$$.type.cube.engine.java = $$$;
})(jQuery);
//#endif

;(function($){ // Engines Reordering
  var c = $.pano.type.cube.engine;
  $.pano.type.cube.engine = {
    webgl: c.webgl,
    flash: c.flash,
    //java: c.java,
    canvas: c.canvas
  };
})(jQuery);
