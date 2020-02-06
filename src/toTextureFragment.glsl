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

const int MAX_BOUNCES = 100;
const float EPSILON = 0.0001;
const float INFINITY = 10000.0;
const float LIGHT_SIZE = 0.1;
const vec3 SPHERE_CENTER = vec3(0, -0.5, 0);
const float SPHERE_RADIUS = 0.5;
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

float shadow(vec3 origin, vec3 ray)
{
   float tSphere = intersectSphere(origin, ray, SPHERE_CENTER, SPHERE_RADIUS);
   if (tSphere < 1.0)
   {
      return 0.0;
   }
   else
   {
      return 1.0;
   }
}

vec3 calculateColor(vec3 origin, vec3 ray)
{
   vec3 accumulatedColor = vec3(0.0);
   vec3 colorMask = vec3(1.0);

   // main raytracing loop
   for (int bounce = 0; bounce < MAX_BOUNCES; bounce++)
   {
      // compute the intersection with everything
      float tSphere = intersectSphere(origin, ray, SPHERE_CENTER, SPHERE_RADIUS);
      vec3 surfaceColor = vec3(0.5, 0.5, 0.5);

      if (bounce == 0)
      {
         // if the first ray hits the light, return the light color. This
         // simulates displaying the light
         for (int i = 0; i < NUM_LIGHTS; i++)
         {
            vec3 lightPos = Lights[i].pos;
            if (intersectSphere(origin, ray, lightPos, Lights[i].size) < tSphere)
            {
               return Lights[i].intensity * Lights[i].color;
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

      if (tSphere < t)
      {
         surfaceColor = vec3(uBallColor);
         t = tSphere;
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
      else if (t == tSphere)
      {
         normal = normalForSphere(hit, SPHERE_CENTER, SPHERE_RADIUS);
      }
      else if (t == tDome)
      {
         normal = normalForSphere(hit, DOME_CENTER, DOME_RADIUS);
         // normal = -normalForSphere(hit, DOME_CENTER, DOME_RADIUS);
         normal[0] = -normal[0];
         normal[1] = -normal[1];
         normal[2] = -normal[2];
      }
      else
      {
         break;
      }

      ray = cosineWeightedDirection(uTimeSinceStart + float(bounce), normal);

      colorMask *= surfaceColor;

      if (length(colorMask) < 0.01)
      {
         break;
      }

      for (int i = 0; i < NUM_LIGHTS; i++)
      {
         float lightIntensity = Lights[i].intensity;
         vec3 lightPos = Lights[i].pos;
         vec3 lightColor = Lights[i].color;

         // compute diffuse lighting contribution
         vec3 toLight = lightPos - hit;
         float diffuse = max(0.0, dot(normalize(toLight), normal));

         // trace a shadow ray to the light
         float shadowIntensity = shadow(hit + normal * EPSILON, toLight);

         // do light bounce

         // apply light fall off as distance squares. Use a min value for the
         // light size
         float radius = max(0.75, Lights[i].size);
         float dist = max(1.0, (length(toLight) - radius) / radius);

         accumulatedColor +=
             colorMask * lightColor * (lightIntensity / (dist * dist) * diffuse * shadowIntensity);
      }

      // calculate next origin
      origin = hit;
   }

   return clamp(accumulatedColor, 0.0, 1.0);
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

   vec3 rand = uniformlyRandomVector(uTimeSinceStart - 53.0) * LIGHT_SIZE;

   Lights[0].intensity = uLightIntensity;
   Lights[0].size = LIGHT_SIZE;
   Lights[0].pos = vec3(uLightPos.x + rand.x, uLightPos.y + rand.y, uLightPos.z + rand.z);
   Lights[0].color = vec3(uLightColor.x, uLightColor.y, uLightColor.z);

   for (int i = 1; i < NUM_LIGHTS; i++)
   {
      float x = RADIUS * sin(2.0 * PI * float(i) / (float(NUM_LIGHTS) - 1.0)) + +rand.x;
      float y = HEIGHT + +rand.y;
      float z = RADIUS * cos(2.0 * PI * float(i) / (float(NUM_LIGHTS) - 1.0)) + +rand.z;

      Lights[i].intensity = uAmbientLightIntensity;
      Lights[i].size = 2.0 * LIGHT_SIZE;
      Lights[i].pos = vec3(x, y, z);
      Lights[i].color = AMBIENT_COLOR;
   }

   vec3 texture2 = texture2D(uTexture, gl_FragCoord.xy / uTextureSize).rgb;
   gl_FragColor = vec4(mix(calculateColor(uEye, initialRay), texture2, uTextureWeight), 1.0);
}