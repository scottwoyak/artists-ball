precision highp float;
varying vec2 texCoord;
uniform sampler2D uTexture;
uniform int uMode;
uniform float uMaxChroma;

#define MODE_COLOR 0
#define MODE_VALUE 1
#define MODE_CHROMA 2

vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
vec4 orange = vec4(1.0, 0.65, 0.0, 1.0);
vec4 yellow = vec4(1.0, 1.0, 0.0, 1.0);
vec4 green = vec4(0.0, 1.0, 0.0, 1.0);
vec4 cyan = vec4(0.0, 1.0, 1.0, 1.0);
vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);
vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
#define NUM_COLORS 6
vec4 colors[NUM_COLORS];

vec4 value2Color(float value)
{
   float span = 1.0 / float(NUM_COLORS - 1);
   value *= float(NUM_COLORS - 1);
   if (value < 0.0)
   {
      return colors[0];
   }
   else if (value < 1.0)
   {
      return colors[0] + value * (colors[1] - colors[0]);
   }
   else if (value < 2.0)
   {
      return colors[1] + (value - 1.0) * (colors[2] - colors[1]);
   }
   else if (value < 3.0)
   {
      return colors[2] + (value - 2.0) * (colors[3] - colors[2]);
   }
   else if (value < 4.0)
   {
      return colors[3] + (value - 3.0) * (colors[4] - colors[3]);
   }
   else if (value < 5.0)
   {
      return colors[4] + (value - 4.0) * (colors[5] - colors[4]);
   }
   /*
   else if (value < 6.0)
   {
      return colors[5] + (value - 5.0) * (colors[6] - colors[5]);
   }
   */
   else
   {
      return colors[NUM_COLORS - 1];
   }
}

void main()
{
   colors[0] = black;
   colors[1] = blue;
   colors[2] = green;
   colors[3] = yellow;
   colors[4] = orange;
   colors[5] = red;

   if (uMode == MODE_VALUE)
   {
      vec4 color = texture2D(uTexture, texCoord);
      //      float rgb = 0.3 * color.x + 0.59 * color.y + 0.11 * color.z;
      float rgb = clamp((color.r + color.g + color.b) / 3.0, 0.0, 1.0);
      gl_FragColor = vec4(rgb, rgb, rgb, 1.0);
   }
   else if (uMode == MODE_CHROMA)
   {
      if (texCoord.x < 0.03)
      {
         gl_FragColor = value2Color(texCoord.y);
      }
      else
      {
         vec4 color = texture2D(uTexture, texCoord);
         float avg = (color.r + color.g + color.b) / 3.0;
         float rgb = (abs(avg - color.r) + abs(avg - color.g) + abs(avg - color.b)) / (4.0 / 3.0);
         gl_FragColor = value2Color(rgb / uMaxChroma);
      }
   }
   else
   {
      gl_FragColor = texture2D(uTexture, texCoord);
   }
}
