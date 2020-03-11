#version 300 es

precision highp float;
uniform vec3 uEye;
in vec3 initialRay;
uniform float uTextureWeight;
uniform float uTextureSize;
uniform float uRandom;
uniform sampler2D uTexture;
uniform vec3 uLightPos;
uniform float uLightIntensity;
uniform vec3 uLightColor;
uniform float uAmbientLightIntensity;
uniform vec3 uBallColor;
uniform float uBallRadius;
uniform float uSample;
uniform float uBALL_SPECULAR;
uniform float uBALL_LIGHT;
uniform float uBALL_SHADOW;

uniform float uBallLightShift;
uniform float uBallLightTintStrength;

uniform float uobjShadowShift;
uniform float uobjShadowTintStrength;

out vec4 fragColor;

const int MAX_BOUNCES = 10;
const float EPSILON = 0.000001;
const float INFINITY = 10000.0;
const float LIGHT_SIZE = 0.1;
#define BALL_CENTER vec3(0, uBallRadius, 0)
const vec3 DOME_CENTER = vec3(0, 0, 0);
const float DOME_RADIUS = 8.0;
const float VAL = 0.8;
const vec3 DOME_COLOR = vec3(VAL, VAL, VAL);
const vec3 FLOOR_COLOR = vec3(VAL, VAL, VAL);
const vec3 AMBIENT_COLOR = vec3(1.0, 1.0, 1.0);
const int NUM_LIGHTS = 6;
const float HEIGHT = 5.0;
const float RADIUS = 4.0;
const float PI = 3.14159265;

struct Light
{
   float intensity;
   float size;
   vec3 pos;
   vec3 color;
};

struct Triangle
{
   vec3 p0;
   vec3 p1;
   vec3 p2;
};

// The following line is replaced with code generated in JavaScript
<TRIANGLES>

    Light Lights[NUM_LIGHTS];

bool intersectBox(const vec3 origin, const vec3 ray)
{
   vec3 rayInv = 1.0 / ray;
   vec3 tbot = rayInv * (boxMin - origin);
   vec3 ttop = rayInv * (boxMax - origin);
   vec3 tmin = min(ttop, tbot);
   vec3 tmax = max(ttop, tbot);
   vec2 t = max(tmin.xx, tmin.yz);
   float t0 = max(t.x, t.y);
   t = min(tmax.xx, tmax.yz);
   float t1 = min(t.x, t.y);
   return t1 > max(t0, 0.0);
}

// Möller–Trumbore ray-triangle intersection algorithm
// source: http://bit.ly/2MxnPMG
float intersectTriangle(vec3 origin, vec3 ray, Triangle tri)
{
   vec3 edge1, edge2, h, s, q;
   float a, f, u, v;
   edge1 = tri.p1 - tri.p0;
   edge2 = tri.p2 - tri.p0;

   h = cross(ray, edge2);
   a = dot(edge1, h);
   if (abs(a) < EPSILON)
      return INFINITY;

   f = 1.0 / a;
   s = origin - tri.p0;
   u = f * dot(s, h);
   if (u < 0.0 || u > 1.0)
      return INFINITY;

   q = cross(s, edge1);
   v = f * dot(ray, q);
   if (v < 0.0 || (u + v) > 1.0)
      return INFINITY;

   // At this stage we can compute t to find out where the intersection point is on the line.
   float t = f * dot(edge2, q);
   if (t <= EPSILON) // this means that there is a line intersection but not a ray intersection.
      return INFINITY;

   return t; // ray intersection
}

vec3 normalForTriangle(vec3 origin, vec3 hit, Triangle tri)
{
   vec3 normal = cross(tri.p1 - tri.p0, tri.p2 - tri.p0);
   normal = normal / length(normal);
   if (dot(normal, origin - hit) > 0.0)
   {
      return normal;
   }
   else
   {
      return -normal;
   }
}

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

