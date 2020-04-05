import { Mat4 } from './Mat';
import { Vec3, Vec2 } from './Vec';
import vertexSource from './shaders/ViewerVertex.glsl';
import fragmentSource from './shaders/ViewerFragment.glsl';
import { clamp, mix, toRad, toDeg } from './Globals';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { TriangleObj, NormalType } from './TriangleObj';
import { glObject } from './glObject';
import { glColor } from './glColor';
import { TextureRenderer } from './TextureRenderer';
import { textureSize } from './ThresholdCtrl';
import { htmlColor } from './htmlColor';
import { glClipSpace } from './glClipSpace';
import { TriangleObjBuilder } from './TriangleObjBuilder';
import { glTexture, glTextureStyle } from './glTexture';
import { glFrameBuffer } from './glFrameBuffer';

export class BallImageData {
   public image: ImageData;
   public ballCenter: Vec2;
   public ballRadius: number;
}

export let DEFAULT_THRESHOLD1 = 40;
export let DEFAULT_THRESHOLD2 = 70;

const HIGHLIGHT_DIFF = 0.1;
const BALL_RADIUS = 0.5;
const INITIAL_LIGHT_DIRECTION = [1.0, -1.0, 1.5];
const INITIAL_VIEW = Mat4.identity();

/**
 * Class that renders triangles and a light source
 */
