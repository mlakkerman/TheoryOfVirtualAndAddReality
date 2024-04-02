import * as THREE from 'three';
import init from './init';
import './style.css';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const { sizes, camera, scene, canvas, controls, renderer } = init();

// 4. Определить начальное положение перспективной камеры, создать ее и добавить в сцену.
camera.position.set(-6.135, 8.868, -15.807); // 0 2 7
// 2. Осуществить загрузку графических файлов текстур и создать материалы для них.
const textureLoader = new THREE.TextureLoader();
const textures = [
    'floor',
    'wall',
    'ceiling',
    'officechair',
];
const materials = textures.map((texture) => {
    const map = textureLoader.load(`/textures/${texture}/map.jpg`);
    const normalMap = textureLoader.load(`/textures/${texture}/normalMap.jpg`);
    const aoMap = textureLoader.load(`/textures/${texture}/aoMap.jpg`);
    const roughMap = textureLoader.load(`/textures/${texture}/roughMap.jpg`);

    return new THREE.MeshStandardMaterial({
        map,
        normalMap,
        aoMap,
        roughnessMap: roughMap,
    });
});


// 1. Импортировать полученный obj файл модели помещения
const loader = new OBJLoader();
loader.load(
    'models/room/room.obj',
    function (object) {
        console.log(object);
        object.castShadow = true;
        object.children.forEach((child, index) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                //2. Применить созданные материалы к соответствующим объектам модели помещения.
                if (index === 0) {
                    child.material = materials[0];
                } else if (index < 5) {
                    child.material = materials[1];
                } else {
                    child.material = materials[2];
                }
            }
        });
        scene.add(object);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.log('An error happened');
    }
);
// 3. Осуществить загрузку obj файла объекта и разместить его в соответствующих координатах
const loaderObj = new OBJLoader();
loaderObj.load(
    'models/officechair/officechair.obj',
    function (object) {
        console.log(object);
        object.position.set(-3.5, 0.2, -1.6);
        object.rotateY(Math.PI / 4);
        object.scale.set(0.02, 0.02, 0.02);
        object.children.forEach((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.material = materials[3];
            }
        });
        scene.add(object);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.log('An error happened chair');
    }
);

// 5. Разместить в сцене источники освещения по заранее спроектированным параметрам
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-9.85, 8.768, 18.908);
directionalLight.shadow.bias = 5;
directionalLight.castShadow = true;
directionalLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 5);
pointLight.position.set(0,3.505,0);
pointLight.castShadow = true;
pointLight.decay = 0.82;
pointLight.distance = 100;
pointLight.shadowRange = 6;
scene.add(pointLight);

// 7. Создать конвейер рендерера сцены. Функция render().
const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

// 8. Разработать обработчик изменения размеров viewport сцены.
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
