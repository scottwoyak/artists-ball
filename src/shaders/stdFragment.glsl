precision highp float;
varying vec3 vNormal;
uniform float uLightIntensity;
uniform float uAmbientIntensity;
uniform float uThreshold1;
uniform float uThreshold2;
uniform float uLightLight;
uniform float uMidLight;
uniform float uDarkLight;

void main()
{
   vec3 color = vec3(1.0, 1.0, 1.0);
   vec3 sunlightDirection = vec3(1.0, -1.0, 0.5);
   float lightness = -clamp(dot(normalize(vNormal), normalize(sunlightDirection)), -1.0, 0.0);

   float v1 = min(uThreshold1, uThreshold2);
   float v2 = max(uThreshold1, uThreshold2);

   if (lightness < v1)
   {
      //      lightness = v1 / 2.0;
      lightness = uDarkLight;
   }
   else if (lightness < v2)
   {
      //      lightness = (v1 + v2) / 2.0;
      lightness = uMidLight;
   }
   else
   {
      //      lightness = (1.0 + v2) / 2.0;
      lightness = uLightLight;
   }
   lightness = uAmbientIntensity + (1.0 - uAmbientIntensity) * lightness * uLightIntensity;
   gl_FragColor = vec4(color * lightness, 1.0);
}