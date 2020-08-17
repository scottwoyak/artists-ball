/**
 * Spherical coordinates based on the WebGL viewing system: x=left-right, y=up-down, z=near-far
 */
export class SphericalCoord {
   /**
    * The distance from the origin to the point
    */
   public radius = 0;

   /**
    * The elevation from the floor to the point. 0 and 180 are on the
    * floor. 90 points up.
    */
   public elevationAngle = 0;

   /**
    * The angle, when looking down from the top, to the point. 0 points right.
    */
   public rotationAngle = 0;

   /**
    * @param radius
    * @param elevationAngle 
    * @param rotationAngle 
    */
   public constructor(radius: number, elevationAngle: number, rotationAngle: number) {
      this.radius = radius;
      this.elevationAngle = elevationAngle;
      this.rotationAngle = rotationAngle;
   }

   /**
    * Creates a spherical coordinate from a cartesian point
    * 
    * @param pos The cartesian point.
    * @returns The spherical coordinate.
    */
   public static fromXYZ(pos: number[]): SphericalCoord {

      const x = pos[0];
      const y = pos[1];
      const z = pos[2];

      const radius = Math.sqrt(x * x + y * y + z * z);
      const rotationAngle = (180 / Math.PI) * Math.atan2(z, x);
      const elevationAngle = (180 / Math.PI) * Math.asin(y / radius);

      return new SphericalCoord(radius, elevationAngle, rotationAngle);
   }

   /**
    * Converts this spherical coordinate to a cartesian coordinate.
    * 
    * @returns The cartesian coordinate.
    */
   public toXYZ(): number[] {

      const floorRadius = this.radius * Math.cos((Math.PI / 180) * this.elevationAngle);
      const x = floorRadius * Math.cos((Math.PI / 180) * this.rotationAngle);
      const y = this.radius * Math.sin((Math.PI / 180) * this.elevationAngle);
      const z = floorRadius * Math.sin((Math.PI / 180) * this.rotationAngle);

      return [x, y, z];
   }
}

