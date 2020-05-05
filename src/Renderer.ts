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
import { Camera, ObjSizeProvider, FixedSizeProvider } from './Camera';
import { IMinMax } from './BoundingBox';
import { Plane } from './Plane';

const BALL_RADIUS = 0.5;
const INITIAL_LIGHT_POS = new Vec3([-1.0, 1.0, 1.5]);
const INITIAL_VIEW = Mat4.identity;
const INITIAL_SHININESS = 15;
const INITIAL_LIGHT_INTENSITY = 1.0;
const INITIAL_FALLOFF = 0.5;
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

export enum LightType {
   Point,
   Directional
}

export interface IRenderOptions {
   view: Mat4;
   valueRange: ValueRange;
   lightPos: Vec3;
   lightType: LightType;
   falloff: number;
   lightIntensity: number;
   contours: Contour[];
   useCulling: boolean;
   showHighlights: boolean;
   shininess: number;
   camera: Camera;
   renderMode: RenderMode;
   whiteColor: glColor3;
   blackColor: glColor3;
   useShadows: boolean;
}

/**
 * Class that renders triangles and a light source
 */
export class Renderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private program: glProgram;
   public readonly yellow = new glColor3([1.0, 0.9, 0.7]);

   public options: IRenderOptions = {
      view: Mat4.identity,
      valueRange: ValueRange.Standard,
      lightPos: INITIAL_LIGHT_POS.clone(),
      lightType: LightType.Directional,
      falloff: INITIAL_FALLOFF,
      lightIntensity: INITIAL_LIGHT_INTENSITY,
      contours: [],

      useCulling: true,
      showHighlights: true,
      shininess: INITIAL_SHININESS,
      camera: new Camera(),
      whiteColor: glColor3.modelWhite,
      blackColor: glColor3.modelBlack,
      useShadows: true,

      renderMode: RenderMode.Normal,
   }

   private arrowOptions: IRenderOptions = {
      view: Mat4.identity,
      valueRange: new ValueRange(1.0, 0.4, 0.1),
      lightPos: new Vec3([-1, 0.5, 0.5]),
      lightType: LightType.Directional,
      falloff: 0.0,
      lightIntensity: INITIAL_LIGHT_INTENSITY,
      contours: [],
      useCulling: true,
      showHighlights: false,
      shininess: INITIAL_SHININESS,
      camera: new Camera({
         sizeProvider: new FixedSizeProvider(2, 2),
         useOrthographic: true,
      }),
      whiteColor: this.yellow,
      blackColor: htmlColor.black.toGlColor(),
      useShadows: false,

      renderMode: RenderMode.Normal,
   }

   private ballOptions: IRenderOptions = {
      view: Mat4.identity,
      valueRange: ValueRange.Standard,
      lightPos: new Vec3([-1, 0.5, 0.5]),
      lightType: LightType.Directional,
      falloff: 0.0,
      lightIntensity: INITIAL_LIGHT_INTENSITY,
      contours: [],
      useCulling: true,
      showHighlights: false,
      shininess: INITIAL_SHININESS,
      camera: new Camera({
         sizeProvider: new FixedSizeProvider(2, 2),
         useOrthographic: true,
      }),
      whiteColor: glColor3.modelWhite,
      blackColor: glColor3.modelBlack,
      useShadows: false,

      renderMode: RenderMode.Normal,
   }

   public set ballColor(color: glColor3) {
      this.ballOptions.whiteColor = color;
   }

   // size of the smaller view
   public readonly miniSize = 0.2;

   private ball: glObject;
   private arrow: glObject;
   public floor: glObject;
   public obj: glObject;

   private lightView: Mat4;
   private shadowFrameBuffer: glFrameBuffer;
   private shadowColorTexture: glTexture;
   private shadowDepthTexture: glTexture;

   public showShadowMap = false;
   public showMiniView = true;
   public showBall = true;
   public showFloor = true;
   public showGrid = false;
   public miniViewShowContours = false;
   public lockFloor = false;


   public constructor(glCtx: WebGLRenderingContext) {

      this.gl = glCtx;
      let gl = this.gl;

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
      this.arrowOptions.camera.useOrthographic = true;

      let style = getComputedStyle(<Element>gl.canvas);
      let color = htmlColor.fromCss(style.backgroundColor).toGlColor();
      gl.clearColor(color.r, color.g, color.b, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);


      // tests
      /*
      let light = new Vec3([0, 10, 0]);
      let pt = new Vec3([2, 0, 0]);
      let mat = new Mat4();
      mat.translate(new Vec3([0, -100, 0]));
      mat.scale(0.5);
      mat.rotZ(toRad(-90));
      mat.rotY(toRad(45));
      let xpt = mat.multVec3(pt);
      let xLight = mat.inverse().multVec3(light);
      let xOrigin = mat.inverse().multVec3(new Vec3([0, 0, 0]));
      let plane = new Plane(light);
      let plane2 = new Plane(xLight, xOrigin);
      console.log('\n\n----------------------');
      console.log('pt: ' + pt.toString(2) + '      xlight: ' + xLight.toString(2) + '   ' + (plane2.distToPt(pt) * mat.scaleFactors.x));
      console.log('xpt: ' + xpt.toString(2) + '    light: ' + light.toString(2) + '   ' + plane.distToPt(xpt));
      console.log('xOrigin: ' + xOrigin.toString(2));
      */
   }

   public delete() {
      this.obj.delete();
      this.floor.delete();
      this.ball.delete();
      this.arrow.delete();

      if (this.shadowFrameBuffer) {
         this.shadowFrameBuffer.delete();
         this.shadowColorTexture.delete();
         this.shadowDepthTexture.delete();
      }

      this.obj = null;
      this.floor = null;
      this.ball = null;
      this.arrow = null;
      this.shadowFrameBuffer = null;
      this.shadowColorTexture = null;
      this.shadowDepthTexture = null;
   }

   public renderModeCanToggleHighlights(): boolean {
      if (this.options.renderMode === RenderMode.EmphasizeHighlights || this.options.renderMode === RenderMode.LightAndShadow) {
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
      let vec = Vec4.fromVec3(this.options.lightPos, 1);
      vec = matX.multV(vec);
      vec = matY.multV(vec);
      this.options.lightPos = vec.xyz;
   }

   public get tObj(): TriangleObj {
      return this.obj.tObj;
   }

   public setModel(tObj: TriangleObj) {
      if (this.obj) {
         this.obj.delete();
      }
      this.obj = new glObject(this.gl, tObj, this.program);
      this.options.camera.sizeProvider = new ObjSizeProvider(this.obj);

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
   }

   public reset(what: Reset) {
      switch (what) {
         case Reset.All:
            this.reset(Reset.Lights);
            this.reset(Reset.Rendering);
            this.reset(Reset.View);

            break;
         case Reset.Lights:
            this.options.lightPos = INITIAL_LIGHT_POS.clone();
            this.options.falloff = INITIAL_FALLOFF;
            this.options.lightIntensity = INITIAL_LIGHT_INTENSITY;
            this.options.valueRange.ambientIntensity = ValueRange.Standard.ambientIntensity;
            break;

         case Reset.View:
            this.options.view = INITIAL_VIEW.clone();
            this.obj.clearTransforms();
            this.floor.clearTransforms();
            this.options.camera.eye = new Vec3(INITIAL_EYE);
            this.options.camera.lookAt = Vec3.origin;
            this.options.camera.zoomFactor = 1;

            break;

         case Reset.Rendering:
            this.options.renderMode = RenderMode.Normal;
            this.options.showHighlights = true;
            this.options.shininess = INITIAL_SHININESS;
            this.options.valueRange = ValueRange.Standard;
            break;
      }
   }

   public render(): void {

      this.program.use();
      this.renderToShadowMap();
      this.renderToScreen();
   }

   private setValueRangeUniforms(valueRange: ValueRange) {
      let uni = new glUniform(this.gl, this.program);
      uni.set('uDiffuseIntensity', valueRange.diffuseIntensity);
      uni.set('uAmbientIntensity', valueRange.shadow);
      uni.set('uSpecularIntensity', valueRange.specularIntensity);
   }

   private setOptions(options: IRenderOptions): glUniform {

      let gl = this.gl;
      options.useCulling ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      let uni = new glUniform(this.gl, this.program);
      uni.set('view', options.view);
      uni.set('lightView', this.lightView);
      uni.set('projection', options.camera.getProjection(this.gl));
      uni.set('uEye', options.camera.eye);
      uni.set('uOrthographic', options.camera.useOrthographic);
      uni.set('uUseShadows', options.useShadows);
      uni.seti('uRenderMode', options.renderMode);
      uni.set('uShowHighlights', options.showHighlights || options.renderMode === RenderMode.EmphasizeHighlights);
      uni.set('uShininess', options.shininess);

      let valueRange;
      if (options.renderMode === RenderMode.EmphasizeHighlights) {
         valueRange = ValueRange.EmphasizeHighlights;
      }
      else {
         valueRange = options.valueRange;
      }
      this.setValueRangeUniforms(valueRange);

      uni.set('uWhiteColor', options.whiteColor);
      uni.set('uBlackColor', options.blackColor);

      uni.seti('uNumContours', options.contours.length);
      for (let i = 0; i < options.contours.length; i++) {
         uni.set('uContourColors[' + i + ']', options.contours[i].color);
         uni.set('uContourAngles[' + i + ']', options.contours[i].angle);
      }

      uni.set('uPointLight', options.lightType === LightType.Point);
      uni.set('uFalloff', options.falloff);
      uni.set('uLightIntensity', options.lightIntensity);
      if (options.falloff === 0) {
         uni.set('uLightPos', options.lightPos);
      }
      else {
         // compute the minimum distance to the light. We'll use this value to auto-adjust
         // the light
         let dist: IMinMax;

         // We can get the distance in two ways. 1: transform all the points by the model
         // matrix and compute distances. This is expensive since we have to transform each
         // point so we instead, 2: do the inverse transform to the light and compute the
         // distance to the untransformed points.
         let boundingPts = this.obj.tObj.getBoundingPts();

         // get the inverse transform of the light position
         let obj = this.obj;
         let mat = obj.model.multM(obj.normalize);
         let inverse = mat.inverse();
         let xLightPos = inverse.multVec3(options.lightPos);

         if (options.lightType === LightType.Point) {

            // TODO use the inverse light
            dist = boundingPts.distToPoint(options.lightPos);
         }
         else {
            // figure out the light plane for the inverse light
            let xOrigin = inverse.multVec3(Vec3.origin);
            let plane = new Plane(xLightPos, xOrigin);

            // distance to the raw object points
            dist = boundingPts.distToPlane(plane);
         }

         // to get the actual distance, we now need to reapply the scale factor to
         // get the true distance. The scale factor is the same in all directions
         // so just use the x value
         let s = obj.model.multM(obj.normalize).scaleFactors.x;

         dist = {
            min: dist.min * s,
            max: dist.max * s,
         }

         // we need to compute the distance to the light and the light intensity such that
         // the closes point gets lit with value 1 and the furthese point matches the
         // target falloff.
         //
         // - d is the distance the light needs to be from the closest point. Light falls off
         // with the square of distance.
         // - falloffDistance is the size of the object
         let falloffDistance = dist.max - dist.min;
         let d = (falloffDistance * Math.sqrt(1.0 - options.falloff)) / (1.0 - Math.sqrt(1.0 - options.falloff));

         // intensity = d^2 so that intensity at d (1/d^2) = 1.0
         let lightIntensityAtSource = d * d;
         uni.set('uLightIntensityAtSource', lightIntensityAtSource);

         // actual light position is measured from the object, not the origin. Shift 
         // it back
         let objToOrigin = options.lightPos.magnitude() - dist.min;
         uni.set('uLightPos', options.lightPos.normalize().mult(d + objToOrigin));
      }

      return uni;
   }

   private renderToShadowMap(): void {

      let gl = this.gl;
      let maxTextureSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE));
      let desiredSize = this.options.camera.zoomFactor * Math.min(gl.canvas.width, gl.canvas.height);
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

      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      let center = new Vec3([0, 0, 0]);
      let up = new Vec3([0, 1, 0]);
      let eye = this.options.lightPos;
      let mat = Mat4.makeLookAt(eye, center, up);
      mat.set(0, 3, 0);
      mat.set(1, 3, 0);
      mat.set(2, 3, 0);
      if (this.options.lightType === LightType.Directional) {
         // to avoid clipping, expand the z range to allow full rotation of
         // anything in a 3-3-3 cube.
         let maxSize = Math.sqrt(27);
         mat = Mat4.makeOrtho(-1, 1, -1, 1, maxSize, -maxSize).multM(mat);
         this.lightView = mat;
      }
      else {
         // TODO make point light sources work for shadow maps
         /*
         let fov = 2 * toDeg(Math.atan2(3 / 2, eye.z));
         console.log('fov=' + fov);
         mat = Mat4.makePerspective(fov, 1, 0.1, 20).multM(mat);
         this.lightView = mat;
         */
         let maxSize = Math.sqrt(27);
         mat = Mat4.makeOrtho(-1, 1, -1, 1, maxSize, -maxSize).multM(mat);
         this.lightView = mat;
      }

      let uni = this.setOptions(this.options);

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
         this.shadowDepthTexture.bind();

         gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

         this.drawFloor();

         // draw the main object
         this.setOptions(this.options);
         this.obj.draw();

         gl.clear(gl.DEPTH_BUFFER_BIT);

         this.drawMiniView();
         this.drawBall();

         gl.bindTexture(gl.TEXTURE_2D, null);
         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
   }

   private drawFloor() {
      if (this.showFloor) {

         let gl = this.gl;
         let uni = this.setOptions(this.options);

         // set the special mode for the floor
         uni.set('uRenderingFloor', true);
         uni.set('uShowGrid', this.showGrid);

         // cull polygons so we don't see the floor from below
         gl.enable(gl.CULL_FACE);
         gl.cullFace(gl.BACK);
         uni.seti('uRenderMode', RenderMode.Normal);
         //this.setValueRangeUniforms(ValueRange.Standard);

         this.floor.draw();

         uni.set('uRenderingFloor', false);
      }
   }

   private drawMiniView() {

      if (this.showMiniView) {
         let gl = this.gl;
         gl.enable(gl.CULL_FACE);

         let uni = this.setOptions(this.options);

         let clipSpace = this.options.camera.getClipSpace(gl);
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

      // create a view matrix that renders in the upper left
      let clipSpace = this.options.camera.getClipSpace(gl);
      let view = Mat4.identity;
      view.scale(this.miniSize);
      view.translate(new Vec3([clipSpace.min.x + this.miniSize, clipSpace.max.y - this.miniSize, 0]));

      this.ballOptions.lightPos = this.options.lightPos.clone();
      this.ballOptions.view = view.clone();
      this.setOptions(this.ballOptions);
      this.ball.draw();

      // back out angles as if looking down the z-axis
      let x = -this.options.lightPos.x;
      let y = -this.options.lightPos.y;
      let z = -this.options.lightPos.z;

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

      this.arrowOptions.view = view.clone();
      this.setOptions(this.arrowOptions);
      this.arrow.draw();
   }
}