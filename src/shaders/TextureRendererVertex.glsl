
attribute vec2 vertex;
varying vec2 texCoord;

void main()
{
   texCoord = vertex.xy * 0.5 + 0.5;

   gl_Position = vec4(vertex.xy, 0.0, 1.0);
}
