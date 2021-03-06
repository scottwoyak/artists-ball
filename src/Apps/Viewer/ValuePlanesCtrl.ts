import vertexSource from '../../shaders/ViewerVertex.glsl';
import fragmentSource from '../../shaders/ViewerFragment.glsl';
import { Vec3, Vec2 } from '../../Util3D/Vec';
import { glProgram } from '../../gl/glProgram';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { ValuePlanes } from './ValuePlanes';
import { glObject } from './glObject';
import { isMobile, clamp, toDeg, toRad } from '../../Util/Globals';
import { TriangleObjBuilder } from '../../Util3D/TriangleObjBuilder';
import { NormalType } from '../../Util3D/TriangleObj';
import { glColor3 } from '../../gl/glColor';
import { glUniform } from '../../gl/glUniform';
import { Mat4 } from '../../Util3D/Mat';
import { ValueRange } from './ValueRange';
import { RenderMode } from './Renderer';
import { htmlColor } from '../../Util/htmlColor';

export type ThresholdChangeFunction = (value: number) => void;

const BALL_RADIUS = 0.875;
const BALL_CENTER = new Vec3([-0.6, -0.6, 0]);


let CTRL_SIZE = 150;
const NOMINAL_DISPLAY_SIZE = 150;
const NOMINAL_KNOB_LENGTH = 25;
const NOMINAL_KNOB_RADIUS = 10;

export class ValuePlanesCtrl {
   private gl: WebGLRenderingContext;
   private program: glProgram;
   private overlay: HTMLCanvasElement;
   private mouseOffset = new Vec2();
   private hit = 0;
   private handler: PointerEventHandler;
   private provider: ValuePlanes;

   private ball: glObject;
   private arrow: glObject;
   private ballCenter: Vec2;
   private p1: Vec2;
   private p2: Vec2;

   private onThreshold1Change: ThresholdChangeFunction;
   private onThreshold2Change: ThresholdChangeFunction;

   public constructor(
      parent: HTMLElement,
      provider: ValuePlanes,
      onThreshold1Change: ThresholdChangeFunction,
      onThreshold2Change: ThresholdChangeFunction
   ) {

      if (isMobile) {
         CTRL_SIZE = 300;
      }

      this.provider = provider;
      this.onThreshold1Change = onThreshold1Change;
      this.onThreshold2Change = onThreshold2Change;

      const canvas = document.createElement('canvas');
      canvas.id = 'ValuePlanesCanvas';
      canvas.width = CTRL_SIZE;
      canvas.height = CTRL_SIZE;
      parent.appendChild(canvas);

      // don't try to make the canvas transparent to the underlying html. This
      // seems to limit the alpha values we can use in our scene.
      const context = canvas.getContext('webgl') as WebGLRenderingContext;

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      this.gl = context;

      this.overlay = document.createElement('canvas');
      this.overlay.id = 'ValuePlanesOverlayCanvas';
      this.overlay.width = CTRL_SIZE;
      this.overlay.height = CTRL_SIZE;

      parent.appendChild(this.overlay);

      this.handler = new PointerEventHandler(this.overlay);
      this.handler.onDown = (pos: Vec2) => this.onDown(pos);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      const gl = this.gl;
      gl.enable(gl.DEPTH_TEST);

      this.program = new glProgram(gl, vertexSource, fragmentSource);

      const tBall = new TriangleObjBuilder('Ball');
      tBall.addSphere(50, BALL_RADIUS, BALL_CENTER);
      tBall.optimize(NormalType.Smooth);
      this.ball = new glObject(gl, tBall, this.program);

      const tArrow = new TriangleObjBuilder('Light Arrow');
      tArrow.addArrow();
      this.arrow = new glObject(gl, tArrow, this.program);

      this.draw();
   }

   private onDown(pos: Vec2) {

      this.hitTest(pos);
   }

   private hitTest(pos: Vec2) {
      const d1 = this.p1.distance(pos);
      const d2 = this.p2.distance(pos);

      const HIT_RADIUS = NOMINAL_KNOB_RADIUS * (CTRL_SIZE / NOMINAL_DISPLAY_SIZE);
      if (d1 < HIT_RADIUS && d1 <= d2) {
         this.hit = 1;
         this.mouseOffset = new Vec2([this.p1.x - pos.x, this.p1.y - pos.y]);
      }
      else if (d2 < HIT_RADIUS && d2 <= d1) {
         this.hit = 2;
         this.mouseOffset = new Vec2([this.p2.x - pos.x, this.p2.y - pos.y]);
      }
      else {
         this.hit = 0;
      }
   }

