import { glProgram } from './glProgram';
import { Vec3 } from '../Util3D/Vec';
import { glColor3, glColor4 } from './glColor';
import { Mat4 } from '../Util3D/Mat';

/**
 * Utility class for setting uniform values in a shader
 */
export class glUniform {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;

   // the WebGL shader program
   private program: WebGLProgram;

   /**
    * Creates an object for setting values and calls gl.useProgram
    * 
    * @param glCtx The WebGL context
    * @param program The program associated with the uniform values
    */
   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      program: WebGLProgram | glProgram
   ) {
      this.gl = glCtx;
      let gl = this.gl;

      if (program instanceof glProgram) {
         program = program.get();
      }

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
   public set(
      name: string,
      value: boolean | number | Vec3 | glColor3 | glColor4 | Mat4,
      int = false
   ): void {

      const gl = this.gl;

      const loc = gl.getUniformLocation(this.program, name);
      if (loc) {
         if (value instanceof Vec3) {
            gl.uniform3fv(loc, new Float32Array(value.values));
         }
         else if (value instanceof glColor3) {
            gl.uniform3fv(loc, new Float32Array([value.r, value.g, value.b]));
         }
         else if (value instanceof glColor4) {
            gl.uniform4fv(loc, new Float32Array([value.r, value.g, value.b, value.a]));
         }
         else if (value instanceof Mat4) {
            gl.uniformMatrix4fv(loc, false, new Float32Array(value.transpose().values));
         }
         else if (typeof (value) === 'boolean') {
            gl.uniform1i(loc, value ? 1.0 : 0.0);
         }
         else if (name === 'uMode') {
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
   public seti(name: string, value: number): void {
      this.set(name, value, true);
   }

   /**
    * Sets all values for variables stored as members of an object
    * 
    * @param uniforms The object with member values
    */
   public setAll(uniforms: any): void {

      for (const name in uniforms) {
         const value = uniforms[name];
         this.set(name, value);
      }
   }
}