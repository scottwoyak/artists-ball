// no triangles
#define NUM_TRIANGLES 0

// variable declaration requires atleast one element
Triangle triangles[1];

// values that result in no intersections
vec3 boxMin = vec3(0.0, 0.0, 0.0);
vec3 boxMax = vec3(0.0, 0.0, 0.0);

Triangle getTriangle(int index) { return triangles[index]; }
