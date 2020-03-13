<VERSION>

#define NOTHING
#ifdef USE_TRIANGLES
#define WEBGL2
#endif

precision highp float;
uniform vec3 uEye, uRay00, uRay01, uRay10, uRay11;

#ifdef WEBGL2
in vec3 vertex;
out vec3 initialRay;
#else
attribute vec3 vertex;
varying vec3 initialRay;
#endif 

void main()
{
   vec2 percent = vertex.xy * 0.5 + 0.5;
   initialRay = mix(mix(uRay00, uRay01, percent.y), mix(uRay10, uRay11, percent.y), percent.x);
   gl_Position = vec4(vertex, 1.0);
}