   private onDrag(pos: Vec2, delta: Vec2) {
      if (this.hit > 0) {
         const hitPt = new Vec2([pos.x + this.mouseOffset.x, pos.y + this.mouseOffset.y]);
         hitPt.x = Math.max(hitPt.x, this.ballCenter.x);
         hitPt.y = Math.min(hitPt.y, this.ballCenter.y);
         const radius = this.ballCenter.distance(hitPt);
         const angle = clamp(toDeg(Math.asin((hitPt.x - this.ballCenter.x) / radius)), 0, 90);
         if (this.hit == 1) {
            this.provider.threshold1 = angle;
            this.onThreshold1Change(angle);
         }
         else {
            this.provider.threshold2 = angle;
            this.onThreshold2Change(angle);
         }

         this.draw();
      }
   }

   private toGLColor(val: number): glColor3 {
      return new glColor3([val, val, val]);
   }

   private setStdUniforms(): glUniform {

      const uni = new glUniform(this.gl, this.program);
      uni.set('view', Mat4.identity);
      uni.set('projection', Mat4.ortho);
      uni.set('uEye', new Vec3([0, 0, 1]));
      uni.set('uOrthographic', true);

      uni.set('uDiffuseIntensity', ValueRange.Standard.diffuseIntensity);
      uni.set('uAmbientIntensity', ValueRange.Standard.shadow);
      uni.set('uSpecularIntensity', ValueRange.Standard.specularIntensity);
      uni.set('uLightIntensity', 1.0);
      uni.set('uFalloff', 0);

      uni.set('uWhiteColor', glColor3.modelWhite);
      uni.set('uBlackColor', glColor3.modelBlack);

      const contourColors = [
         this.toGLColor(this.provider.lightLight),
         this.toGLColor(this.provider.midLight),
         this.toGLColor(this.provider.darkLight),
      ]
      uni.seti('uNumContours', contourColors.length);
      for (let i = 0; i < contourColors.length; i++) {
         uni.set('uContourColors[' + i + ']', contourColors[i]);
      }

      uni.set('uContourAngles[0]', this.provider.threshold1);
      uni.set('uContourAngles[1]', this.provider.threshold2);
      uni.set('uContourAngles[2]', 90);

      return uni;
   }

   public draw() {

      this.drawBall();
      this.drawOverlay();
   }

   private drawBall() {
      const gl = this.gl;
      gl.clear(gl.COLOR_BUFFER_BIT);

      const uni = this.setStdUniforms();

      // always render with bands
      uni.seti('uRenderMode', RenderMode.ContourPlanes);

      // shoot the light straight down
      uni.set('uLightPos', new Vec3([0, 1, 0]));

      // don't cast shadows
      uni.set('uUseShadows', false);

      // render the ball
      this.ball.draw();

      // draw the arrow
      uni.set('uLightPos', new Vec3([-1, -0.5, 0.5]));
      uni.seti('uRenderMode', RenderMode.Normal);

      // first reset things so that we're looking down the z-axis
      this.arrow.clearTransforms();
      this.arrow.scale(1.25)
      this.arrow.translate(new Vec3([BALL_CENTER.x, BALL_CENTER.y + BALL_RADIUS + 0.1, 0.0]));

      uni.set('uWhiteColor', new glColor3([1.0, 1.0, 0.5]));
      uni.set('uBlackColor', htmlColor.black.toGlColor());
      uni.set('uAmbientIntensity', 0.4);
      uni.set('uDiffuseIntensity', 0.6);
      this.arrow.draw();
   }

   private drawOverlay() {
      const ctx = this.overlay.getContext('2d');
      this.ballCenter = new Vec2([
         CTRL_SIZE * (1 + BALL_CENTER.x) / 2,
         CTRL_SIZE * (1 - BALL_CENTER.y) / 2
      ]);

      ctx.clearRect(0, 0, CTRL_SIZE, CTRL_SIZE);
      ctx.fillStyle = 'limegreen';
      ctx.strokeStyle = 'black'

      const KNOB_LENGTH = NOMINAL_KNOB_LENGTH * (CTRL_SIZE / NOMINAL_DISPLAY_SIZE);
      const KNOB_RADIUS = NOMINAL_KNOB_RADIUS * (CTRL_SIZE / NOMINAL_DISPLAY_SIZE);
      const r = CTRL_SIZE * BALL_RADIUS / 2;
      const s1 = this.getPt(this.ballCenter, this.provider.threshold1, r);
      this.p1 = this.getPt(this.ballCenter, this.provider.threshold1, r + KNOB_LENGTH);
      const s2 = this.getPt(this.ballCenter, this.provider.threshold2, r);
      this.p2 = this.getPt(this.ballCenter, this.provider.threshold2, r + KNOB_LENGTH);

      ctx.lineWidth = (1 / 150) * CTRL_SIZE;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(this.p1.x, this.p1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.p1.x, this.p1.y, KNOB_RADIUS, 0, toRad(360));
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.p2.x, this.p2.y, KNOB_RADIUS, 0, toRad(360));
      ctx.fill();
      ctx.stroke();
   }

   private getPt(center: Vec2, threshold: number, radius: number): Vec2 {

      const oy = radius * Math.sin(toRad(90 - threshold));
      const ox = radius * Math.cos(toRad(90 - threshold));

      return new Vec2([center.x + ox, center.y - oy]);
   }
}