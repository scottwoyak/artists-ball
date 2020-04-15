attribute vec3 aVertex;
attribute vec3 aNormal;

uniform mat4 normalize;
uniform mat4 model;
uniform mat4 view;
uniform mat4 lightView;
uniform mat4 projection;

varying vec3 vObjVertex;
varying vec3 vNormal;
varying vec3 vVertex;
varying vec3 vShadowVertex;

void main()
{
   // TODO see if premultiplying these matrices helps performance
   gl_Position = projection * view * model * normalize * vec4(aVertex, 1.0);
   vObjVertex = (normalize * vec4(aVertex, 1.0)).xyz;
   vNormal = (model * normalize * vec4(aNormal, 0.0)).xyz;
   vVertex = (model * normalize * vec4(aVertex, 1.0)).xyz;
   vShadowVertex = (lightView * model * normalize * vec4(aVertex, 1.0)).xyz;
}