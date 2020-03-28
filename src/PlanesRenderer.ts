import { glMat4 } from './glMat';
import { glVec3, glVec2 } from './glVec';
import vertexSource from './shaders/PlanesVertex.glsl';
import fragmentSource from './shaders/PlanesFragment.glsl';
import { gl, clamp, mix, toRad, toDeg, isMobile } from './Globals';
import { TriangleSphere } from './TriangleSphere';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { TriangleObj, NormalType } from './TriangleObj';
import { glObject } from './glObject';
import { TriangleArrow } from './TriangleArrow';
import { glColor } from './glColor';
import { TextureRenderer } from './TextureRenderer';
import { glTextureFrameBuffer, FrameBufferStyle } from './glTextureFrameBuffer';
import { textureSize } from './ThresholdCtrl';
import { htmlColor } from './htmlColor';

export class BallImageData {
   public image: ImageData;
   public ballCenter: glVec2;
   public ballRadius: number;
}

const BALL_RADIUS = 0.5;

/**
 * Class that renders triangles and a light source
 */
export class PlanesRenderer {

   private program: WebGLProgram;
   private view = new glMat4();
   private shadowView = new glMat4();
   private projection = new glMat4();

   private uColor = new glColor([1, 1, 1]);
   private uThreshold1 = 40;
   private uThreshold2 = 70;

   private uHighlight: number = 1.0;
   private uLightLight: number;
   private uMidLight: number;
   private uDarkLight: number;
   private uShadow: number = 0.2;

   // size of the smaller view
   private readonly miniSize = 0.2;

   private uUseThresholds = false;

   private ball: glObject;
   private arrow: glObject;
   private obj: glObject;

   private shadowFrameBuffer: glTextureFrameBuffer;
   private textureFrameBuffer: glTextureFrameBuffer;

   public uLightDirection = new glVec3([1.0, -1.0, 1.5]);

   public ballColor = new glColor([1, 1, 1]);
   public readonly yellow = new glColor([1.0, 0.9, 0.7]);

