import { Vec2 } from '../../Util3D/Vec';

export enum RectHit {
   UL,
   UR,
   LL,
   LR,
   Inside,
   None,
}

export class Rect {
   public x: number;
   public y: number;
   public width: number;
   public height: number;

   public get left(): number {
      return this.x;
   }

   public get top(): number {
      return this.y;
   }

   public get right(): number {
      return this.x + this.width;
   }

   public get bottom(): number {
      return this.y + this.height;
   }

   public constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
   }

   public getScaled(factor: number): Rect {
      return new Rect(factor * this.x, factor * this.y, factor * this.width, factor * this.height);
   }

   public inside(pos: Vec2): boolean {
      if (pos.x > this.x && pos.x < this.right && pos.y > this.y && pos.y < this.bottom) {
         return true;
      }
      else {
         return false;
      }
   }

   public hit(pos: Vec2, epsilon: number): RectHit {
      let ul = new Vec2([this.x, this.y]);
      let ur = new Vec2([this.right, this.y]);
      let ll = new Vec2([this.x, this.bottom]);
      let lr = new Vec2([this.right, this.bottom]);

      if (pos.distance(ul) < epsilon) {
         return RectHit.UL;
      }
      else if (pos.distance(ur) < epsilon) {
         return RectHit.UR;
      }
      else if (pos.distance(ll) < epsilon) {
         return RectHit.LL;
      }
      else if (pos.distance(lr) < epsilon) {
         return RectHit.LR;
      }
      else if (pos.x > this.x && pos.x < this.right && pos.y > this.y && pos.y < this.bottom) {
         return RectHit.Inside;
      }
      else {
         return RectHit.None
      }

   }
}
