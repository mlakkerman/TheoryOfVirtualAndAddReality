import * as THREE from 'three'
import { OrbitControls } from 'three/controls/OrbitControls.js';

const handpose = window.handpose;
let model = null;

window.onload = () => {
	const video = document.getElementById("video");
	navigator.mediaDevices.getUserMedia({ video: true })
		.then(stream => {
			video.srcObject = stream;
		})
		.catch(e => console.error('Не удалось инициализировать камеру:', e));

	handpose.load()
		.then(_model => {
			console.log("Handpose model loaded");
			model = _model;
			tick();
		})
		.catch(e => console.error('Не удалось загрузить модель Handpose:', e));

	const qrCodeReader = new Html5Qrcode("reader");

	qrCodeReader.start(
		{ facingMode: "environment" },
		{
			fps: 10,
			aspectRatio: 1,
			qrbox: { width: 250, height: 250 },
		},
		qrCodeMessage => {
			console.log("QR Code detected: " + qrCodeMessage);
			let image = new Image();
			image.src = qrCodeMessage;

			image.onload = function () {
				let canvas = document.getElementById('imageCanvas');
				let ctx = canvas.getContext('2d');
				ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
			}
		},
		);
	document.getElementById("reader").style.position = "fixed";
}

async function loadJSON(jsonPath) {
	try {
		const response = await fetch(jsonPath);
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}
		return response.json();
	} catch (error) {
		console.error('Ошибка при загрузке JSON:', error);
	}
}

let schemaJSON = await loadJSON('/src/schema.json');
console.log(schemaJSON);

let isSpinning = false;
let counter = 0;
let prevDistance = null;
let scale = 1;
const calculateDistance = (pointA, pointB) => {
	return Math.sqrt(Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2));
};


const processVideo = async () => {
	try {
		if (!model || !camera || !scene) return;
		const predictions = await model.estimateHands(video);
		if (predictions.length > 0) {
			let prediction = predictions[0];

			// Подняты все пальцы ладони, вращение сцены
			if (prediction.annotations.thumb[3][1] < prediction.annotations.thumb[0][1] &&
				prediction.annotations.indexFinger[3][1] < prediction.annotations.indexFinger[0][1] &&
				prediction.annotations.middleFinger[3][1] < prediction.annotations.middleFinger[0][1] &&
				prediction.annotations.ringFinger[3][1] < prediction.annotations.ringFinger[0][1] &&
				prediction.annotations.pinky[3][1] < prediction.annotations.pinky[0][1]) {
				counter++;
				if (counter > 3) {
					isSpinning = true;
					counter = 0;
				}
				return;
			}
			// Поднят мезинец - остановка вращения сцены
			if (prediction.annotations.thumb[3][1] > prediction.annotations.pinky[3][1] &&
				prediction.annotations.indexFinger[3][1] > prediction.annotations.pinky[3][1] &&
				prediction.annotations.middleFinger[3][1] > prediction.annotations.pinky[3][1] &&
				prediction.annotations.ringFinger[3][1] > prediction.annotations.pinky[3][1]) {
				counter++;
				if (counter > 3) {
					isSpinning = false;
					counter = 0;
				}
				return;
			}

		// масштаб - удаление указательного от большого пальца
		const currentDistance = calculateDistance(
			prediction.annotations.thumb[3],
			prediction.annotations.indexFinger[3]
		);

		if (prevDistance != null) {
		  if (currentDistance < prevDistance) {
			scale *= 0.95;
		  }

		  if (currentDistance > prevDistance) {
			scale *= 1.05;
		  }
		}
		scene.scale.set(scale, scale, scale);
		prevDistance = currentDistance;
		}
		counter = 0;
		window.requestAnimationFrame(processVideo);
	} catch (e) {
		console.error(e);
	}
}


