(function () {
    'use strict';

    function initPlugin() {
        if (!window.Lampa || !window.Lampa.Select) return;

        // Копирование в буфер обмена с защитой от ограничений браузеров
        function copyText(text, successMessage) {
            function showSuccess() {
                Lampa.Noty.show(successMessage);
            }
            function showError() {
                Lampa.Noty.show('Ошибка копирования. Проверьте разрешения браузера');
            }

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
                    fallbackCopy(text, showSuccess, showError);
                });
            } else {
                fallbackCopy(text, showSuccess, showError);
            }
        }

        function fallbackCopy(text, onSuccess, onError) {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.top = "-9999px";
            textArea.style.left = "-9999px";
            textArea.style.opacity = "0";
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                let successful = document.execCommand('copy');
                if (successful) onSuccess();
                else if (onError) onError();
            } catch (err) {
                if (onError) onError();
            }
            
            document.body.removeChild(textArea);
        }

        // Сохраняем оригинальный системный метод отрисовки меню
        let original_select_show = Lampa.Select.show;

        // Перехватываем открытие всех контекстных меню в приложении
        Lampa.Select.show = function (params) {
            if (params && params.items && Array.isArray(params.items)) {
                // 1. Проверяем, является ли открытое меню менюшкой торрента
                let is_torrent_menu = params.items.some(function (item) {
                    let title = (item.title || '').toLowerCase();
                    return title.includes('торрент') || title.includes('пометить') || title.includes('отметк');
                });

                if (is_torrent_menu) {
                    // 2. Ищем данные о выбранной раздаче (в фокусе на экране или в параметрах)
                    let focus_el = $('.focus, .selector.focus');
                    let el_data = focus_el.data('element') || focus_el.data('item') || focus_el.data('torrent') || {};
                    let search_sources = [el_data, params, params.element || {}, params.item || {}];
                    
                    let links = { magnet: '', direct: '' };

                    // 3. Универсальный поиск ссылок или хешей во всех возможных полях
                    function extractFromObj(obj) {
                        if (!obj || typeof obj !== 'object') return;
                        
                        // Если магнета нет, но есть чистый хеш — собираем magnet-ссылку сами
                        if (!links.magnet && obj.hash && typeof obj.hash === 'string') {
                            let clean_hash = obj.hash.trim();
                            if (/^[a-fA-F0-9]{40}$/.test(clean_hash) || /^[a-zA-Z2-7]{32}$/.test(clean_hash)) {
                                links.magnet = 'magnet:?xt=urn:btih:' + clean_hash;
                            }
                        }

                        for (let key in obj) {
                            let val = obj[key];
                            if (typeof val === 'string') {
                                val = val.trim();
                                if (val.toLowerCase().startsWith('magnet:')) {
                                    links.magnet = val;
                                } else if ((val.toLowerCase().startsWith('http') || val.toLowerCase().startsWith('ftp')) && 
                                           (val.includes('.torrent') || key.toLowerCase().includes('link') || key.toLowerCase().includes('url') || key.toLowerCase().includes('file'))) {
                                    // Исключаем постеры и картинки
                                    if (!links.direct && !val.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) && !key.toLowerCase().includes('img') && !key.toLowerCase().includes('poster')) {
                                        links.direct = val;
                                    }
                                }
                            }
                        }
                    }

                    search_sources.forEach(extractFromObj);

                    // 4. Добавляем наши пункты, если ссылки нашлись
                    if (links.magnet) {
                        params.items.push({
                            title: 'Скопировать Magnet-ссылку',
                            copy_url: links.magnet,
                            copy_msg: 'Magnet-ссылка скопирована'
                        });
                    }

                    if (links.direct) {
                        params.items.push({
                            title: 'Скопировать .torrent ссылку',
                            copy_url: links.direct,
                            copy_msg: 'Прямая ссылка скопирована'
                        });
                    }

                    // 5. Обрабатываем клик по нашим новым пунктам
                    let original_onSelect = params.onSelect;
                    params.onSelect = function (item) {
                        if (item && item.copy_url) {
                            copyText(item.copy_url, item.copy_msg);
                        } else if (original_onSelect) {
                            original_onSelect(item);
                        }
                    };
                }
            }

            // Вызываем стандартное отображение меню уже с нашими добавленными пунктами
            return original_select_show(params);
        };
    }

    // Инициализация при старте Lampa
    if (window.appready) initPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') initPlugin();
        });
    }
})();
