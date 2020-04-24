import { Mat4 } from './Mat';
import { Vec3, Vec2, Vec4 } from './Vec';
import vertexSource from './shaders/ViewerVertex.glsl';
import fragmentSource from './shaders/ViewerFragment.glsl';
import { toRad, toDeg } from './Globals';
import { glUniform } from './glUniform';
import { TriangleObj, NormalType } from './TriangleObj';
import { glObject } from './glObject';
import { glColor3 } from './glColor';
import { TextureRenderer } from './TextureRenderer';
import { htmlColor } from './htmlColor';
import { TriangleObjBuilder } from './TriangleObjBuilder';
import { glTexture, glTextureStyle } from './glTexture';
import { glFrameBuffer } from './glFrameBuffer';
import { glProgram } from './glProgram';
import { ValueRange } from './ValueRange';
import { Camera, ObjSizeProvider } from './Camera';

const BALL_RADIUS = 0.5;
const INITIAL_LIGHT_DIRECTION = [1.0, -1.0, -1.5];
const INITIAL_VIEW = Mat4.identity;
const INITIAL_SHININESS = 15;
export const INITIAL_EYE = [0, 0, 6]; // 3 times the max object dimension of 2. For a model, about 15 ft away

export class Contour {
   public color: glColor3;
   public angle: number; // degrees

   public constructor(color: glColor3 | number, angle: number) {

      if (color instanceof glColor3) {
         this.color = color;
      }
      else {
         this.color = new glColor3([color, color, color]);
      }

      this.angle = angle;
   }
}

// Rendering modes. Must match values in ViewerFragment.glsl
export enum RenderMode {
   Normal = 0,
   Contours = 1,
   LightAndShadow = 2,
   HighlightTerminator = 3,
   HighlightShadow = 4,
   EmphasizeHighlights = 5,
}

export enum Reset {
   All,
   View,
   Lights,
   Rendering
}

/**
 * Class that renders triangles and a light source
 */
