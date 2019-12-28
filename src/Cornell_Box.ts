import * as THREE from 'three';
import { FirstPersonCameraControls } from '../src/FirstPersonCameraControls';
import { screenTextureShader} from '../src/pathTracingCommon';
import { screenOutputShader} from '../src/pathTracingCommon';

var SCREEN_WIDTH;
var SCREEN_HEIGHT;
var canvas;
var context: WebGLRenderingContext;
var container;
var controls: FirstPersonCameraControls;
var pathTracingScene: THREE.Scene;
var screenTextureScene: THREE.Scene;
var screenOutputScene: THREE.Scene;
var pathTracingUniforms: any;
var pathTracingDefines: any;
var pathTracingVertexShader: string;
var pathTracingFragmentShader;
var pathTracingGeometry: THREE.PlaneBufferGeometry;
var pathTracingMaterial;
var pathTracingMesh;
var screenTextureGeometry;
var screenTextureMaterial;
var screenTextureMesh;
var screenOutputGeometry;
var screenOutputMaterial: THREE.ShaderMaterial;
var screenOutputMesh;
var pathTracingRenderTarget: THREE.WebGLRenderTarget;
var quadCamera: THREE.OrthographicCamera;
var worldCamera: THREE.PerspectiveCamera;
var renderer: THREE.WebGLRenderer;
var fovScale;
var apertureSize = 0.0;
var focusDistance = 132.0;
var pixelRatio = 0.5;
var windowIsBeingResized = false;
var randomVector = new THREE.Vector3();
var sampleCounter = 1.0;
var frameCounter = 1.0;
var cameraIsMoving = false;
var cameraRecentlyMoving = false;
var oldYawRotation: number;
var oldPitchRotation: number;
var oldDeltaX = 0;
var oldDeltaY = 0;
var newDeltaX = 0;
var newDeltaY = 0;
var mobileControlsMoveX = 0;
var mobileControlsMoveY = 0;
var stillFlagX = true;
var stillFlagY = true;
var oldPinchWidthX = 0;
var oldPinchWidthY = 0;
var pinchDeltaX = 0;
var pinchDeltaY = 0;
var fontAspect;

// the following variables will be used to calculate rotations and directions from the camera
var cameraDirectionVector = new THREE.Vector3(); //for moving where the camera is looking
var cameraRightVector = new THREE.Vector3(); //for strafing the camera right and left
var cameraUpVector = new THREE.Vector3(); //for moving camera up and down
var cameraWorldQuaternion = new THREE.Quaternion(); //for rotating scene objects to match camera's current rotation
var cameraControlsObject: THREE.Object3D; //for positioning and moving the camera itself
var cameraControlsYawObject: THREE.Object3D; //allows access to control camera's left/right movements through mobile input
var cameraControlsPitchObject: THREE.Object3D; //allows access to control camera's up/down movements through mobile input

var PI_2 = Math.PI / 2; //used by controls below

var screenTextureRenderTarget: THREE.WebGLRenderTarget;

var fileLoader = new THREE.FileLoader();




function onWindowResize(event: any) {

   windowIsBeingResized = true;

   SCREEN_WIDTH = window.innerWidth;
   SCREEN_HEIGHT = window.innerHeight;

   renderer.setPixelRatio(pixelRatio);
   renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

   fontAspect = (SCREEN_WIDTH / 175) * (SCREEN_HEIGHT / 200);
   if (fontAspect > 25) fontAspect = 25;
   if (fontAspect < 4) fontAspect = 4;
   fontAspect *= 2;

   pathTracingUniforms.uResolution.value.x = context.drawingBufferWidth;
   pathTracingUniforms.uResolution.value.y = context.drawingBufferHeight;

   pathTracingRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);
   screenTextureRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);

   worldCamera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
   worldCamera.updateProjectionMatrix();

   // the following scales all scene objects by the worldCamera's field of view,
   // taking into account the screen aspect ratio and multiplying the uniform uULen,
   // the x-coordinate, by this ratio
   fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
   pathTracingUniforms.uVLen.value = Math.tan(fovScale);
   pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

} // end function onWindowResize( event )



