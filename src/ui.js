////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

function UI() {
   this.renderer = new Renderer();
 }
 
 UI.prototype.setObjects = function(objects) {
   this.objects = objects;
   this.objects.splice(0, 0, new Light());
   this.renderer.setObjects(this.objects);
 };
 
 UI.prototype.update = function(timeSinceStart) {
   this.modelview = makeLookAt(eye.elements[0], eye.elements[1], eye.elements[2], 0, 0, 0, 0, 1, 0);
   this.projection = makePerspective(55, 1, 0.1, 100);
   this.modelviewProjection = this.projection.multiply(this.modelview);
   this.renderer.update(this.modelviewProjection, timeSinceStart);
 };
 
 UI.prototype.render = function() {
   this.renderer.render();
 };
 
 UI.prototype.addSphere = function() {
   this.objects.push(new Sphere(Vector.create([0, 0, 0]), 0.25, nextObjectId++));
   this.renderer.setObjects(this.objects);
 };
 
 ////////////////////////////////////////////////////////////////////////////////
 // main program
 ////////////////////////////////////////////////////////////////////////////////
 
 var gl;
 var ui;
 var canvas;
 
 var angleX = 0;
 var angleY = 0;
 var zoomZ = 2.5;
 var eye = Vector.create([0, 0, 0]);
 var light = Vector.create([0.4, 0.5, -0.6]);
 
 var nextObjectId = 0;
  
 function tick(timeSinceStart) {
   eye.elements[0] = zoomZ * Math.sin(angleY) * Math.cos(angleX);
   eye.elements[1] = zoomZ * Math.sin(angleX);
   eye.elements[2] = zoomZ * Math.cos(angleY) * Math.cos(angleX);
 
   ui.update(timeSinceStart);
   ui.render();
 }
 
 window.onload = function() {
   gl = null;
   canvas = document.getElementById('canvas');
   try { gl = canvas.getContext('webgl'); } catch(e) {}
 
   if(gl) {
     ui = new UI();
     ui.setObjects([new Sphere(Vector.create([0, -0.5, 0]), 0.5, nextObjectId++)]); // SAW initial object
     var start = new Date();
     setInterval(function(){ tick((new Date() - start) * 0.001); }, 1000 / 60);
   }
 };
 
 function elementPos(element) {
   var x = 0, y = 0;
   while(element.offsetParent) {
     x += element.offsetLeft;
     y += element.offsetTop;
     element = element.offsetParent;
   }
   return { x: x, y: y };
 }
 
 function eventPos(event) {
   return {
     x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
     y: event.clientY + document.body.scrollTop + document.documentElement.scrollTop
   };
 }
 
 function canvasMousePos(event) {
   var mousePos = eventPos(event);
   var canvasPos = elementPos(canvas);
   return {
     x: mousePos.x - canvasPos.x,
     y: mousePos.y - canvasPos.y
   };
 }
 
 var mouseDown = false, oldX, oldY;
 
 document.onmousedown = function(event) {
   var mouse = canvasMousePos(event);
   oldX = mouse.x;
   oldY = mouse.y;
 
   if(mouse.x >= 0 && mouse.y >= 0) {
 
    mouseDown = true;
 
    // disable selection because dragging is used for rotating the camera and moving objects
     return false;
   }
 
   return true;
 };
 
 document.onmousemove = function(event) {
   var mouse = canvasMousePos(event);
 
   if(mouseDown) {
     // update the angles based on how far we moved since last time
     angleY -= (mouse.x - oldX) * 0.01;
     angleX += (mouse.y - oldY) * 0.01;
 
     // don't go upside down
     angleX = Math.max(angleX, -Math.PI / 2 + 0.01);
     angleX = Math.min(angleX, Math.PI / 2 - 0.01);
 
     // clear the sample buffer
     ui.renderer.pathTracer.sampleCount = 0;
 
     // remember this coordinate
     oldX = mouse.x;
     oldY = mouse.y;
   }
 };
 
 document.onmouseup = function(event) {
   mouseDown = false;
 };
 
 