bool inShadow(vec3 origin, vec3 ray, float tLight)
{
   float tBall = intersectSphere(origin, ray, BALL_CENTER, uBallRadius);
   if (tBall < tLight)
   {
      return true;
   }

   if (intersectBox(origin, ray))
   {
      for (int i = 0; i < NUM_TRIANGLES; i++)
      {
         Triangle tri = getTriangle(i);
         if (intersectTriangle(origin, ray, tri) < tLight)
         {
            return true;
         }
      }
   }

   return false;
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

vec4 shiftTemperature(vec4 rgb, float deg, float tintStrength)
{
   vec4 hsv = rgb2hsv(rgb);
   hsv.x += deg / 360.0;
   vec4 fullTintRgb = hsv2rgb(hsv);

   return mix(rgb, fullTintRgb, tintStrength);
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
   vec4 rgblight = shiftTemperature(color, -uBallLightShift, uBallLightTintStrength);
   vec4 rgbshadow = shiftTemperature(color, -uobjShadowShift, uobjShadowTintStrength);
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
   bool objHit = false;
   bool objShadow = false;
   float specularContribution = 0.0;

   // main raytracing loop
   for (int bounce = 0; bounce < MAX_BOUNCES; bounce++)
   {
      // compute the intersection with everything
      float tBall = intersectSphere(origin, ray, BALL_CENTER, uBallRadius);
      vec3 surfaceColor = vec3(0.5, 0.5, 0.5);

      float tObj = INFINITY;
      Triangle obj;
      if (intersectBox(origin, ray))
      {
         for (int i = 0; i < NUM_TRIANGLES; i++)
         {
            Triangle tri = getTriangle(i);
            float tTri = min(tObj, intersectTriangle(origin, ray, tri));
            if (tTri < tObj)
            {
               obj = tri;
               tObj = tTri;
            }
         }
      }

      // if the first ray hits the light, return the light color. This
      // simulates displaying the light
      if (bounce == 0)
      {
         for (int i = 0; i < NUM_LIGHTS; i++)
         {
            float tLight = intersectSphere(origin, ray, Lights[i].pos, Lights[i].size);
            if (tLight < tBall && tLight < tObj)
            {
               return vec4(Lights[i].intensity * Lights[i].color, 1.0);
            }
         }
      }

      // find the closest intersection
      float tDome = intersectSphere(origin, ray, DOME_CENTER, DOME_RADIUS);
      float tFloor = INFINITY;

      // check for intersection with the ground
      if (ray.y < 0.0)
      {
         // distance to floor = num unit vectors required to reach the floor
         tFloor = -origin.y / ray.y;
      }

      // find the closest hit
      float t = min(min(tDome, tFloor), min(tBall, tObj));

      // info about hit
      vec3 hit = origin + ray * t;
      vec3 normal;

      // calculate the normal
      if (t == tFloor)
      {
         surfaceColor = FLOOR_COLOR;
         normal = vec3(0.0, 1.0, 0.0);
      }
      else if (t == tBall)
      {
         surfaceColor = vec3(uBallColor);
         normal = normalForSphere(hit, BALL_CENTER, uBallRadius);

         if (bounce == 0)
         {
            objHit = true;
         }
      }
      else if (t == tObj)
      {
         surfaceColor = uBallColor;
         normal = normalForTriangle(origin, hit, obj);

         if (bounce == 0)
         {
            objHit = true;
         }
      }
      else if (t == tDome)
      {
         surfaceColor = DOME_COLOR;
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
         vec3 toLightN = normalize(toLight);

         // trace a shadow ray to the light
         if (inShadow(hit + normal * EPSILON, toLightN, length(toLight)) == false)
         {
            // diffuse component
            float diffuse = max(0.0, dot(toLightN, normal));

            // specular component
            vec3 toEye = eye - hit;
            vec3 n2l = toLightN;
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

            if (bounce == 0 && i == 0)
            {
               specularContribution += lightIntensity * specular;
            }
         }
         else if (bounce == 0 && i == 0)
         {
            objShadow = true;
         }
      }

      // calculate next origin
      ray = cosineWeightedDirection(uRandom + float(bounce), normal);

      origin = hit;
   }

   float alpha = 1.0;
   if (objHit)
   {
      if (objShadow)
      {
         alpha = uBALL_SHADOW;
      }
      else
      {
         alpha = uBALL_LIGHT;
      }
      alpha += clamp(specularContribution, 0.0, 1.0);
   }

   vec4 scienceColor = vec4(clamp(accumulatedColor, 0.0, 1.0), alpha);
   return scienceColor;
   /*
   if (objHit)
   {
      return vec4(toArtist(scienceColor).rgb, alpha);
   }
   else
   {
      return scienceColor;
   }
   */
}

void main()
{
   /*
   float x = floor(gl_FragCoord.x);
   float y = floor(gl_FragCoord.y);
   if (mod(x, 4.0) != 0.0 || mod(y, 4.0) != 0.0)
   {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
   }
   */

   vec3 rand = uniformlyRandomVector(uRandom) * LIGHT_SIZE;

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
   vec4 textureColor = texture(uTexture, gl_FragCoord.xy / uTextureSize);
   vec4 newColor = calculateColor(uEye, initialRay);
   fragColor = mix(newColor, textureColor, uTextureWeight);
}