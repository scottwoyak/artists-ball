import { glVec3 } from "./glVec";
import { gl } from "./Globals";
import { glColor } from "./glColor";
import { glMat4 } from "./glMat";

/**
 * Utility class for setting uniform values in a shader
 */
export class glUniform {
   // the WebGL shader program
   private program: WebGLProgram;

   /**
    * Creates an object for setting values and calls gl.useProgram
    * 
    * @param program The program associated with the uniform values
    */
   public constructor(program: WebGLProgram) {
      this.program = program;
      gl.useProgram(program);
   }

   /**
    * Sets a uniform value
    * 
    * @param name The variable name
    * @param value The value
    * @param int If true and the value is a number, it is treated as an integer
    */
   public set(name: string, value: number | glVec3 | glColor | glMat4, int: boolean = false) {

      let loc = gl.getUniformLocation(this.program, name);
      if (loc) {
         if (value instanceof glVec3) {
            gl.uniform3fv(loc, new Float32Array(value.values));
         }
         else if (value instanceof glColor) {
            gl.uniform3fv(loc, new Float32Array([value.r, value.g, value.b]));
         }
         else if (value instanceof glMat4) {
            gl.uniformMatrix4fv(loc, false, new Float32Array(value.values));
         }
         else if (name === "uMode") {
            gl.uniform1i(loc, value);
         }
         else {
            if (int) {
               gl.uniform1i(loc, value);
            }
            else {
               gl.uniform1f(loc, value);
            }
         }
      }
   }

   /**
    * Sets an integer uniform value (same as set(name, value, true))
    * 
    * @param name The variable name
    * @param value The value
    */
   public seti(name: string, value: number) {
      this.set(name, value, true);
   }

   /**
    * Sets all values for variables stored as members of an object
    * 
    * @param uniforms The object with member values
    */
   public setAll(uniforms: any) {

      for (var name in uniforms) {
         var value = uniforms[name];
         this.set(name, value);
      }
   }
}