(function () {
    'use strict';

    // 1. ВНЕДРЯЕМ НАШИ ФИРМЕННЫЕ СТИЛИ (CSS)
    let style = document.createElement('style');
    style.innerHTML = `
        /* --- Общие настройки для всех наших угловых плашек --- */
        .my-overlay-box {
            position: absolute;
            z-index: 10;
            pointer-events: none; /* Чтобы плашки не мешали кликать пультом */
            font-family: Arial, sans-serif;
            line-height: 1;
        }

        /* --- ЛЕВЫЙ ВЕРХНИЙ УГОЛ: Тип контента + серии + точка статуса --- */
        .my-overlay__top-left {
            top: 6px;
            left: 6px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* Точки статуса сериала */
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
        .dot-green { background-color: #00FF66; box-shadow: 0 0 6px #00FF66; } /* В эфире */
        .dot-red   { background-color: #FF3333; box-shadow: 0 0 4px #FF3333; } /* Завершён */

        /* --- ПРАВЫЙ ВЕРХНИЙ УГОЛ: Год выпуска --- */
        .my-overlay__top-right {
            top: 6px;
            right: 6px;
            background: rgba(0, 0, 0, 0.8);
            color: #dddddd;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* --- ЛЕВЫЙ НИЖНИЙ УГОЛ: Цветные плашки качества --- */
        .my-overlay__quality {
            bottom: 6px;
            left: 6px;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 800;          /* Экстра-жирный шрифт */
            font-size: 11px;
            text-transform: uppercase; /* Заглавные буквы */
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8); /* Тёмная тень вокруг */
        }

        /* Цветовая дифференциация качества */
        .quality-gold {
            background: #FFC107 !important; /* Янтарно-золотой фон (4K / UHD) */
            color: #000000 !important;      /* Чёрный текст */
        }
        .quality-blue {
            background: #00E5FF !important; /* Неоновый голубой (1080p / BluRay) */
            color: #000814 !important;      /* Глубокий тёмно-синий текст */
        }
        .quality-white {
            background: #F8F9FA !important; /* Белый фон (Обычное качество / 720p) */
            color: #1A1A1A !important;      /* Тёмно-графитовый текст */
        }

        /* --- ПРАВЫЙ НИЖНИЙ УГОЛ: Крупные рейтинги (Кинопоиск / IMDb) --- */
        .my-overlay__rating {
            bottom: 6px;
            right: 6px;
            background: rgba(0, 0, 0, 0.85);
            color: #00FF66; /* Зеленоватый цвет рейтинга по умолчанию */
            padding: 5px 9px;          /* Увеличенные отступы */
            border-radius: 6px;
            font-size: 14px;           /* Крупный шрифт для чтения с дивана! */
            font-weight: 800;
            box-shadow: 0 2px 6px rgba(0,0,0,0.8);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Подсветка разных оценок */
        .rating-good { color: #00FF66 !important; } /* Высокий рейтинг - зелёный */
        .rating-mid  { color: #FFC107 !important; } /* Средний рейтинг - жёлтый */
        .rating-bad  { color: #FF3333 !important; } /* Низкий рейтинг - красный */

        /* --- ПЛАВНАЯ АНИМАЦИЯ ПРИ НАВЕДЕНИИ ПУЛЬТОМ --- */
        .card.focus .card__view, .card:hover .card__view {
            transform: scale(1.05); /* Плавное увеличение карточки на 5% */
            box-shadow: 0 10px 25px rgba(0, 229, 255, 0.3) !important; /* Лёгкое неоновое свечение */
            transition: all 0.3s ease;
        }
        .card__view {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // 2. ЛОГИКА РАБОТЫ (НАКЛАДЫВАЕМ ЭЛЕМЕНТЫ НА КАРТОЧКИ)
    Lampa.Listener.follow('card', function (e) {
        if (e.type == 'build') {
            let card = e.render;  // HTML-элемент самой карточки
            let data = e.object;  // Информация о фильме/сериале (база данных Лампы)

            // Если это не стандартная карточка фильма/сериала, пропускаем
            if (!data || !card) return;

            // Контейнер с постером, куда мы будем приклеивать наши плашки
            let view = card.querySelector('.card__view');
            if (!view) return;

            // --- 1. ГОД (Правый верхний угол) ---
            let year = data.release_date || data.first_air_date || data.year;
            if (year && (typeof year === 'string' || typeof year === 'number')) {
                let cleanYear = String(year).slice(0, 4); // Берём только первые 4 цифры года
                if (cleanYear.length === 4) {
                    let yearBox = document.createElement('div');
                    yearBox.className = 'my-overlay-box my-overlay__top-right';
                    yearBox.innerText = cleanYear;
                    view.appendChild(yearBox);
                }
            }

            // --- 2. ТИП + СЕРИИ + ТОЧКА СТАТУСА (Левый верхний угол) ---
            let isTv = data.type === 'tv' || data.name || data.number_of_seasons;
            let typeBox = document.createElement('div');
            typeBox.className = 'my-overlay-box my-overlay__top-left';

            if (isTv) {
                // Если это сериал
                let seasonInfo = '';
                if (data.number_of_seasons) seasonInfo += `S${data.number_of_seasons}`;
                if (data.number_of_episodes) seasonInfo += ` E${data.number_of_episodes}`;
                
                // Проверяем статус (завершён или в эфире)
                let isEnded = data.status === 'Ended' || data.status === 'Canceled' || data.status === 'Завершен';
                let dotClass = isEnded ? 'dot-red' : 'dot-green';

                typeBox.innerHTML = `СЕРИАЛ ${seasonInfo} <span class="status-dot ${dotClass}"></span>`;
            } else {
                // Если это фильм
                typeBox.innerText = 'ФИЛЬМ';
            }
            view.appendChild(typeBox);

            // --- 3. ЦВЕТНОЕ КАЧЕСТВО ВИДЕО (Левый нижний угол) ---
            let quality = data.quality || data.hd || (data.rip ? 'DVDRip' : '');
            if (quality) {
                let qText = String(quality).toUpperCase();
                let colorClass = 'quality-white'; // По умолчанию белый

                // Проверяем качество и назначаем цвет
                if (qText.includes('4K') || qText.includes('2160') || qText.includes('UHD')) {
                    colorClass = 'quality-gold';
                } else if (qText.includes('1080') || qText.includes('FHD') || qText.includes('BLU') || qText.includes('BDRIP')) {
                    colorClass = 'quality-blue';
                }

                let qualityBox = document.createElement('div');
                qualityBox.className = `my-overlay-box my-overlay__quality ${colorClass}`;
                qualityBox.innerText = qText;
                view.appendChild(qualityBox);
            }

            // --- 4. КРУПНЫЙ РЕЙТИНГ (Правый нижний угол) ---
            // Ищем рейтинг Кинопоиска, если нет — берём IMDb или общий рейтинг TMDB
            let rating = data.kp_rating || data.rating_kp || data.imdb_rating || data.rating_imdb || data.vote_average;
            if (rating && parseFloat(rating) > 0) {
                let cleanRating = parseFloat(rating).toFixed(1); // Оставляем одну цифру после запятой (напр. 7.8)
                
                // Выбираем цвет цифр (зелёный для 7+, жёлтый для 5-7, красный для низких)
                let ratingColorClass = 'rating-good';
                if (cleanRating < 5.0) ratingColorClass = 'rating-bad';
                else if (cleanRating < 7.0) ratingColorClass = 'rating-mid';

                let ratingBox = document.createElement('div');
                ratingBox.className = `my-overlay-box my-overlay__rating ${ratingColorClass}`;
                ratingBox.innerText = cleanRating;
                view.appendChild(ratingBox);
            }

        }
    });

    console.log('Мой кастомный плагин карточек успешно загружен!');

})();