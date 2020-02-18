precision highp float;
varying vec2 texCoord;
uniform sampler2D uTexture;
uniform int uMode;
uniform float uMaxChroma;
uniform float uBallLightChroma;
uniform float uBallShadowChroma;
uniform float uBallLightShift;
uniform float uBallShadowShift;

uniform vec3 uHighlightColor;
uniform vec3 uLightLightColor;
uniform vec3 uMidLightColor;
uniform vec3 uDarkLightColor;

uniform vec3 uShadowColor;
uniform vec3 uReflectedLightColor;
uniform vec3 uDarkAccentColor;

uniform float uBALL_SPECULAR;
uniform float uBALL_LIGHT;
uniform float uBALL_SHADOW;

#define MODE_SCIENCE 0
#define MODE_VALUE 1
#define MODE_CHROMA 2
#define MODE_ARTIST 3
#define MODE_BANDS 4

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
   // lots of ways to convert RGB to gray scale.

   // simple averaging method
   // return (c.r + c.g + c.b) / 3.0;

   // relative perceptual values
   // return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;

   // luminosity measure
   float gamma = 2.2;
   float y = 0.2126 * pow(c.r, gamma) + 0.7152 * pow(c.g, gamma) + .0722 * pow(c.b, gamma);
   float l = 116.0 * pow(y, 1.0 / 3.0) - 16.0;
   return l / 100.0;
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
      return value2Color((texCoord.y - 0.1) / 0.9);
   }
   else
   {
      if (color.a >= uBALL_SHADOW)
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

float d2(vec3 c1, vec3 c2)
{
   // sum the squares of the differences
   return pow(c1.r - c2.r, 2.0) + pow(c1.g - c2.g, 2.0) + pow(c1.b - c2.b, 2.0);
}

vec3 closest(vec3 color, vec3 high, vec3 light, vec3 mid, vec3 dark)
{
   float dhigh = d2(color, high);
   float dlight = d2(color, light);
   float dmid = d2(color, mid);
   float ddark = d2(color, dark);

   float dmin = min(dhigh, min(dlight, min(dmid, ddark)));
   if (dmin == dhigh)
   {
      return high;
   }
   else if (dmin == dlight)
   {
      return light;
   }
   else if (dmin == dmid)
   {
      return mid;
   }
   else
   {
      return dark;
   }
}

vec4 renderAsBands()
{
   vec4 color = texture2D(uTexture, texCoord);

   // define the terminator as the point where things are 50% in shadow
   float terminator = ((uBALL_SHADOW + uBALL_LIGHT) / 2.0);
   if (color.a > 1.0 && color.a <= terminator)
   {
      vec3 c = closest(color.rgb, uShadowColor, uReflectedLightColor, uDarkAccentColor,
                       uDarkAccentColor);
      return vec4(c, 1.0);
   }
   else if (color.a > terminator)
   {
      vec3 c =
          closest(color.rgb, uHighlightColor, uLightLightColor, uMidLightColor, uDarkLightColor);
      return vec4(c, 1.0);
   }
   else
   {
      return color;
   }
}

vec4 shiftTemperature(vec4 rgb, float deg)
{
   vec4 hsv = rgb2hsv(rgb);
   hsv.x += deg / 360.0;
   return hsv2rgb(hsv);
}

vec4 renderAsArtist()
{
   vec4 color = texture2D(uTexture, texCoord);

   if (color.a >= 1.0)
   {
      float percentLight = clamp(uBALL_LIGHT - color.a, 0.0, 1.0);
      float percentShadow = 1.0 - percentLight;

      // temperature shift
      vec4 rgblight = shiftTemperature(color, -uBallLightShift);
      vec4 rgbshadow = shiftTemperature(color, -uBallShadowShift);
      vec4 rgbmix = mix(rgblight, rgbshadow, percentShadow);
      vec4 hsv = rgb2hsv(rgbmix);

      // correct overflows
      if (hsv.x > 1.0)
      {
         hsv.x -= 1.0;
      }
      else if (hsv.x < 0.0)
      {
         hsv.x += 1.0;
      }

      // chroma shift
      hsv.y *= (percentLight * uBallLightChroma + percentShadow * uBallShadowChroma);
      hsv.y = clamp(hsv.y, 0.0, 1.0);

      // adjust light/dark value to match the old value in rgb space
      float origValue = toGray(color);
      float newValue = toGray(hsv2rgb(hsv));
      for (int i = 0; i < 1000; i++)
      {
         if (abs(origValue - newValue) < 0.01)
         {
            break;
         }
         else
         {
            hsv.z += (origValue - newValue) / 10.0;
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

vec4 renderAsScience()
{
   // just return the texture
   return texture2D(uTexture, texCoord);
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
   else if (uMode == MODE_BANDS)
   {
      gl_FragColor = renderAsBands();
   }
   else
   {
      gl_FragColor = renderAsScience();
   }
}
