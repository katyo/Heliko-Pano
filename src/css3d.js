HelikoPanoCube.engine(
  'css3d',
  function(){
    this.transform = initStyleProp('transform', 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)');
    this.transformStyle = initStyleProp('transformStyle', 'preserve-3d');

    return null !== this.transform && null !== this.transformStyle;
  },
  function(){
    var transform = this.transform,
        transformStyle = this.transformStyle;

    function CSS3D(geom){
      var self = this,
          view = self.view = doc.createElement('div');

      self.geom = geom;

      view.setAttribute('style', 'position:relative;top:0;left:0;width:0;height:0;overflow:hidden;');

      self.m = [ /* face's matrixes */
        mat4(),
        mat4(),
        mat4(),
        mat4(),
        mat4(),
        mat4()
      ];

      self.v = mat4(); /* view matrix */

      self.p = mat4(); /* projection matrix */
      self.r = mat4(); /* static temporary matrix */
      self.l = mat4();
    }

    CSS3D.prototype = {
      load: function(urls, cb, pc){
        var i,
            self = this,
            view = self.view,
            geom = self.geom,
            mplane = self.m,
            scale;

        imagesLoad(urls, function(err, end, i, c, plane){
          if(end){
            /* increase by 0.001 to eliminate white glitches between faces */
            scale = 1.001 / max(plane.width, plane.height);

            Matrix3D(mplane[i - 1])
            .i()
            .s(scale, -scale, scale) /* invert Y */
            .m(geom[i - 1]);

            plane.setAttribute('style', 'position:absolute;'
              /*+backfaceVisibility.css+':hidden;'*/
                                      +transformStyle.css+':preserve-3d;'
            );
            view.appendChild(plane);

            if(i == c){
              self.draw();
              cb();
            }
          }else{
            pc(i, c);
          }
        });
      },
      draw: function(){
        var i,
            self = this,
            view = self.v,
            proj = self.p,
            temp = self.r,
            pmat = self.l,
            mplane = self.m,
            planes = self.view.children;

        mat4_mul(temp, proj, view);

        for(i = 0; i < planes.length; i++){
          mat4_mul(pmat, mplane[i], temp);
          planes[i].style[transform.sty] = mat4_stringify_css(pmat);
        }
      },
      size: function(width, height){
        var self = this,
            view = self.view,
            temp = self.r,
            scale = max(width, height),
            h_scale = 0.5 * scale;

        mat4_scale(self.v, h_scale, -h_scale, h_scale); /* invert Y */
        mat4_translate(temp, -h_scale - 0.5 * (scale - width), -h_scale - 0.5 * (scale - height), -scale);
        mat4_mul(self.v, self.v, temp);

        view.style.width = width + 'px';
        view.style.height = height + 'px';

        self.draw();
      },
      look: function(latitude, longitude, viewangle){
        var self = this,
            proj = self.p,
            temp = self.r;

        mat4_rotate(proj, 0.0, 1.0, 0.0, latitude);
        mat4_rotate(temp, 1.0, 0.0, 0.0, longitude);
        mat4_mul(proj, proj, temp);

        mat4_perspective(temp, viewangle, 1.0, 0.1, 10.0);
        mat4_mul(proj, proj, temp);

        self.draw();
      }
    };

    return CSS3D;
  }
);
