import { Vec3 } from "../../Util3D/Vec";
import { IndexedTriangle } from "../../Util3D/IndexedTriangle";

const MAX = 1000; // INFINITY in our rendering world

/**
 * Class that manages a set of triangles within a given space
 */
export class Volume {
   /**
    * The triangles enclosed within the bounding box
    */
   public triangles: IndexedTriangle[] = [];

   /**
    * Bounding box minimum
    */
   public boxMin = new Vec3([MAX, MAX, MAX]);

   /**
    * Bounding box maximum
    */
   public boxMax = new Vec3([-MAX, -MAX, -MAX]);

   /**
    * Stores a triangle and updates the bounding box
    * 
    * @param triangle The triangle to store
    */
   public push(triangle: IndexedTriangle) {

      this.triangles.push(triangle);
      this.boxMin.x = Math.min(this.boxMin.x, triangle.minX);
      this.boxMin.y = Math.min(this.boxMin.y, triangle.minY);
      this.boxMin.z = Math.min(this.boxMin.z, triangle.minZ);
      this.boxMax.x = Math.max(this.boxMax.x, triangle.maxX);
      this.boxMax.y = Math.max(this.boxMax.y, triangle.maxY);
      this.boxMax.z = Math.max(this.boxMax.z, triangle.maxZ);
   }
}
