precision highp float;

// interpolated values from the vertex shader
varying vec3 vNormal;
varying vec3 vVertex;

uniform float uLightIntensity;
uniform float uAmbientIntensity;
uniform vec3 uLightDirection;
uniform vec3 uColor;

uniform int uUseThresholds;
uniform float uThreshold1;
uniform float uThreshold2;
uniform float uLightLight;
uniform float uMidLight;
uniform float uDarkLight;

void main()
{
   vec3 eye = vec3(0.0, 0.0, -10.0);
   vec3 toLight = normalize(-uLightDirection);
   vec3 toEye = normalize(eye - vVertex);
   vec3 normal = normalize(vNormal); // vNormal is interpolated and no long normal

   // compute diffuse contribution = cos of angle between the vectors (dot product)
   float diffuseFactor = clamp(dot(normal, toLight), 0.0, 1.0);
   float diffuse = diffuseFactor * uLightIntensity;

   // compute specular contribution
   float shininess = 50.0;
   vec3 reflection = normalize(2.0 * dot(normal, toLight) * normal - toLight);
   float cosAngle = clamp(dot(reflection, toEye), 0.0, 1.0); // clamp to avoid values > 90 deg
   float specular = 0.2 * pow(cosAngle, shininess);

   float rgb;
   if (uUseThresholds == 0)
   {
      rgb = uAmbientIntensity + diffuse + specular;
   }
   else
   {
      float threshold = 1.0 - diffuseFactor;

      float v1 = min(uThreshold1, uThreshold2);
      float v2 = max(uThreshold1, uThreshold2);

      if (threshold < v1)
      {
         rgb = uLightLight;
      }
      else if (threshold < v2)
      {
         rgb = uMidLight;
      }
      else if (threshold < 1.0)
      {
         rgb = uDarkLight;
      }
      else
      {
         // in shadow
         rgb = uAmbientIntensity;
      }

      if (specular > 0.05)
      {
         rgb = 1.0;
      }
   }

   vec3 rgbv = vec3(rgb, rgb, rgb);
   rgbv *= uColor;
   gl_FragColor = vec4(rgbv, 1.0);
}