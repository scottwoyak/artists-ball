attribute vec3 vertex;
varying vec2 texCoord;
uniform float uScale;
uniform float uXOffset;
uniform float uYOffset;

void main()
{
   texCoord = vertex.xy * 0.5 + 0.5;

   gl_Position = vec4(uScale * vertex.x + uXOffset, uScale * vertex.y + uYOffset, 0.0, 1.0);
}
