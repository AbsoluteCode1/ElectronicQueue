from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit
from threading import Thread

import sqlite3

app = Flask('app')
app.config['SECRET_KEY'] = 'abscode223'
socketio = SocketIO(app, allow_unsafe_werkzeug=True)

connection = sqlite3.connect('baze.db')
cursor = connection.cursor()

# Создаем таблицу Users
cursor.execute('''
CREATE TABLE IF NOT EXISTS Users (
id INTEGER,
username TEXT,
gettime TEXT,
stande TEXT, 
description TEXT, 
keywords TEXT, 
des
)
''')

# Сохраняем изменения и закрываем соединение
connection.commit()
connection.close()


@app.route('/')
def main():
    return render_template("index.html")



def keep_alive():
    socketio.run(app, allow_unsafe_werkzeug=True, host="0.0.0.0", port=2554)

if __name__ == "__main__":
    keep_alive()