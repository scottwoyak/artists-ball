
attribute vec3 aVertex;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

varying vec3 vVertex;

void main()
{
   gl_Position = projection * view * model * vec4(aVertex, 1.0);
   vVertex = (model * vec4(aVertex, 1.0)).xyz;
}

/*
// Vertex shader
// Scene transformations
uniform mat4 u_PVM_transform;       // Projection, view, model transform
uniform mat4 u_Shadowmap_transform; // The transform used to render the shadow map

// Original model data
attribute vec3 a_Vertex;

// Data (to be interpolated) that is passed on to the fragment shader
varying vec4 v_Vertex_relative_to_light;

void main()
{

   // Calculate this vertex's location from the light source. This is
   // used in the fragment shader to determine if fragments receive direct light.
   v_Vertex_relative_to_light = u_Shadowmap_transform * vec4(a_Vertex, 1.0);

   // Transform the location of the vertex for the rest of the graphics pipeline.
   gl_Position = u_PVM_transform * vec4(a_Vertex, 1.0);
}
*/