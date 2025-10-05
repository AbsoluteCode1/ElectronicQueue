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
def login_page():
    return render_template('login.html') 

@app.route('/profile')
def profile_page():
    return render_template('profile.html')

@app.route('/allstend')
def allstend():
    return render_template('allstend.html')

@app.route('/qr')
def QRCode():
    return render_template('qr.html')

@app.route('/selectstand')
def SelectStand():
    return render_template('selectstand.html')


@app.route('/notification')
def notification():
    return render_template('notification.html')

# -----------------------
# API Эндпоинты
# -----------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('username')
    password = data.get('password')
    user_type = 1
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (Login, Password, User_Type) VALUES (?, ?, ?)', (name, password, user_type))
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



@app.route('/api/user/queue', methods=['GET'])
def get_user_queue():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    conn = get_db_connection()
    try:
        # Получаем стенды пользователя из Queue с информацией о Platform
        queue_items = conn.execute('''
            SELECT 
                q.id_Queue,
                q.GetTime,
                p.id_Platform,
                p.Place as stand_name,
                p.Description as stand_description
            FROM Queue q
            JOIN Platform p ON q.id_Platform = p.id_Platform
            WHERE q.id_user = ?
            ORDER BY q.GetTime
        ''', (user_id,)).fetchall()
        
        conn.close()
        
        queue_list = []
        for item in queue_items:
            # Форматируем время
            time_str = "Время не указано"
            if item['GetTime']:
                try:
                    # Парсим время из базы и форматируем
                    db_time = datetime.fromisoformat(item['GetTime'].replace('Z', '+00:00'))
                    time_str = db_time.strftime('%H:%M')
                except:
                    time_str = item['GetTime']
            
            queue_list.append({
                'queue_id': item['id_Queue'],
                'stand_id': item['id_Platform'],
                'stand_name': item['stand_name'],
                'stand_description': item['stand_description'],
                'time': time_str
            })
        
        return jsonify(queue_list)
        
    except Exception as e:
        conn.close()
        print(f"Ошибка при получении очереди пользователя: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/queue/<int:queue_id>', methods=['DELETE'])
def remove_from_queue(queue_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM Queue WHERE id_Queue = ?', (queue_id,))
        conn.commit()
        conn.close()
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/queue', methods=['POST'])
def add_to_queue():
    data = request.get_json()
    user_id = data.get('user_id')
    platform_id = data.get('platform_id')
    stand_name = data.get('stand_name')
    
    conn = get_db_connection()
    try:
        # Добавляем запись в Queue
        conn.execute('''
            INSERT INTO Queue (id_Platform, id_user, GetTime) 
            VALUES (?, ?, datetime('now'))
        ''', (platform_id, user_id))
        conn.commit()
        conn.close()
        return jsonify({'status': 'added'}), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/queue/stand', methods=['DELETE'])
def remove_from_stand_queue():
    data = request.get_json()
    user_id = data.get('user_id')
    stand_name = data.get('stand_name')
    
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM stand_queue WHERE user_id=? AND stand_name=?', (user_id, stand_name))
        conn.commit()
        conn.close()
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stands', methods=['GET'])
def get_stands():
    conn = get_db_connection()
    try:
        stands = conn.execute('''
            SELECT 
                id_Platform as id,
                Place as name,
                Description as description,
                Keywords as keywords
            FROM Platform
        ''').fetchall()
        
        conn.close()
        
        stands_list = []
        for stand in stands:
            stands_list.append({
                'id': stand['id'],
                'name': stand['name'],
                'description': stand['description'] or '',
                'keywords': stand['keywords'] or ''
            })
        
        return jsonify(stands_list)
        
    except Exception as e:
        conn.close()
        print(f"Ошибка при получении стендов: {e}")
        return jsonify({'error': str(e)}), 500


# -----------------------
# Запуск сервера
# -----------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
