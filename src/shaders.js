////////////////////////////////////////////////////////////////////////////////
// shader strings
////////////////////////////////////////////////////////////////////////////////

// vertex shader for drawing a textured quad
var renderVertexSource =
' attribute vec3 vertex;\n' +
' varying vec2 texCoord;\n' +
' void main()\n' +
' {\n' +
'   texCoord = vertex.xy * 0.5 + 0.5;\n' +
'   gl_Position = vec4(vertex, 1.0);\n' +
' }\n';

// fragment shader for drawing a textured quad
var renderFragmentSource =
' precision highp float;\n' +
' varying vec2 texCoord;\n' +
' uniform sampler2D texture;\n' +
' void main()\n' +
' {\n' +
'   gl_FragColor = texture2D(texture, texCoord);\n' +
' }\n';

