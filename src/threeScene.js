import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import schemaJSON from '/static/schema.json';

const threeScene = () => {
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
				// } else if (geo.type === 'BufferGeometry') {
				// 	const bufferGeometry = new THREE.BufferGeometry();
				// 	bufferGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(geo.data.attributes.position.array), geo.data.attributes.position.itemSize));
				// 	geometries[geo.uuid] = bufferGeometry;
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

export default threeScene;
