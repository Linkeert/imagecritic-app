// ПРОВЕРКА ИЗОБРАЖЕНИЙ
function upload() {
    document.getElementById('file').focus();
    document.getElementById('file').click();
    document.getElementById('file').addEventListener('change', updateList);
}

function updateList() {
    const files = document.getElementById('file').files;
    const imageList = document.getElementById('img_list');
    const imagesParagraph = document.getElementById('images');
    imagesParagraph.textContent = `Загружено изображений - ${files.length}`;

    imageList.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
        const img = document.createElement('img');
        const filename = files[i].name;
        const extension = filename.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            img.src = URL.createObjectURL(files[i]);
            img.width = 150;
            img.height = 150;
            img.style.borderRadius = '10px';
            img.style.marginTop = '15px';
            img.style.marginBottom = '15px';
            img.style.marginLeft = '15px';

            const listItem = document.createElement('li');
            listItem.appendChild(img);

            const space = document.createElement('span');
            space.style.width = '7px';
            listItem.appendChild(space);

            const shortenedFilename = document.createElement('span');
            shortenedFilename.textContent = shortenFilename(filename, 9);
            listItem.appendChild(shortenedFilename);

            listItem.style.display = 'flex';
            listItem.style.alignItems = 'center';

            imageList.appendChild(listItem);
        } else {
            console.error(`Неподдерживаемый формат файла: ${filename}`);
        }
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }

    document.getElementById('file').files = files;
    updateList();
    document.getElementById('dropzone').classList.remove('dragover');
}

function dragEnter(event) {
    event.preventDefault();
    document.getElementById('dropzone').classList.add('dragover');
}

function dragLeave(event) {
    event.preventDefault();
    document.getElementById('dropzone').classList.remove('dragover');
}

function shortenFilename(name, maxLength) {
    const parts = name.split('.');
    parts[0] = parts[0].slice(0, maxLength);
    return parts.join('.');
}

let processedImagesCount = 0;
let qualityCount = 0;
let noQualityCount = 0;
let startTime, endTime;

function check() {
    startTime = new Date();

    const files = document.getElementById('file').files;
    const totalImagesCount = files.length;

    if (totalImagesCount === 0) {
        alert("Выберите изображения!");
        return;
    }

    processedImagesCount = 0;
    qualityCount = 0;
    noQualityCount = 0;

    for (let i = 0; i < totalImagesCount; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const prediction = data.predictions[0];
            updatePredictions([prediction]);

            processedImagesCount++;

            if (prediction.result === 'Качественное') {
                qualityCount++;
            } else if (prediction.result === 'Некачественное') {
                noQualityCount++;
            }

            updateProgress(processedImagesCount, totalImagesCount);

            if (processedImagesCount === totalImagesCount) {
                showOverallResult(qualityCount, noQualityCount);
            }
        })
        .catch(error => console.error('Ошибка:', error));
    }
}

function updatePredictions(predictions) {
    const qualityBlock = document.getElementById('quality_block');
    const noQualityBlock = document.getElementById('noquality_block');

    predictions.forEach(prediction => {
        const img = document.createElement('img');
        img.src = prediction.filename;
        img.width = 150;
        img.height = 150;
        img.style.borderRadius = '10px';
        img.style.margin = '30px';

        if (prediction.result === 'Качественное') {
            qualityBlock.appendChild(img);
        } else if (prediction.result === 'Некачественное') {
            noQualityBlock.appendChild(img);
        }
    });
}

function updateProgress(currentCount, totalCount) {
    const progressElement = document.getElementById('progress');
    progressElement.textContent = `Проверено: ${currentCount}/${totalCount}`;
}

function showOverallResult(qualityCount, noQualityCount) {
    endTime = new Date();

    const totalTime = (endTime - startTime) / 1000; // Преобразуем миллисекунды в секунды

    const overallResultElement = document.getElementById('result');
    overallResultElement.innerHTML = `Результат проверки: <br> качественных изображений - ${qualityCount} некачественных изображений - ${noQualityCount}`;
}

document.getElementById('dwn_quality').addEventListener('click', function () {
    downloadImages('quality_block');
});

document.getElementById('dwn_noquality').addEventListener('click', function () {
    downloadImages('noquality_block');
});

function downloadImages(blockId) {
    var zip = new JSZip();
    var block = document.getElementById(blockId);
    var images = block.getElementsByTagName('img');

    if (images.length === 0) {
        alert("Нет изображений для загрузки.");
        return;
    }

    var promises = [];

    for (var i = 0; i < images.length; i++) {
        let img = images[i];
        let url = img.src;
        let filename = url.substring(url.lastIndexOf('/') + 1);

        var promise = fetch(url)
            .then(function (response) {
                return response.blob();
            })
            .then(function (blob) {
                zip.file(filename, blob, { binary: true });
            });

        promises.push(promise);
    }

    Promise.all(promises).then(function () {
        zip.generateAsync({ type: "blob" })
            .then(function (content) {
                saveAs(content, blockId + ".zip");
            });
    });
}

