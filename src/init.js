import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// сцена состоит из: камеры, освещения, геом. моделей
const init = () => {
	//размер окна
	const sizes = {
		width: window.innerWidth,
		height: window.innerHeight,
	};
	//Создание сцены, отрисовка в canvas
	const scene = new THREE.Scene();
	const canvas = document.querySelector('.canvas');
	const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
	scene.add(camera);

	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;

	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(sizes.width, sizes.height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.render(scene, camera);

	return { sizes, scene, canvas, camera, renderer, controls };
};

export default init;
