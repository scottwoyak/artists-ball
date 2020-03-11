/**
 * Interface for things composed of triangles
 */
export interface ITriangleObj {
   /**
    * Gets the source code to be inserted into the shader code
    */
   readonly code: string;

   /**
    * Uploads data to the shader program
    * 
    * @param program The shader program
    */
   uploadUniformBlock(program: WebGLProgram): void;
}