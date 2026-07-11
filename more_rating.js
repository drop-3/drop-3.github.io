(function () {
    'use strict';

    // 1. НАШИ СТИЛИ С ВЫСОКИМ ПРИОРИТЕТОМ (z-index: 9999)
    let style = document.createElement('style');
    style.innerHTML = `
        .my-overlay-box {
            position: absolute !important;
            z-index: 9999 !important;
            pointer-events: none !important;
            font-family: Arial, sans-serif !important;
            line-height: 1 !important;
        }

        /* ЛЕВЫЙ ВЕРХНИЙ УГОЛ: Серии + статус */
        .my-overlay__top-left {
            top: 6px !important;
            left: 6px !important;
            background: rgba(0, 0, 0, 0.85) !important;
            color: #ffffff !important;
            padding: 4px 8px !important;
            border-radius: 6px !important;
            font-size: 11px !important;
            font-weight: bold !important;
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.8) !important;
        }

        .status-dot {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            display: inline-block !important;
        }
        .dot-green { background-color: #00FF66 !important; box-shadow: 0 0 6px #00FF66 !important; }
        .dot-red   { background-color: #FF3333 !important; box-shadow: 0 0 4px #FF3333 !important; }

        /* ПРАВЫЙ ВЕРХНИЙ УГОЛ: Год */
        .my-overlay__top-right {
            top: 6px !important;
            right: 6px !important;
            background: rgba(0, 0, 0, 0.85) !important;
            color: #dddddd !important;
            padding: 4px 8px !important;
            border-radius: 6px !important;
            font-size: 11px !important;
            font-weight: bold !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.8) !important;
        }

        /* ЛЕВЫЙ НИЖНИЙ УГОЛ: Цветное качество */
        .my-overlay__quality {
            bottom: 6px !important;
            left: 6px !important;
            padding: 4px 8px !important;
            border-radius: 6px !important;
            font-weight: 800 !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.9) !important;
        }

        .quality-gold { background: #FFC107 !important; color: #000000 !important; }
        .quality-blue { background: #00E5FF !important; color: #000814 !important; }
        .quality-white { background: #F8F9FA !important; color: #1A1A1A !important; }

        /* ПРАВЫЙ НИЖНИЙ УГОЛ: Крупные рейтинги */
        .my-overlay__rating {
            bottom: 6px !important;
            right: 6px !important;
            background: rgba(0, 0, 0, 0.85) !important;
            color: #00FF66 !important;
            padding: 5px 9px !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.9) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
        }
        
        .rating-good { color: #00FF66 !important; }
        .rating-mid  { color: #FFC107 !important; }
        .rating-bad  { color: #FF3333 !important; }

        /* АНИМАЦИЯ */
        .card.focus .card__view, .card:hover .card__view,
        .card.focus .card__img, .card:hover .card__img {
            transform: scale(1.05);
            box-shadow: 0 10px 25px rgba(0, 229, 255, 0.3) !important;
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    let firstCardLogged = false;

    // 2. УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК КАРТОЧЕК (Без фильтра e.type == 'build'!)
    Lampa.Listener.follow('card', function (e) {
        try {
            let card = e.render;
            let data = e.object || e.data;

            if (!card || !data) return;

            // Ищем визуальный контейнер карточки
            let view = null;
            if (card.find) {
                view = card.find('.card__view')[0] || card.find('.card__img')[0] || card[0];
            } else if (card.querySelector) {
                view = card.querySelector('.card__view') || card.querySelector('.card__img') || card;
            }
            if (!view) return;

            // Защита от повторного наложения на одну и ту же карточку
            if (view.classList.contains('my-overlay-added')) return;
            view.classList.add('my-overlay-added');

            // Удерживаем плашки в границах постера
            if (view.style) view.style.position = 'relative';

            // --- 1. ГОД ---
            let year = data.release_date || data.first_air_date || data.year || data.date;
            if (year) {
                let cleanYear = String(year).slice(0, 4);
                if (cleanYear.length === 4 && !isNaN(cleanYear)) {
                    let yearBox = document.createElement('div');
                    yearBox.className = 'my-overlay-box my-overlay__top-right';
                    yearBox.innerText = cleanYear;
                    view.appendChild(yearBox);
                }
            }

            // --- 2. ТИП + СЕРИИ + ТОЧКА СТАТУСА ---
            let isTv = data.type === 'tv' || data.name || data.number_of_seasons || data.first_air_date;
            let typeBox = document.createElement('div');
            typeBox.className = 'my-overlay-box my-overlay__top-left';

            if (isTv) {
                let seasonInfo = '';
                if (data.number_of_seasons) seasonInfo += `S${data.number_of_seasons}`;
                if (data.number_of_episodes) seasonInfo += ` E${data.number_of_episodes}`;
                
                let isEnded = data.status === 'Ended' || data.status === 'Canceled' || data.status === 'Завершен';
                let dotClass = isEnded ? 'dot-red' : 'dot-green';

                typeBox.innerHTML = `СЕРИАЛ ${seasonInfo} <span class="status-dot ${dotClass}"></span>`;
            } else {
                typeBox.innerText = 'ФИЛЬМ';
            }
            view.appendChild(typeBox);

            // --- 3. ЦВЕТНОЕ КАЧЕСТВО ---
            let quality = data.quality || data.hd || (data.rip ? 'DVDRip' : '');
            if (quality) {
                let qText = String(quality).toUpperCase();
                let colorClass = 'quality-white';

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

            // --- 4. КРУПНЫЙ РЕЙТИНГ ---
            let rating = data.kp_rating || data.rating_kp || data.imdb_rating || data.rating_imdb || data.vote_average || data.rating;
            if (rating && parseFloat(rating) > 0) {
                let cleanRating = parseFloat(rating).toFixed(1);
                
                let ratingColorClass = 'rating-good';
                if (cleanRating < 5.0) ratingColorClass = 'rating-bad';
                else if (cleanRating < 7.0) ratingColorClass = 'rating-mid';

                let ratingBox = document.createElement('div');
                ratingBox.className = `my-overlay-box my-overlay__rating ${ratingColorClass}`;
                ratingBox.innerText = cleanRating;
                view.appendChild(ratingBox);
            }

            // Выводим сообщение в консоль, когда первая карточка успешно оформилась
            if (!firstCardLogged) {
                console.log('УСПЕХ! Кастомный плагин начал оформлять карточки:', data.title || data.name || 'Фильм');
                firstCardLogged = true;
            }

        } catch (err) {
            console.error('Ошибка отрисовки карточки в плагине:', err);
        }
    });

    console.log('Кастомный плагин оверлея v2.0 (без фильтра типов) успешно загружен!');

})();