   public constructor() {

      this.computeColors();

      gl.enable(gl.DEPTH_TEST);

      this.program = glCompiler.compile(vertexSource, fragmentSource);

      let tBall = new TriangleSphere(100, BALL_RADIUS, new glVec3([0, 0, 0]));
      tBall.computeNormals(NormalType.Smooth);
      this.ball = new glObject(tBall, this.program);

      let tArrow = new TriangleArrow();
      this.arrow = new glObject(tArrow, this.program);
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

   public get highlight(): number {
      return this.uHighlight;
   }
   public set highlight(val: number) {
      this.uHighlight = val;
      this.uLightLight = Math.min(this.uLightLight, val);
      this.uMidLight = Math.min(this.uMidLight, val);
      this.uDarkLight = Math.min(this.uDarkLight, val);
      this.uShadow = Math.min(this.uShadow, val);
   }

   public get lightLight(): number {
      return this.uLightLight;
   }
   public set lightLight(val: number) {
      this.uHighlight = Math.max(this.uHighlight, val);
      this.uLightLight = val;
      this.uMidLight = Math.min(this.uMidLight, val);
      this.uDarkLight = Math.min(this.uDarkLight, val);
      this.uShadow = Math.min(this.uShadow, val);
   }

   public get midLight(): number {
      return this.uMidLight;
   }
   public set midLight(val: number) {
      this.uHighlight = Math.max(this.uHighlight, val);
      this.uLightLight = Math.max(this.uLightLight, val);
      this.uMidLight = val;
      this.uDarkLight = Math.min(this.uDarkLight, val);
      this.uShadow = Math.min(this.uShadow, val);
   }

   public get darkLight(): number {
      return this.uDarkLight;
   }
   public set darkLight(val: number) {
      this.uHighlight = Math.max(this.uHighlight, val);
      this.uLightLight = Math.max(this.uLightLight, val);
      this.uMidLight = Math.max(this.uMidLight, val);
      this.uDarkLight = val;
      this.uShadow = Math.min(this.uShadow, val);
   }

   public get shadow(): number {
      return this.uShadow;
   }
   public set shadow(val: number) {
      this.uHighlight = Math.max(this.uHighlight, val);
      this.uLightLight = Math.max(this.uLightLight, val);
      this.uMidLight = Math.max(this.uMidLight, val);
      this.uDarkLight = Math.max(this.uDarkLight, val);
      this.uShadow = val;
   }

   public get threshold1(): number {
      return this.uThreshold1;
   }
   public set threshold1(val: number) {
      this.uThreshold1 = val;
      this.uThreshold2 = Math.max(this.uThreshold2, val);
   }

   public get threshold2(): number {
      return this.uThreshold2;
   }
   public set threshold2(val: number) {
      this.uThreshold2 = val;
      this.uThreshold1 = Math.min(this.uThreshold1, val);
   }

   private colorAt(deg: number): number {
      deg = clamp(deg, 0, 90);
      return mix(this.uShadow, this.uHighlight - 0.1, Math.cos(toRad(deg)));
   }

   /*
   private thresholdAt(color: number): number {
      color = clamp(color, this.ambientIntensity, this.ambientIntensity + this.lightIntensity);
      return toDeg(Math.acos(color - this.ambientIntensity) / this.lightIntensity);
   }
*/

   private computeColors() {
      this.uLightLight = this.colorAt(0.5 * this.threshold1);
      this.uMidLight = this.colorAt(mix(this.threshold1, this.threshold2, 0.5));
      this.uDarkLight = this.colorAt((this.threshold2 + 90) / 2);
   }

   public setModel(tObj: TriangleObj) {
      if (this.obj) {
         this.obj.delete();
      }
      this.obj = new glObject(tObj, this.program);
   }

   public render(): void {

      //this.renderBall();
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      this.renderToShadowMap();
      this.renderToScreen();
   }

   private setStdUniforms(): glUniform {
      let uni = new glUniform(this.program);
      uni.set('view', this.view.transpose());
      uni.set('shadowView', this.shadowView.transpose());
      uni.set('projection', this.projection.transpose());
      uni.set('uUseThresholds', this.uUseThresholds ? 1 : 0, true);
      uni.set('uLightDirection', this.uLightDirection);
      uni.seti('uUseShadows', 1);

      uni.set('uThreshold1', 1 - Math.sin(toRad(this.threshold1 + 90)));
      uni.set('uThreshold2', 1 - Math.sin(toRad(this.threshold2 + 90)));

      uni.set('uLightIntensity', this.uHighlight - this.uShadow - 0.1);
      uni.set('uAmbientIntensity', this.uShadow);
      uni.set('uHighlight', this.uHighlight);
      uni.set('uLightLight', this.uLightLight);
      uni.set('uMidLight', this.uMidLight);
      uni.set('uDarkLight', this.uDarkLight);
      uni.set('uShadow', this.uShadow);

      uni.set('uColor', this.uColor);

      return uni;
   }

   public getBallImage(): BallImageData {

      if (!this.textureFrameBuffer) {
         this.textureFrameBuffer = new glTextureFrameBuffer(textureSize, textureSize, FrameBufferStyle.Depth);
      }

      gl.viewport(0, 0, textureSize, textureSize);

      gl.bindTexture(gl.TEXTURE_2D, this.textureFrameBuffer.colorTexture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureFrameBuffer.frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textureFrameBuffer.colorTexture, 0);
      gl.bindTexture(gl.TEXTURE_2D, null);

      gl.useProgram(this.program);


      let style = getComputedStyle(<Element>gl.canvas);
      let color = htmlColor.fromCss(style.backgroundColor).toGlColor();
      gl.clearColor(color.r, color.g, color.b, 1);
      //gl.clearColor(0.5, 0.5, 0.6, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      let uni = this.setStdUniforms();

      let view = new glMat4();
      view.translate(new glVec3([-0.45, -0.45, 0]));
      uni.set('view', view.transpose());

      // always render with bands
      uni.seti('uUseThresholds', 1);

      // shoot the light straight down
      uni.set('uLightDirection', new glVec3([0, -1, 0]));

      // don't cast shadows
      uni.seti('uUseShadows', 0);

      this.ball.draw();

      let data = new BallImageData();
      data.ballRadius = BALL_RADIUS;
      let c = 0.05 + BALL_RADIUS;
      data.ballCenter = new glVec2([c, c]);

      // normalize value since our drawing space is -1 to 1
      data.ballRadius /= 2;
      data.ballCenter.x /= 2;
      data.ballCenter.y /= 2;

      // draw the arrow
      uni.set('uLightDirection', new glVec3([1, -0.5, 0.5]));
      uni.set('uUseThresholds', 0, true);

      // first reset things so that we're looking down the z-axis
      this.arrow.clearTransforms();
      this.arrow.translate(new glVec3([0.0, 1.0, 0.0]));

      uni.set('uColor', new glColor([1.0, 1.0, 0.5]));
      uni.set('uAmbientIntensity', 0.4);
      this.arrow.draw();


      let pixels = new Uint8Array(textureSize * textureSize * 4);
      gl.readPixels(0, 0, textureSize, textureSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      data.image = new ImageData(new Uint8ClampedArray(pixels), textureSize, textureSize);

      return data;
   }

   private renderToShadowMap(): void {

      if (!this.shadowFrameBuffer) {
         this.shadowFrameBuffer = new glTextureFrameBuffer(gl.canvas.width, gl.canvas.height, FrameBufferStyle.Depth);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFrameBuffer.frameBuffer);

      gl.useProgram(this.program);

      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      let center = new glVec3([0, 0, 0]);
      let up = new glVec3([0, 1, 0]);
      let mat = glMat4.makeLookAt(this.uLightDirection, center, up);
      mat.set(0, 3, 0);
      mat.set(1, 3, 0);
      mat.set(2, 3, 0);
      this.shadowView = mat;

      let uni = this.setStdUniforms();

      // change the view matrix so that our view is from the light
      uni.set('view', this.shadowView.transpose());

      // don't try to use the shadow texture while we're creating it
      uni.seti('uUseShadows', 0);

      this.obj.draw();

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   }

   private renderToScreen(): void {

      /*
      // display the depth buffer for testing purposes
      let tr = new TextureRenderer();
      tr.render(this.shadowMap.depthTexture);
      */

      /*
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // display the depth buffer for testing purposes
      let tr = new TextureRenderer();
      tr.render(this.textureFrameBuffer.colorTexture);

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
      */

      gl.useProgram(this.program);

      gl.bindTexture(gl.TEXTURE_2D, this.shadowFrameBuffer.depthTexture)

      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      // reset the view matrix
      this.view = new glMat4();

      // draw the main object
      let uni = this.setStdUniforms();
      this.obj.draw();

      // draw the object in the upper right at a reduced size and opposite banding
      gl.clear(gl.DEPTH_BUFFER_BIT);
      this.view.scale(this.miniSize);
      this.view.translate(new glVec3([1 - this.miniSize, 1 - this.miniSize, 0]));
      uni.set('view', this.view.transpose());
      uni.set('uUseThresholds', this.uUseThresholds ? 0 : 1, true);
      this.obj.draw();

      // draw the ball
      this.drawBall();

      gl.bindTexture(gl.TEXTURE_2D, null);
   }

   private drawBall() {

      let uni = this.setStdUniforms();

      // stop using the shadowmap
      uni.seti('uUseShadows', 0);

      this.view = new glMat4();
      this.view.scale(this.miniSize);
      this.view.translate(new glVec3([-(1 - this.miniSize), 1 - this.miniSize, 0]));
      uni.set('view', this.view.transpose());
      uni.set('uUseThresholds', this.uUseThresholds ? 1 : 0, true);
      uni.set('uColor', this.ballColor);
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

      uni.set('uColor', this.yellow);
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
         return true;
      }

      return false;
   }

   public optimize(normalType: NormalType) {
      this.obj.optimize(normalType);
      this.render();
   }
}