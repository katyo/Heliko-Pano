var MT = global.Math,
    min = MT.min,
    max = MT.max,
    pi = MT.PI,
    h_pi = 0.5 * pi,
    rad2deg = 180.0 / pi,
    deg2rad = pi / 180.0,
    sin = MT.sin,
    cos = MT.cos,
    tan = MT.tan,
    arrayType = Float32Array;

function setupGeom(src){
  return new Function('M', 'PI', 'hPI', 'return M()' + src + '.$;')(Matrix3D, pi, h_pi);
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