export function init() {

   window.addEventListener('resize', onWindowResize, false);

   /*
   // Fullscreen API
   document.addEventListener("click", function() {
   	
        if ( !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement ) {

            if (document.documentElement.requestFullscreen) {
                 document.documentElement.requestFullscreen();
            	
            } else if (document.documentElement.mozRequestFullScreen) {
                 document.documentElement.mozRequestFullScreen();
        	
            } else if (document.documentElement.webkitRequestFullscreen) {
                 document.documentElement.webkitRequestFullscreen();
        	
            }

        }
   });
   */

   initTHREEjs(); // boilerplate: init necessary three.js items and scene/demo-specific objects

} // end function init()



function initTHREEjs() {

   canvas = document.createElement('canvas');

   renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      context: canvas.getContext('webgl2') as WebGLRenderingContext 
   });

   context = renderer.getContext();

   renderer.autoClear = false;
   // 1 is full resolution, 0.5 is half, 0.25 is quarter, etc. (must be > than 0.0)
   renderer.setPixelRatio(pixelRatio);
   renderer.setSize(window.innerWidth, window.innerHeight);
   //required by WebGL 2.0 for rendering to FLOAT textures
   context.getExtension('EXT_color_buffer_float');

   container = document.getElementById('container');
   container.appendChild(renderer.domElement);

   pathTracingScene = new THREE.Scene();
   screenTextureScene = new THREE.Scene();
   screenOutputScene = new THREE.Scene();

   // quadCamera is simply the camera to help render the full screen quad (2 triangles),
   // hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
   // the window into our 3d world. This camera will not move or rotate for the duration of the app.
   quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
   screenTextureScene.add(quadCamera);
   screenOutputScene.add(quadCamera);

   // worldCamera is the dynamic camera 3d object that will be positioned, oriented and 
   // constantly updated inside the 3d scene.  Its view will ultimately get passed back to the 
   // stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
   worldCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
   pathTracingScene.add(worldCamera);

   controls = new FirstPersonCameraControls(worldCamera);

   cameraControlsObject = controls.getObject();
   cameraControlsYawObject = controls.getYawObject();
   cameraControlsPitchObject = controls.getPitchObject();

   pathTracingScene.add(cameraControlsObject);


   // setup render targets...
   pathTracingRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * pixelRatio), (window.innerHeight * pixelRatio), {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false
   });
   pathTracingRenderTarget.texture.generateMipmaps = false;

   screenTextureRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * pixelRatio), (window.innerHeight * pixelRatio), {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false
   });
   screenTextureRenderTarget.texture.generateMipmaps = false;


   // setup scene/demo-specific objects, variables, and data
   initSceneData();


   // setup screen-size quad geometry and shaders....

   // this full-screen quad mesh performs the path tracing operations and produces a screen-sized image
   pathTracingGeometry = new THREE.PlaneBufferGeometry(2, 2);
   initPathTracingShaders();

   // this full-screen quad mesh copies the image output of the pathtracing shader and feeds it back in to that shader as a 'previousTexture'
   screenTextureGeometry = new THREE.PlaneBufferGeometry(2, 2);

   screenTextureMaterial = new THREE.ShaderMaterial({
      uniforms: screenTextureShader.uniforms,
      vertexShader: screenTextureShader.vertexShader,
      fragmentShader: screenTextureShader.fragmentShader,
      depthWrite: false,
      depthTest: false
   });

   screenTextureMaterial.uniforms.tPathTracedImageTexture.value = pathTracingRenderTarget.texture;

   screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);
   screenTextureScene.add(screenTextureMesh);


   // this full-screen quad mesh takes the image output of the path tracing shader (which is a continuous blend of the previous frame and current frame),
   // and applies gamma correction (which brightens the entire image), and then displays the final accumulated rendering to the screen
   screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);

   screenOutputMaterial = new THREE.ShaderMaterial({
      uniforms: screenOutputShader.uniforms,
      vertexShader: screenOutputShader.vertexShader,
      fragmentShader: screenOutputShader.fragmentShader,
      depthWrite: false,
      depthTest: false
   });

   screenOutputMaterial.uniforms.tPathTracedImageTexture.value = pathTracingRenderTarget.texture;

   screenOutputMesh = new THREE.Mesh(screenOutputGeometry, screenOutputMaterial);
   screenOutputScene.add(screenOutputMesh);

   // this 'jumpstarts' the initial dimensions and parameters for the window and renderer
   onWindowResize(undefined);

   // everything is set up, now we can start animating
   animate();

} // end function initTHREEjs()




