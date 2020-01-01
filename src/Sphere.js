////////////////////////////////////////////////////////////////////////////////
// class Sphere
////////////////////////////////////////////////////////////////////////////////

function Sphere(center, radius, id) {
   this.center = center;
   this.radius = radius;
   this.centerStr = 'sphereCenter' + id;
   this.radiusStr = 'sphereRadius' + id;
 }
     
 Sphere.prototype.setUniforms = function(renderer) {
   renderer.uniforms[this.centerStr] = this.center;
   renderer.uniforms[this.radiusStr] = this.radius;
 };
  
