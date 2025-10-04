from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__, template_folder="templates")

app.secret_key = "secretkey"  # обязательно

# -----------------------
# Подключение к базе
# -----------------------
def get_db_connection():
    conn = sqlite3.connect('AbsoluteCode.db')
    conn.row_factory = sqlite3.Row
    return conn

# -----------------------
# Страницы
# -----------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')    

@app.route('/profile')
def profile_page():
    return render_template('profile.html')

# -----------------------
# API Эндпоинты
# -----------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('username')
    password = data.get('password')
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (Login, Password) VALUES (?, ?)', (name, password))
        conn.commit()
        user_id = conn.execute('SELECT Login FROM users WHERE Login=?', (name,)).fetchone()['Login']
        return jsonify({'id': user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Пользователь с таким логином уже существует'}), 400
    finally:
        conn.close()



@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    name = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE Login=? AND Password=?',
        (name, password)
    ).fetchone()
    conn.close()

    if user:
        return jsonify({'id': user['Login']}), 200
    return jsonify({'error': 'Ошибка авторизации'}), 401



@app.route('/api/queue/<int:user_id>', methods=['GET'])
def get_queue(user_id):
    conn = get_db_connection()
    stands = conn.execute('SELECT stand_name FROM stand_queue WHERE user_id=?', (user_id,)).fetchall()
    conn.close()
    return jsonify([s['stand_name'] for s in stands])

@app.route('/api/queue', methods=['POST'])
def follow_stand():
    data = request.get_json()
    user_id = data.get('user_id')
    stand_name = data.get('stand_name')
    conn = get_db_connection()
    conn.execute('INSERT INTO stand_queue (user_id, stand_name) VALUES (?, ?)', (user_id, stand_name))
    conn.commit()
    conn.close()
    return jsonify({'status': 'ok'}), 201

@app.route('/api/queue', methods=['DELETE'])
def unfollow_stand():
    data = request.get_json()
    user_id = data.get('user_id')
    stand_name = data.get('stand_name')
    conn = get_db_connection()
    conn.execute('DELETE FROM stand_queue WHERE user_id=? AND stand_name=?', (user_id, stand_name))
    conn.commit()
    conn.close()
    return jsonify({'status': 'ok'}), 200

# -----------------------
# Запуск сервера
# -----------------------
if __name__ == '__main__':
    app.run(debug=True)
