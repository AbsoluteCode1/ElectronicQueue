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