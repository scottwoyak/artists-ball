precision highp float;

// interpolated values from the vertex shader
varying vec3 vNormal;
varying vec3 vVertex;
varying vec3 vShadowVertex;
varying vec3 vObjVertex;

uniform mat4 model;
uniform mat4 view;
uniform mat4 lightView;
uniform mat4 projection;
uniform vec3 uEye;
uniform bool uOrthographic;

uniform float uLightIntensity;
uniform float uAmbientIntensity;
uniform vec3 uLightDirection;

// the colors we use to represent our lightest and darkest values
uniform vec3 uWhiteColor;
uniform vec3 uBlackColor;

uniform bool uUseThresholds;
uniform float uThreshold1;
uniform float uThreshold2;
uniform float uHighlight;
uniform float uLightLight;
uniform float uMidLight;
uniform float uDarkLight;
uniform float uShadow;

uniform bool uUseShadows;
uniform sampler2D uShadowTexture;

uniform vec3 uFloorCenter;
uniform float uFloorRadius;
uniform bool uShowFloor;
uniform bool uShowContours;
uniform int uNumContours;
uniform vec3 uContourColors[9];
uniform float uContourAngles[9];
uniform bool uShowHighlights;

// For contour shading, the minimum specular contribution required to
// show something as a highlight
const float SPECULAR_THRESHOLD = 0.08;

bool in_shadow()
{
   if (uUseShadows == false)
   {
      return false;
   }

   // The vertex location rendered from the light source is almost in Normalized
   // Device Coordinates (NDC), but the perspective division has not been
   // performed yet. Perform the perspective divide. The (x,y,z) vertex location
   // components are now each in the range [-1.0,+1.0].
   // vec3 vertex_relative_to_light = v_Vertex_relative_to_light.xyz / v_Vertex_relative_to_light.w;
   vec3 vertex = vShadowVertex;

   // Convert the the values from Normalized Device Coordinates (range [-1.0,+1.0])
   // to the range [0.0,1.0]. This mapping is done by scaling
   // the values by 0.5, which gives values in the range [-0.5,+0.5] and then
   // shifting the values by +0.5.
   vertex = vertex * 0.5 + 0.5;

   // Get the z value of this fragment in relationship to the light source.
   // This value was stored in the shadow map (depth buffer of the frame buffer)
   // which was passed to the shader as a texture map.
   // vec4 textureValue = texture2D(uShadowSampler, vertex.xy);

   // The texture map contains a single depth value for each pixel. However,
   // the texture2D sampler always returns a color from a texture. For a
   // gl.DEPTH_COMPONENT texture, the color contains the depth value in
   // each of the color components. If the value was d, then the color returned
   // is (d,d,d,1). This is a "color" (depth) value between [0.0,+1.0].
   float shadowmap_distance = texture2D(uShadowTexture, vertex.xy).r;

   // Test the distance between this fragment and the light source as
   // calculated using the shadowmap transformation (vertex_relative_to_light.z) and
   // the smallest distance between the closest fragment to the light source
   // for this location, as stored in the shadowmap. When the closest
   // distance to the light source was saved in the shadowmap, some
   // precision was lost. Therefore we need a small tolerance factor to
   // compensate for the lost precision.
   float tol = 0.001;
   if (vertex.z <= shadowmap_distance + tol)
   {
      // This surface receives full light because it is the closest surface
      // to the light.
      return false;
   }
   else
   {
      // This surface is in a shadow because there is a closer surface to
      // the light source.
      return true;
   }
}

float getSpecular(vec3 normal, vec3 toLight, vec3 toEye)
{
   float specular = 0.0;

   if (uShowHighlights)
   {
      float shininess = 15.0;
      vec3 reflection = normalize(2.0 * dot(normal, toLight) * normal - toLight);
      float cosAngle = clamp(dot(reflection, toEye), 0.0, 1.0); // clamp to avoid values > 90 deg
      specular = 0.1 * pow(cosAngle, shininess);
   }

   return specular;
}

