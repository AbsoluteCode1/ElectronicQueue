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
cursor.execute("""CREATE TABLE IF NOT EXISTS users(
   userid INT PRIMARY KEY,
   fname TEXT,
   lname TEXT,
   gender TEXT);
""")
# Сохраняем изменения и закрываем соединение
connection.commit()
connection.close()


@app.route('/')
def main():
    return render_template("index.html", stend="1")

@app.route('/reg', methods=['GET', 'POST'])
def registartion():
    name = request.form['name']
    password = request.form['password']
    stend = request.form['stend_num']
    print(name, password, stend)

    return render_template('index.html', stend="1")




def keep_alive():
    socketio.run(app, allow_unsafe_werkzeug=True, host="0.0.0.0", port=2554)

if __name__ == "__main__":
    keep_alive()