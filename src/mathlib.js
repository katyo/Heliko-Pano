var MT = global.Math,
    min = MT.min,
    max = MT.max,
    pi = MT.PI,
    h_pi = 0.5 * pi,
    sin = MT.sin,
    cos = MT.cos,
    tan = MT.tan,

    arrayType = Float32Array;

function vec3(){
  return new arrayType(3);
}

function vec3_set(v, x, y, z){
  v[0] = x;
  v[1] = y;
  v[2] = z;
  return v;
}

function vec3_inv(v){
  v[0] = -v[0];
  v[1] = -v[1];
  v[2] = -v[2];
  return v;
}

function vec3_copy(v){
  return v.slice(0);
}

function vec3_add(v, w){
  v[0] += w[0];
  v[1] += w[1];
  v[2] += w[2];
  return v;
}

function vec3_sum(v, w){
  return vec3_add(vec3(), w);
}

function vec3_stringify(v){
  return join.call(v, ',');
}

function mat4(
  _11, _21, _31, _41,
  _12, _22, _32, _42,
  _13, _23, _33, _43,
  _14, _24, _34, _44
){
  var m = new arrayType(16);
  m[ 0] = _11; m[ 4] = _21; m[ 8] = _31; m[12] = _41;
  m[ 1] = _12; m[ 5] = _22; m[ 9] = _32; m[13] = _42;
  m[ 2] = _13; m[ 6] = _23; m[10] = _33; m[14] = _43;
  m[ 3] = _14; m[ 7] = _24; m[11] = _34; m[15] = _44;
  return m;
}

function mat4_copy(m){
  return m.slice(0);
}

function mat4_identity(){
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

function mat4_mul(A, B){
  return mat4(
    A[ 0] * B[ 0] + A[ 1] * B[ 4] + A[ 2] * B[ 8] + A[ 3] * B[12],
    A[ 4] * B[ 0] + A[ 5] * B[ 4] + A[ 6] * B[ 8] + A[ 7] * B[12],
    A[ 8] * B[ 0] + A[ 9] * B[ 4] + A[10] * B[ 8] + A[11] * B[12],
    A[12] * B[ 0] + A[13] * B[ 4] + A[14] * B[ 8] + A[15] * B[12],
    A[ 0] * B[ 1] + A[ 1] * B[ 5] + A[ 2] * B[ 9] + A[ 3] * B[13],
    A[ 4] * B[ 1] + A[ 5] * B[ 5] + A[ 6] * B[ 9] + A[ 7] * B[13],
    A[ 8] * B[ 1] + A[ 9] * B[ 5] + A[10] * B[ 9] + A[11] * B[13],
    A[12] * B[ 1] + A[13] * B[ 5] + A[14] * B[ 9] + A[15] * B[13],
    A[ 0] * B[ 2] + A[ 1] * B[ 5] + A[ 2] * B[10] + A[ 3] * B[14],
    A[ 4] * B[ 2] + A[ 5] * B[ 6] + A[ 6] * B[10] + A[ 7] * B[14],
    A[ 8] * B[ 2] + A[ 9] * B[ 6] + A[10] * B[10] + A[11] * B[14],
    A[12] * B[ 2] + A[13] * B[ 6] + A[14] * B[10] + A[15] * B[14],
    A[ 0] * B[ 3] + A[ 1] * B[ 7] + A[ 2] * B[11] + A[ 3] * B[15],
    A[ 4] * B[ 3] + A[ 5] * B[ 7] + A[ 6] * B[11] + A[ 7] * B[15],
    A[ 8] * B[ 3] + A[ 9] * B[ 7] + A[10] * B[11] + A[11] * B[15],
    A[12] * B[ 3] + A[13] * B[ 7] + A[14] * B[11] + A[15] * B[15]
  );
}

function mat4_translate(tx, ty, tz){
  return mat4(
    1.0, 0.0, 0.0, tx,
    0.0, 1.0, 0.0, ty,
    0.0, 0.0, 1.0, tz,
    0.0, 0.0, 0.0, 1.0
  );
}

function mat4_scale(sx, sy, sz){
  return mat4(
    sx,  0.0, 0.0, 0.0,
    0.0, sy,  0.0, 0.0,
    0.0, 0.0, sz,  0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

function mat4_rotate(x, y, z, a){
  var ha = 0.5 * a,
      sa = sin(ha),
      sc = sa * cos(ha),
      sq = sa * sa,
      sq2 = 2.0 * sq,

      xx = x * x,
      yy = y * y,
      zz = z * z,

      x_sc = x * sc,
      y_sc = y * sc,
      z_sc = z * sc,

      xy_sq = x * y,
      yz_sq = y * z,
      zx_sq = x * z;

  return mat4(
    1.0 - (yy + zz) * sq2, 2.0 * (xy_sq - z_sc),  2.0 * (zx_sq + y_sc),  0.0,
    2.0 * (xy_sq + z_sc),  1.0 - (xx + zz) * sq2, 2.0 * (yz_sq - x_sc),  0.0,
    2.0 * (zx_sq - y_sc),  2.0 * (yz_sq + x_sc),  1.0 - (xx + yy) * sq2, 0.0,
    0.0,                   0.0,                   0.0,                   1.0
  );
}

function mat4_perspective(d){
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, -1.0/d, 1.0
  );
}

function mat4_perspective4(fov, aspect, znear, zfar){
  var f = 1.0 / tan(0.5 * fov);
  return mat4(
    f / aspect, 0.0, 0.0,                             0.0,
    0.0,        f,   0.0,                             0.0,
    0.0,        0.0, (zfar + znear) / (zfar - znear), 2.0 * zfar * znear / (zfar - znear),
    0.0,        0.0, -1.0,                            0.0
  );
}

function mat4_perspective_fov(fov){
  return mat4_perspective4(fov, 1.0, 0.0001, 1000.0);
}

function mat4_parse(s){
  var i = 0,
      v = s.split(/\s*,\s*/),
      m = mat4_identity();
  for(; i < 16; m[i++] = parseFloat(v[i]));
  return m;
}

function mat4_stringify(m){
  var i = 1,
      r = m[0].toFixed(10);
  for(; i < 16; r += ',' + m[i++].toFixed(10));
  return r;
}

function mat4_parse_css(s){
  return mat4_parse(s.replace(/^[^\(]*\(\s*/, '').replace(/\s*\)\s*$/));
}

function mat4_stringify_css(m){
  return 'matrix3d(' + mat4_stringify(m) + ')';
}
