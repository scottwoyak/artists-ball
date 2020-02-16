precision highp float;
varying vec2 texCoord;
uniform sampler2D uTexture;
uniform int uMode;
uniform float uMaxChroma;
uniform float uBallLightChroma;
uniform float uBallShadowChroma;
uniform float uBallLightShift;
uniform float uBallShadowShift;

#define MODE_COLOR 0
#define MODE_VALUE 1
#define MODE_CHROMA 2
#define MODE_ARTIST 3

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

// All components are in the range [0…1], including hue.
vec4 rgb2hsv(vec4 c)
{
   vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
   vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
   vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

   float d = q.x - min(q.w, q.y);
   float e = 1.0e-10;
   return vec4(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x, c.a);
}

// All components are in the range[0…1], including hue.
vec4 hsv2rgb(vec4 c)
{
   vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
   vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
   return vec4(c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y), c.a);
}

float toGray(vec4 c)
{
   // converty to grayscale by luminosity
   // return (c.r + c.g + c.b) / 3.0;
   return clamp(0.3 * c.r + 0.59 * c.g + 0.11 * c.b, 0.0, 1.0);
}

vec4 shift(vec4 color, float deg)
{
   vec4 hsv = rgb2hsv(color);

   // adjust temperature
   hsv.x -= deg / 360.0;

   if (hsv.x > 1.0)
   {
      hsv.x -= 1.0;
   }
   else if (hsv.x < 0.0)
   {
      hsv.x += 1.0;
   }

   // adjust value to match the old value
   float origValue = toGray(color);
   float newValue = toGray(hsv2rgb(hsv));
   for (int i = 0; i < 100; i++)
   {
      if (abs(origValue - newValue) < 0.01)
      {
         break;
      }
      else
      {
         hsv.z += (origValue - newValue);
         newValue = toGray(hsv2rgb(hsv));
      }
   }

   // convert back to rgb
   return hsv2rgb(hsv);
}

vec4 renderAsValue()
{
   vec4 color = texture2D(uTexture, texCoord);
   float rgb = toGray(color);
   return vec4(rgb, rgb, rgb, 1.0);
}

vec4 renderAsChroma()
{
   vec4 color = texture2D(uTexture, texCoord);

   // render the scale as a bar on the left
   if (texCoord.x < 0.03)
   {
      return value2Color(texCoord.y);
   }
   else
   {
      if (color.a >= 2.0)
      {
         float avg = (color.r + color.g + color.b) / 3.0;
         float rgb = (abs(avg - color.r) + abs(avg - color.g) + abs(avg - color.b)) / (4.0 / 3.0);
         return value2Color(rgb / uMaxChroma);
      }
      else
      {
         return vec4(0.0, 0.0, 0.0, 1.0);
      }
   }
}

vec4 renderAsArtist()
{
   vec4 color = texture2D(uTexture, texCoord);

   // 2 = ball in light
   // 3 = ball in shadow
   if (color.a >= 1.9)
   {
      // make adjustments in hsv space
      vec4 hsv = rgb2hsv(color);

      // in shadow
      if (color.a > 2.5)
      {
         // temperature shift
         // hsv.x -= ((2.0 * (color.a - 2.5)) * uBallShadowShift) / 360.0;
         hsv.x -= uBallShadowShift / 360.0;

         // chroma adjustment
         hsv.y = clamp(hsv.y * uBallShadowChroma, 0.0, 1.0);
      }
      // in light
      else
      {
         // temperature shift
         // hsv.x += ((2.0 * (2.5 - color.a)) * uBallLightShift) / 360.0;
         hsv.x -= uBallLightShift / 360.0;

         // chroma adjustment
         hsv.y = clamp(hsv.y * uBallLightChroma, 0.0, 1.0);
      }

      if (hsv.x > 1.0)
      {
         hsv.x -= 1.0;
      }
      else if (hsv.x < 0.0)
      {
         hsv.x += 1.0;
      }

      // adjust light/dark value to match the old value in rgb space
      float origValue = toGray(color);
      float newValue = toGray(hsv2rgb(hsv));
      for (int i = 0; i < 100; i++)
      {
         if (abs(origValue - newValue) < 0.01)
         {
            break;
         }
         else
         {
            hsv.z += (origValue - newValue);
            newValue = toGray(hsv2rgb(hsv));
         }
      }

      // convert back to rgb
      return hsv2rgb(hsv);
   }
   else
   {
      return color;
   }
}

vec4 renderAsScience() { return texture2D(uTexture, texCoord); }

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
      gl_FragColor = renderAsValue();
   }
   else if (uMode == MODE_CHROMA)
   {
      gl_FragColor = renderAsChroma();
   }
   else if (uMode == MODE_ARTIST)
   {
      gl_FragColor = renderAsArtist();
   }
   else
   {
      gl_FragColor = renderAsScience();
   }
}
