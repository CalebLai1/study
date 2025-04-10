import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Basic Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd); // Light grey background

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
    30, // Field of View
    window.innerWidth / window.innerHeight, // Aspect Ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
// Position the camera slightly back and up
camera.position.set(-4, -7, 4);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
document.body.appendChild(renderer.domElement); // Add the canvas to the page

// --- Lighting ---
// Ambient light: provides overall illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft white light
scene.add(ambientLight);

// Directional light: simulates sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5); // Position the light
directionalLight.castShadow = true; // Allow this light to cast shadows

// Configure shadow properties
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

scene.add(directionalLight);
// Optional: Add a helper to visualize the shadow camera
// const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(shadowHelper);


// --- Controls ---
// OrbitControls allow the camera to orbit around a target.
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Add inertia to camera movement
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // Keep panning within the scene plane
controls.minDistance = 1; // How close the camera can get
controls.maxDistance = 50; // How far the camera can get
controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the ground
controls.target.set(0, 1, 0); // Point controls towards the center of a potential model
controls.update(); // Need to call update once after setting target


// --- GLTF Model Loader ---
const loader = new GLTFLoader();
const loadingIndicator = document.getElementById('loading-indicator');

loader.load(
    'shop.glb', // The path to your model file
    function (gltf) {
        // --- Called when the model is loaded successfully ---
        console.log('Model loaded successfully!');
        const model = gltf.scene;

        // Enable shadows for all meshes in the loaded model
        model.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true; // Allow parts of the model to receive shadows from other parts
            }
        });

        // --- Optional: Adjust model position/scale/rotation if needed ---
        // Example: Center the model (requires calculating its bounding box)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Rescale model if it's too big or small (optional)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4.0 / maxDim; // Aim for a maximum dimension of ~4 units
        // model.scale.set(scale, scale, scale);

        // Recalculate box after scaling
        // box.setFromObject(model);
        // box.getCenter(center); // Get new center


        scene.add(model); // Add the loaded model to the scene

        // Update OrbitControls target to the model's new center
        controls.target.copy(model.position).add(new THREE.Vector3(0, size.y * scale / 2 , 0)); // Target center height
        controls.update();

        loadingIndicator.style.display = 'none'; // Hide loading indicator
    },
    function (xhr) {
        // --- Called while loading is progressing ---
        const percentLoaded = (xhr.loaded / xhr.total) * 100;
        console.log(percentLoaded + '% loaded');
        loadingIndicator.textContent = `Loading: ${Math.round(percentLoaded)}%`;
    },
    function (error) {
        // --- Called if there is an error loading the model ---
        console.error('An error happened loading the model:', error);
        loadingIndicator.textContent = 'Error loading model!';
        loadingIndicator.style.color = 'red';
    }
);

// --- Handle Window Resize ---
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Update camera projection matrix
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate); // Request the next frame

    controls.update(); // Update controls (needed if enableDamping is true)

    renderer.render(scene, camera); // Render the scene from the camera's perspective
}

// Start the animation loop
animate();