const threeScene = (schemaJSON) => {
	function createPerspectiveCamera(schemaJSON) {
		const camera = new THREE.PerspectiveCamera(
			schemaJSON.objectCamera.fov,
			schemaJSON.objectCamera.aspect,
			schemaJSON.objectCamera.near,
			schemaJSON.objectCamera.far
		);

		const cameraMatrix = new THREE.Matrix4();
		cameraMatrix.fromArray(schemaJSON.objectCamera.matrix);
		cameraMatrix.decompose(camera.position, camera.quaternion, camera.scale);
		camera.updateMatrixWorld(true);

		return camera;
	}
	const sizes = {
		width: window.innerWidth,
		height: window.innerHeight,
	};
	const scene = new THREE.Scene();
	const canvas = document.querySelector('.canvas');
	const camera = createPerspectiveCamera(schemaJSON);

	function createSceneFromJSON(schemaJSON, existingScene) {
		const loader = new THREE.TextureLoader();
		const materials = {};
		const geometries = {};

		schemaJSON.materials.forEach((material) => {

			const textures = {
				map: loader.load(material.map),
				aoMap: loader.load(material.aoMap),
				normalMap: loader.load(material.normalMap),
				roughnessMap: loader.load(material.roughnessMap)
			};
			materials[material.uuid] = new THREE.MeshStandardMaterial(textures);
		});

		schemaJSON.geometries.forEach((geo) => {
			if (geo.type === 'BoxGeometry') {
				geometries[geo.uuid] = new THREE.BoxGeometry(geo.width, geo.height, geo.depth);
			}
			else if (geo.type === 'BufferGeometry') {
				const bufferGeometry = new THREE.BufferGeometry();
				bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(geo.data.attributes.position.array), geo.data.attributes.position.itemSize));
				if (geo.data.attributes.normal) {
					bufferGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(geo.data.attributes.normal.array), geo.data.attributes.normal.itemSize));
				}
				if (geo.data.attributes.uv) {
					bufferGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.data.attributes.uv.array), geo.data.attributes.uv.itemSize));
				}
				geometries[geo.uuid] = bufferGeometry;
			}
		});

		schemaJSON.object.children.forEach((child) => {
			if (child.type === 'Mesh') {
				const mesh = new THREE.Mesh(geometries[child.geometry], materials[child.material]);
				mesh.castShadow = child.castShadow;
				mesh.receiveShadow = child.receiveShadow;
				const matrix = new THREE.Matrix4();
				matrix.fromArray(child.matrix);
				mesh.applyMatrix4(matrix);
				existingScene.add(mesh);
			} else if (child.type === 'AmbientLight') {
				const light = new THREE.AmbientLight(child.color, child.intensity);
				existingScene.add(light);
			} else if (child.type === 'PointLight') {
				const pointLight = new THREE.PointLight(child.color, child.intensity, child.distance, child.decay);
				pointLight.name = child.name;
				pointLight.castShadow = child.castShadow;
				pointLight.layers.enable(child.layers);
				const matrix = new THREE.Matrix4();
				matrix.fromArray(child.matrix);
				pointLight.matrix = matrix;
				pointLight.matrixAutoUpdate = false;
				pointLight.shadow.radius = child.shadow.radius;
				const camData = child.shadow.camera;
				pointLight.shadow.camera = new THREE.PerspectiveCamera(camData.fov, camData.aspect, camData.near, camData.far);
				pointLight.shadow.camera.up.set(camData.up[0], camData.up[1], camData.up[2]); // Устанавливаем "up" из данных JSON
				pointLight.shadow.camera.updateProjectionMatrix();
				existingScene.add(pointLight);
			} else if (child.type === 'DirectionalLight') {
				const directionalLight = new THREE.DirectionalLight(child.color, child.intensity);
				directionalLight.name = child.name;
				directionalLight.castShadow = child.castShadow;
				directionalLight.layers.enable(child.layers);
				const matrix = new THREE.Matrix4();
				matrix.fromArray(child.matrix);
				directionalLight.matrix = matrix;
				directionalLight.matrixAutoUpdate = false;
				const shadowCamData = child.shadow.camera;
				const shadowCamera = new THREE.OrthographicCamera(shadowCamData.left, shadowCamData.right, shadowCamData.top, shadowCamData.bottom, shadowCamData.near, shadowCamData.far);
				shadowCamera.up.set(...shadowCamData.up);
				shadowCamera.updateProjectionMatrix();
				directionalLight.shadow.camera = shadowCamera;
				existingScene.add(directionalLight);
			} else if (child.type === 'Group') {
				const group = new THREE.Group();
				const matrix = new THREE.Matrix4();
				matrix.fromArray(child.matrix);
				group.applyMatrix4(matrix);
				child.children.forEach((groupChild) => {
					const groupMesh = new THREE.Mesh(geometries[groupChild.geometry], materials[groupChild.material]);
					const groupMatrix = new THREE.Matrix4();
					groupMatrix.fromArray(groupChild.matrix);
					groupMesh.applyMatrix4(groupMatrix);
					group.add(groupMesh);
				});
				existingScene.add(group);
			}
		});
	}
	createSceneFromJSON(schemaJSON, scene);

	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setClearColor(0x000000, 0); // LR 3 - прозрачный фон рендера - (0x000000, 0)
	renderer.setSize(sizes.width, sizes.height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.render(scene, camera);

	return { sizes, scene, canvas, camera, renderer, controls };
};

const { sizes, scene, canvas, camera, renderer, controls } = threeScene(schemaJSON)
const tick = () => {
	if (isSpinning) {
		scene.rotation.y += Math.PI / 4;
		scene.rotation.x += Math.PI / 4;
	}
	console.log(isSpinning);
	if (camera && scene) {
		processVideo();
	}
	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.render(scene, camera);
});

window.addEventListener('dblclick', () => {
	if (!document.fullscreenElement) {
		canvas.requestFullscreen();
	} else {
		document.exitFullscreen();
	}
});