attribute vec3 vertex;
uniform vec3 uEye, uRay00, uRay01, uRay10, uRay11;
varying vec3 initialRay;

void main()
{
   vec2 percent = vertex.xy * 0.5 + 0.5;
   initialRay = mix(mix(uRay00, uRay01, percent.y), mix(uRay10, uRay11, percent.y), percent.x);
   gl_Position = vec4(vertex, 1.0);
}
