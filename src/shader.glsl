 precision highp float;
 uniform vec3 eye;
 varying vec3 initialRay;
 uniform float textureWeight;
 uniform float timeSinceStart;
 uniform sampler2D texture;
 uniform vec3 light;
 uniform float lightIntensity;
 uniform vec3 lightColor;
 uniform vec3 ballColor;
 uniform vec3 sphereCenter0;
 uniform float sphereRadius0;
 float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius)
 {
   vec3 toSphere = origin - sphereCenter;
   float a = dot(ray, ray);
   float b = 2.0 * dot(toSphere, ray);
   float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;
   float discriminant = b*b - 4.0*a*c;
   if(discriminant > 0.0) {
     float t = (-b - sqrt(discriminant)) / (2.0 * a);
     if(t > 0.0) return t;
   }
   return 10000.0;
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
   if (abs(normal.x)<.5) 
   {
     sdir = cross(normal, vec3(1,0,0));
   }
   else 
   {
     sdir = cross(normal, vec3(0,1,0));
   }
   tdir = cross(normal, sdir);
   return r*cos(angle)*sdir + r*sin(angle)*tdir + sqrt(1.-u)*normal;
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
   float tSphere0 = intersectSphere(origin, ray, sphereCenter0, sphereRadius0);
   if(tSphere0 < 1.0)
   {
     return 0.0;
   }
   else
   {
     return 1.0;
   }
 }

 vec3 calculateColor(vec3 origin, vec3 ray, vec3 light) 
 {
   vec3 colorMask = lightColor;
   vec3 accumulatedColor = vec3(0.0);

   // main raytracing loop
   for(int bounce = 0; bounce < 5; bounce++) 
   {

     // compute the intersection with everything
     float tSphere0 = intersectSphere(origin, ray, sphereCenter0, sphereRadius0);
     vec3 surfaceColor = vec3(0.5);

     // find the closest intersection
     float t = 10000.0;
     float tfloor = 10000.0;

     // check for intersection with the ground
     if (ray.y < 0.0)
     {
       // distance to floor = num unit vectors required to reach the floor
       tfloor = -(origin.y+1.0)/ray.y;
       if (tfloor < t )
       {
         t = tfloor;
       }
     }

     if(tSphere0 < t)
     {
       surfaceColor = vec3(ballColor);
       t = tSphere0;
     }

     // info about hit
     vec3 hit = origin + ray * t;
     float specularHighlight = 0.0;
     vec3 normal;

     // calculate the normal
     if(t == tfloor)
     {
       normal = vec3(0.0,1.0,0.0);
     }
     else if(t == tSphere0)
     {
       normal = normalForSphere(hit, sphereCenter0, sphereRadius0);
     }
     else
     {
       break;
     }

     ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);

     // compute diffuse lighting contribution
     vec3 toLight = light - hit;
     float diffuse = max(0.0, dot(normalize(toLight), normal));

     // trace a shadow ray to the light
     float shadowIntensity = shadow(hit + normal * 0.0001, toLight);

     // do light bounce
     colorMask *= surfaceColor;
     accumulatedColor += colorMask * (lightIntensity * diffuse * shadowIntensity);
     accumulatedColor += colorMask * specularHighlight * shadowIntensity;

     // calculate next origin
     origin = hit;
   }

   return accumulatedColor;
 }
 void main() 
 {
   vec3 newLight = light + uniformlyRandomVector(timeSinceStart - 53.0) * 0.1;
   vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;
   gl_FragColor = vec4(mix(calculateColor(eye, initialRay, newLight), texture, textureWeight), 1.0);
 }
