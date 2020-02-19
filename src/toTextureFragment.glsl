precision highp float;
uniform vec3 uEye;
varying vec3 initialRay;
uniform float uTextureWeight;
uniform float uTextureSize;
uniform float uTimeSinceStart;
uniform sampler2D uTexture;
uniform vec3 uLightPos;
uniform float uLightIntensity;
uniform vec3 uLightColor;
uniform float uAmbientLightIntensity;
uniform vec3 uBallColor;
uniform float uPass;
uniform float uNumPasses;
uniform float uSample;
uniform float uBALL_SPECULAR;
uniform float uBALL_LIGHT;
uniform float uBALL_SHADOW;
uniform float uBallLightChroma;
uniform float uBallShadowChroma;
uniform float uBallLightShift;
uniform float uBallShadowShift;

const int MAX_BOUNCES = 100;
const float EPSILON = 0.0001;
const float INFINITY = 10000.0;
const float LIGHT_SIZE = 0.1;
const vec3 BALL_CENTER = vec3(0, -0.5, 0);
const float BALL_RADIUS = 0.5;
const vec3 DOME_CENTER = vec3(0, 0, 0);
const float DOME_RADIUS = 7.0;
const float VAL = 0.8;
const vec3 DOME_COLOR = vec3(VAL, VAL, VAL);
const vec3 FLOOR_COLOR = vec3(VAL, VAL, VAL);
const vec3 AMBIENT_COLOR = vec3(1.0, 1.0, 1.0);
const int NUM_LIGHTS = 6;
const float HEIGHT = 4.0;
const float RADIUS = 4.0;
const float PI = 3.14159265;

struct Light
{
   float intensity;
   float size;
   vec3 pos;
   vec3 color;
};

Light Lights[NUM_LIGHTS];

float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius)
{
   vec3 toSphere = origin - sphereCenter;
   float a = dot(ray, ray);
   float b = 2.0 * dot(toSphere, ray);
   float c = dot(toSphere, toSphere) - sphereRadius * sphereRadius;
   float discriminant = b * b - 4.0 * a * c;
   if (discriminant > 0.0)
   {
      float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
      float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
      if (t1 > 0.0)
      {
         return t1;
      }
      else if (t2 > 0.0)
      {
         return t2;
      }
   }
   return INFINITY;
}

vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius)
{
   return (hit - sphereCenter) / sphereRadius;
}

float random(vec3 scale, float seed)
{
   return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

vec3 cosineWeightedDirection(float seed, vec3 normal)
{
   float u = random(vec3(12.9898, 78.233, 151.7182), seed);
   float v = random(vec3(63.7264, 10.873, 623.6736), seed);
   float r = sqrt(u);
   float angle = 6.283185307179586 * v;
   // compute basis from normal
   vec3 sdir, tdir;
   if (abs(normal.x) < .5)
   {
      sdir = cross(normal, vec3(1, 0, 0));
   }
   else
   {
      sdir = cross(normal, vec3(0, 1, 0));
   }
   tdir = cross(normal, sdir);
   return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1. - u) * normal;
}

vec3 uniformlyRandomDirection(float seed)
{
   float u = random(vec3(12.9898, 78.233, 151.7182), seed);
   float v = random(vec3(63.7264, 10.873, 623.6736), seed);
   float z = 1.0 - 2.0 * u;
   float r = sqrt(1.0 - z * z);
   float angle = 6.283185307179586 * v;
   return vec3(r * cos(angle), r * sin(angle), z);
}

vec3 uniformlyRandomVector(float seed)
{
   return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));
}

