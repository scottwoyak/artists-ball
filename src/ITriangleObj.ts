import { IndexedTriangle } from "./IndexedTriangle";
import { Volume } from "./Volume";
import { glVec3 } from "./glVec";

/**
 * Interface for things composed of triangles
 */
export interface ITriangleObj {

   /**
    * Vertices that are specified for indices for the triangles
    */
   vertices: glVec3[];

   /**
    * Triangle created using points in the vertices array
    */
   triangles: IndexedTriangle[];

   /**
    * Volumes that subdivide the triangles into smaller groups
    */
   volumes: Volume[];

   /**
    * Uploads data to the shader program
    * 
    * @param program The shader program
    */
   uploadUniforms(program: WebGLProgram): void;
}