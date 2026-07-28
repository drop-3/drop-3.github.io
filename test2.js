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
                if (data.error) {
                    // Если ошибка данных, закрываем меню и показываем уведомление
                    Lampa.Select.close();
                    Lampa.Noty.show('Ошибка анализа: ' + data.error);
                    return;
                }

                // Возвращаемся к надежной логике сплошного текста
                let fullText = '';
                
                if (data.audience_opinion) {
                    fullText += '💬 Мнение аудитории:\n' + data.audience_opinion + '\n\n';
                }
                
                if (data.critics_opinion && data.critics_opinion !== 'Нет данных' && data.critics_opinion.trim() !== '') {
                    fullText += '🎭 Мнение критиков:\n' + data.critics_opinion + '\n\n';
                }
                
                if (data.pros && Array.isArray(data.pros) && data.pros.length > 0) {
                    fullText += '🟢 Главные плюсы:\n';
                    data.pros.forEach(p => {
                        fullText += '  • ' + p + '\n';
                    });
                    fullText += '\n';
                }
                
                if (data.cons && Array.isArray(data.cons) && data.cons.length > 0) {
                    fullText += '🔴 На что жалуются:\n';
                    data.cons.forEach(c => {
                        fullText += '  • ' + c + '\n';
                    });
                    fullText += '\n';
                }
                
                if (data.target_audience) {
                    fullText += '🎯 Кому стоит посмотреть:\n' + data.target_audience + '\n\n';
                }
                
                if (!fullText.trim()) {
                    fullText = 'Нет данных для отображения';
                }

                // Создаем массив строк для Lampa.Select
                let lines = fullText.split('\n');
                let items = [];
                
                lines.forEach(line => {
                    // Оставляем даже пустые строки для визуальных отступов
                    if (line.trim() !== '' || items.length > 0) {
                        items.push({
                            title: line || ' ', // Заменяем пустую строку на пробел, чтобы не схлопывалась
                            value: 'line_' + items.length,
                            description: ''
                        });
                    }
                });

                // Подчищаем лишние пустые строки в самом конце
                while (items.length > 0 && items[items.length - 1].title === ' ') {
                    items.pop();
                }

                // Немного увеличил лимит до 40 строк для более подробных отзывов
                if (items.length > 40) {
                    let truncated = items.slice(0, 40);
                    truncated.push({
                        title: '... и еще ' + (items.length - 40) + ' строк',
                        value: 'more',
                        description: ''
                    });
                    items = truncated;
                }

                // Вызываем показ меню БЕЗ предварительного close(). 
                // Это перезапишет текущее "окно загрузки" без двойного мигания.
                Lampa.Select.show({
                    title: 'Анализ: ' + title,
                    items: items,
                    onSelect: function (item) {
                        if (item.value !== 'more' && item.title && item.title !== ' ') {
                            if (navigator.clipboard) {
                                navigator.clipboard.writeText(item.title).then(() => {
                                    Lampa.Noty.show('Скопировано в буфер обмена');
                                }).catch(() => {});
                            }
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
