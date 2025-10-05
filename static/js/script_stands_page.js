document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById('searchInput');

  let lastQuery = "";
  let results = [];
  let currentIndex = 0;

  // Снимаем выделение поиска со всех стендов
  function clearSearchHighlight() {
    document.querySelectorAll('.stand').forEach(s => s.classList.remove("active"));
  }

  // Одноразовая «авто‑очистка» после первого пользовательского действия
  function setupAutoClearOnce() {
    const standsContainer = document.querySelector('.stands-container');

    const onPointerEnterStand = (e) => {
      if (e.target.closest('.stand')) {
        teardown();
        clearSearchHighlight();
      }
    };

    const onPointerDown = () => {
      teardown();
      clearSearchHighlight();
    };

    const onScroll = () => {
      teardown();
      clearSearchHighlight();
    };

    function teardown() {
      standsContainer.removeEventListener('pointerenter', onPointerEnterStand, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('wheel', onScroll, true);
    }

    // Наведение на любой стенд, клик в документе, прокрутка/колесо — снимаем .active
    standsContainer.addEventListener('pointerenter', onPointerEnterStand, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('wheel', onScroll, true);
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      const query = this.value.trim().toLowerCase();
      if (!query) return;

      // если запрос изменился — пересобираем список
      if (query !== lastQuery) {
        lastQuery = query;
        results = [];
        currentIndex = 0;

        // снимаем active со всех стендов
        clearSearchHighlight();

        const stands = document.querySelectorAll('.stand');
        for (let stand of stands) {
          const name = stand.querySelector('.large-text').textContent.trim().toLowerCase();
          if (name.includes(query)) {
            results.push(stand);
          }
        }
      }

      if (results.length > 0) {
        // снимаем active у всех результатов
        results.forEach(s => s.classList.remove("active"));

        // подсвечиваем текущий
        const stand = results[currentIndex];
        stand.scrollIntoView({ behavior: 'smooth', block: 'center' });
        stand.classList.add("active");

        // ставим одноразовые слушатели: любое действие пользователя — очистка .active
        setupAutoClearOnce();

        // двигаем индекс по кругу
        currentIndex = (currentIndex + 1) % results.length;
      } else {
        alert("Ничего не найдено");
      }
    }
  });
});
function goToQR(standName) {
// Здесь можно подставить имя пользователя динамически
const user = "user1"; 
const status = "был";
const data = encodeURIComponent(`${standName}|${user}|${status}`);
window.location.href = `qr.html?data=${data}`;
}

async function loadStandsFromDB() {
    try {
        const response = await fetch('/api/stands');
        if (!response.ok) throw new Error('Ошибка загрузки стендов');
        const stands = await response.json();
        
        if (stands.length > 0) {
            renderStandsFromDB(stands);
        } else {
            // Если в БД нет стендов, показываем заглушку
            showDefaultStands();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showDefaultStands();
    }
}

// Функция отрисовки стендов из БД
function renderStandsFromDB(stands) {
    const container = document.getElementById('standsContainer');
    container.innerHTML = ''; // Очищаем контейнер

    stands.forEach(stand => {
        const standElement = createStandElementFromDB(stand);
        container.appendChild(standElement);
    });

    // Инициализируем поиск после загрузки стендов
    initializeSearch();
}

// Создание элемента стенда из данных БД
function createStandElementFromDB(stand) {
    const standDiv = document.createElement('div');
    standDiv.className = 'stand';
    standDiv.id = `stand-${stand.id}`;
    
    // Используем дефолтную картинку, так как в вашей таблице нет image_url
    const imageUrl = "../static/svg/tbank_logo.svg";
    
    standDiv.innerHTML = `
        <img src="${imageUrl}" class="adaptive-image" alt="${stand.name}">
        <p class="large-text">${stand.description}</p>
        ${stand.name ? `<p class="stand-description">${stand.name}</p>` : ''}
        <button class="fly-button recording">Записаться на стенд</button>
        <button class="fly-button cancel">Отказаться от записи</button>
        <button class="fly-button accepting" onclick="goToQR('${stand.name.replace(/'/g, "\\'")}')">
            Отсканировать QR
        </button>
    `;

    // Добавляем обработчики для кнопок
    addStandEventListeners(standDiv, stand);
    
    return standDiv;
}

// Добавление обработчиков событий для стенда
function addStandEventListeners(standElement, stand) {
    const recordBtn = standElement.querySelector('.fly-button.recording');
    const cancelBtn = standElement.querySelector('.fly-button.cancel');
    
    recordBtn.addEventListener('click', function() {
        followStand(stand.id, stand.name);
    });
    
    cancelBtn.addEventListener('click', function() {
        unfollowStand(stand.id, stand.name);
    });
}

async function followStand(standId, standName) {
    try {
        const userId = localStorage.getItem('userId') || 'current_user';
        
        // Записываем в stand_queue (ваша существующая таблица)
        const response1 = await fetch('/api/queue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                stand_name: standName
            })
        });

        // Записываем в Queue (новая таблица для профиля)
        const response2 = await fetch('/api/user/queue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                platform_id: standId,
                stand_name: standName
            })
        });

        if (response1.ok && response2.ok) {
            alert(`Вы записались на стенд "${standName}"`);
            updateButtonState(standId, true);
        } else {
            alert('Ошибка при записи на стенд');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function unfollowStand(standId, standName) {
    try {
        const userId = localStorage.getItem('userId') || 'current_user';
        
        const response = await fetch('/api/queue', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                stand_name: standName
            })
        });

        if (response.ok) {
            alert(`Вы отменили запись на стенд "${standName}"`);
            updateButtonState(standId, false);
        } else {
            alert('Ошибка при отмене записи');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function updateButtonState(standId, isFollowing) {
    const standElement = document.getElementById(`stand-${standId}`);
    if (!standElement) return;
    
    const recordBtn = standElement.querySelector('.fly-button.recording');
    const cancelBtn = standElement.querySelector('.fly-button.cancel');

    if (isFollowing) {
        recordBtn.style.display = 'none';
        cancelBtn.style.display = 'block';
    } else {
        recordBtn.style.display = 'block';
        cancelBtn.style.display = 'none';
    }
}

// Загрузка стендов при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadStandsFromDB();
});