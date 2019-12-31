////////////////////////////////////////////////////////////////////////////////
// class Renderer
////////////////////////////////////////////////////////////////////////////////

function Renderer() { 
   this.objects = [];
   this.pathTracer = new PathTracer();
 }
 
 Renderer.prototype.setObjects = function(objects) {
   this.objects = objects;
   this.pathTracer.setObjects(objects);
 };
 
 Renderer.prototype.update = function(modelviewProjection, timeSinceStart) {
   var jitter = Matrix.Translation(Vector.create([Math.random() * 2 - 1, Math.random() * 2 - 1, 0]).multiply(1 / 512));
   var inverse = jitter.multiply(modelviewProjection).inverse();
   this.modelviewProjection = modelviewProjection;
   this.pathTracer.update(inverse, timeSinceStart);
 };
 
 Renderer.prototype.render = function() {
   this.pathTracer.render(); 
 };
 
 