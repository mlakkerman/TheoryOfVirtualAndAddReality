import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const init = () => {
	//Размер окна
	const sizes = {
		width: window.innerWidth,
		height: window.innerHeight,
	};
	//Создание сцены, отрисовка в canvas
	const scene = new THREE.Scene();
	const canvas = document.querySelector('.canvas');
	//создание камеры и добавление на сцену
	const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
	scene.add(camera);
	
	//6. Подключить библиотеку OrbitControls и обеспечить с помощью нее управление камерой в сцене.
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	//рендер, рисующий сцену
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(sizes.width, sizes.height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.render(scene, camera);

	return { sizes, scene, canvas, camera, renderer, controls };
};

export default init;