export class Renderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private program: glProgram;
   public view = INITIAL_VIEW.clone();
   private lightView = new Mat4();

   public valueRange = ValueRange.Standard;

   // size of the smaller view
   public readonly miniSize = 0.2;

   private ball: glObject;
   private arrow: glObject;
   public floor: glObject;
   public obj: glObject;

   private shadowFrameBuffer: glFrameBuffer;
   private shadowColorTexture: glTexture;
   private shadowDepthTexture: glTexture;

   public uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);

   public ballColor = new glColor3([1, 1, 1]);
   public readonly yellow = new glColor3([1.0, 0.9, 0.7]);

   public contours: Contour[] = [];

   public showShadowMap = false;
   public showMiniView = true;
   public showBall = true;
   public showFloor = true;
   public useCulling = true;
   public miniViewShowContours = false;
   public showHighlights = true;
   public uShininess = INITIAL_SHININESS;
   public lockFloor = false;
   public camera: Camera;

   public renderMode = RenderMode.Normal;

   public constructor(glCtx: WebGLRenderingContext) {

      this.gl = glCtx;
      let gl = this.gl;

      this.camera = new Camera(this.gl);

      // enable z-buffer
      gl.enable(gl.DEPTH_TEST);

      // enable alpha values
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      this.program = new glProgram(gl, vertexSource, fragmentSource);

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

   public renderModeCanToggleHighlights(): boolean {
      if (this.renderMode === RenderMode.EmphasizeHighlights || this.renderMode === RenderMode.LightAndShadow) {
         return false;
      }
      else {
         return true;
      }
   }

   public rotX(angle: number) {
      this.obj.rotX(angle);
      if (this.lockFloor == false) {
         this.floor.rotX(angle);
      }
   }
   public rotY(angle: number) {
      this.obj.rotY(angle);
      if (this.lockFloor == false) {
         this.floor.rotY(angle);
      }
   }
   public rotZ(angle: number) {
      this.obj.rotZ(angle);
      if (this.lockFloor == false) {
         this.floor.rotZ(angle);
      }
   }
   public preRotX(angle: number) {
      this.obj.preRotX(angle);
      if (this.lockFloor == false) {
         this.floor.preRotX(angle);
      }
   }
   public preRotY(angle: number) {
      this.obj.preRotY(angle);
      if (this.lockFloor == false) {
         this.floor.preRotY(angle);
      }
   }
   public preRotZ(angle: number) {
      this.obj.preRotZ(angle);
      if (this.lockFloor == false) {
         this.floor.preRotZ(angle);
      }
   }
   public scale(scale: number) {
      this.obj.scale(scale);
      if (this.lockFloor == false) {
         this.floor.scale(scale);
      }
   }
   public translate(offset: Vec3) {
      this.obj.translate(offset);
      if (this.lockFloor == false) {
         this.floor.translate(offset);
      }
   }

   public rotateLight(xRad: number, yRad: number) {
      let matX = Mat4.fromRotX(yRad);
      let matY = Mat4.fromRotY(xRad);
      let vec = Vec4.fromVec3(this.uLightDirection, 1);
      vec = matX.multV(vec);
      vec = matY.multV(vec);
      this.uLightDirection = vec.xyz;
   }


   public get tObj(): TriangleObj {
      return this.obj.tObj;
   }

   public setModel(tObj: TriangleObj) {
      if (this.obj) {
         this.obj.delete();
      }
      this.obj = new glObject(this.gl, tObj, this.program);
      this.camera.sizeProvider = new ObjSizeProvider(this.obj);

      // move the object so that the center is at [0,0,0] and it is scaled
      // so that it's diagonal is 2 units across
      let objScale = 2.0 / tObj.diagonal;
      this.obj.autoSize(new Vec3([0, 0, 0]), 2);

      if (this.floor) {
         this.floor.delete;
      }
      let tFloor = new TriangleObjBuilder('Floor');

      // make the floor size slightly larger than the object, centered at the bottom
      let radius = 4;
      let pos = new Vec3([0, -objScale * tObj.height / 2, 0]);
      tFloor.addDisk(50, radius, pos);
      this.floor = new glObject(this.gl, tFloor, this.program);

      let uni = new glUniform(this.gl, this.program);
      uni.set('uFloorCenter', tFloor.center);
      uni.set('uFloorRadius', radius);

      // reset the view and the light
      this.reset(Reset.All);
      this.uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);
   }

   public reset(what: Reset) {
      switch (what) {
         case Reset.All:
            this.reset(Reset.Lights);
            this.reset(Reset.Rendering);
            this.reset(Reset.View);

            break;
         case Reset.Lights:
            this.uLightDirection = new Vec3(INITIAL_LIGHT_DIRECTION);
            break;

         case Reset.View:
            this.view = INITIAL_VIEW.clone();
            this.obj.clearTransforms();
            this.floor.clearTransforms();
            this.camera.eye = new Vec3(INITIAL_EYE);
            this.camera.lookAt = Vec3.origin;
            this.camera.zoomFactor = 1;

            break;

         case Reset.Rendering:
            this.renderMode = RenderMode.Normal;
            this.showHighlights = true;
            this.uShininess = INITIAL_SHININESS;
            break;
      }
   }

   public render(): void {

      this.setStdUniforms();
      this.renderToShadowMap();
      this.renderToScreen();
   }

   public setStdUniforms(): glUniform {

      let uni = new glUniform(this.gl, this.program);
      uni.set('view', this.view);
      uni.set('lightView', this.lightView);
      uni.set('projection', this.camera.projection);
      uni.set('uEye', this.camera.eye);
      uni.set('uOrthographic', this.camera.useOrthographic);
      uni.set('uLightDirection', this.uLightDirection);
      uni.set('uUseShadows', true);
      uni.seti('uRenderMode', this.renderMode);
      uni.set('uShowHighlights', this.showHighlights || this.renderMode === RenderMode.EmphasizeHighlights);
      uni.set('uShininess', this.uShininess);

      let valueRange;
      if (this.renderMode === RenderMode.EmphasizeHighlights) {
         valueRange = ValueRange.EmphasizeHighlights;
      }
      else {
         valueRange = ValueRange.Standard;
      }

      uni.set('uLightIntensity', valueRange.lightIntensity);
      uni.set('uAmbientIntensity', valueRange.shadow);
      uni.set('uHighlight', valueRange.highlight);
      uni.set('uWhiteColor', glColor3.modelWhite);
      uni.set('uBlackColor', glColor3.modelBlack);

      uni.seti('uNumContours', this.contours.length);
      for (let i = 0; i < this.contours.length; i++) {
         uni.set('uContourColors[' + i + ']', this.contours[i].color);
         uni.set('uContourAngles[' + i + ']', this.contours[i].angle);
      }

      return uni;
   }

   private renderToShadowMap(): void {

      let gl = this.gl;
      let maxTextureSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE));
      let desiredSize = this.camera.zoomFactor * Math.min(gl.canvas.width, gl.canvas.height);
      let size = 256;
      while (size < desiredSize && size * 2 <= maxTextureSize) {
         size *= 2;
      }

      if (!this.shadowFrameBuffer || size !== this.shadowFrameBuffer.size) {

         if (this.shadowFrameBuffer) {
            this.shadowFrameBuffer.delete();
            this.shadowColorTexture.delete();
            this.shadowDepthTexture.delete();
         }

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

      this.program.use();

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
      uni.seti('uRenderMode', RenderMode.Normal);

      gl.disable(gl.CULL_FACE);

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
         this.program.use();

         this.shadowDepthTexture.bind();

         gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

         let uni = this.setStdUniforms();
         if (this.showFloor) {

            uni.set('uRenderingFloor', true);

            // cull polygons so we don't see the floor from below
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            uni.seti('uRenderMode', RenderMode.Normal);

            this.floor.draw();

            uni.set('uRenderingFloor', false);
         }

         // draw the main object
         this.useCulling ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
         gl.cullFace(gl.BACK);

         uni = this.setStdUniforms();
         this.obj.draw();

         gl.clear(gl.DEPTH_BUFFER_BIT);

         this.drawMiniView();
         this.drawBall();

         gl.bindTexture(gl.TEXTURE_2D, null);
         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
   }

   private drawMiniView() {

      if (this.showMiniView) {
         let gl = this.gl;
         gl.enable(gl.CULL_FACE);
         gl.cullFace(gl.BACK);

         let uni = this.setStdUniforms();

         let clipSpace = this.camera.getClipSpace();
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
         uni.seti('uRenderMode', this.miniViewShowContours ? RenderMode.Contours : RenderMode.Normal);
         this.obj.draw();
      }
   }

   private drawBall() {

      if (this.showBall === false) {
         return;
      }

      let gl = this.gl;
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      let uni = this.setStdUniforms();

      let clipSpace = this.camera.getClipSpace();
      let projection = Mat4.makeOrtho(
         clipSpace.left,
         clipSpace.right,
         clipSpace.bottom,
         clipSpace.top,
         clipSpace.near,
         clipSpace.far
      );

      uni.set('projection', projection);
      uni.set('uOrthographic', true);

      // stop using the shadowmap
      uni.set('uUseShadows', false);

      let view = Mat4.identity;
      view.scale(this.miniSize);
      view.translate(new Vec3([clipSpace.min.x + this.miniSize, clipSpace.max.y - this.miniSize, 0]));
      uni.set('view', view);
      uni.set('uWhiteColor', this.ballColor);
      uni.set('uBlackColor', htmlColor.black.toGlColor());
      uni.seti('uRenderMode', this.renderMode);
      this.ball.draw();

      uni.set('uLightDirection', new Vec3([1, -0.5, -0.5]));
      uni.seti('uRenderMode', RenderMode.Normal);

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
      uni.set('uLightIntensity', ValueRange.Standard.lightIntensity);
      uni.set('uHighlight', ValueRange.Standard.highlight);
      uni.set('uAmbientIntensity', 0.4);
      this.arrow.draw();
   }
}