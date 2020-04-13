import { Mat4 } from './Mat';
import { Vec3, Vec2 } from './Vec';
import vertexSource from './shaders/ViewerVertex.glsl';
import fragmentSource from './shaders/ViewerFragment.glsl';
import { clamp, mix, toRad, toDeg } from './Globals';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { TriangleObj, NormalType } from './TriangleObj';
import { glObject } from './glObject';
import { glColor3 } from './glColor';
import { TextureRenderer } from './TextureRenderer';
import { htmlColor } from './htmlColor';
import { glClipSpace } from './glClipSpace';
import { TriangleObjBuilder } from './TriangleObjBuilder';
import { glTexture, glTextureStyle } from './glTexture';
import { glFrameBuffer } from './glFrameBuffer';
import { IThresholdProvider } from './IThresholdProvider';

export let DEFAULT_THRESHOLD1 = 40;
export let DEFAULT_THRESHOLD2 = 70;

const BALL_RADIUS = 0.5;
const INITIAL_LIGHT_DIRECTION = [1.0, -1.0, -1.5];
const INITIAL_VIEW = Mat4.identity;

/**
 * Class that renders triangles and a light source
 */
export class Renderer implements IThresholdProvider {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private program: WebGLProgram;
   private view = INITIAL_VIEW;
   private lightView = new Mat4();
   private projection = new Mat4();
   private uEye = new Vec3([0, 0, 8]); // 4 times the max object dimension of 2. For a model, about 20 ft away
   public useOrthographic = false;

   private uThreshold1 = DEFAULT_THRESHOLD1;
   private uThreshold2 = DEFAULT_THRESHOLD2;

   private uHighlight: number = 1.0;
   private uLightLight: number;
   private uMidLight: number;
   private uDarkLight: number;
   private uShadow: number = 0.2;
   public highlightDifference = 0.1;

   // size of the smaller view
   public readonly miniSize = 0.2;

   public useThresholds = false;
   public miniViewUseThresholds = true;

   private ball: glObject;
   private arrow: glObject;
   private floor: glObject;
   public obj: glObject;
   private objScale: number = 1;

   private shadowFrameBuffer: glFrameBuffer;
   private shadowColorTexture: glTexture;
   private shadowDepthTexture: glTexture;

