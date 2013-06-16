#include<string.h>
#include<stdlib.h>
#include<math.h>

typedef double scal_t;
typedef scal_t mat4_t[16];

#if !defined(_MAT4_SET_INLINE)
void mat4_set(mat4_t m,
              scal_t _11, scal_t _21, scal_t _31, scal_t _41,
              scal_t _12, scal_t _22, scal_t _32, scal_t _42,
              scal_t _13, scal_t _23, scal_t _33, scal_t _43,
              scal_t _14, scal_t _24, scal_t _34, scal_t _44){
  m[ 0] = _11; m[ 4] = _21; m[ 8] = _31; m[12] = _41;
  m[ 1] = _12; m[ 5] = _22; m[ 9] = _32; m[13] = _42;
  m[ 2] = _13; m[ 6] = _23; m[10] = _33; m[14] = _43;
  m[ 3] = _14; m[ 7] = _24; m[11] = _34; m[15] = _44;
}
#else
#define mat4_set(m, _11, _21, _31, _41, _12, _22, _32, _42, _13, _23, _33, _43, _14, _24, _34, _44) { \
    m[ 0] = _11; m[ 4] = _21; m[ 8] = _31; m[12] = _41;                 \
    m[ 1] = _12; m[ 5] = _22; m[ 9] = _32; m[13] = _42;                 \
    m[ 2] = _13; m[ 6] = _23; m[10] = _33; m[14] = _43;                 \
    m[ 3] = _14; m[ 7] = _24; m[11] = _34; m[15] = _44;                 \
  }
#endif

void mat4_copy(mat4_t c, mat4_t m){
  memcpy(c, m, sizeof(m));
}

void mat4_identity(mat4_t m){
  mat4_set(m,
           1.0, 0.0, 0.0, 0.0,
           0.0, 1.0, 0.0, 0.0,
           0.0, 0.0, 1.0, 0.0,
           0.0, 0.0, 0.0, 1.0);
}

void mat4_mul(mat4_t m, mat4_t a, mat4_t b){
  mat4_set(m,
           a[ 0] * b[ 0] + a[ 1] * b[ 4] + a[ 2] * b[ 8] + a[ 3] * b[12],
           a[ 4] * b[ 0] + a[ 5] * b[ 4] + a[ 6] * b[ 8] + a[ 7] * b[12],
           a[ 8] * b[ 0] + a[ 9] * b[ 4] + a[10] * b[ 8] + a[11] * b[12],
           a[12] * b[ 0] + a[13] * b[ 4] + a[14] * b[ 8] + a[15] * b[12],
           a[ 0] * b[ 1] + a[ 1] * b[ 5] + a[ 2] * b[ 9] + a[ 3] * b[13],
           a[ 4] * b[ 1] + a[ 5] * b[ 5] + a[ 6] * b[ 9] + a[ 7] * b[13],
           a[ 8] * b[ 1] + a[ 9] * b[ 5] + a[10] * b[ 9] + a[11] * b[13],
           a[12] * b[ 1] + a[13] * b[ 5] + a[14] * b[ 9] + a[15] * b[13],
           a[ 0] * b[ 2] + a[ 1] * b[ 5] + a[ 2] * b[10] + a[ 3] * b[14],
           a[ 4] * b[ 2] + a[ 5] * b[ 6] + a[ 6] * b[10] + a[ 7] * b[14],
           a[ 8] * b[ 2] + a[ 9] * b[ 6] + a[10] * b[10] + a[11] * b[14],
           a[12] * b[ 2] + a[13] * b[ 6] + a[14] * b[10] + a[15] * b[14],
           a[ 0] * b[ 3] + a[ 1] * b[ 7] + a[ 2] * b[11] + a[ 3] * b[15],
           a[ 4] * b[ 3] + a[ 5] * b[ 7] + a[ 6] * b[11] + a[ 7] * b[15],
           a[ 8] * b[ 3] + a[ 9] * b[ 7] + a[10] * b[11] + a[11] * b[15],
           a[12] * b[ 3] + a[13] * b[ 7] + a[14] * b[11] + a[15] * b[15]);
}

void mat4_translate(mat4_t m, scal_t tx, scal_t ty, scal_t tz){
  mat4_set(m,
           1.0, 0.0, 0.0, tx,
           0.0, 1.0, 0.0, ty,
           0.0, 0.0, 1.0, tz,
           0.0, 0.0, 0.0, 1.0);
}

void mat4_scale(mat4_t m, scal_t sx, scal_t sy, scal_t sz){
  mat4_set(m,
           sx,  0.0, 0.0, 0.0,
           0.0, sy,  0.0, 0.0,
           0.0, 0.0, sz,  0.0,
           0.0, 0.0, 0.0, 1.0);
}

void mat4_rotate(mat4_t m, scal_t x, scal_t y, scal_t z, scal_t a){
  scal_t
    ha = 0.5 * a,
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
  
  mat4_set(m,
           1.0 - (yy + zz) * sq2, 2.0 * (xy_sq - z_sc),  2.0 * (zx_sq + y_sc),  0.0,
           2.0 * (xy_sq + z_sc),  1.0 - (xx + zz) * sq2, 2.0 * (yz_sq - x_sc),  0.0,
           2.0 * (zx_sq - y_sc),  2.0 * (yz_sq + x_sc),  1.0 - (xx + yy) * sq2, 0.0,
           0.0,                   0.0,                   0.0,                   1.0);
}

void mat4_perspective(mat4_t m, scal_t d){
  mat4_set(m,
           1.0, 0.0, 0.0, 0.0,
           0.0, 1.0, 0.0, 0.0,
           0.0, 0.0, 1.0, 0.0,
           0.0, 0.0, -1.0/d, 1.0);
}

void mat4_perspective4(mat4_t m, scal_t fov, scal_t aspect, scal_t znear, scal_t zfar){
  scal_t f = 1.0 / tan(0.5 * fov);
  mat4_set(m,
           f / aspect, 0.0, 0.0,                             0.0,
           0.0,        f,   0.0,                             0.0,
           0.0,        0.0, (zfar + znear) / (zfar - znear), 2.0 * zfar * znear / (zfar - znear),
           0.0,        0.0, -1.0,                            0.0);
}

void mat4_perspective_fov(mat4_t m, scal_t fov){
  mat4_perspective4(m, fov, 1.0, 0.0001, 1000.0);
}
