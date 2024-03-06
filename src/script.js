import * as THREE from 'three';
import init from './init';
import './style.css';

const { sizes, camera, scene, canvas, controls, renderer } = init();

camera.position.set(0, 2, 7);
// Синее полотно снизу-----------------------
const floor = new THREE.Mesh(
	new THREE.PlaneGeometry(10, 10),
	new THREE.MeshStandardMaterial({
		color: 'blue',
		roughness: 0.5,
		metalness: 0,
	})
)
floor.receiveShadow = true;
floor.rotation.x = - Math.PI * 0.5

// Куб, конус, капсула, куб---------------------------------
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
	color: 'gray',
});
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0.5, 0);
mesh.castShadow = true;
mesh.receiveShadow = true;

const geometry2 = new THREE.CapsuleGeometry(1, 1, 4, 8)
const material2 = new THREE.MeshStandardMaterial({
	color: 'red',
});
const mesh2 = new THREE.Mesh(geometry2, material2);
mesh2.position.set(-2, 2, 1);
mesh2.castShadow = true;
mesh2.receiveShadow = true;
scene.add(mesh2);

const geometry3 = new THREE.ConeGeometry(2, 2, 2);
const material3 = new THREE.MeshStandardMaterial({
	color: 'green',
});
const mesh3 = new THREE.Mesh(geometry3, material3);
mesh3.position.set(2, 1, 2);
mesh3.castShadow = true;
mesh3.receiveShadow = true;
scene.add(mesh3);

const geometry4 = new THREE.BoxGeometry(1, 1, 1);
const material4 = new THREE.MeshStandardMaterial({
	color: 'yellow',
});
const mesh4 = new THREE.Mesh(geometry4, material4);
mesh4.position.set(0, 0.5, -2);
mesh4.castShadow = true;
mesh4.receiveShadow = true;
scene.add(mesh4);

// Создание группы и добавление моделей в нее, отображение
const group = new THREE.Group();
group.add(floor, mesh, mesh2, mesh3, mesh4);
scene.add(group);

// Обработчики клика для изменения цвета фигур
const raycaster = new THREE.Raycaster(); // https://threejs.org/docs/#api/en/core/Raycaster
const mouse = new THREE.Vector2();
const objects = [floor, mesh, mesh2, mesh3, mesh4];

window.addEventListener('click', (event) => {
	// вычисляем положение мыши в нормализованных координатах устройства
    // (от -1 до +1) для обоих компонентов
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	
	// обновляем луч выбора, указав положение камеры и мыши
    raycaster.setFromCamera(mouse, camera);

    // вычисляем объекты, пересекающие луч выбора
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        selectedObject.material.color.set(Math.random() * 0xffffff);
    }
});
// 3. Создание источников освещения -------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-8, 12, 8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
scene.add(directionalLight);

// Постоянная отрисовка сцены
const tick = () => {
	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};
tick();

/** Базовые обработчики событий длы поддержки ресайза */
window.addEventListener('resize', () => {
	// Обновляем размеры
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Обновляем соотношение сторон камеры
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Обновляем renderer
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