export class Renderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private program: WebGLProgram;
   private view = INITIAL_VIEW;
   private lightView = new Mat4();
   private projection = new Mat4();

   private uThreshold1 = DEFAULT_THRESHOLD1;
   private uThreshold2 = DEFAULT_THRESHOLD2;

   private uHighlight: number = 1.0;
   private uLightLight: number;
   private uMidLight: number;
   private uDarkLight: number;
   private uShadow: number = 0.2;

   // size of the smaller view
   public readonly miniSize = 0.2;

   public useThresholds = false;
   public miniViewUseThresholds = true;

   private ball: glObject;
   private arrow: glObject;
   private base: glObject;
   public obj: glObject;

   private shadowFrameBuffer: glFrameBuffer;
   private shadowColorTexture: glTexture;
   private shadowDepthTexture: glTexture;

   private tCtrlFrameBuffer: glFrameBuffer;
   private tCtrlColorTexture: glTexture;
   private tCtrlDepthTexture: glTexture;

   public uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);

   public ballColor = new glColor([1, 1, 1]);
   public readonly yellow = new glColor([1.0, 0.9, 0.7]);
   public whiteColor = new htmlColor([255, 255, 255]);
   public blackColor = new htmlColor([0, 0, 0]);

   public showShadowMap = false;
   public showMiniView = true;
   public showBase = false;

   public constructor(glCtx: WebGLRenderingContext) {

      this.gl = glCtx;
      let gl = this.gl;

      this.computeColors();

      gl.enable(gl.DEPTH_TEST);

      this.program = glCompiler.compile(gl, vertexSource, fragmentSource);

      let tBall = new TriangleObjBuilder('Ball');
      tBall.addSphere(50, BALL_RADIUS, new Vec3([0, 0, 0]));
      tBall.optimize(NormalType.Smooth);
      this.ball = new glObject(gl, tBall, this.program);

      let tArrow = new TriangleObjBuilder('Light Arrow');
      tArrow.addArrow();
      this.arrow = new glObject(gl, tArrow, this.program);

      this.resize();
   }

   public getClipSpace(): glClipSpace {

      let gl = this.gl;
      let ar = gl.canvas.width / gl.canvas.height;

      if (ar > 1) {
         return new glClipSpace(new Vec3([-ar, -1, -100]), new Vec3([ar, 1, 100]));
      }
      else {
         return new glClipSpace(new Vec3([-1, -1 / ar, -100]), new Vec3([1, 1 / ar, 100]));
      }
   }

   public resize() {
      let clipSpace = this.getClipSpace();
      this.projection = Mat4.makeOrtho(
         clipSpace.left,
         clipSpace.right,
         clipSpace.bottom,
         clipSpace.top,
         clipSpace.near,
         clipSpace.far
      );
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

   public get highlight(): number {
      return this.uHighlight;
   }
   public set highlight(val: number) {
      this.uHighlight = Math.max(val, HIGHLIGHT_DIFF);
      this.uShadow = Math.min(this.uShadow, this.uHighlight - HIGHLIGHT_DIFF);
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
      this.uShadow = Math.min(val, 1 - HIGHLIGHT_DIFF);
      this.uHighlight = Math.max(this.uHighlight, this.uShadow + HIGHLIGHT_DIFF);
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
      return mix(this.uShadow, this.uHighlight - HIGHLIGHT_DIFF, Math.cos(toRad(deg)));
   }

   private thresholdAt(color: number): number {
      let acos = (color - this.uShadow) / (this.uHighlight - HIGHLIGHT_DIFF - this.uShadow);
      return toDeg(Math.acos(acos));
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
      let scale = 2.0 / Math.sqrt(tObj.width * tObj.width + tObj.height * tObj.height + tObj.depth * tObj.depth);
      this.obj.scale(scale);
      this.obj.xForm.snap();

      if (this.base) {
         this.base.delete;
      }
      let tBase = new TriangleObjBuilder('Base');

      // make the base size slightly larger than the object, centered at the bottom
      let radius = 0.25 + scale * Math.sqrt(tObj.width * tObj.width + tObj.depth * tObj.depth) / 2;
      let pos = new Vec3([0, -scale * tObj.height / 2, 0]);
      tBase.addDisk(50, radius, pos);
      this.base = new glObject(this.gl, tBase, this.program);

      // reset the view and the light
      this.resetView();
      this.uLightDirection = new Vec3([1.0, -1.0, 1.5]);
   }

   public resetView() {
      this.view = INITIAL_VIEW.clone();
   }

   public render(): void {

      this.setStdUniforms();
      this.renderToShadowMap();
      this.renderToScreen();
   }

   private setStdUniforms(): glUniform {

      let uni = new glUniform(this.gl, this.program);
      uni.set('view', this.view.transpose());
      uni.set('lightView', this.lightView.transpose());
      uni.set('projection', this.projection.transpose());
      uni.set('uLightDirection', this.uLightDirection);
      uni.seti('uUseShadows', 1);

      uni.set('uUseThresholds', this.useThresholds ? 1 : 0, true);
      uni.set('uThreshold1', 1 - Math.sin(toRad(this.threshold1 + 90)));
      uni.set('uThreshold2', 1 - Math.sin(toRad(this.threshold2 + 90)));

      uni.set('uLightIntensity', this.uHighlight - this.uShadow - HIGHLIGHT_DIFF);
      uni.set('uAmbientIntensity', this.uShadow);
      uni.set('uHighlight', this.uHighlight);
      uni.set('uLightLight', this.uLightLight);
      uni.set('uMidLight', this.uMidLight);
      uni.set('uDarkLight', this.uDarkLight);
      uni.set('uShadow', this.uShadow);

      uni.set('uWhiteColor', this.whiteColor.toGlColor());
      uni.set('uBlackColor', this.blackColor.toGlColor());

      return uni;
   }

   public getBallImage(): BallImageData {

      let gl = this.gl;

      if (!this.tCtrlFrameBuffer) {
         this.tCtrlFrameBuffer = new glFrameBuffer(gl, textureSize, textureSize);
         this.tCtrlColorTexture = this.tCtrlFrameBuffer.createTexture(glTextureStyle.Color);
         this.tCtrlDepthTexture = this.tCtrlFrameBuffer.createTexture(glTextureStyle.Depth);

         this.tCtrlFrameBuffer.attachTexture(gl.COLOR_ATTACHMENT0, this.tCtrlColorTexture);
         this.tCtrlFrameBuffer.attachTexture(gl.DEPTH_ATTACHMENT, this.tCtrlDepthTexture);

         this.tCtrlFrameBuffer.check();

         // Unbind these new objects, which makes the default frame buffer the
         // target for rendering.
         gl.bindTexture(gl.TEXTURE_2D, null);
         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      gl.viewport(0, 0, textureSize, textureSize);

      this.tCtrlColorTexture.bind();
      this.tCtrlFrameBuffer.bind();
      this.tCtrlFrameBuffer.attachTexture(gl.COLOR_ATTACHMENT0, this.tCtrlColorTexture);
      gl.bindTexture(gl.TEXTURE_2D, null);

      gl.useProgram(this.program);

      let style = getComputedStyle(<Element>gl.canvas);
      let color = htmlColor.fromCss(style.backgroundColor).toGlColor();
      gl.clearColor(color.r, color.g, color.b, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      let uni = this.setStdUniforms();

      // always render with bands
      uni.seti('uUseThresholds', 1);

      // shoot the light straight down
      uni.set('uLightDirection', new Vec3([0, -1, 0]));

      // don't cast shadows
      uni.seti('uUseShadows', 0);

      uni.set('view', new Mat4());

      // move the ball to the lower left and partially offscreen
      const scale = 1.75;
      const offset = new Vec3([-0.6, -0.6, 0]);
      this.ball.clearTransforms();
      this.ball.scale(scale);
      this.ball.translate(offset);

      // render the ball
      this.ball.draw();
      this.ball.clearTransforms();

      // draw the arrow
      uni.set('uLightDirection', new Vec3([1, -0.5, 0.5]));
      uni.seti('uUseThresholds', 0);

      // first reset things so that we're looking down the z-axis
      this.arrow.clearTransforms();
      this.arrow.scale(1.25)
      this.arrow.translate(new Vec3([offset.x, offset.y + scale * BALL_RADIUS + 0.1, 0.0]));

      uni.set('uWhiteColor', new glColor([1.0, 1.0, 0.5]));
      uni.set('uBlackColor', htmlColor.black.toGlColor());
      uni.set('uAmbientIntensity', 0.4);
      this.arrow.draw();

      let pixels = new Uint8Array(textureSize * textureSize * 4);
      gl.readPixels(0, 0, textureSize, textureSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // create the data structure we'll return
      let data = new BallImageData();
      data.image = new ImageData(new Uint8ClampedArray(pixels), textureSize, textureSize);

      // convert from [-1,1] drawing space to [0,1]
      data.ballRadius = scale * BALL_RADIUS;
      data.ballCenter = new Vec2([offset.x, offset.y]);
      data.ballRadius /= 2;
      data.ballCenter.x = 0.5 * (data.ballCenter.x + 1);
      data.ballCenter.y = 0.5 * (data.ballCenter.y + 1);

      return data;
   }

   private renderToShadowMap(): void {

      let gl = this.gl;
      if (!this.shadowFrameBuffer) {
         // TODO use a float depth texture so we don't get stair step shadows
         let size = 1024;
         this.shadowFrameBuffer = new glFrameBuffer(gl, size, size);
         this.shadowColorTexture = this.shadowFrameBuffer.createTexture(glTextureStyle.Color);
         this.shadowDepthTexture = this.shadowFrameBuffer.createTexture(glTextureStyle.Depth);

         this.shadowFrameBuffer.attachTexture(gl.COLOR_ATTACHMENT0, this.shadowColorTexture);
         this.shadowFrameBuffer.attachTexture(gl.DEPTH_ATTACHMENT, this.shadowDepthTexture);

         this.shadowFrameBuffer.check();
      }

      gl.viewport(0, 0, this.shadowFrameBuffer.width, this.shadowFrameBuffer.height);
      this.shadowFrameBuffer.bind();

      gl.useProgram(this.program);

      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      let center = new Vec3([0, 0, 0]);
      let up = new Vec3([0, 1, 0]);
      let mat = Mat4.makeLookAt(this.uLightDirection, center, up);
      mat.set(0, 3, 0);
      mat.set(1, 3, 0);
      mat.set(2, 3, 0);
      // to avoid clipping, expand the z range to the max distance from
      // the origin for a 1-1-1 cube
      let maxSize = Math.sqrt(3);
      mat = Mat4.makeOrtho(-1, 1, -1, 1, -maxSize, maxSize).multM(mat);
      this.lightView = mat;

      let uni = this.setStdUniforms();

      // change the view matrix so that our view is from the light
      uni.set('view', this.lightView.transpose());
      uni.set('projection', Mat4.identity());

      // don't try to use the shadow texture while we're creating it
      uni.seti('uUseShadows', 0);

      this.obj.draw();

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   }

   private renderToScreen(): void {

      let gl = this.gl;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // display the depth buffer for testing purposes
      if (this.showShadowMap) {
         let tr = new TextureRenderer(gl);
         tr.render(
            this.shadowDepthTexture.get(),
            this.shadowFrameBuffer.width,
            this.shadowFrameBuffer.height
         );
      }
      else {
         gl.useProgram(this.program);

         this.shadowDepthTexture.bind();

         gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

         // draw the main object
         this.setStdUniforms();
         this.obj.draw();

         if (this.showBase) {
            this.base.xForm.mat = this.obj.xForm.mat.clone();

            // cull polygons so we don't see the base from below
            gl.enable(gl.CULL_FACE)
            gl.cullFace(gl.FRONT);
            this.base.draw();
            gl.disable(gl.CULL_FACE)
         }

         gl.clear(gl.DEPTH_BUFFER_BIT);

         this.drawMiniView();
         this.drawBall();

         gl.bindTexture(gl.TEXTURE_2D, null);
      }
   }

   private drawMiniView() {

      let uni = this.setStdUniforms();

      // draw the object in the upper right at a reduced size
      let view = Mat4.identity();
      view.scale(this.miniSize);
      let clipSpace = this.getClipSpace();
      view.translate(new Vec3([clipSpace.max.x - this.miniSize, clipSpace.max.y - this.miniSize, 0]));
      uni.set('view', view.transpose());
      uni.set('uUseThresholds', this.miniViewUseThresholds ? 0 : 1, true);
      this.obj.draw();
   }

   private drawBall() {

      let uni = this.setStdUniforms();

      // stop using the shadowmap
      uni.seti('uUseShadows', 0);

      let view = Mat4.identity();
      view.scale(this.miniSize);
      let clipSpace = this.getClipSpace();
      view.translate(new Vec3([clipSpace.min.x + this.miniSize, clipSpace.max.y - this.miniSize, 0]));
      uni.set('view', view.transpose());
      uni.set('uUseThresholds', this.useThresholds ? 1 : 0, true);
      uni.set('uWhiteColor', this.ballColor);
      uni.set('uBlackColor', htmlColor.black.toGlColor());
      this.ball.draw();

      uni.set('uLightDirection', new Vec3([1, -0.5, 0.5]));
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