function animate() {

   requestAnimationFrame(animate);

   // reset flags
   cameraIsMoving = false;

   if (windowIsBeingResized) {
      cameraIsMoving = true;
      windowIsBeingResized = false;
   }

   // this gives us a vector in the direction that the camera is pointing,
   // which will be useful for moving the camera 'forward' and shooting projectiles in that direction
   controls.getDirection(cameraDirectionVector);
   cameraDirectionVector.normalize();
   controls.getUpVector(cameraUpVector);
   controls.getRightVector(cameraRightVector);

   // the following gives us a rotation quaternion (4D vector), which will be useful for 
   // rotating scene objects to match the camera's rotation
   worldCamera.getWorldQuaternion(cameraWorldQuaternion);

   // update scene/demo-specific input(if custom), variables and uniforms every animation frame
   updateVariablesAndUniforms();


   // RENDERING in 3 steps

   // STEP 1
   // Perform PathTracing and Render(save) into pathTracingRenderTarget, a full-screen texture.
   // Read previous screenTextureRenderTarget(via texelFetch inside fragment shader) to use as a new starting point to blend with
   renderer.setRenderTarget(pathTracingRenderTarget);
   renderer.render(pathTracingScene, worldCamera);

   // STEP 2
   // Render(copy) the pathTracingScene output(pathTracingRenderTarget above) into screenTextureRenderTarget.
   // This will be used as a new starting point for Step 1 above (essentially creating ping-pong buffers)
   renderer.setRenderTarget(screenTextureRenderTarget);
   renderer.render(screenTextureScene, quadCamera);

   // STEP 3
   // Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
   // After the image is gamma-corrected, it will be shown on the screen as the final accumulated output
   renderer.setRenderTarget(null);
   renderer.render(screenOutputScene, quadCamera);

} // end function animate()













// scene/demo-specific variables go here
var EPS_intersect: number;
var sceneIsDynamic = false;
var tallBoxGeometry;
var tallBoxMaterial;
var tallBoxMesh: THREE.Mesh;
var shortBoxGeometry;
var shortBoxMaterial;
var shortBoxMesh: THREE.Mesh;

// called automatically from within initTHREEjs() function
function initSceneData() {

   // scene/demo-specific three.js objects setup goes here
   EPS_intersect = 1.0; // less precision on mobile

   // Boxes
   tallBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
   tallBoxMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.95, 0.95, 0.95), //RGB, ranging from 0.0 - 1.0
      roughness: 1.0 // ideal Diffuse material	
   });

   tallBoxMesh = new THREE.Mesh(tallBoxGeometry, tallBoxMaterial);
   pathTracingScene.add(tallBoxMesh);
   tallBoxMesh.visible = false; // disable normal Three.js rendering updates of this object: 
   // it is just a data placeholder as well as an Object3D that can be transformed/manipulated by 
   // using familiar Three.js library commands. It is then fed into the GPU path tracing renderer
   // through its 'matrixWorld' matrix. See below:
   tallBoxMesh.rotation.set(0, Math.PI * 0.1, 0);
   tallBoxMesh.position.set(180, 170, -350);
   tallBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update


   shortBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
   shortBoxMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.95, 0.95, 0.95), //RGB, ranging from 0.0 - 1.0
      roughness: 1.0 // ideal Diffuse material	
   });

   shortBoxMesh = new THREE.Mesh(shortBoxGeometry, shortBoxMaterial);
   pathTracingScene.add(shortBoxMesh);
   shortBoxMesh.visible = false;
   shortBoxMesh.rotation.set(0, -Math.PI * 0.09, 0);
   shortBoxMesh.position.set(370, 85, -170);
   shortBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update


   // set camera's field of view
   worldCamera.fov = 31;
   focusDistance = 1180.0;

   // position and orient camera
   cameraControlsObject.position.set(278, 270, 1050);
   ///cameraControlsYawObject.rotation.y = 0.0;
   // look slightly upward
   cameraControlsPitchObject.rotation.x = 0.005;

} // end function initSceneData()



