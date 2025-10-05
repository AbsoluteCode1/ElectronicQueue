async function loadUserQueue() {
    try {
        // Получаем user_id из localStorage или используем дефолтный
        const userId = localStorage.getItem('userId') || 'current_user';
        
        const response = await fetch(`/api/user/queue?user_id=${userId}`);
        if (!response.ok) throw new Error('Ошибка загрузки очереди');
        
        const queue = await response.json();
        renderUserQueue(queue);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('userQueueList').innerHTML = 
            '<div class="error">Ошибка загрузки данных</div>';
    }
}

// Отрисовка очереди пользователя
function renderUserQueue(queue) {
    const container = document.getElementById('userQueueList');
    
    if (queue.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Вы ещё не записались ни на один стенд
            </div>
        `;
        return;
    }
    
    container.innerHTML = queue.map(item => `
        <div class="stand-card" data-queue-id="${item.queue_id}">
            <div class="stand-info">
                <p class="stand-title">${item.stand_name}</p>
                <p class="stand-time">${item.time}</p>
                ${item.stand_description ? `<p class="stand-description">${item.stand_description}</p>` : ''}
            </div>
            <button class="unsubscribe-btn" onclick="removeFromQueue(${item.queue_id}, '${item.stand_name.replace(/'/g, "\\'")}')">
                Отписаться
            </button>
        </div>
    `).join('');
}

// Удаление из очереди
async function removeFromQueue(queueId, standName) {
    if (!confirm(`Вы уверены, что хотите отписаться от стенда "${standName}"?`)) {
        return;
    }
    
    try {
        const userId = localStorage.getItem('userId') || 'current_user';
        
        // Удаляем из обеих таблиц
        const response1 = await fetch(`/api/user/queue/${queueId}`, {
            method: 'DELETE'
        });
        
        const response2 = await fetch('/api/user/queue/stand', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                stand_name: standName
            })
        });
        
        if (response1.ok && response2.ok) {
            alert(`Вы отписались от стенда "${standName}"`);
            document.querySelector(`[data-queue-id="${queueId}"]`).remove();
            
            const remainingStands = document.querySelectorAll('.stand-card').length;
            if (remainingStands === 0) {
                document.getElementById('userQueueList').innerHTML = `
                    <div class="empty-state">
                        Вы ещё не записались ни на один стенд
                    </div>
                `;
            }
        } else {
            alert('Ошибка при отписке от стенда');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при отписке от стенда');
    }
}

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    loadUserQueue();
});