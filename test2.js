(function () {
    'use strict';

    const BACKEND_URL = 'https://cinema.lavril.ru' + '/api/v1/analyze';
    
    console.log('Lampa Movies Analyzer Plugin: Скрипт загружен');

    function init() {
        console.log('Lampa Movies Analyzer Plugin: Инициализация успешна');

        function showAIAnalysis(data) {
            let item = data.movie || data;
            let tmdb_id = item.tmdb_id || item.id || data.id;
            let media_type = data.method ? data.method : (item.name ? 'tv' : 'movie');
            let title = item.title || item.original_title || 'Неизвестный фильм';

            if (!tmdb_id) {
                Lampa.Noty.show('Ошибка: ID фильма не найден');
                return;
            }

            // Показываем диалог загрузки
            Lampa.Select.show({
                title: 'Анализ',
                items: [
                    {
                        title: '⏳ Загрузка...',
                        value: 'loading',
                        description: 'Анализируем отзывы и сюжет для: ' + title
                    }
                ],
                onBack: function () {
                    Lampa.Controller.toggle('content');
                }
            });

            let requestUrl = `${BACKEND_URL}/${media_type}/${tmdb_id}`;

            fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        let errorMsg = 'Код ошибки: ' + response.status;
                        try {
                            let errData = JSON.parse(text);
                            if (errData.detail) {
                                errorMsg = errData.detail; 
                            }
                        } catch (e) {}
                        throw new Error(errorMsg); 
                    });
                }
                return response.json(); 
            })
            .then(data => {
                // Закрываем диалог загрузки
                Lampa.Select.close();

                if (data.error) {
                    Lampa.Noty.show('Ошибка анализа: ' + data.error);
                    return;
                }

                // Формируем аккуратные карточки через title и description
                let items = [];
                
                if (data.audience_opinion) {
                    items.push({
                        title: '💬 Мнение аудитории',
                        description: data.audience_opinion,
                        value: 'info'
                    });
                }
                
                if (data.critics_opinion && data.critics_opinion !== 'Нет данных' && data.critics_opinion.trim() !== '') {
                    items.push({
                        title: '🎭 Мнение критиков',
                        description: data.critics_opinion,
                        value: 'info'
                    });
                }
                
                if (data.pros && Array.isArray(data.pros) && data.pros.length > 0) {
                    items.push({
                        title: '🟢 Главные плюсы',
                        // Превращаем массив плюсов в красивый список
                        description: data.pros.map(p => '• ' + p).join('<br>'),
                        value: 'info'
                    });
                }
                
                if (data.cons && Array.isArray(data.cons) && data.cons.length > 0) {
                    items.push({
                        title: '🔴 На что жалуются',
                        description: data.cons.map(c => '• ' + c).join('<br>'),
                        value: 'info'
                    });
                }
                
                if (data.target_audience) {
                    items.push({
                        title: '🎯 Кому стоит посмотреть',
                        description: data.target_audience,
                        value: 'info'
                    });
                }

                // Если нет данных
                if (items.length === 0) {
                    items.push({
                        title: 'Пусто',
                        description: 'Нет данных для отображения',
                        value: 'empty'
                    });
                }

                // Показываем результат в нативном окне Lampa
                Lampa.Select.show({
                    title: 'Анализ: ' + title,
                    items: items,
                    onSelect: function (item) {
                        if (item.value !== 'empty' && navigator.clipboard) {
                            // Формируем текст для копирования без HTML тегов
                            let copyText = item.title + '\n' + item.description.replace(/<br>/g, '\n');
                            navigator.clipboard.writeText(copyText).then(() => {
                                Lampa.Noty.show('Блок скопирован в буфер');
                            }).catch(() => {});
                        }
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            })
            .catch(err => {
                Lampa.Select.close();
                Lampa.Noty.show('Ошибка: ' + err.message);
            });
        }

        // Добавление кнопки в интерфейс
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                let render = e.object.activity.render();
                if (render.find('.ai-plugin-btn').length > 0) return;

                let button = `
                    <div class="full-start__button selector ai-plugin-btn">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="13" cy="13" r="9" stroke="currentColor" stroke-width="2.5" fill="transparent"/>
                            <line x1="20" y1="20" x2="28" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                        </svg>
                        <span>Анализ</span>
                    </div>
                `;
                
                let btn = $(button);                
                let isProcessing = false;
                
                function handleClick() {
                    if (isProcessing) {
                        console.log('⏳ Уже обрабатывается, пропускаем');
                        return;
                    }
                    isProcessing = true;
                    console.log('🚀 Запускаем анализ');
                    showAIAnalysis(e.data);
                    
                    setTimeout(function() {
                        isProcessing = false;
                    }, 2000);
                }
                
                btn.on('hover:enter', handleClick);
                
                btn.on('click', function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    handleClick();
                });
                
                let buttonsPanel = render.find('.full-start__buttons, .info__buttons, .full__buttons');
                
                if (buttonsPanel.length === 0) {
                    let anyButton = render.find('.full-start__button, .info__button, .selector').first();
                    if (anyButton.length > 0) buttonsPanel = anyButton.parent();
                }
                
                if (buttonsPanel && buttonsPanel.length > 0) {
                    let reactionBtn = buttonsPanel.find('.button--reaction');
                    if (reactionBtn.length > 0) {
                        reactionBtn.before(btn);
                    } else {
                        buttonsPanel.append(btn);
                    }
                }
            }
        });
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                init();
            }
        });
    }

})();
