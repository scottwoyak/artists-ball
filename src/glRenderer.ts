import { glMat4 } from './glMat';
import { glVec3 } from './glVec';
import vertexSource from './shaders/stdVertex.glsl';
import fragmentSource from './shaders/stdFragment.glsl';
import { gl, clamp, mix, toRad, toDeg } from './Globals';
import { TriangleObjFile } from './TriangleObjFile';
import { TriangleCube } from './TriangleCube';
import { TriangleSphere } from './TriangleSphere';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { TriangleObj } from './TriangleObj';
import { glStdObject } from './glStdObject';

export enum LightValues {
   LightLight,
   MidLight,
   DarkLight
}

/**
 * Class that renders triangles and a light source
 */
export class glRenderer {

   private program: WebGLProgram;
   private view = new glMat4();
   private projection = new glMat4();

   public lightIntensity = 0.8;
   public ambientIntensity = 0.2;
   public threshold1 = 15;
   public threshold2 = 55;

   public lightLight: number;
   public midLight: number;
   public darkLight: number;

   // size of the smaller view
   private readonly miniSize = 0.3;

   private autoRender = 0;

   private ball: glStdObject;
   private obj: glStdObject;

   public constructor() {
      this.syncColors();
   }

   public rotX(angle: number) {
      this.obj.rotX(angle);
   }
   public rotY(angle: number) {
      this.obj.rotY(angle);
   }
   public rotZ(angle: number) {
      this.obj.rotZ(angle);
   }
   public scale(scale: number) {
      this.obj.scale(scale);
   }
   public translate(offset: glVec3) {
      this.obj.translate(offset);
   }

   public colorAt(deg: number): number {
      deg = clamp(deg, 0, 90);
      return mix(this.ambientIntensity, this.lightIntensity, Math.cos(toRad(deg)));
   }

   public thresholdAt(color: number): number {
      color = clamp(color, this.ambientIntensity, this.lightIntensity);
      let val = (color - this.ambientIntensity) / (this.lightIntensity - this.ambientIntensity);
      return toDeg(Math.acos(val));
   }

   public syncColors() {
      this.lightLight = this.colorAt(0.5 * this.threshold1);
      this.midLight = this.colorAt((this.threshold1 + this.threshold2) / 2);
      this.darkLight = this.colorAt((this.threshold2 + 90) / 2);
   }

   public syncThresholds(change: LightValues) {
      switch (change) {
         case LightValues.LightLight:
            this.threshold1 = (1 / 0.5) * (this.thresholdAt(this.lightLight));
            this.threshold2 = 2 * this.thresholdAt(this.midLight) - this.threshold1;
            break;

         case LightValues.MidLight:
            let range = this.threshold2 - this.threshold1
            this.threshold1 = this.thresholdAt(this.midLight) - range / 2;
            this.threshold2 = this.thresholdAt(this.midLight) + range / 2;
            break;

         case LightValues.DarkLight:
            this.threshold2 = 2 * this.thresholdAt(this.darkLight) - 90;
            this.threshold1 = 2 * this.thresholdAt(this.midLight) - this.threshold2;
            break;
      }
   }

   public create(query: string): Promise<void> {

      gl.enable(gl.DEPTH_TEST);

      // create shaders
      this.program = glCompiler.compile(vertexSource, fragmentSource);

      let tBall = new TriangleSphere();
      tBall.createNow(500, 0.5, new glVec3([0, 0, 0]));
      this.ball = new glStdObject(tBall, this.program);

      if (query && query.toLowerCase() === 'trianglesphere') {
         let radius = 0.75;
         let center = new glVec3([0, 0, 0]);
         let tObj = new TriangleSphere();
         return tObj.create(500, radius, center).then(() => {
            this.obj = new glStdObject(tObj, this.program);
         });
      }
      else if (query && query.toLowerCase() === 'trianglecube') {
         let size = 0.8;
         let center = new glVec3([0, size / 2.0, 0]);
         let tObj = new TriangleCube();
         return tObj.create(size, center).then(() => {
            this.obj = new glStdObject(tObj, this.program);
         });
      }
      else if (query && query.toLowerCase().endsWith('.obj')) {
         let tObj = new TriangleObjFile();
         return tObj.create(query).then(() => {
            this.obj = new glStdObject(tObj, this.program);
            this.orient(tObj, query);
         });
      }
      else {
         return Promise.resolve();
      }
   }

   public orient(tObj: TriangleObj, query: string) {

      let center = tObj.center;
      this.obj.translate(new glVec3([-center.x, -center.y, -center.z]));
      this.obj.scale(1.75 / Math.max(tObj.width, tObj.height, tObj.depth));

      // orient each file so that it is facing forward
      switch (query.toLowerCase()) {
         case 'skull.obj':
            this.obj.rotX(toRad(90));
            this.obj.rotY(toRad(180));
            break;

         case 'femalehead.obj':
            this.obj.rotY(toRad(180));
            break;
      }
   }

   public render(): void {

      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // size of the actual canvas. The texture we create is drawn to this item
      let size = document.body.clientWidth;

      if (isMobile === false) {
         // not sure why, but this basically becomes full width on my phone
         size = 512;
      }

      gl.canvas.width = size;
      gl.canvas.height = size;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(this.program);

      gl.clearColor(0.5, 0.5, 0.5, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      this.view = new glMat4();

      let uni = new glUniform(this.program);
      uni.set('view', this.view.transpose());
      uni.set('projection', this.projection.transpose());
      uni.set('uLightIntensity', this.lightIntensity);
      uni.set('uAmbientIntensity', this.ambientIntensity);
      uni.set('uThreshold1', this.threshold1 / 90);
      uni.set('uThreshold2', this.threshold2 / 90);
      uni.set('uLightLight', this.lightLight);
      uni.set('uMidLight', this.midLight);
      uni.set('uDarkLight', this.darkLight);
      uni.set('uAutoRender', this.autoRender, true);

      this.obj.draw();

      gl.clear(gl.DEPTH_BUFFER_BIT);
      this.view.scale(this.miniSize);
      this.view.translate(new glVec3([1 - this.miniSize, 1 - this.miniSize, 0]));
      uni.set('view', this.view.transpose());
      uni.set('uAutoRender', this.autoRender === 0 ? 1 : 0, true);
      this.obj.draw();

      this.view = new glMat4();
      this.view.scale(this.miniSize);
      this.view.translate(new glVec3([-(1 - this.miniSize), 1 - this.miniSize, 0]));
      uni.set('view', this.view.transpose());
      uni.set('uAutoRender', this.autoRender, true);
      this.ball.draw();
   }

   /**
    * Processes a click/touch event at the designated coordinates. If a hit
    * occurs, the clicked on view is swapped for the primary view and true
    * is returned. If no hit occurs, false is returned.
    * 
    * @param x The x coordinate [0-1].
    * @param y The y coordinate [0-1].
    * @returns true if a hit on one of the views occurs.
    */
   public click(x: number, y: number): boolean {

      if (x > (1 - this.miniSize) && y > (1 - this.miniSize)) {
         this.autoRender = this.autoRender === 0 ? 1 : 0;
         this.render();
         return false;
      }
   }
}