float round(float val) { return floor(val + 0.5); }

vec3 getContourColor(float vDot, vec3 normal, vec3 toLight, vec3 toEye)
{
   float specular = getSpecular(normal, toLight, toEye);
   if (specular > SPECULAR_THRESHOLD)
   {
      return vec3(1.0, 1.0, 1.0);
   }

   float angle = (180.0 / 3.1415926) * acos(vDot);
   for (int i = 0; i < 9; i++)
   {
      if (i < uNumContours)
      {
         if (angle < uContourAngles[i])
         {
            return uContourColors[i];
         }
      }
   }
}

vec4 getColor(float valForLight, float vDot, bool inShadow, vec3 normal, vec3 toLight, vec3 toEye)
{
   float a = 1.0;
   if (uShowFloor)
   {
      // gradiate out the background from half transparent to full transparency
      vec3 center = (model * vec4(uFloorCenter, 1.0)).xyz;
      float dist = length(center - vVertex);
      a = 0.5 * (1.0 - dist / uFloorRadius);
   }

   if (uShowContours && vDot >= 0.0 && inShadow == false)
   {
      return vec4(getContourColor(vDot, normal, toLight, toEye), a);
   }
   else
   {
      return vec4(mix(uBlackColor, uWhiteColor, valForLight), a);
   }
}

float getValueFromLight(vec3 normal, vec3 toLight, vec3 toEye)
{
   float vDot = dot(normal, toLight);
   float diffuseFactor = clamp(vDot, 0.0, 1.0);
   float diffuse = diffuseFactor * uLightIntensity;
   float specular = getSpecular(normal, toLight, toEye);

   float val;
   if (uUseThresholds == false)
   {
      val = uAmbientIntensity + diffuse + specular;
   }
   else
   {
      float threshold = 1.0 - diffuseFactor;

      float v1 = min(uThreshold1, uThreshold2);
      float v2 = max(uThreshold1, uThreshold2);

      if (threshold < v1)
      {
         val = uLightLight;
      }
      else if (threshold < v2)
      {
         val = uMidLight;
      }
      else if (threshold < 1.0)
      {
         val = uDarkLight;
      }
      else
      {
         val = uShadow;
      }

      if (specular > SPECULAR_THRESHOLD)
      {
         val = uHighlight;
      }
   }

   return val;
}

void main()
{
   vec3 toLight = normalize(-uLightDirection);
   bool inShadow = in_shadow();

   vec3 toEye;
   if (uOrthographic)
   {
      toEye = vec3(0.0, 0.0, 1.0);
   }
   else
   {
      toEye = normalize(uEye - vVertex);
   }

   vec3 normal = normalize(vNormal); // vNormal is interpolated and nolonger normal

   // swap normals for back facing triangles
   if (dot(normal, toEye) < 0.0)
   {
      normal = -normal;
   }

   // compute diffuse contribution = cos of angle between the vectors (dot product)
   float vDot = dot(normal, toLight);

   vec4 fragColor;
   if (inShadow)
   {
      if (uUseThresholds == false)
      {
         // when in shadow, apply slight shading as if the light
         // were coming from the eye.
         vec3 toShadowLight = vec3(0.0, 0.0, 1.0);
         float val = getValueFromLight(normal, toShadowLight, toEye) / 20.0;
         fragColor =
             getColor(uAmbientIntensity + val, vDot, inShadow, normal, toShadowLight, toEye);
      }
      else
      {
         fragColor = getColor(uShadow, vDot, inShadow, normal, toLight, toEye);
      }
      // useful for debugging - turn shadows red
      // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      // return;
   }
   else
   {
      float val = getValueFromLight(normal, toLight, toEye);
      fragColor = getColor(val, vDot, inShadow, normal, toLight, toEye);
   }

   gl_FragColor = fragColor;
}