function vec4(){
  return new arrayType(4);
}

function vec4_set(v, x, y, z, w){
  v[0] = x;
  v[1] = y;
  v[2] = z;
  v[3] = w;
}

function mat4_mul_vec4(r, m, v){
  vec4_set(
    r,
    m[ 0] * v[0] + m[ 4] * v[1] + m[ 8] * v[2] + m[12] * v[3],
    m[ 1] * v[0] + m[ 5] * v[1] + m[ 9] * v[2] + m[13] * v[3],
    m[ 2] * v[0] + m[ 6] * v[1] + m[10] * v[2] + m[14] * v[3],
    m[ 3] * v[0] + m[ 7] * v[1] + m[11] * v[2] + m[15] * v[3]
  );
}
