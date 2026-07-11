(function () {
    'use strict';
    // Этот патч просто "перекрашивает" уже работающий плагин amikdn
    setInterval(function() {
        document.querySelectorAll('.card-overlay-item').forEach(el => {
            // Увеличиваем размер рейтинга
            if (el.classList.contains('bottom-right')) {
                el.style.fontSize = '14px';
                el.style.fontWeight = '800';
            }
            // Меняем цвета качества
            if (el.classList.contains('bottom-left')) {
                if (el.innerText.includes('4K')) el.style.color = '#FFC107';
                else if (el.innerText.includes('1080') || el.innerText.includes('HD')) el.style.color = '#00E5FF';
            }
        });
    }, 1000);
})();