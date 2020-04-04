import { Vec3 } from "./Vec";
import { TriangleObj } from "./TriangleObj";
import { IndexedTriangle } from "./IndexedTriangle";
import { TriangleObjBuilder } from "./TriangleObjBuilder";

/**
 * Creates a sphere using triangles
 */
export class TriangleSphere extends TriangleObjBuilder {

   /**
    * Creates the sphere
    * 
    * @param numSteps The number of bands used to cover the sphere
    * @param radius The radius of the sphere
    * @param center The center of the sphere
    */
   public constructor(numSteps: number, radius: number, center: Vec3) {

      super('Sphere');

      super.addSphere(numSteps, radius, center);
   }
}
