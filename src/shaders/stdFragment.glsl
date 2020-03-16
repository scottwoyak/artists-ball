precision highp float;
varying vec3 vNormal;

void main()
{
   vec3 color = vec3(0.8, 0.8, 0.8);
   vec3 sunlightDirection = vec3(1.0, -1.0, 0.0);
   float lightness = -clamp(dot(normalize(vNormal), normalize(sunlightDirection)), -1.0, 0.0);
   float ambientLight = 0.2;
   lightness = ambientLight + (1.0 - ambientLight) * lightness;
   gl_FragColor = vec4(color * lightness, 1.0);
}