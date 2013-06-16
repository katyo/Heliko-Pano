#include"../src/mat4.c"

#include<stdio.h>
#include<sys/time.h>

typedef unsigned long uts_t;

uts_t uts(){
  struct timeval tv;
  gettimeofday(&tv, NULL);
  return tv.tv_sec * 1000 * 1000 + tv.tv_usec;
}

void bench(const char *t, void(*f)(), long n){
  //printf("%s result: %s\n", t, mat4_stringify(f()));
  uts_t _ = uts();
  for(long $ = 0; $ < n; $++) f();
  printf("%s mean time: %f us\n", t, (double)(uts() - _) / n);
}

void prog(){
  mat4_t r, s, m;
  mat4_rotate(r, 0.98, 0.44, 0.2, 2.1);
  mat4_scale(s, 0.54, 0.28, 0.99);
  mat4_mul(m, r, s);
}

void test(const char *type){
  bench(type, prog, 1000000);
}

int main(){
  test("C");
}
