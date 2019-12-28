/**
 * originally from https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/PointerLockControls.js
 * @author mrdoob / http://mrdoob.com/
 *
 * edited by Erich Loftis (erichlof on GitHub)
 * https://github.com/erichlof
 * Btw, this is the most consice and elegant way to implement first person camera rotation/movement that I've ever seen -
 * look at how short it is, without spaces/braces it would be around 30 lines!  Way to go, mrdoob!
 */

import * as THREE from 'three';

export class FirstPersonCameraControls {

   private pitchObject = new THREE.Object3D();
   private yawObject = new THREE.Object3D();

   constructor(camera: any) {

      camera.rotation.set(0, 0, 0);

      this.pitchObject.add(camera);

      this.yawObject.add(this.pitchObject);
   }


   public getObject(): THREE.Object3D {

      return this.yawObject;

   };

   public getYawObject(): THREE.Object3D {

      return this.yawObject;

   };

   public getPitchObject(): THREE.Object3D {

      return this.pitchObject;

   };

   public getDirection(v: THREE.Vector3): THREE.Vector3 {

      var te = this.pitchObject.matrixWorld.elements;
      v.set(te[8], te[9], te[10]).negate();
      return v;

   }

   public getUpVector(v: THREE.Vector3): THREE.Vector3 {

      var te = this.pitchObject.matrixWorld.elements;
      v.set(te[4], te[5], te[6]);
      return v;

   }

   public getRightVector(v: THREE.Vector3): THREE.Vector3 {

      var te = this.pitchObject.matrixWorld.elements;
      v.set(te[0], te[1], te[2]);
      return v;

   }
}
