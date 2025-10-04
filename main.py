from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__, template_folder="templates")

# -----------------------
# Подключение к базе
# -----------------------
def get_db_connection():
    conn = sqlite3.connect('database.db')
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
    username = data.get('username')
    password = data.get('password')
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
        user_id = conn.execute('SELECT id FROM users WHERE username=?', (username,)).fetchone()['id']
        return jsonify({'id': user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'User already exists'}), 400
    finally:
        conn.close()

app.secret_key = "secretkey"  # обязательно

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE username=? AND password=?',
        (username, password)
    ).fetchone()
    conn.close()

    if user:
        session['user_id'] = user['id']  # сохраняем в сессию
        return jsonify({'id': user['id'], 'username': user['username']}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

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
