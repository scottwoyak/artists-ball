precision highp float;

// interpolated values from the vertex shader
varying vec3 vNormal;
varying vec3 vVertex;
varying vec3 vShadowVertex;

uniform float uLightIntensity;
uniform float uAmbientIntensity;
uniform vec3 uLightDirection;

// the colors we use to represent our lightest and darkest values
uniform vec3 uWhiteColor;
uniform vec3 uBlackColor;

uniform int uUseThresholds;
uniform float uThreshold1;
uniform float uThreshold2;
uniform float uHighlight;
uniform float uLightLight;
uniform float uMidLight;
uniform float uDarkLight;
uniform float uShadow;

uniform int uUseShadows;
uniform sampler2D uShadowTexture;

bool in_shadow(void)
{
   if (uUseShadows == 0)
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

vec4 getColor(float val)
{
   vec3 rgb = mix(uBlackColor, uWhiteColor, val);
   return vec4(rgb.r, rgb.g, rgb.b, 1.0);
}

void main()
{
   if (in_shadow())
   {
      if (uUseThresholds == 0)
      {
         gl_FragColor = getColor(uAmbientIntensity);
      }
      else
      {
         gl_FragColor = getColor(uShadow);
      }
      return;
   }

   vec3 eye = vec3(0.0, 0.0, -10.0);
   vec3 toLight = normalize(-uLightDirection);
   vec3 toEye = normalize(eye - vVertex);
   vec3 normal = normalize(vNormal); // vNormal is interpolated and no long normal

   // swap normals for back facing triangles
   if (dot(normal, toEye) < 0.0)
   {
      normal = -normal;
   }

   // compute diffuse contribution = cos of angle between the vectors (dot product)
   float diffuseFactor = clamp(dot(normal, toLight), 0.0, 1.0);
   float diffuse = diffuseFactor * uLightIntensity;

   // compute specular contribution
   float shininess = 15.0;
   vec3 reflection = normalize(2.0 * dot(normal, toLight) * normal - toLight);
   float cosAngle = clamp(dot(reflection, toEye), 0.0, 1.0); // clamp to avoid values > 90 deg
   float specular = 0.1 * pow(cosAngle, shininess);

   float val;
   if (uUseThresholds == 0)
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

      if (specular > 0.05)
      {
         val = uHighlight;
      }
   }

   gl_FragColor = getColor(val);
}