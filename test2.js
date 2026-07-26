(function () {
    'use strict';

    Lampa.Plugin.init('tmdb_imdb_style', {
        title: 'TMDb in IMDb Style',
        version: '1.0',
        description: 'Отображение рейтинга TMDb в желтом стиле'
    });

    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'build') {
            
            // Ищем стандартный класс рейтинга
            let tmdbButton = e.html.find('.full-start__rate');

            // Резервный поиск, если класс другой
            if (tmdbButton.length === 0) {
                tmdbButton = e.html.find('.tag').filter(function() {
                    return $(this).text().indexOf('TMDB') > -1 || $(this).text().indexOf('TMDb') > -1;
                });
            }

            if (tmdbButton.length) {
                
                // Получаем рейтинг фильма из базы
                let rating = e.data.vote_average ? parseFloat(e.data.vote_average).toFixed(1) : '';
                
                // Формируем текст: меняем 'TMDB' на 'TMDb' и подставляем актуальную цифру
                if (rating) {
                    tmdbButton.text(rating + ' TMDb');
                } else {
                    let currentText = tmdbButton.text();
                    tmdbButton.text(currentText.replace(/TMDB/i, 'TMDb'));
                }

                // Применяем стили, чтобы сделать кнопку похожей на референс
                tmdbButton.css({
                    'background-color': '#f5c518', // Классический желтый цвет
                    'color': '#000000',            // Черный текст
                    'font-weight': '900',          // Максимально жирный шрифт
                    'font-family': 'Impact, "Arial Black", sans-serif', // Массивный шрифт
                    'border': 'none',              // Убираем стандартную рамку
                    'border-radius': '4px',        // Скругление краев
                    'padding': '2px 6px',          // Отступы по краям от текста
                    'box-shadow': 'none',          // Убираем свечение
                    'text-transform': 'none'       // Отключаем принудительный верхний регистр
                });
            }
        }
    });

})();