   public uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);

   public ballColor = new glColor3([1, 1, 1]);
   public readonly yellow = new glColor3([1.0, 0.9, 0.7]);
   public whiteColor = new glColor3([1, 1, 1]);
   public blackColor = new glColor3([0, 0, 0]);

   public showShadowMap = false;
   public showMiniView = true;
   public showFloor = false;
   public useCulling = true;

   public constructor(glCtx: WebGLRenderingContext) {

      this.gl = glCtx;
      let gl = this.gl;

      this.computeColors();

      // enable z-buffer
      gl.enable(gl.DEPTH_TEST);

      // enable alpha values
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      this.program = glCompiler.compile(gl, vertexSource, fragmentSource);

      let tBall = new TriangleObjBuilder('Ball');
      tBall.addSphere(50, BALL_RADIUS, new Vec3([0, 0, 0]));
      tBall.optimize(NormalType.Smooth);
      this.ball = new glObject(gl, tBall, this.program);

      let tArrow = new TriangleObjBuilder('Light Arrow');
      tArrow.addArrow();
      this.arrow = new glObject(gl, tArrow, this.program);

      let style = getComputedStyle(<Element>gl.canvas);
      let color = htmlColor.fromCss(style.backgroundColor).toGlColor();
      gl.clearColor(color.r, color.g, color.b, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
   }

   public getClipSpace(): glClipSpace {

      let gl = this.gl;
      let ar = gl.canvas.width / gl.canvas.height;

      if (ar > 1) {
         return new glClipSpace(new Vec3([-ar, -1, 100]), new Vec3([ar, 1, -100]));
      }
      else {
         return new glClipSpace(new Vec3([-1, -1 / ar, 100]), new Vec3([1, 1 / ar, -100]));
      }
   }

   private updateProjectionMatrix() {

      let gl = this.gl;
      let clipSpace = this.getClipSpace();
      let winAR = gl.canvas.width / this.gl.canvas.height;

      let xBox = this.tObj.box.xForm(this.obj.xForm.base);
      let objMaxHeight = 1.1 * xBox.height;
      let objMaxWidth = 1.1 * Math.sqrt(xBox.width * xBox.width + xBox.depth * xBox.depth);
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

      if (this.useOrthographic) {
         this.projection = Mat4.makeOrtho(
            -desiredWidth / 2,
            desiredWidth / 2,
            -desiredHeight / 2,
            desiredHeight / 2,
            clipSpace.near,
            clipSpace.far,
         );
      }
      else {
         let eye = this.uEye;
         let center = new Vec3([0, 0, 0]);
         let up = new Vec3([0, 1, 0]);
         let mat = Mat4.makeLookAt(eye, center, up);


         let fieldOfView = 2 * toDeg(Math.atan2(desiredHeight / 2, eye.z));
         let near = 0.1;
         let far = 20;
         this.projection = Mat4.makePerspective(fieldOfView, winAR, near, far).multM(mat);
      }
   }

   //
   // The functions below change our view of the model
   //
   public zoom(zoom: number) {
      this.view.scale(zoom);
   }

   public translateView(delta: Vec2) {
      this.view.translate(new Vec3([delta.x, delta.y, 0]));
   }

   public get lightIntensity(): number {
      return this.uHighlight - this.uShadow - this.highlightDifference;
   }

   public get highlight(): number {
      return this.uHighlight;
   }
   public set highlight(val: number) {
      this.uHighlight = Math.max(val, this.highlightDifference);
      this.uShadow = Math.min(this.uShadow, this.uHighlight - this.highlightDifference);
      this.computeColors();
   }

   public get lightLight(): number {
      return this.uLightLight;
   }
   public get midLight(): number {
      return this.uMidLight;
   }
   public get darkLight(): number {
      return this.uDarkLight;
   }

   public get shadow(): number {
      return this.uShadow;
   }
   public set shadow(val: number) {
      this.uShadow = Math.min(val, 1 - this.highlightDifference);
      this.uHighlight = Math.max(this.uHighlight, this.uShadow + this.highlightDifference);
      this.computeColors();
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

   public get tObj(): TriangleObj {
      return this.obj.tObj;
   }

   private colorAt(deg: number): number {
      deg = clamp(deg, 0, 90);
      return mix(this.uShadow, this.uHighlight - this.highlightDifference, Math.cos(toRad(deg)));
   }

   public computeColors() {
      this.uLightLight = this.colorAt(0.5 * this.threshold1);
      this.uMidLight = this.colorAt(mix(this.threshold1, this.threshold2, 0.5));
      this.uDarkLight = this.colorAt((this.threshold2 + 90) / 2);
   }

   public setModel(tObj: TriangleObj) {
      if (this.obj) {
         this.obj.delete();
      }
      this.obj = new glObject(this.gl, tObj, this.program);

      let center = tObj.center;
      this.obj.translate(new Vec3([-center.x, -center.y, -center.z]));
      this.objScale = 2.0 / tObj.diagonal;
      this.obj.scale(this.objScale);
      this.obj.xForm.snap();

      if (this.floor) {
         this.floor.delete;
      }
      let tFloor = new TriangleObjBuilder('Floor');

      // make the floor size slightly larger than the object, centered at the bottom
      let radius = 4;
      let pos = new Vec3([0, -this.objScale * tObj.height / 2, 0]);
      tFloor.addDisk(50, radius, pos);
      this.floor = new glObject(this.gl, tFloor, this.program);

      let uni = new glUniform(this.gl, this.program);
      uni.set('uFloorCenter', tFloor.center);
      uni.set('uFloorRadius', radius);

      // reset the view and the light
      this.resetView();
      this.uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);
   }

   public resetView() {
      this.view = INITIAL_VIEW.clone();
      this.uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);
      this.obj.xForm.mat = Mat4.identity;
      this.objScale = 1.0;
   }

   public render(): void {

      this.updateProjectionMatrix();
      this.setStdUniforms();
      this.renderToShadowMap();
      this.renderToScreen();
   }

   private setStdUniforms(): glUniform {

      let uni = new glUniform(this.gl, this.program);
      uni.set('view', this.view);
      uni.set('lightView', this.lightView);
      uni.set('projection', this.projection);
      uni.set('uEye', this.uEye);
      uni.set('uOrthographic', this.useOrthographic);
      uni.set('uLightDirection', this.uLightDirection);
      uni.set('uUseShadows', true);

      uni.set('uUseThresholds', this.useThresholds ? 1 : 0, true);
      uni.set('uThreshold1', 1 - Math.sin(toRad(this.threshold1 + 90)));
      uni.set('uThreshold2', 1 - Math.sin(toRad(this.threshold2 + 90)));

      uni.set('uLightIntensity', this.lightIntensity);
      uni.set('uAmbientIntensity', this.uShadow);
      uni.set('uHighlight', this.uHighlight);
      uni.set('uLightLight', this.uLightLight);
      uni.set('uMidLight', this.uMidLight);
      uni.set('uDarkLight', this.uDarkLight);
      uni.set('uShadow', this.uShadow);

      uni.set('uWhiteColor', this.whiteColor);
      uni.set('uBlackColor', this.blackColor);

      return uni;
   }

   private renderToShadowMap(): void {

      let gl = this.gl;
      if (!this.shadowFrameBuffer) {
         let size = 1024;
         this.shadowFrameBuffer = new glFrameBuffer(gl, size, size);
         this.shadowColorTexture = this.shadowFrameBuffer.createTexture(glTextureStyle.Color);
         this.shadowDepthTexture = this.shadowFrameBuffer.createTexture(glTextureStyle.Depth);

         this.shadowFrameBuffer.attachTexture(gl.COLOR_ATTACHMENT0, this.shadowColorTexture);
         this.shadowFrameBuffer.attachTexture(gl.DEPTH_ATTACHMENT, this.shadowDepthTexture);

         this.shadowFrameBuffer.check();
         gl.bindTexture(gl.TEXTURE_2D, null);
      }

      gl.viewport(0, 0, this.shadowFrameBuffer.width, this.shadowFrameBuffer.height);
      this.shadowFrameBuffer.bind();

      gl.useProgram(this.program);

      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      let center = new Vec3([0, 0, 0]);
      let up = new Vec3([0, 1, 0]);
      let eye = new Vec3([-this.uLightDirection.x, -this.uLightDirection.y, -this.uLightDirection.z]);
      let mat = Mat4.makeLookAt(eye, center, up);
      mat.set(0, 3, 0);
      mat.set(1, 3, 0);
      mat.set(2, 3, 0);
      // to avoid clipping, expand the z range to allow full projation of
      // anything in a 3-3-3 cube.
      let maxSize = Math.sqrt(27);
      mat = Mat4.makeOrtho(-1, 1, -1, 1, maxSize, -maxSize).multM(mat);
      this.lightView = mat;

      let uni = this.setStdUniforms();

      // change the view matrix so that our view is from the light
      uni.set('view', this.lightView);
      uni.set('projection', Mat4.identity);

      // don't try to use the shadow texture while we're creating it
      uni.set('uUseShadows', false);

      this.obj.draw();

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   }

   private renderToScreen(): void {

      let gl = this.gl;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // display the depth buffer for testing purposes
      if (this.showShadowMap) {
         gl.disable(gl.CULL_FACE);
         let tr = new TextureRenderer(gl);
         tr.render(
            this.shadowDepthTexture,
            this.shadowFrameBuffer.width,
            this.shadowFrameBuffer.height
         );
         gl.bindTexture(gl.TEXTURE_2D, null);
      }
      else {
         gl.useProgram(this.program);

         this.shadowDepthTexture.bind();

         gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

         // draw the main object
         this.useCulling ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
         gl.cullFace(gl.BACK);

         let uni = this.setStdUniforms();
         this.obj.draw();

         if (this.showFloor) {
            uni.set('uShowFloor', true);

            this.floor.xForm.mat = this.obj.xForm.mat.clone();

            // cull polygons so we don't see the floor from below
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            this.floor.draw();

            uni.set('uShowFloor', false);
         }

         gl.clear(gl.DEPTH_BUFFER_BIT);

         this.drawMiniView();
         this.drawBall();

         gl.bindTexture(gl.TEXTURE_2D, null);
         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
   }

   private drawMiniView() {

      let gl = this.gl;
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      let uni = this.setStdUniforms();

      let clipSpace = this.getClipSpace();
      let projection = Mat4.makeOrtho(
         clipSpace.left,
         clipSpace.right,
         clipSpace.bottom,
         clipSpace.top,
         clipSpace.near,
         clipSpace.far
      );

      uni.set('projection', projection);
      uni.set('uOthrographic', true);

      // draw the object in the upper right at a reduced size
      let view = Mat4.identity;
      view.scale(this.miniSize);
      view.translate(new Vec3([clipSpace.max.x - this.miniSize, clipSpace.max.y - this.miniSize, 0]));
      uni.set('view', view);
      uni.set('uUseThresholds', this.miniViewUseThresholds ? 0 : 1, true);
      this.obj.draw();
   }

   private drawBall() {

      let gl = this.gl;
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      let uni = this.setStdUniforms();

      let clipSpace = this.getClipSpace();
      let projection = Mat4.makeOrtho(
         clipSpace.left,
         clipSpace.right,
         clipSpace.bottom,
         clipSpace.top,
         clipSpace.near,
         clipSpace.far
      );

      uni.set('projection', projection);
      uni.set('uOthrographic', true);

      // stop using the shadowmap
      uni.set('uUseShadows', false);

      let view = Mat4.identity;
      view.scale(this.miniSize);
      view.translate(new Vec3([clipSpace.min.x + this.miniSize, clipSpace.max.y - this.miniSize, 0]));
      uni.set('view', view);
      uni.set('uUseThresholds', this.useThresholds ? 1 : 0, true);
      uni.set('uWhiteColor', this.ballColor);
      uni.set('uBlackColor', htmlColor.black.toGlColor());
      this.ball.draw();

      uni.set('uLightDirection', new Vec3([1, -0.5, -0.5]));
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
      this.arrow.translate(new Vec3([0.0, 0.55, 0.0]));
      this.arrow.rotX(toRad(90));

      // rotate to match the light source
      this.arrow.rotY(-elevationAngle);
      this.arrow.rotZ(-rotationAngle);

      uni.set('uWhiteColor', this.yellow);
      uni.set('uBlackColor', htmlColor.black.toGlColor());
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

      // TODO adjust for aspect ratio
      if (this.showMiniView) {
         if (x > (1 - this.miniSize) && y > (1 - this.miniSize)) {
            this.useThresholds = !this.useThresholds;
            this.render();
            return true;
         }
      }

      return false;
   }
}