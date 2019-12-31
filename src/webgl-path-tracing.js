/*
 WebGL Path Tracing (http://madebyevan.com/webgl-path-tracing/)
 License: MIT License (see below)

 Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/


// constants for the shaders
var bounces = '5';
var epsilon = '0.0001';
var infinity = '10000.0';
var lightSize = 0.1;

// vertex shader, interpolate ray per-pixel
var tracerVertexSource =
   ' attribute vec3 vertex;\n' +
   ' uniform vec3 eye, ray00, ray01, ray10, ray11;\n' +
   ' varying vec3 initialRay;\n' +
   ' void main()\n' +
   ' {\n' +
   '   vec2 percent = vertex.xy * 0.5 + 0.5;\n' +
   '   initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);\n' +
   '   gl_Position = vec4(vertex, 1.0);\n' +
   ' }\n';

// start of fragment shader
var tracerFragmentSourceHeader =
   ' precision highp float;\n' +
   ' uniform vec3 eye;\n' +
   ' varying vec3 initialRay;\n' +
   ' uniform float textureWeight;\n' +
   ' uniform float timeSinceStart;\n' +
   ' uniform sampler2D texture;\n' +
   ' uniform vec3 light;\n' +
   ' uniform float lightIntensity;\n' +
   ' uniform vec3 sphereCenter0;\n' +
   ' uniform float sphereRadius0;\n';

// compute the near intersection of a sphere
// no intersection returns a value of +infinity
var intersectSphereSource =
   ' float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius)\n' +
   ' {\n' +
   '   vec3 toSphere = origin - sphereCenter;\n' +
   '   float a = dot(ray, ray);\n' +
   '   float b = 2.0 * dot(toSphere, ray);\n' +
   '   float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;\n' +
   '   float discriminant = b*b - 4.0*a*c;\n' +
   '   if(discriminant > 0.0) {\n' +
   '     float t = (-b - sqrt(discriminant)) / (2.0 * a);\n' +
   '     if(t > 0.0) return t;\n' +
   '   }\n' +
   '   return ' + infinity + ';\n' +
   ' }\n\n';

// given that hit is a point on the sphere, what is the surface normal?
var normalForSphereSource =
   ' vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) \n' +
   ' {\n' +
   '   return (hit - sphereCenter) / sphereRadius;\n' +
   ' }\n\n';

// use the fragment position for randomness
var randomSource =
   ' float random(vec3 scale, float seed) \n' +
   ' {\n' +
   '   return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n' +
   ' }\n\n';

// random cosine-weighted distributed vector
// from http://www.rorydriscoll.com/2009/01/07/better-sampling/
var cosineWeightedDirectionSource =
   ' vec3 cosineWeightedDirection(float seed, vec3 normal) \n' +
   ' {\n' +
   '   float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n' +
   '   float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n' +
   '   float r = sqrt(u);\n' +
   '   float angle = 6.283185307179586 * v;\n' +
   '   // compute basis from normal\n' +
   '   vec3 sdir, tdir;\n' +
   '   if (abs(normal.x)<.5) \n' +
   '   {\n' +
   '     sdir = cross(normal, vec3(1,0,0));\n' +
   '   }\n' +
   '   else \n' +
   '   {\n' +
   '     sdir = cross(normal, vec3(0,1,0));\n' +
   '   }\n' +
   '   tdir = cross(normal, sdir);\n' +
   '   return r*cos(angle)*sdir + r*sin(angle)*tdir + sqrt(1.-u)*normal;\n' +
   ' }\n\n';

// random normalized vector
var uniformlyRandomDirectionSource =
   ' vec3 uniformlyRandomDirection(float seed) \n' +
   ' {\n' +
   '   float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n' +
   '   float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n' +
   '   float z = 1.0 - 2.0 * u;\n' +
   '   float r = sqrt(1.0 - z * z);\n' +
   '   float angle = 6.283185307179586 * v;\n' +
   '   return vec3(r * cos(angle), r * sin(angle), z);\n' +
   ' }\n\n';

// random vector in the unit sphere
// note: this is probably not statistically uniform, saw raising to 1/3 power somewhere but that looks wrong?
var uniformlyRandomVectorSource =
   ' vec3 uniformlyRandomVector(float seed) \n' +
   ' {\n' +
   '   return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));\n' +
   ' }\n\n';

// compute specular lighting contribution
var specularReflection =
   ' vec3 reflectedLight = normalize(reflect(light - hit, normal));\n' +
   ' specularHighlight = max(0.0, dot(reflectedLight, normalize(hit - origin)));\n';

// update ray using normal and bounce according to a diffuse reflection
var newDiffuseRay =
   '       ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);\n';

// update ray using normal according to a specular reflection
var newReflectiveRay =
   '       ray = reflect(ray, normal);\n' +
   specularReflection +
   '     specularHighlight = 2.0 * pow(specularHighlight, 20.0);\n';

// update ray using normal and bounce according to a glossy reflection
var newGlossyRay =
   '       ray = normalize(reflect(ray, normal)) + uniformlyRandomVector(timeSinceStart + float(bounce)) * glossiness;\n' +
   specularReflection +
   '     specularHighlight = pow(specularHighlight, 3.0);\n';

function makeShadow(objects) {
   return '' +
      ' float shadow(vec3 origin, vec3 ray) \n' +
      ' {\n' +
      '   float tSphere0 = intersectSphere(origin, ray, sphereCenter0, sphereRadius0);\n' +
      '   if(tSphere0 < 1.0)\n' +
      '   {\n' +
      '     return 0.0;\n' +
      '   }\n' +
      '   else\n' +
      '   {\n' +
      '     return 1.0;\n' +
      '   }\n' +
      ' }\n\n';
}

function makeCalculateColor(objects) {
   return '' +
         ' vec3 calculateColor(vec3 origin, vec3 ray, vec3 light) \n' +
      ' {\n' +
         '   vec3 colorMask = vec3(1.0);\n' +
      '   vec3 accumulatedColor = vec3(0.0);\n' +
      '\n' +
      '   // main raytracing loop\n' +
      '   for(int bounce = 0; bounce < ' + bounces + '; bounce++) \n' +
      '   {\n' +
      '\n' +
      '     // compute the intersection with everything\n' +
      '     float tSphere0 = intersectSphere(origin, ray, sphereCenter0, sphereRadius0);\n' +
      '     vec3 surfaceColor = vec3(0.5);\n' + // SAW material color
      '\n' +
      '     // find the closest intersection\n' +
      '     float t = ' + infinity + ';\n' +
      '     float tfloor = ' + infinity + ';\n' +
      '\n' +
      '     // check for intersection with the ground\n' +
      '     if (ray.y < 0.0)\n' +
      '     {\n' +
      '       // distance to floor = num unit vectors required to reach the floor\n' +
      '       tfloor = -(origin.y+1.0)/ray.y;\n' +
      '       if (tfloor < t )\n' +
      '       {\n' +
      '         t = tfloor;\n' +
      '       }\n' +
      '     }\n' +
      '\n' + 
      '     if(tSphere0 < t)\n' +
      '     {\n' +
      '       surfaceColor = vec3(0.5, 0.5, 0.8);\n' +
      '       t = tSphere0;\n' +
      '     }\n' +
      '\n' + 
      '     // info about hit\n' +
      '     vec3 hit = origin + ray * t;\n' +
      '     float specularHighlight = 0.0;\n' +
      '     vec3 normal;\n' +
      '\n' +
      '     // calculate the normal\n' +
      '     if(t == tfloor)\n' +
      '     {\n' +
      '       normal = vec3(0.0,1.0,0.0);\n' +
      '     }\n' +      
      '     else if(t == tSphere0)\n' +
      '     {\n' +
      '       normal = normalForSphere(hit, sphereCenter0, sphereRadius0);\n' +
      '     }\n' +
      '     else\n' +
      '     {\n' +
      '       break;\n' +
      '     }\n' +
      '\n' +
      '     ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);\n' +
      '\n' +
      '     // compute diffuse lighting contribution\n' +
      '     vec3 toLight = light - hit;\n' +
      '     float diffuse = max(0.0, dot(normalize(toLight), normal));\n' +
      '\n' +
      '     // trace a shadow ray to the light\n' +
      '     float shadowIntensity = shadow(hit + normal * ' + epsilon + ', toLight);\n' +
      '\n' +
      '     // do light bounce\n' +
      '     colorMask *= surfaceColor;\n' +
      '     accumulatedColor += colorMask * (lightIntensity * diffuse * shadowIntensity);\n' +
      '     accumulatedColor += colorMask * specularHighlight * shadowIntensity;\n' +
      '\n' +
      '     // calculate next origin\n' +
      '     origin = hit;\n' +
      '   }\n' +
      '\n' +
      '   return accumulatedColor;\n' +
      ' }\n';
}

function makeMain() {
   return '' +
      ' void main() \n' +
      ' {\n' +
      '   vec3 newLight = light + uniformlyRandomVector(timeSinceStart - 53.0) * ' + lightSize + ';\n' +
      '   vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;\n' +
      '   gl_FragColor = vec4(mix(calculateColor(eye, initialRay, newLight), texture, textureWeight), 1.0);\n' +
      ' }\n';
}

function makeTracerFragmentSource(objects) {
   return tracerFragmentSourceHeader +
      intersectSphereSource +
      normalForSphereSource +
      randomSource +
      cosineWeightedDirectionSource +
      uniformlyRandomDirectionSource +
      uniformlyRandomVectorSource +
      makeShadow(objects) +
      makeCalculateColor(objects) +
      makeMain();
}

////////////////////////////////////////////////////////////////////////////////
// utility functions
////////////////////////////////////////////////////////////////////////////////

function getEyeRay(matrix, x, y) {
   return matrix.multiply(Vector.create([x, y, 0, 1])).divideByW().ensure3().subtract(eye);
}

function setUniforms(program, uniforms) {
   for (var name in uniforms) {
      var value = uniforms[name];
      var location = gl.getUniformLocation(program, name);
      if (location == null) continue;
      if (value instanceof Vector) {
         gl.uniform3fv(location, new Float32Array([value.elements[0], value.elements[1], value.elements[2]]));
      } else if (value instanceof Matrix) {
         gl.uniformMatrix4fv(location, false, new Float32Array(value.flatten()));
      } else {
         gl.uniform1f(location, value);
      }
   }
}

function compileSource(source, type) {
   console.log('-----------------------------------------------------------------------------');
   console.log(source);
   console.log('-----------------------------------------------------------------------------');

   var shader = gl.createShader(type);
   gl.shaderSource(shader, source);
   gl.compileShader(shader);
   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw 'compile error: ' + gl.getShaderInfoLog(shader);
   }
   return shader;
}

function compileShader(vertexSource, fragmentSource) {
   var shaderProgram = gl.createProgram();
   gl.attachShader(shaderProgram, compileSource(vertexSource, gl.VERTEX_SHADER));
   gl.attachShader(shaderProgram, compileSource(fragmentSource, gl.FRAGMENT_SHADER));
   gl.linkProgram(shaderProgram);
   if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw 'link error: ' + gl.getProgramInfoLog(shaderProgram);
   }
   return shaderProgram;
}
