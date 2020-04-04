import { Vec3 } from "./Vec";
import { TriangleObj } from "./TriangleObj";
import { IndexedTriangle } from "./IndexedTriangle";
import { TriangleObjBuilder } from "./TriangleObjBuilder";

/**
 * Creates a 3D arrow using triangles
 */
export class TriangleArrow extends TriangleObjBuilder {

   public constructor() {

      super('Arrow');
      super.addArrow();
   }
}
