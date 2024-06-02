from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename
from keras.preprocessing.image import load_img, img_to_array
from keras.models import load_model
import numpy as np
import os
import cv2
import base64


app = Flask(__name__)

model = load_model('CNN.h5')

app.config['UPLOAD_FOLDER1'] = './uploads'
app.config['UPLOAD_FOLDER'] = './videos'
app.config['CADRS_FOLDER'] = './cadrs'

@app.route('/')
def index():
    return render_template('main_page.html')

@app.route("/first_page")
def страница1():
    return render_template("first_page.html")

@app.route("/second_page")
def страница2():
    return render_template("second_page.html")

@app.route("/about_page")
def страница3():
    return render_template("about_page.html")


#ПРОВЕРКА ИЗОБРАЖЕНИЙ
@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        files = request.files.getlist('file')
        predictions = []

        for file in files:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER1'], filename))
            img_path = os.path.join(app.config['UPLOAD_FOLDER1'], filename)
            prediction = process_image(img_path)
            predictions.append({'filename': '/uploads/' + filename, 'result': prediction})

        return jsonify(predictions=predictions)


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER1'], filename)

def process_image(img_path):
  img = load_img(img_path)
  
  img_array = img_to_array(img)
  img_array = np.expand_dims(img_array, axis=0)
  prediction = model.predict(img_array)
  if prediction[0][0] >= 0.7:
    return "Качественное"
  else:
    return "Некачественное"
 
#РАЗБИЕНИЕ ВИДЕО НА КАДРЫ И ПРОВЕРКА КАЧЕСТВА
def process_cadrs(img_path):
    img = load_img(img_path)
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    prediction = model.predict(img_array)
    if prediction[0][0] >= 0.7:
        return "Качественное", img
    else:
        return "Некачественное", img

@app.route('/video_upload', methods=['POST'])
def uploadVideo():
    if request.method == 'POST':
        video = request.files['video']
        filename = video.filename
        video_path = os.path.join('./videos', filename)
        video.save(video_path)

        cap = cv2.VideoCapture(video_path)
        frame_count = 0
        while True:
            ret, frame = cap.read()

            if not ret:
                break

            cv2.imwrite(os.path.join('./cadrs', f'frame{frame_count:05d}.jpg'), frame)
            frame_count += 1

        cap.release()

        return jsonify({'success': True, 'filename': filename, 'frame_count': frame_count})

@app.route('/predict_quality', methods=['POST'])
def predict_quality():
    frame_path = request.form['frame_path']
    result, img = process_cadrs(frame_path)
    with open(frame_path, 'rb') as f:
        img_bytes = f.read()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return jsonify({'frame_path': frame_path, 'result': result, 'img_base64': img_base64})


if __name__ == '__main__':
    app.run(threaded=True)