
function mat4(){
  return new arrayType(16);
}

function mat4_set(m,
                  _11, _21, _31, _41,
                  _12, _22, _32, _42,
                  _13, _23, _33, _43,
                  _14, _24, _34, _44){
  m[ 0] = _11; m[ 4] = _21; m[ 8] = _31; m[12] = _41;
  m[ 1] = _12; m[ 5] = _22; m[ 9] = _32; m[13] = _42;
  m[ 2] = _13; m[ 6] = _23; m[10] = _33; m[14] = _43;
  m[ 3] = _14; m[ 7] = _24; m[11] = _34; m[15] = _44;
}

function mat4_copy(m, n){
  for(var i = 0; i < 16; i++){
    m[i] = n[i];
  }
}

function mat4_identity(m){
  mat4_set(
    m,
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

function mat4_mul(m, b, a){
  mat4_set(
    m,
    a[ 0] * b[ 0] + a[ 1] * b[ 4] + a[ 2] * b[ 8] + a[ 3] * b[12],
    a[ 4] * b[ 0] + a[ 5] * b[ 4] + a[ 6] * b[ 8] + a[ 7] * b[12],
    a[ 8] * b[ 0] + a[ 9] * b[ 4] + a[10] * b[ 8] + a[11] * b[12],
    a[12] * b[ 0] + a[13] * b[ 4] + a[14] * b[ 8] + a[15] * b[12],
    a[ 0] * b[ 1] + a[ 1] * b[ 5] + a[ 2] * b[ 9] + a[ 3] * b[13],
    a[ 4] * b[ 1] + a[ 5] * b[ 5] + a[ 6] * b[ 9] + a[ 7] * b[13],
    a[ 8] * b[ 1] + a[ 9] * b[ 5] + a[10] * b[ 9] + a[11] * b[13],
    a[12] * b[ 1] + a[13] * b[ 5] + a[14] * b[ 9] + a[15] * b[13],
    a[ 0] * b[ 2] + a[ 1] * b[ 6] + a[ 2] * b[10] + a[ 3] * b[14],
    a[ 4] * b[ 2] + a[ 5] * b[ 6] + a[ 6] * b[10] + a[ 7] * b[14],
    a[ 8] * b[ 2] + a[ 9] * b[ 6] + a[10] * b[10] + a[11] * b[14],
    a[12] * b[ 2] + a[13] * b[ 6] + a[14] * b[10] + a[15] * b[14],
    a[ 0] * b[ 3] + a[ 1] * b[ 7] + a[ 2] * b[11] + a[ 3] * b[15],
    a[ 4] * b[ 3] + a[ 5] * b[ 7] + a[ 6] * b[11] + a[ 7] * b[15],
    a[ 8] * b[ 3] + a[ 9] * b[ 7] + a[10] * b[11] + a[11] * b[15],
    a[12] * b[ 3] + a[13] * b[ 7] + a[14] * b[11] + a[15] * b[15]
  );
}

function mat4_translate(m, tx, ty, tz){
  mat4_set(
    m,
    1.0, 0.0, 0.0, tx,
    0.0, 1.0, 0.0, ty,
    0.0, 0.0, 1.0, tz,
    0.0, 0.0, 0.0, 1.0
  );
}

function mat4_scale(m, sx, sy, sz){
  mat4_set(
    m,
    sx,  0.0, 0.0, 0.0,
    0.0, sy,  0.0, 0.0,
    0.0, 0.0, sz,  0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

function mat4_rotate(m, x, y, z, a){
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

  mat4_set(
    m,
    1.0 - (yy + zz) * sq2, 2.0 * (xy_sq - z_sc),  2.0 * (zx_sq + y_sc),  0.0,
    2.0 * (xy_sq + z_sc),  1.0 - (xx + zz) * sq2, 2.0 * (yz_sq - x_sc),  0.0,
    2.0 * (zx_sq - y_sc),  2.0 * (yz_sq + x_sc),  1.0 - (xx + yy) * sq2, 0.0,
    0.0,                   0.0,                   0.0,                   1.0
  );
}

function mat4_frustum(m, x, X, y, Y, z, Z){
  mat4_set(
    m,
    2.0 * z / (X - x), 0.0,               (X + x) / (X - x),   0.0,
    0.0,               2.0 * z / (Y - y), (Y + y) / (Y - y),   0.0,
    0.0,               0.0,              -(Z + z) / (Z - z), -2.0 * Z * z / (Z - z),
    0.0,               0.0,              -1.0,                 0.0
  );
}

function mat4_perspective(m, fov, aspect, znear, zfar){
  fov = znear * tan(0.5 * fov);
  mat4_frustum(m, -fov * aspect, fov * aspect, -fov, fov, znear, zfar);
}

function mat4_perspective_d(m, d){
  mat4_set(
    m,
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, -1.0/d, 1.0
  );
}

function mat4_parse(m, s){
  var i = 0,
      v = s.split(/\s*,\s*/);
  for(; i < 16; m[i++] = parseFloat(v[i]));
}

function mat4_stringify(m){
  var i = 1,
      r = m[0].toFixed(10);
  for(; i < 16; r += ',' + m[i++].toFixed(10));
  return r;
}

function mat4_parse_css(m, s){
  return mat4_parse(m, s.replace(/^[^\(]*\(\s*/, '').replace(/\s*\)\s*$/));
}

function mat4_stringify_css(m){
  return 'matrix3d(' + mat4_stringify(m) + ')';
}