bool inShadow(vec3 origin, vec3 ray)
{
   float tBall = intersectSphere(origin, ray, BALL_CENTER, BALL_RADIUS);
   if (tBall < 1.0)
   {
      return true;
   }
   else
   {
      return false;
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

vec4 shiftTemperature(vec4 rgb, float deg)
{
   vec4 hsv = rgb2hsv(rgb);
   hsv.x += deg / 360.0;
   return hsv2rgb(hsv);
}

// TODO move to a common file
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

vec4 toArtist(vec4 color)
{
   float percentShadow = clamp(uBALL_LIGHT - color.a, 0.0, 1.0);
   float percentLight = 1.0 - percentShadow;

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
   return hsv2rgb(clamp(hsv, 0.0, 1.0));
}

vec4 calculateColor(vec3 origin, vec3 ray)
{
   vec3 accumulatedColor = vec3(0.0);
   vec3 colorMask = vec3(1.0);
   vec3 eye = origin;
   bool ballHit = false;
   bool ballShadow = false;

   // main raytracing loop
   for (int bounce = 0; bounce < MAX_BOUNCES; bounce++)
   {
      // compute the intersection with everything
      float tBall = intersectSphere(origin, ray, BALL_CENTER, BALL_RADIUS);
      vec3 surfaceColor = vec3(0.5, 0.5, 0.5);

      if (bounce == 0)
      {
         // if the first ray hits the light, return the light color. This
         // simulates displaying the light
         for (int i = 0; i < NUM_LIGHTS; i++)
         {
            if (intersectSphere(origin, ray, Lights[i].pos, Lights[i].size) < tBall)
            {
               return vec4(Lights[i].intensity * Lights[i].color, 1.0);
            }
         }
      }

      float tDome = intersectSphere(origin, ray, DOME_CENTER, DOME_RADIUS);

      // find the closest intersection
      float t = INFINITY;
      float tfloor = INFINITY;

      // check for intersection with the ground
      if (ray.y < 0.0)
      {
         // distance to floor = num unit vectors required to reach the floor
         tfloor = -(origin.y + 1.0) / ray.y;
         if (tfloor < t)
         {
            t = tfloor;
         }

         surfaceColor = FLOOR_COLOR;
      }

      if (tBall < t)
      {
         surfaceColor = vec3(uBallColor);
         t = tBall;

         if (bounce == 0)
         {
            ballHit = true;
         }
      }
      else if (tDome < t)
      {
         surfaceColor = DOME_COLOR;
         t = tDome;
      }

      // info about hit
      vec3 hit = origin + ray * t;
      vec3 normal;

      // calculate the normal
      if (t == tfloor)
      {
         normal = vec3(0.0, 1.0, 0.0);
      }
      else if (t == tBall)
      {
         normal = normalForSphere(hit, BALL_CENTER, BALL_RADIUS);
      }
      else if (t == tDome)
      {
         normal = -normalForSphere(hit, DOME_CENTER, DOME_RADIUS);
      }
      else
      {
         break;
      }

      colorMask *= surfaceColor;

      if (length(colorMask) < 0.01)
      {
         break;
      }

      for (int i = 0; i < NUM_LIGHTS; i++)
      {
         // compute diffuse lighting contribution
         vec3 toLight = Lights[i].pos - hit;

         // trace a shadow ray to the light
         if (inShadow(hit + normal * EPSILON, toLight) == false)
         {
            // diffuse component
            float diffuse = max(0.0, dot(normalize(toLight), normal));

            // specular component
            vec3 toEye = eye - hit;
            vec3 n2l = normalize(toLight);
            vec3 n2e = normalize(toEye);
            vec3 bisector = (n2l + n2e) / length(n2l + n2e);
            float specularCoefficient = 0.5;
            float shininess = 100.0;
            float specular = specularCoefficient * pow(max(0.0, dot(bisector, normal)), shininess);

            // apply light fall off as distance squares. Use a min value for the
            // light size otherwise falloff is too rapid
            float radius = max(0.75, Lights[i].size);
            float dist = max(1.0, (length(toLight) - radius) / radius);
            float lightIntensity = Lights[i].intensity / (dist * dist);

            accumulatedColor += colorMask * Lights[i].color * lightIntensity * diffuse;

            // TODO define a color mask for specular reflection
            //            accumulatedColor += mix(surfaceColor, Lights[i].color, 0.8) *
            //            lightIntensity * specular;
            accumulatedColor +=
                (length(surfaceColor) * Lights[i].color) * lightIntensity * specular;
         }
         else if (bounce == 0 && i == 0)
         {
            ballShadow = true;
         }
      }

      // calculate next origin
      ray = cosineWeightedDirection(uTimeSinceStart + float(bounce), normal);

      origin = hit;
   }

   float alpha = 1.0;
   if (ballHit)
   {
      if (ballShadow)
      {
         alpha = uBALL_SHADOW;
      }
      else
      {
         alpha = uBALL_LIGHT;
      }
   }

   vec4 scienceColor = vec4(clamp(accumulatedColor, 0.0, 1.0), alpha);
   if (ballHit)
   {
      return vec4(toArtist(scienceColor).rgb, alpha);
   }
   else
   {
      return scienceColor;
   }
}

void main()
{
   if (floor(mod(gl_FragCoord.x, uNumPasses)) != uPass)
   {
      if (uSample == 0.0 && uPass == 0.0)
      {
         gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
      else
      {
         gl_FragColor = texture2D(uTexture, gl_FragCoord.xy / uTextureSize);
      }
      return;
   }

   //   vec3 rand = uniformlyRandomVector(uTimeSinceStart) * LIGHT_SIZE;
   vec3 rand = uniformlyRandomVector(uSample) * LIGHT_SIZE;

   Lights[0].intensity = uLightIntensity;
   Lights[0].size = LIGHT_SIZE;
   Lights[0].pos = uLightPos + rand;
   Lights[0].color = uLightColor;

   for (int i = 1; i < NUM_LIGHTS; i++)
   {
      float x = RADIUS * sin(2.0 * PI * float(i) / (float(NUM_LIGHTS) - 1.0)) + rand.x;
      float y = HEIGHT + rand.y;
      float z = RADIUS * cos(2.0 * PI * float(i) / (float(NUM_LIGHTS) - 1.0)) + rand.z;

      Lights[i].intensity = uAmbientLightIntensity;
      Lights[i].size = 2.0 * LIGHT_SIZE;
      Lights[i].pos = vec3(x, y, z);
      Lights[i].color = AMBIENT_COLOR;
   }

   // merge the new color into the existing texture
   vec4 textureColor = texture2D(uTexture, gl_FragCoord.xy / uTextureSize);
   vec4 newColor = calculateColor(uEye, initialRay);
   gl_FragColor = mix(newColor, textureColor, uTextureWeight);
}