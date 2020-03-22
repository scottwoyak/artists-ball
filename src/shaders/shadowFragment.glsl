precision highp float;

// interpolated values from the vertex shader
varying vec3 vNormal;
varying vec3 vVertex;

void main() { gl_FragColor = vec4(vVertex.z); }