import os
import cv2
import numpy as np
import json
import random
from http.server import BaseHTTPRequestHandler, HTTPServer

import io

class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-type")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'{"status": "AI Service is running and ready for POST requests"}')

    def do_POST(self):
        if self.path == '/detect':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                file_data = self.rfile.read(content_length)
                # Parse image with OpenCV
                nparr = np.frombuffer(file_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    self.send_error(400, "Invalid image data")
                    return

                # Convert to grayscale for face detection
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                # Load Haar Cascade
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) == 0:
                    emotion = "neutral"
                    confidence = 0.5
                else:
                    # Dummy emotion detection
                    emotions_list = ['happy', 'sad', 'angry', 'surprised', 'neutral']
                    emotion = random.choice(emotions_list)
                    confidence = round(random.uniform(0.75, 0.98), 2)
                    
                response_data = {
                    "emotion": emotion,
                    "confidence": confidence,
                    "faces_detected": len(faces)
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            else:
                self.send_error(400, "No data provided")
        else:
            self.send_error(404, "Not Found")

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting server on port {port}...")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
