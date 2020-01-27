 precision highp float;
 varying vec2 texCoord;
 uniform sampler2D uTexture;

 void main()
 {
   gl_FragColor = texture2D(uTexture, texCoord);
 }
