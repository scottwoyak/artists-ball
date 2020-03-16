attribute vec3 aVertex;
attribute vec3 aNormal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

varying vec3 vNormal;

void main()
{
   gl_Position = projection * view * model * vec4(aVertex, 1.0);
   vNormal = (model * vec4(aNormal, 0.0)).xyz;
}