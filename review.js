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
                    // Если сервер вернул ошибку (429, 500 и т.д.), читаем тело ответа
                    return response.text().then(text => {
                        let errorMsg = 'Код ошибки: ' + response.status;
                        try {
                            // Пытаемся достать поле detail из ответа FastAPI
                            let errData = JSON.parse(text);
                            if (errData.detail) {
                                errorMsg = errData.detail; // Тот самый текст "Дневной лимит исчерпан..."
                            }
                        } catch (e) {
                            // Если пришел не JSON, оставляем стандартный текст
                        }
                        // Пробрасываем ошибку дальше в блок .catch()
                        throw new Error(errorMsg); 
                    });
                }
                return response.json(); // Если всё ок (200), просто парсим JSON
            })
            .then(data => {
                // Закрываем диалог загрузки
                Lampa.Select.close();

                if (data.error) {
                    Lampa.Select.show({
                        title: '❌ Ошибка',
                        items: [
                            {
                                title: 'Ошибка анализа',
                                value: 'error',
                                description: data.error
                            }
                        ],
                        onBack: function () {
                            Lampa.Controller.toggle('content');
                        }
                    });
                    return;
                }

                // Формируем текст для отображения
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
                

                // Если нет данных
                if (!fullText.trim()) {
                    fullText = 'Нет данных для отображения';
                }

                // Создаем массив строк для отображения
                let lines = fullText.split('\n');
                let items = [];
                
                // Добавляем каждую строку как отдельный пункт
                lines.forEach(line => {
                    if (line.trim()) {
                        items.push({
                            title: line,
                            value: 'line_' + items.length,
                            description: ''
                        });
                    }
                });

                // Если слишком много строк, группируем
                if (items.length > 20) {
                    // Оставляем только первые 20 и добавляем "и еще..."
                    let truncated = items.slice(0, 20);
                    truncated.push({
                        title: '... и еще ' + (items.length - 20) + ' строк',
                        value: 'more',
                        description: ''
                    });
                    items = truncated;
                }

                // Показываем результат
                Lampa.Select.show({
                    title: 'Анализ: ' + title,
                    items: items,
                    onSelect: function (item) {
                        // Если это строка с текстом, копируем её
                        if (item.value !== 'more' && item.title) {
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

                // Всплывающее уведомление (Toast) в Лампе - очень удобно для отображения лимитов
                Lampa.Noty.show(err.message);
                
                Lampa.Select.show({
                    title: '❌ Ошибка связи',
                    items: [
                        {
                            title: 'Не удалось подключиться к серверу',
                            value: 'error',
                            description: err.message || 'Проверьте интернет-соединение'
                        }
                    ],
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            });
        }

        // Добавление кнопки в интерфейс
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Проверяем, не добавлена ли уже кнопка
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
                
                // Создаем флаг для предотвращения двойного вызова
                let isProcessing = false;
                
                // Функция-обработчик с защитой
                function handleClick() {
                    if (isProcessing) {
                        console.log('⏳ Уже обрабатывается, пропускаем');
                        return;
                    }
                    isProcessing = true;
                    console.log('🚀 Запускаем анализ');
                    showAIAnalysis(e.data);
                    
                    // Сбрасываем флаг через 2 секунды (время на выполнение)
                    setTimeout(function() {
                        isProcessing = false;
                        console.log('✅ Флаг сброшен');
                    }, 2000);
                }
                
                // Подписываемся только на hover:enter (основное событие в Lampa)
                btn.on('hover:enter', handleClick);
                
                // Для мыши используем отдельную обработку с защитой
                btn.on('click', function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    handleClick();
                });
                
                // Ищем панель с кнопками
                let buttonsPanel = render.find('.full-start__buttons, .info__buttons, .full__buttons');
                
                if (buttonsPanel.length === 0) {
                    let anyButton = render.find('.full-start__button, .info__button, .selector').first();
                    if (anyButton.length > 0) buttonsPanel = anyButton.parent();
                }
                
                if (buttonsPanel && buttonsPanel.length > 0) {
                    // Добавляем перед кнопкой реакций или после
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

    // Инициализация плагина
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