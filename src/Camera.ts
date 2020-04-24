import { Mat4 } from "./Mat";
import { Vec3, Vec2 } from "./Vec";
import { toDeg } from "./Globals";
import { INITIAL_EYE } from "./Renderer";
import { glSpace } from "./glSpace";
import { glObject } from "./glObject";
import { IPerspectiveProvider } from "./PerspectiveCtrl";

// When viewing an object, view this much more than the object
const BUFFER_FACTOR = 1.1;

export interface ISizeProvider {
   readonly maxWidth: number;
   readonly maxHeight: number;
}

export class ObjSizeProvider implements ISizeProvider {
   private obj: glObject;

   public get maxWidth() {
      let xBox = this.obj.box;
      return BUFFER_FACTOR * Math.sqrt(xBox.width * xBox.width + xBox.depth * xBox.depth);
   }

   public get maxHeight() {
      let xBox = this.obj.tObj.box.multM(this.obj.normalize);
      return BUFFER_FACTOR * Math.sqrt(xBox.height * xBox.height + xBox.depth * xBox.depth);
   }

   public constructor(obj: glObject) {
      this.obj = obj;
   }
}

export class FixedSizeProvider implements ISizeProvider {
   public readonly maxWidth: number;
   public readonly maxHeight: number;

   public constructor(maxWidth: number, maxHeight: number) {
      this.maxWidth = maxWidth;
      this.maxHeight = maxHeight;
   }
}

export class Camera implements IPerspectiveProvider {

   protected gl: WebGLRenderingContext;
   public eye = new Vec3(INITIAL_EYE);
   public lookAt = Vec3.origin;
   public zoomFactor = 1;
   public useOrthographic = false;
   public fov: number;
   public sizeProvider: ISizeProvider;

   public get projection(): Mat4 {

      let projection: Mat4;
      let space = this.getViewSpace();

      if (this.useOrthographic) {
         projection = Mat4.makeOrtho(
            space.min.x,
            space.max.x,
            space.min.y,
            space.max.y,
            space.min.z,
            space.max.z
         );
      }
      else {
         let eye = this.eye;
         let up = new Vec3([0, 1, 0]);
         let mat = Mat4.makeLookAt(eye, this.lookAt, up);

         this.fov = 2 * toDeg(Math.atan2(space.height / 2, eye.z));
         let near = 0.1;
         let far = 20;
         let ar = space.width / space.height;
         projection = Mat4.makePerspective(this.fov, ar, near, far).multM(mat);
      }

      return projection;
   }

   public constructor(gl: WebGLRenderingContext, sizeProvider?: ISizeProvider) {
      this.gl = gl;
      this.sizeProvider = sizeProvider;
   }

   //
   // The functions below change our view of the model
   //
   public zoom(zoom: number) {
      this.zoomFactor *= zoom;
   }

   public translate(delta: Vec2) {
      this.eye.x -= delta.x / this.zoomFactor;
      this.eye.y -= delta.y / this.zoomFactor;
      this.lookAt.x -= delta.x / this.zoomFactor;
      this.lookAt.y -= delta.y / this.zoomFactor;
   }

   /**
    * Clipspace is defined as a range of [-1,1] in the smaller of the width and height.
    * The other dimensions is scaled to match the aspect ratio of the canvas
    */
   public getClipSpace(): glSpace {

      let gl = this.gl;
      let ar = gl.canvas.width / gl.canvas.height;

      if (ar > 1) {
         return new glSpace(new Vec3([-ar, -1, 100]), new Vec3([ar, 1, -100]));
      }
      else {
         return new glSpace(new Vec3([-1, -(1 / ar), 100]), new Vec3([1, (1 / ar), -100]));
      }
   }

   /**
    * View space is the world coordinate space of what can be currently viewed.
    */
   public getViewSpace(): glSpace {
      let winAR = this.gl.canvas.width / this.gl.canvas.height;

      let objMaxWidth = this.sizeProvider.maxWidth;
      let objMaxHeight = this.sizeProvider.maxHeight;
      let objAR = objMaxWidth / objMaxHeight;

      let desiredWidth;
      let desiredHeight;
      if (objAR < winAR) {
         // make the object height fit
         desiredHeight = objMaxHeight;
         desiredWidth = objMaxHeight * winAR;
      }
      else {
         // make the object width fit
         desiredHeight = objMaxWidth / winAR;
         desiredWidth = objMaxWidth;
      }
      desiredHeight /= this.zoomFactor;
      desiredWidth /= this.zoomFactor;

      let clipSpace = this.getClipSpace();
      let min = new Vec3([
         -desiredWidth / 2 - this.lookAt.x,
         -desiredHeight / 2 - this.lookAt.y,
         clipSpace.near + this.lookAt.z,
      ]);
      let max = new Vec3([
         desiredWidth / 2 - this.lookAt.x,
         desiredHeight / 2 - this.lookAt.y,
         clipSpace.far + this.lookAt.z,
      ])
      return new glSpace(min, max);
   }

}