// called automatically from within initTHREEjs() function
function initPathTracingShaders() {

   // scene/demo-specific uniforms go here
   pathTracingUniforms = {

      tPreviousTexture: { type: "t", value: screenTextureRenderTarget.texture },

      uCameraIsMoving: { type: "b1", value: false },

      uEPS_intersect: { type: "f", value: EPS_intersect },
      uTime: { type: "f", value: 0.0 },
      uSampleCounter: { type: "f", value: 0.0 },
      uFrameCounter: { type: "f", value: 1.0 },
      uULen: { type: "f", value: 1.0 },
      uVLen: { type: "f", value: 1.0 },
      uApertureSize: { type: "f", value: 0.0 },
      uFocusDistance: { type: "f", value: focusDistance },

      uResolution: { type: "v2", value: new THREE.Vector2() },

      uRandomVector: { type: "v3", value: new THREE.Vector3() },

      uCameraMatrix: { type: "m4", value: new THREE.Matrix4() },

      uShortBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
      uShortBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() },

      uTallBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
      uTallBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() }

   };

   pathTracingDefines = {
      //NUMBER_OF_TRIANGLES: total_number_of_triangles
   };

   // load vertex and fragment shader files that are used in the pathTracing material, mesh and scene
   fileLoader.load('shaders/common_PathTracing_Vertex.glsl', function (shaderText: string) {
      pathTracingVertexShader = shaderText;

      createPathTracingMaterial();
   });

} // end function initPathTracingShaders()


// called automatically from within initPathTracingShaders() function above
function createPathTracingMaterial() {

   fileLoader.load('shaders/Cornell_Box_Fragment.glsl', function (shaderText: string) {

      pathTracingFragmentShader = shaderText;

      pathTracingMaterial = new THREE.ShaderMaterial({
         uniforms: pathTracingUniforms,
         defines: pathTracingDefines,
         vertexShader: pathTracingVertexShader,
         fragmentShader: pathTracingFragmentShader,
         depthTest: false,
         depthWrite: false
      });

      pathTracingMesh = new THREE.Mesh(pathTracingGeometry, pathTracingMaterial);
      pathTracingScene.add(pathTracingMesh);

      // the following keeps the large scene ShaderMaterial quad right in front 
      //   of the camera at all times. This is necessary because without it, the scene 
      //   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
      worldCamera.add(pathTracingMesh);

   });

} // end function createPathTracingMaterial()



// called automatically from within the animate() function
function updateVariablesAndUniforms() {

   if (!cameraIsMoving) {

      if (sceneIsDynamic)
         sampleCounter = 1.0; // reset for continuous updating of image
      else sampleCounter += 1.0; // for progressive refinement of image

      frameCounter += 1.0;

      cameraRecentlyMoving = false;
   }

   if (cameraIsMoving) {
      sampleCounter = 1.0;
      frameCounter += 1.0;

      if (!cameraRecentlyMoving) {
         frameCounter = 1.0;
         cameraRecentlyMoving = true;
      }
   }


   pathTracingUniforms.uCameraIsMoving.value = cameraIsMoving;
   pathTracingUniforms.uSampleCounter.value = sampleCounter;
   pathTracingUniforms.uFrameCounter.value = frameCounter;
   pathTracingUniforms.uRandomVector.value = randomVector.set(Math.random(), Math.random(), Math.random());

   // BOXES
   pathTracingUniforms.uTallBoxInvMatrix.value.getInverse(tallBoxMesh.matrixWorld);
   pathTracingUniforms.uTallBoxNormalMatrix.value.getNormalMatrix(tallBoxMesh.matrixWorld);
   pathTracingUniforms.uShortBoxInvMatrix.value.getInverse(shortBoxMesh.matrixWorld);
   pathTracingUniforms.uShortBoxNormalMatrix.value.getNormalMatrix(shortBoxMesh.matrixWorld);

   // CAMERA
   cameraControlsObject.updateMatrixWorld(true);
   pathTracingUniforms.uCameraMatrix.value.copy(worldCamera.matrixWorld);
   screenOutputMaterial.uniforms.uOneOverSampleCounter.value = 1.0 / sampleCounter;
} // end function updateVariablesAndUniforms()



//init(); // init app and start animating
