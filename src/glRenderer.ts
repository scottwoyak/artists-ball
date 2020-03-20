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
import { TriangleObj, NormalType } from './TriangleObj';
import { glObject } from './glObject';
import { TriangleArrow } from './TriangleArrow';
import { glColor } from './glColor';

/**
 * Class that renders triangles and a light source
 */
export class glRenderer {

   private program: WebGLProgram;
   private view = new glMat4();
   private projection = new glMat4();

   public lightIntensity = 0.7;
   public ambientIntensity = 0.2;

   private uColor = new glColor([1, 1, 1]);
   private uThreshold1 = 15;
   private uThreshold2 = 55;

   private uLightLight: number;
   private uMidLight: number;
   private uDarkLight: number;

   private _sync: boolean = true;

   // size of the smaller view
   private readonly miniSize = 0.2;

   private uUseThresholds = true;

   private ball: glObject;
   private arrow: glObject;
   private obj: glObject;


   public uLightDirection = new glVec3([1.0, -1.0, 0.5]);

   public constructor() {
      this.computeColors();
   }

   public get sync(): boolean {
      return this._sync;
   }
   public set sync(val: boolean) {
      this._sync = val;
      this.computeColors();
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

   public get lightLight(): number {
      return this.uLightLight;
   }
   public set lightLight(val: number) {
      this.uLightLight = val;
      this.uMidLight = Math.min(this.uMidLight, val);
      this.uDarkLight = Math.min(this.uDarkLight, val);

      if (this.sync) {
         this.uThreshold1 = 2 * (this.thresholdAt(this.uLightLight));
         this.uThreshold2 = 2 * this.thresholdAt(this.uDarkLight) - 90;
         this.computeColors();
      }
   }

   public get midLight(): number {
      return this.uMidLight;
   }
   public set midLight(val: number) {
      this.uMidLight = val;
      this.uLightLight = Math.max(this.uLightLight, val);
      this.uDarkLight = Math.min(this.uDarkLight, val);

      if (this.sync) {
         let range = this.uThreshold2 - this.uThreshold1
         this.uThreshold1 = this.thresholdAt(this.uMidLight) - range / 2;
         this.uThreshold2 = this.thresholdAt(this.uMidLight) + range / 2;
         this.computeColors();
      }
   }

   public get darkLight(): number {
      return this.uDarkLight;
   }
   public set darkLight(val: number) {
      this.uDarkLight = val;
      this.uLightLight = Math.max(this.uLightLight, val);
      this.uMidLight = Math.max(this.uMidLight, val);

      if (this.sync) {
         this.uThreshold2 = 2 * this.thresholdAt(this.uDarkLight) - 90;
         this.uThreshold1 = 2 * this.thresholdAt(this.uMidLight) - this.uThreshold2;
         this.computeColors();
      }
   }

   public get threshold1(): number {
      return this.uThreshold1;
   }
   public set threshold1(val: number) {
      this.uThreshold1 = val;
      this.uThreshold2 = Math.max(this.uThreshold2, val);
      this.computeColors();
   }

   public get threshold2(): number {
      return this.uThreshold2;
   }
   public set threshold2(val: number) {
      this.uThreshold2 = val;
      this.uThreshold1 = Math.min(this.uThreshold1, val);
      this.computeColors();
   }

   private colorAt(deg: number): number {
      deg = clamp(deg, 0, 90);
      //      return mix(this.ambientIntensity, this.lightIntensity, Math.cos(toRad(deg)));
      return this.ambientIntensity + this.lightIntensity * Math.cos(toRad(deg));
   }

   private thresholdAt(color: number): number {
      color = clamp(color, this.ambientIntensity, this.ambientIntensity + this.lightIntensity);
      return toDeg(Math.acos(color - this.ambientIntensity) / this.lightIntensity);
   }

   private computeColors() {
      this.uLightLight = this.colorAt(0.5 * this.threshold1);
      this.uMidLight = this.colorAt(mix(this.threshold1, this.threshold2, 0.7));
      this.uDarkLight = this.colorAt((this.threshold2 + 90) / 2);
   }

   public create(query: string): Promise<void> {

      gl.enable(gl.DEPTH_TEST);

      // create shaders
      this.program = glCompiler.compile(vertexSource, fragmentSource);

      let tBall = new TriangleSphere();
      tBall.createNow(500, 0.5, new glVec3([0, 0, 0]));
      this.ball = new glObject(tBall, this.program);

      let tArrow = new TriangleArrow();
      tArrow.createNow();
      this.arrow = new glObject(tArrow, this.program);

      if (query && query.toLowerCase() === 'trianglesphere') {
         let radius = 0.75;
         let center = new glVec3([0, 0, 0]);
         let tObj = new TriangleSphere();
         return tObj.create(100, radius, center).then(() => {
            tObj.computeNormals(NormalType.Smooth);
            this.obj = new glObject(tObj, this.program);
         });
      }
      else if (query && query.toLowerCase() === 'trianglecube') {
         let size = 0.8;
         let center = new glVec3([0, 0, 0]);
         let tObj = new TriangleCube();
         return tObj.create(size, center).then(() => {
            this.obj = new glObject(tObj, this.program);
         });
      }
      else if (query && query.toLowerCase().endsWith('.obj')) {
         let tObj = new TriangleObjFile();
         return tObj.create(query).then(() => {
            this.obj = new glObject(tObj, this.program);
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

         case 'wolf.obj':
            this.obj.rotY(toRad(-140));
            this.obj.rotX(toRad(5));
            break;

         case 'sheephead.obj':
            this.obj.rotY(toRad(-160));
            break;

         case 'tom.obj':
         case 'malehead.obj':
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
      uni.set('uLightLight', this.uLightLight);
      uni.set('uMidLight', this.uMidLight);
      uni.set('uDarkLight', this.uDarkLight);
      uni.set('uUseThresholds', this.uUseThresholds ? 1 : 0, true);
      uni.set('uLightDirection', this.uLightDirection);
      uni.set('uColor', this.uColor);

      this.obj.draw();

      gl.clear(gl.DEPTH_BUFFER_BIT);
      this.view.scale(this.miniSize);
      this.view.translate(new glVec3([1 - this.miniSize, 1 - this.miniSize, 0]));
      uni.set('view', this.view.transpose());
      uni.set('uUseThresholds', this.uUseThresholds ? 0 : 1, true);
      this.obj.draw();

      this.view = new glMat4();
      this.view.scale(this.miniSize);
      this.view.translate(new glVec3([-(1 - this.miniSize), 1 - this.miniSize, 0]));
      uni.set('view', this.view.transpose());
      uni.set('uUseThresholds', this.uUseThresholds ? 1 : 0, true);
      this.ball.draw();

      uni.set('uLightDirection', new glVec3([1, -0.5, 0.5]));
      uni.set('uUseThresholds', 0, true);

      // back out angles as if looking down the z-axis
      let x = this.uLightDirection.x;
      let y = this.uLightDirection.y;
      let z = this.uLightDirection.z;

      // start by looking down from the Z direction
      let radius = Math.sqrt(x * x + y * y + z * z);
      let elevationAngle = Math.acos(z / radius);
      let rotationAngle = Math.atan2(y, x);

      // first reset things so that we're looking down the z-axis
      this.arrow.clearTransforms();
      this.arrow.translate(new glVec3([0.0, 0.55, 0.0]));
      this.arrow.rotX(toRad(90));

      // rotate to match the light source
      this.arrow.rotY(-elevationAngle);
      this.arrow.rotZ(-rotationAngle);

      //uni.set('uColor', new glColor([1.0, 0.86, 0.6]));
      uni.set('uColor', new glColor([1.0, 0.9, 0.7]));
      uni.set('uAmbientIntensity', 0.4);
      this.arrow.draw();
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
         this.uUseThresholds = !this.uUseThresholds;
         this.render();
         return false;
      }
   }

   public optimize(normalType: NormalType) {
      this.obj.optimize(normalType);
      this.render();
   }
}