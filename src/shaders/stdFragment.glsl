precision highp float;
varying vec3 vNormal;
uniform float uLightIntensity;
uniform float uAmbientIntensity;
uniform float uThreshold1;
uniform float uThreshold2;
uniform float uLightLight;
uniform float uMidLight;
uniform float uDarkLight;
uniform int uAutoRender;
uniform vec3 uLightDirection;

void main()
{
   vec3 color = vec3(1.0, 1.0, 1.0);

   // dot product equals cos of angle between the vectors
   float lightness = clamp(dot(normalize(vNormal), normalize(-uLightDirection)), 0.0, 1.0);

   if (uAutoRender == 1)
   {
      lightness = uAmbientIntensity + (1.0 - uAmbientIntensity) * lightness * uLightIntensity;
   }
   else
   {
      float threshold = 1.0 - lightness;

      float v1 = min(uThreshold1, uThreshold2);
      float v2 = max(uThreshold1, uThreshold2);

      if (threshold < v1)
      {
         lightness = uLightLight;
      }
      else if (threshold < v2)
      {
         lightness = uMidLight;
      }
      else if (threshold < 1.0)
      {
         lightness = uDarkLight;
      }
      else
      {
         // in shadow
         lightness = uAmbientIntensity;
      }
   }
   gl_FragColor = vec4(color * lightness, 1.0);
}