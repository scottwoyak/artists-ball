import { glObject } from './glObject';
import { Vec3, Vec2 } from '../../Util3D/Vec';
import { IPerspectiveProvider } from './PerspectiveCtrl';
import { INITIAL_EYE } from './Renderer';
import { Mat4 } from '../../Util3D/Mat';
import { toDeg } from '../../Util/Globals';
import { glSpace } from '../../gl/glSpace';

// When viewing an object, view this much more than the object
const BUFFER_FACTOR = 1.1;

export interface ISizeProvider {
   readonly maxWidth: number;
   readonly maxHeight: number;
}

export class ObjSizeProvider implements ISizeProvider {
   private obj: glObject;

   public get maxWidth(): number {
      //let xBox = this.obj.getBoundingPts();
      const xBox = this.obj.getBoundingBox();
      return BUFFER_FACTOR * Math.sqrt(xBox.width * xBox.width + xBox.depth * xBox.depth);
   }

   public get maxHeight(): number {
      const xBox = this.obj.getBoundingBox();
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

export interface ICameraSettings {
   sizeProvider?: ISizeProvider,
   eye?: Vec3,
   lookAt?: Vec3,
   zoomFactor?: number,
   useOrthographic?: boolean,
   fov?: number,
}

export class Camera implements IPerspectiveProvider {

   public eye = new Vec3(INITIAL_EYE);
   public lookAt = Vec3.origin;
   public zoomFactor = 1;
   public useOrthographic = false;
   public fov: number;
   public sizeProvider: ISizeProvider;

   public constructor(settings?: ICameraSettings) {
      if (settings) {
         this.sizeProvider = settings.sizeProvider ?? this.sizeProvider;
         this.eye = settings.eye ?? this.eye;
         this.lookAt = settings.lookAt ?? this.lookAt;
         this.zoomFactor = settings.zoomFactor ?? this.zoomFactor;
         this.useOrthographic = settings.useOrthographic ?? this.useOrthographic;
         this.fov = settings.fov ?? this.fov;
      }
   }

   public getProjection(gl: WebGLRenderingContext): Mat4 {

      let projection: Mat4;
      let space = this.getViewSpace(gl);

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
         const eye = this.eye;
         const up = new Vec3([0, 1, 0]);
         const mat = Mat4.makeLookAt(eye, this.lookAt, up);

         this.fov = 2 * toDeg(Math.atan2(space.height / 2, eye.z));
         const near = 0.1;
         const far = 20;
         const ar = space.width / space.height;
         projection = Mat4.makePerspective(this.fov, ar, near, far).multM(mat);
      }

      return projection;
   }

   //
   // The functions below change our view of the model
   //
   public zoom(zoom: number): void {
      this.zoomFactor *= zoom;
   }

   public translate(delta: Vec2): void {
      this.eye.x -= delta.x / this.zoomFactor;
      this.eye.y -= delta.y / this.zoomFactor;
      this.lookAt.x -= delta.x / this.zoomFactor;
      this.lookAt.y -= delta.y / this.zoomFactor;
   }

   /**
    * Clipspace is defined as a range of [-1,1] in the smaller of the width and height.
    * The other dimensions is scaled to match the aspect ratio of the canvas
    */
   public getClipSpace(gl: WebGLRenderingContext): glSpace {

      const ar = gl.canvas.width / gl.canvas.height;

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
   public getViewSpace(gl: WebGLRenderingContext): glSpace {
      const winAR = gl.canvas.width / gl.canvas.height;

      const objMaxWidth = this.sizeProvider.maxWidth;
      const objMaxHeight = this.sizeProvider.maxHeight;
      const objAR = objMaxWidth / objMaxHeight;

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

      const clipSpace = this.getClipSpace(gl);
      const min = new Vec3([
         -desiredWidth / 2 - this.lookAt.x,
         -desiredHeight / 2 - this.lookAt.y,
         clipSpace.near + this.lookAt.z,
      ]);
      const max = new Vec3([
         desiredWidth / 2 - this.lookAt.x,
         desiredHeight / 2 - this.lookAt.y,
         clipSpace.far + this.lookAt.z,
      ])
      return new glSpace(min, max);
   }
}
