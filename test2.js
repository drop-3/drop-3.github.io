(function () {
    'use strict';

    // Вставь сюда свои ключи (внутри кавычек), чтобы они работали по умолчанию.
    // Если оставишь пустыми, плагин попросит ввести их в настройках Лампы.
    const DEFAULT_GEMINI_KEY = '';
    const DEFAULT_KINOPOISK_KEY = '';

    console.log('Lampa Movies Analyzer Plugin: Скрипт загружен (Локальная версия)');

    function getGeminiKey() {
        return Lampa.Storage.get('ai_analyzer_gemini_key') || DEFAULT_GEMINI_KEY;
    }

    function getKpKey() {
        return Lampa.Storage.get('ai_analyzer_kp_key') || DEFAULT_KINOPOISK_KEY;
    }

    function init() {
        console.log('Lampa Movies Analyzer Plugin: Инициализация успешна');

        // Внедряем раздел в настройки Лампы
        if (window.Lampa && Lampa.SettingsApi && !Lampa.SettingsApi.getComponent('ai_analyzer')) {
            Lampa.SettingsApi.addComponent({
                component: 'ai_analyzer',
                name: 'Анализ ИИ',
                icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="9" stroke="currentColor" stroke-width="2.5" fill="transparent"/><line x1="20" y1="20" x2="28" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`
            });

            // Кнопка для ввода ключа Gemini (открывает нативную клавиатуру Лампы)
            Lampa.SettingsApi.addParam({
                component: 'ai_analyzer',
                param: {
                    name: 'ai_analyzer_gemini_key',
                    type: 'button'
                },
                field: {
                    name: 'API Ключ Gemini',
                    description: 'Нажмите, чтобы ввести или изменить ключ'
                },
                onChange: function () {
                    Lampa.Input.edit({
                        title: 'API Ключ Gemini',
                        value: Lampa.Storage.get('ai_analyzer_gemini_key', ''),
                        free: true
                    }, function (new_val) {
                        Lampa.Storage.set('ai_analyzer_gemini_key', new_val.trim());
                        Lampa.Settings.update();
                    });
                }
            });

            // Кнопка для ввода ключа Кинопоиска (открывает нативную клавиатуру Лампы)
            Lampa.SettingsApi.addParam({
                component: 'ai_analyzer',
                param: {
                    name: 'ai_analyzer_kp_key',
                    type: 'button'
                },
                field: {
                    name: 'API Ключ Кинопоиск (Unofficial)',
                    description: 'Нажмите, чтобы ввести или изменить ключ'
                },
                onChange: function () {
                    Lampa.Input.edit({
                        title: 'API Ключ Кинопоиск',
                        value: Lampa.Storage.get('ai_analyzer_kp_key', ''),
                        free: true
                    }, function (new_val) {
                        Lampa.Storage.set('ai_analyzer_kp_key', new_val.trim());
                        Lampa.Settings.update();
                    });
                }
            });
        }

        async function fetchAIAnalysis(data, geminiKey, kpKey) {
            let item = data.movie || data;
            let title = item.title || item.original_title || item.name || 'Неизвестный фильм';
            let overview = item.overview || 'Сюжет не найден.';
            let kp_id = item.kinopoisk_id;

            let reviewsText = '';

            if (kpKey) {
                try {
                    if (!kp_id) {
                        let searchRes = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}`, {
                            headers: { 'X-API-KEY': kpKey }
                        }).then(r => r.json());
                        if (searchRes.films && searchRes.films.length > 0) {
                            kp_id = searchRes.films[0].filmId;
                        }
                    }

                    if (kp_id) {
                        let reviewsRes = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${kp_id}/reviews?page=1`, {
                            headers: { 'X-API-KEY': kpKey }
                        }).then(r => r.json());

                        if (reviewsRes.items && reviewsRes.items.length > 0) {
                            reviewsText = reviewsRes.items.slice(0, 10).map(r => `[Отзыв зрителя]: ${r.description}`).join('\n\n').substring(0, 15000); 
                        }
                    }
                } catch (e) {
                    console.log('Lampa AI Analyzer: Ошибка получения отзывов KP', e);
                }
            }

            let prompt = `Проанализируй фильм/сериал "${title}".
Официальное описание: ${overview}
Отзывы зрителей: ${reviewsText ? reviewsText : 'Отзывов нет. Используй свои знания об этом фильме.'}

Тебе нужно составить краткую выжимку. Верни ответ СТРОГО в формате JSON без markdown разметки (без \`\`\`json). 
Ключи JSON должны быть точно такими:
{
  "audience_opinion": "Мнение зрителей (сводка на 2-3 абзаца)",
  "critics_opinion": "Мнение критиков (сводка на 2-3 абзаца, если данных нет, напиши 'Нет данных')",
  "pros": ["короткий плюс 1", "короткий плюс 2", "короткий плюс 3"],
  "cons": ["короткий минус 1", "короткий минус 2", "короткий минус 3"],
  "target_audience": "Кому стоит посмотреть (1-2 предложения)"
}`;

            // Используем актуальную модель gemini-3.1-flash, которая подтверждена на твоем ключе
            let geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        response_mime_type: "application/json",
                        temperature: 0.3
                    }
                })
            });

            if (!geminiRes.ok) {
                let errText = await geminiRes.text();
                throw new Error(`Ошибка Gemini API (${geminiRes.status}): ${errText.substring(0, 100)}`);
            }

            let geminiData = await geminiRes.json();
            
            if (geminiData.error) {
                throw new Error(geminiData.error.message);
            }

            let jsonText = geminiData.candidates[0].content.parts[0].text;
            return JSON.parse(jsonText);
        }

        function showCustomModal(title, htmlContent) {
            $('#ai-analysis-wrap').remove();
            
            let wrap = $(`
                <div id="ai-analysis-wrap" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;">
                    <div style="background: #141414; border: 1px solid #333; border-radius: 12px; width: 90%; max-width: 800px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                        <div style="padding: 20px 25px; font-size: 1.4em; font-weight: bold; border-bottom: 1px solid #222; color: #fff;">
                            Анализ: ${title}
                        </div>
                        <div id="ai-analysis-content" style="padding: 25px; overflow-y: auto; font-size: 1.15em; line-height: 1.6; color: #dcdcdc; flex-grow: 1; transition: opacity 0.2s;">
                            ${htmlContent}
                        </div>
                        <div style="padding: 15px 20px; text-align: center; color: #777; border-top: 1px solid #222; font-size: 0.9em; background: #0f0f0f; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                            Используйте ВВЕРХ / ВНИЗ на пульте для прокрутки текста. НАЗАД для закрытия.
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(wrap);
            setTimeout(() => wrap.css('opacity', '1'), 10);

            Lampa.Controller.add('ai_analyzer_view', {
                toggle: function () {},
                up: function () {
                    document.getElementById('ai-analysis-content').scrollBy({ top: -100, behavior: 'smooth' });
                },
                down: function () {
                    document.getElementById('ai-analysis-content').scrollBy({ top: 100, behavior: 'smooth' });
                },
                back: function () {
                    wrap.css('opacity', '0');
                    setTimeout(() => {
                        wrap.remove();
                        Lampa.Controller.toggle('content');
                    }, 300);
                }
            });
            
            Lampa.Controller.toggle('ai_analyzer_view');
        }

        function showAIAnalysis(data) {
            let item = data.movie || data;
            let title = item.title || item.original_title || 'Неизвестный фильм';

            let activeGeminiKey = getGeminiKey();
            let activeKpKey = getKpKey();

            let loadingHtml = `
                <div style="text-align: center; padding: 40px 0; color: #aaa;">
                    <div style="font-size: 2.5em; margin-bottom: 15px;">⏳</div>
                    <div>Сбор данных и ИИ анализ...<br>Пожалуйста, подождите.</div>
                </div>
            `;
            showCustomModal(title, loadingHtml);

            let contentBox = $('#ai-analysis-content');

            if (!activeGeminiKey) {
                contentBox.html(`<div style="color: #f44336; text-align: center; padding: 30px;">Ошибка: Не указан API ключ Gemini.<br><br>Перейдите в Настройки -> Анализ ИИ и укажите ключ.</div>`);
                return;
            }

            fetchAIAnalysis(data, activeGeminiKey, activeKpKey)
            .then(parsedData => {
                let fullHtml = '';
                
                if (parsedData.audience_opinion) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #ffcc00; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">💬 Мнение аудитории:</div><div>' + parsedData.audience_opinion.replace(/\n/g, '<br>') + '</div></div>';
                }
                
                if (parsedData.critics_opinion && parsedData.critics_opinion !== 'Нет данных' && parsedData.critics_opinion.trim() !== '') {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #00ccff; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🎭 Мнение критиков:</div><div>' + parsedData.critics_opinion.replace(/\n/g, '<br>') + '</div></div>';
                }
                
                if (parsedData.pros && Array.isArray(parsedData.pros) && parsedData.pros.length > 0) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #4caf50; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🟢 Главные плюсы:</div><ul style="margin: 0; padding-left: 25px;">';
                    parsedData.pros.forEach(p => fullHtml += '<li style="margin-bottom: 5px;">' + p + '</li>');
                    fullHtml += '</ul></div>';
                }
                
                if (parsedData.cons && Array.isArray(parsedData.cons) && parsedData.cons.length > 0) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #f44336; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🔴 На что жалуются:</div><ul style="margin: 0; padding-left: 25px;">';
                    parsedData.cons.forEach(c => fullHtml += '<li style="margin-bottom: 5px;">' + c + '</li>');
                    fullHtml += '</ul></div>';
                }
                
                if (parsedData.target_audience) {
                    fullHtml += '<div style="margin-bottom: 20px;"><div style="color: #ce93d8; font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">🎯 Кому стоит посмотреть:</div><div>' + parsedData.target_audience.replace(/\n/g, '<br>') + '</div></div>';
                }

                if (!fullHtml) {
                    fullHtml = '<div style="text-align: center; padding: 30px;">Нет данных для отображения</div>';
                }

                contentBox.css('opacity', '0');
                setTimeout(() => {
                    contentBox.html(fullHtml);
                    contentBox.css('opacity', '1');
                }, 200);
            })
            .catch(err => {
                contentBox.html(`<div style="color: #f44336; text-align: center; padding: 30px;">Ошибка связи: ${err.message}</div>`);
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
                    if (isProcessing) return;
                    isProcessing = true;
                    showAIAnalysis(e.data);
                    setTimeout(() => isProcessing = false, 2000);
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
