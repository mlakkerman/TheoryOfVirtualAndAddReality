import './style.css';
import Hammer from 'hammerjs';
import * as THREE from 'three';
import init from './init';

const { sizes, camera, scene, canvas, controls, renderer } = init();

// Инициализация Hammer
function initHammerGestures() {
    const videoElement = document.getElementById('video');
    const hammer = new Hammer(videoElement);

    const panHandler = (event) => {
        const speedX = 0.002; // настраиваемая скорость панорамного движения по оси X
        const speedY = 0.002; // настраиваемая скорость панорамного движения по оси Y
        controls.pan(event.deltaX * speedX, event.deltaY * speedY);
    };

    const pinchHandler = (event) => {
        const dollySpeed = 0.05;
        if (event.additionalEvent === "pinchin") {
            controls.dollyIn(1 + dollySpeed * event.scale);
        } else if (event.additionalEvent === "pinchout") {
            controls.dollyOut(1 + dollySpeed * event.scale);
        }
    };

    hammer.on('panmove', panHandler);
    hammer.on('pinch', pinchHandler);
}

if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.play();
            console.log(video);
            initHammerGestures();
        })
        .catch(function (error) {
            console.error("Ошибка при доступе к камере", error);
        });
}
else {
    console.error('Браузер не поддерживает getUserMedia');
}
