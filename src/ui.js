////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

function UI() {
   this.renderer = new Renderer();
}

UI.prototype.setObjects = function (objects) {
   this.objects = objects;
   this.objects.splice(0, 0, new Light());
   this.renderer.setObjects(this.objects);
};

UI.prototype.update = function (timeSinceStart) {
   this.modelview = makeLookAt(eye.elements[0], eye.elements[1], eye.elements[2], 0, 0, 0, 0, 1, 0);
   this.projection = makePerspective(55, 1, 0.1, 100);
   this.modelviewProjection = this.projection.multiply(this.modelview);
   this.renderer.update(this.modelviewProjection, timeSinceStart);
};

UI.prototype.render = function () {
   this.renderer.render();
};

UI.prototype.addSphere = function () {
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
var zoomZ = 3.0;
var eye = Vector.create([0, 0, 0]);
var light = Vector.create([-0.4, 0.5, 0.6]); // SAW light position

var nextObjectId = 0;

function tick(timeSinceStart) {
   eye.elements[0] = zoomZ * Math.sin(angleY) * Math.cos(angleX);
   eye.elements[1] = zoomZ * Math.sin(angleX);
   eye.elements[2] = zoomZ * Math.cos(angleY) * Math.cos(angleX);

   ui.update(timeSinceStart);
   ui.render();
}

window.onload = function () {
   gl = null;
   canvas = document.getElementById('canvas');
   try { gl = canvas.getContext('webgl'); } catch (e) { }

   if (gl) {
      ui = new UI();
      ui.setObjects([new Sphere(Vector.create([0, -0.5, 0]), 0.5, nextObjectId++)]); // SAW initial object
      var start = new Date();
      setInterval(function () { tick((new Date() - start) * 0.001); }, 1000 / 60);
   }

   var slider = document.getElementById("range1");
   slider.value = this.ui.renderer.pathTracer.uniforms.lightIntensity * 50;
   slider.oninput = function () {
      ui.renderer.pathTracer.uniforms.lightIntensity = slider.value / 50;
      ui.renderer.pathTracer.sampleCount = 0;
   }

   function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }
    
    function rgbToHex(r, g, b) {
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    
    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
         r: parseInt(result[1], 16),
         g: parseInt(result[2], 16),
         b: parseInt(result[3], 16)
      } : null;
   }

   var lightPicker = document.getElementById("picker1");
   var r = Math.trunc(255*ui.renderer.pathTracer.uniforms.lightColor.elements[0]);
   var g = Math.trunc(255*ui.renderer.pathTracer.uniforms.lightColor.elements[1]);
   var b = Math.trunc(255*ui.renderer.pathTracer.uniforms.lightColor.elements[2]);
   lightPicker.value = rgbToHex(r,g,b)
   lightPicker.oninput = function () {
      var color = hexToRgb(lightPicker.value);
      ui.renderer.pathTracer.uniforms.lightColor.elements = [color.r/255.0, color.g/255.0, color.b/255.0];
      ui.renderer.pathTracer.sampleCount = 0;
   }

   var ballPicker = document.getElementById("picker2");
   r = Math.trunc(255*ui.renderer.pathTracer.uniforms.ballColor.elements[0]);
   g = Math.trunc(255*ui.renderer.pathTracer.uniforms.ballColor.elements[1]);
   b = Math.trunc(255*ui.renderer.pathTracer.uniforms.ballColor.elements[2]);
   ballPicker.value = rgbToHex(r,g,b)
   ballPicker.oninput = function () {
      var color = hexToRgb(ballPicker.value);
      ui.renderer.pathTracer.uniforms.ballColor.elements = [color.r/255.0, color.g/255.0, color.b/255.0];
      ui.renderer.pathTracer.sampleCount = 0;
   }
};

function elementPos(element) {
   var x = 0, y = 0;
   while (element.offsetParent) {
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

document.onmousedown = function (event) {
   var mouse = canvasMousePos(event);
   oldX = mouse.x;
   oldY = mouse.y;

   if (mouse.x >= 0 && mouse.y >= 0 && mouse.x < 512 && mouse.y < 512) {

      mouseDown = true;

      // disable selection because dragging is used for rotating the camera and moving objects
      return false;
   }

   return true;
};

document.onmousemove = function (event) {
   var mouse = canvasMousePos(event);

   if (mouseDown) {
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

document.onmouseup = function (event) {
   mouseDown = false;
};

