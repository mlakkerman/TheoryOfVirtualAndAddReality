import './style.css';

if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.play();
        })
        .catch(function (error) {
            console.error("Ошибка при доступе к камере", error);
        });
}
else {
    console.error('Браузер не поддерживает getUserMedia');
}
