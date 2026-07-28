(function () {
    'use strict';

    const BACKEND_URL = 'https://cinema.lavril.ru' + '/api/v1/analyze';
    
    console.log('Lampa Movies Analyzer Plugin: Скрипт загружен');

    function init() {
        console.log('Lampa Movies Analyzer Plugin: Инициализация успешна');

        // Функция для показа нашего собственного красивого окна
        function showCustomModal(title, htmlContent) {
            // На всякий случай удаляем старое окно, если оно зависло
            $('#ai-analysis-wrap').remove();
            
            let wrap = $(`
                <div id="ai-analysis-wrap" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;">
                    <div style="background: #141414; border: 1px solid #333; border-radius: 12px; width: 90%; max-width: 800px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                        <div style="padding: 20px 25px; font-size: 1.4em; font-weight: bold; border-bottom: 1px solid #222; color: #fff;">
                            Анализ: ${title}
                        </div>
                        <div id="ai-analysis-content" style="padding: 25px; overflow-y: auto; font-size: 1.15em; line-height: 1.6; color: #dcdcdc; flex-grow: 1;">
                            ${htmlContent}
                        </div>
                        <div style="padding: 15px 20px; text-align: center; color: #777; border-top: 1px solid #222; font-size: 0.9em; background: #0f0f0f; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                            Используйте ВВЕРХ / ВНИЗ на пульте для прокрутки текста. НАЗАД для закрытия.
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(wrap);
            
            // Плавное появление
            setTimeout(() => wrap.css('opacity', '1'), 10);

            // Подключаем управление с пульта (перехватываем события Лампы)
            Lampa.Controller.add('ai_analyzer_view', {
                toggle: function () {},
                up: function () {
                    // Прокрутка текста вверх на 100 пикселей
                    document.getElementById('ai-analysis-content').scrollBy({ top: -100, behavior: 'smooth' });
                },
                down: function () {
                    // Прокрутка текста вниз на 100 пикселей
                    document.getElementById('ai-analysis-content').scrollBy({ top: 100, behavior: 'smooth' });
                },
                back: function () {
                    wrap.css('opacity', '0');
                    setTimeout(() => {
                        wrap.remove();
                        Lampa.Controller.toggle('content'); // Возвращаем управление карточке фильма
                    }, 300);
                }
            });
            
            // Включаем контроллер нашего окна
            Lampa.Controller.toggle('ai_analyzer_view');
        }


        function showAIAnalysis(data) {
            let item = data.movie || data;
            let tmdb_id = item.tmdb_id || item.id || data.id;
            let media_type = data.method ? data.method : (item.name ? 'tv' : 'movie');
            let title = item.title || item.original_title || 'Неизвестный фильм';

            if (!tmdb_id) {
                Lampa.Noty.show('Ошибка: ID фильма не найден');
                return;
            }

            // Показываем диалог загрузки (его оставляем родным, он работает хорошо)
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
                // Закрываем меню загрузки
                Lampa.Select.close();

                if (data.error) {
                    Lampa.Noty.show('Ошибка анализа: ' + data.error);
                    return;
                }

                // Собираем красивый HTML текст (без всяких списков-кнопок)
                let fullHtml = '';
                
                if (data.audience_opinion) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #ffcc00; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">💬 Мнение аудитории:</div><div>' + data.audience_opinion.replace(/\n/g, '<br>') + '</div></div>';
                }
                
                if (data.critics_opinion && data.critics_opinion !== 'Нет данных' && data.critics_opinion.trim() !== '') {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #00ccff; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🎭 Мнение критиков:</div><div>' + data.critics_opinion.replace(/\n/g, '<br>') + '</div></div>';
                }
                
                if (data.pros && Array.isArray(data.pros) && data.pros.length > 0) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #4caf50; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🟢 Главные плюсы:</div><ul style="margin: 0; padding-left: 25px;">';
                    data.pros.forEach(p => fullHtml += '<li style="margin-bottom: 5px;">' + p + '</li>');
                    fullHtml += '</ul></div>';
                }
                
                if (data.cons && Array.isArray(data.cons) && data.cons.length > 0) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #f44336; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🔴 На что жалуются:</div><ul style="margin: 0; padding-left: 25px;">';
                    data.cons.forEach(c => fullHtml += '<li style="margin-bottom: 5px;">' + c + '</li>');
                    fullHtml += '</ul></div>';
                }
                
                if (data.target_audience) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #ce93d8; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🎯 Кому стоит посмотреть:</div><div>' + data.target_audience.replace(/\n/g, '<br>') + '</div></div>';
                }

                if (!fullHtml) {
                    fullHtml = 'Нет данных для отображения';
                }

                // Вызываем наше кастомное окно
                showCustomModal(title, fullHtml);
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
                        return;
                    }
                    isProcessing = true;
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