// ПРОВЕРКА ВИДЕО-КАДРОВ
function openFileInput() {
    const fileInput = document.getElementById('video');
    fileInput.click();
}

document.getElementById('video').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const fileName = file.name;
        document.getElementById('videoName').innerText = `Загружено видео "${fileName}"`;
        process_video(file);
    }
});

function handleFileSelect(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        handleFiles(file);
    }
}

function handleFiles(file) {
    const fileName = file.name;
    document.getElementById('videoName').innerText = `Загружено видео "${fileName}"`;
    process_video(file);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function process_video(videoFile) {
    const formData = new FormData();
    formData.append('video', videoFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/video_upload');
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (!response.success) {
                alert(response.error);
                return;
            }
            const messageElement = document.getElementById('message');
            messageElement.innerHTML = `Обработка видео "${response.filename}" завершена. Количество кадров: ${response.frame_count}`;
            for (let i = 0; i < response.frame_count; i++) {
                send_to_block(response.filename, i);
            }
        } else {
            alert("Ошибка при обработке видео!");
        }
    };
    xhr.send(formData);
}

let processedFrames = 0;
let totalFrames = 0;
let qualityFrames = 0;
let noQualityFrames = 0;

function clearBlock(block_id) {
    const block = document.getElementById(block_id);
    block.innerHTML = '';
    processedFrames = 0;
    totalFrames = 0;
    qualityFrames = 0;
    noQualityFrames = 0;
}

function send_to_block(filename, frame_number) {
    totalFrames++;

    const frame_path = `./cadrs/frame${frame_number.toString().padStart(5, '0')}.jpg`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/predict_quality');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        if (xhr.status === 200) {
            const prediction = JSON.parse(xhr.responseText);
            updateCadrs([prediction]);

            processedFrames++;

            if (prediction.result === 'Качественное') {
                qualityFrames++;
            } else if (prediction.result === 'Некачественное') {
                noQualityFrames++;
            }

            updateProgressCounter();

            if (processedFrames === totalFrames) {
                showResults();
            }
        } else {
            alert("Ошибка при получении предсказания качества!");
        }
    };
    xhr.send(`frame_path=${frame_path}`);
}

function updateProgressCounter() {
    const progressElement = document.getElementById('progress');
    progressElement.innerText = `Обработано ${processedFrames}/${totalFrames}`;
}

function showResults() {
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = `Результат проверки: <br> качественных изображений - ${qualityFrames} некачественных изображений - ${noQualityFrames}`;
}

function updateCadrs(predictions) {
    predictions.forEach(prediction => {
        let img = document.createElement('img');
        img.width = 100;
        img.height = 100;
        img.style.borderRadius = '10px';
        img.style.margin = '35px';

        img.src = toDataURL(prediction.img_base64);

        if (prediction.result === 'Качественное') {
            document.getElementById('quality__block').appendChild(img);
        }
        else if (prediction.result === 'Некачественное') {
            document.getElementById('noquality__block').appendChild(img);
        }
    });
}

function toDataURL(base64) {
    return `data:image/jpeg;base64,${base64}`;
}


function downloadCadrs(blockId) {
    const block = document.getElementById(blockId);
    const images = block.getElementsByTagName('img');
    if (images.length === 0) {
        alert("Нет изображений для загрузки.");
        return;
    }

    const zip = new JSZip();
    const folderName = blockId === 'quality__block' ? 'Quality_Images' : 'NoQuality_Images';
    const folder = zip.folder(folderName);

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imgData = img.src.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
        const imgName = `${folderName}_${i + 1}.jpg`;

        folder.file(imgName, imgData, { base64: true });
    }

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            const a = document.createElement('a');
            a.download = `${folderName}.zip`;
            a.href = window.URL.createObjectURL(content);
            a.click();
        })
        .catch(function (error) {
            console.error("Error generating zip file: ", error);
        });
}

// Иконки
$(document).ready(function () {
    $('i').hide();
})

$(window).load(function () {
    $('i').show();

    var telegramPos = $('#telegram').position();
    var githubPos = $('#github').position();

    $('i').css({
        position: 'absolute',
        zIndex: '1',
        top: imgPos.top + 100,
        left: '47%'
    });

    setTimeout(function () {
        $('#telegram').animate({
            top: twitterPos.top + 10,
            left: twitterPos.left - 10
        }, 500);
    }, 250);

    setTimeout(function () {
        $('#telegram').animate({
            top: twitterPos.top,
            left: twitterPos.left
        }, 250);

        $('#github').animate({
            top: githubPos.top + 10,
            left: githubPos.left - 6
        }, 500);
    }, 500);

    setTimeout(function () {
        $('#github').animate({
            top: githubPos.top,
            left: githubPos.left
        }, 250);

        $('#stack').animate({
            top: stackPos.top + 10,
            left: stackPos.left - 3
        }, 500);
    }, 750);
})

