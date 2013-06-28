(function($){
  var $W = $(window),
      defaults = {
        geom: [
          /* front */ '.t(0, 0, -0.5)',
          /* right */ '.r(0, 1, 0, -hPI).t(0, 0, -0.5)',
          /* back  */ '.r(0, 1, 0,  PI).t(0, 0, -0.5)',
          /* left  */ '.r(0, 1, 0,  hPI).t(0, 0, -0.5)',
          /* up    */ '.r(1, 0, 0,  hPI).t(0, 0, -0.5)',
          /* down  */ '.r(1, 0, 0, -hPI).t(0, 0, -0.5)'
        ],
        render: '*',
        mouse: {
          on: true,
          dragx: 1,
          dragy: 1,
          wheel: 10
        },
        touch: {
          on: true,
          dragx: 1,
          dragy: 1,
          scale: 1
        },
        range: {
          lon: [-180, 180],
          lat: [-85, 85],
          fov: [20, 120]
        },
        abs: {
          lon: 0,
          lat: 0,
          fov: 60
        },
        rel: {
          lon: 0,
          lat: 0,
          fov: 0
        }
      };

  function Ctrl($root){
    var self = this;
    self.$ = new HelikoPanoCube();
    self.$r = $root;
    self.$o = $('<div></div>').css({
      position:'absolute',
      left:0,
      top:0,
      background: 'black',
      opacity: 0.0
    });
    $root.append(self.$o);
    self._ = {};
  }

  Ctrl.prototype = {
    config: function(opts){
      var self = this,
          _ = self._,
          abs = opts.abs,
          rel = opts.rel,
          range,
          mouse,
          touch;

      $.extend(true, _, defaults, opts);

      /* coord range */
      range = _.range;
      if(!self.range || opts.range){
        self.range = {
          lon: [range.lon[0] * deg2rad, range.lon[1] * deg2rad],
          lat: [range.lat[0] * deg2rad, range.lat[1] * deg2rad],
          fov: [range.fov[0] * deg2rad, range.fov[1] * deg2rad]
        };
      }

      /* renderer */
      if(_.render != self.$.render()){
        if(self.$.render(opts.render, _.geom)){
          self.$r.prepend(self.$.node);
          if(!abs){ /* force initial orientation */
            abs = defaults.abs;
          }
        }
      }

      /* resizer */
      if('destroy' in opts){
        if(self._rh){ /* detach resize handler from window */
          $W.off('resize', self._rh);
          delete self._rh;
        }
      }
      if(!self._rh){ /* attach resize handler to window */
        $W.on('resize',
          self._rh = function(){
            self.resize();
          });
        self.resize();
      }

      /* image loader */
      if(opts.images && 6 === opts.images.length){
        self.$.load(opts.images);
      }

      /* navigator */
      if(abs){ /* absolute navigation */
        self.lookat(abs.lon, abs.lat, abs.fov, false, false);
      }
      if(rel){ /* relative navigation */
        self.lookat(rel.lon, rel.lat, rel.fov, true, false);
      }

      /* mouse handler */
      mouse = _.mouse;
      if(!mouse.on && self._md){ /* detach mouse handler when disabled */
        self.$o.off('mousedown', self._md).off('mousewheel', self._mw);
        delete self._md;
        delete self._mw;
      }
      if(mouse.on && !self._md){ /* attach mouse handler when enabled */
        self.$o.on('mousedown',
          self._md = function(event){
            var position = {
              X: event.pageX,
              Y: event.pageY
            },
                move = function(event){
                  self.lookat(
                    (event.pageX - position.X) * mouse.dragx,
                    (event.pageY - position.Y) * mouse.dragy,
                    0,
                    true, true);
                  position.X = event.pageX;
                  position.Y = event.pageY;
                  event.preventDefault();
                  return false;
                },
                release = function(){
                  $W.off('mousemove', move);
                  event.preventDefault();
                  return false;
                };
            $W.on('mousemove', move).one('mouseup', release);
            event.preventDefault();
            return false;
          }).on('mousewheel',
            self._mw = function(event, delta){
              self.lookat(
                0,
                0,
                (delta > 0 ? 1 : -1) * mouse.wheel,
                true, true);
              event.preventDefault();
              return false;
            });
      }

      touch = _.touch;
      if('touch' in opts){
        if(self._ts){
          self.$o
          .off('touchstart', self._ts);
          delete self._ts;
        }
        if(opts.touch){
          self.$o
          .on('touchstart',
            self._ts = function(e){
              var position = {
                //X:
              };
            });
        }
      }
    },
    lookat: function(lon, lat, fov, rel, scr){
      var self = this,
          range = self.range,
          look = self.$.look(),
          toangle = look[2] / self._ms;

      if(rel){
        lon = lon || 0;
        lat = lat || 0;
        fov = fov || 0;
      }else{
        lon = 'number' === typeof lon ? lon : look[0];
        lat = 'number' === typeof lat ? lat : look[1];
        fov = 'number' === typeof fov ? fov : look[2];
      }

      if(scr){ /* screen coords */
        lon *= toangle;
        lat *= toangle;
        fov *= toangle;
      }else{
        lon *= deg2rad;
        lat *= deg2rad;
        fov *= deg2rad;
      }

      if(rel){
        lon += look[0];
        lat += look[1];
        fov += look[2];
      }

      /* wrap coord */
      if(lon < range.lon[0]){
        lon += range.lon[1] - range.lon[0];
      }
      if(lon > range.lon[1]){
        lon -= range.lon[1] - range.lon[0];
      }

      if(lat < range.lat[0]){
        lat = range.lat[0];
      }
      if(lat > range.lat[1]){
        lat = range.lat[1];
      }

      if(fov < range.fov[0]){
        fov = range.fov[0];
      }
      if(fov > range.fov[1]){
        fov = range.fov[1];
      }

      //console.log(lon * rad2deg, lat * rad2deg, fov * rad2deg);

      self.$.look(lon, lat, fov);
    },
    resize: function(){
      var width = this.$r.innerWidth(),
          height = this.$r.innerHeight();
      this._ms = max(width, height);
      this.$.size(width, height);
      this.$o.css({width: width, height: height});
    }
  };

  $.fn[NAME] = function(opts){
    this.each(function(){
      var self = $(this),
          ctrl = self.data(NAME);

      if(!ctrl){ /* Initialize interface */
        self.data(NAME, ctrl = new Ctrl(self));
      }

      ctrl.config(opts);
    });
  };
})(jQuery);
