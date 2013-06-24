HelikoPanoCube.engine(
  'webgl',
  function(){
    var ctx_names = [
      'webgl',
      'experimental-webgl',
      'webkit-3d',
      'moz-webgl',
      '3d'
    ],
        i = 0,
        canvas = doc.createElement('canvas'),
        gl = null;

    for(; i < ctx_names.length; i++){
      try{
        gl = canvas.getContext(ctx_names[i]);
      }catch(e){}
      if(gl){
        this.ctx_name = ctx_names[i];
        return true;
      }
    }
    return false;
  },
  function(){
    var ctx_name = this.ctx_name;

    function WEBGL(geom){
      var self = this,
          view = self.view = doc.createElement('canvas');

      self.geom = geom;

      view.addEventListener('webglcontextlost', function(event){
        event.preventDefault();
        self.active = false;
      }, false);

      view.addEventListener('webglcontextrestored', function(event){
        self.active = true;
        self.init();
        self.draw();
      }, false);

      view.addEventListener('webglcontextcreationerror', function(event){
        self.error = event.statusMessage;
      }, false);

      self.ctx = view.getContext(ctx_name, {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: true,
        preserveDrawingBuffer: true
      });

      self.p = mat4(); /* projection matrix */
      self.r = mat4(); /* static temporary matrix */

      self.i = new Array(6);
      self.t = new Array(6);

      self.active = true;
      self.init();

      return self;
    }

    function Shader(gl, gp, type, src){
      var s = gl.createShader(type);

      gl.shaderSource(s, src);
      gl.compileShader(s);

      if(DEBUG){
        if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
          throw new Error(gl.getShaderInfoLog(s));
        }
      }

      gl.attachShader(gp, s);
    }

    function Texture(gl, im){
      var tex = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);

      /* use mipmapping to better rendering */
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);

      /* setup wrapping to eliminate white glitches between faces */
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindTexture(gl.TEXTURE_2D, null);
      return tex;
    }

    WEBGL.prototype = {
      init: function(){
        var i,
            self = this,
            gl = self.ctx,

            vertexes = self.v = gl.createBuffer(),
            program = self.g = gl.createProgram();

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexes);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0, 0.0,
          0.0, 1.0,
          1.0, 1.0,
          1.0, 0.0
        ]), gl.STATIC_DRAW);

        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
        gl.cullFace(gl.BACK);

        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(2.0, 10.0);

        Shader(gl, program, gl.VERTEX_SHADER, '\
uniform mat4 m;\
uniform mat4 p;\
attribute vec2 v;\
varying vec2 c;\
void main(){\
c=v;\
gl_Position=p*m*vec4(v-0.5,0.0,1.0);\
}');

        Shader(gl, program, gl.FRAGMENT_SHADER, '\
precision lowp float;\
uniform lowp sampler2D t;\
varying highp vec2 c;\
void main(){\
gl_FragColor=texture2D(t,c);\
}');

        gl.linkProgram(program);

        if(DEBUG){
          if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            throw new Error(gl.getProgramInfoLog(program));
          }

          gl.validateProgram(program);

          if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
            throw new Error(gl.getProgramInfoLog(program));
          }
        }

        console.log('init');

        self.init_textures();
      },
      init_textures: function(){
        var i,
            self = this,
            gl = self.ctx,
            images = self.i,
            textures = self.t;

        for(i = 0; i < 6; i++){
          textures[i] = images[i] ? Texture(gl, images[i]) : null;
        }

        console.log('init_textures');
      },
      draw: function(){
        if(!this.active){
          return;
        }

        var i,
            self = this,
            gl = self.ctx,
            textures = self.t,
            vertexes = self.v,
            planes = self.geom,
            program = self.g;

        gl.viewport(
          0.5 * (gl.drawingBufferWidth - self.port),
          0.5 * (gl.drawingBufferHeight - self.port),
          self.port,
          self.port
        );

        if(DEBUG){
          gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.useProgram(program);

        var vertexAttr = gl.getAttribLocation(program, 'v'),
        projMatrix = gl.getUniformLocation(program, 'p'),
        planeMatrix = gl.getUniformLocation(program, 'm'),
        textureId = gl.getUniformLocation(program, 't');

        gl.enableVertexAttribArray(vertexAttr);
        gl.vertexAttribPointer(vertexAttr, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexes);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(textureId, 0);

        gl.uniformMatrix4fv(projMatrix, false, self.p);

        for(i = 0; i < 6; i++){
          gl.uniformMatrix4fv(planeMatrix, false, planes[i]);
          gl.bindTexture(gl.TEXTURE_2D, textures[i]);
          gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }

        //console.log('draw');
      },
      load: function(urls, cb, pc){
        var i,
            self = this,
            images = self.i;

        imagesLoad(urls, function(err, end, i, c, img){
          if(end){
            images[i - 1] = img;

            if(i == c){
              self.init_textures();
              self.draw();
              cb();
            }
          }else{
            pc(i, c);
          }
        });
      },
      size: function(width, height){
        var self = this,
            view = self.view;

        self.port = max(width, height);

        view.width = width;
        view.height = height;

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

    return WEBGL;
  }
);
