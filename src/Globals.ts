export let gl: WebGLRenderingContext | WebGL2RenderingContext = null;

export class Globals {
   public static get gl() {
      return gl;
   }

   public static set gl(context: WebGLRenderingContext | WebGL2RenderingContext) {
      gl = context;
   }
}
