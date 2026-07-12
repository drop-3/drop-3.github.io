(function () {
    'use strict';

    function initPlugin() {
        if (!window.Lampa) return;

        // 1. ПЕРЕХВАТ ШАБЛОНОВ (Главный секрет!)
        // Lampa не хранит ссылки в HTML. Мы перехватываем генератор шаблонов
        // и принудительно "приклеиваем" данные раздачи прямо к HTML-элементу.
        if (window.Lampa.Template) {
            let orig_template_get = Lampa.Template.get;
            Lampa.Template.get = function (name, data) {
                let el = orig_template_get(name, data);
                if (data && typeof data === 'object' && el && el.data) {
                    try {
                        el.data('injected_torrent_data', data);
                    } catch (e) {}
                }
                return el;
            };
        }

        let last_interacted_data = null;

        // 2. Отслеживаем касания, клики или наведение пульта
        $(document).on('touchstart pointerdown mousedown mouseenter focus hover:focus', '.selector, [class*="torrent"], [class*="item"], [class*="card"]', function () {
            let el = $(this);
            // Ищем наши приклеенные данные на самом элементе или его родителях
            let target = el.closest('[data-injected_torrent_data], [data-element], [data-item], [data-torrent]');
            if (target.length) {
                let data = target.data('injected_torrent_data') || target.data('element') || target.data('item') || target.data('torrent') || target.data('data');
                if (data && typeof data === 'object') {
                    last_interacted_data = data;
                }
            }
        });

        // Функция копирования в буфер обмена
        function copyText(text, successMessage) {
            function showSuccess() {
                if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(successMessage);
                else alert(successMessage);
            }
            function showError() {
                if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Ошибка копирования. Проверьте разрешения браузера');
                else alert('Ошибка копирования');
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

        // 3. Перехватываем открытие контекстного меню
        if (window.Lampa.Select) {
            let original_select_show = Lampa.Select.show;

            Lampa.Select.show = function (params) {
                if (params && params.items && Array.isArray(params.items)) {
                    // Надежно определяем меню торрента по названиям или системным действиям (add/mark)
                    let is_torrent_menu = params.items.some(function (item) {
                        let title = (item.title || '').toLowerCase();
                        let action = (item.action || '').toLowerCase();
                        return title.includes('отметк') || title.includes('пометить') || title.includes('торрент') || 
                               title.includes('добавить') || title.includes('мои') || action === 'add' || action === 'mark';
                    });

                    if (is_torrent_menu) {
                        let links = { magnet: '', direct: '' };

                        // Ищем наши приклеенные данные везде, где они могут быть
                        let current_focused = $('.focus, .selector.focus, :hover').closest('[data-injected_torrent_data], [data-element], [data-item]');
                        let search_sources = [
                            last_interacted_data,
                            current_focused.data('injected_torrent_data'),
                            current_focused.data('element'),
                            current_focused.data('item'),
                            params.element,
                            params.item,
                            params.data
                        ];

                        function extractFromObj(obj) {
                            if (!obj || typeof obj !== 'object') return;
                            
                            // Если парсер отдал только хеш — собираем из него magnet-ссылку сами
                            let hash_val = obj.hash || obj.Hash || obj.info_hash || obj.infoHash || obj.btih;
                            if (!links.magnet && hash_val && typeof hash_val === 'string') {
                                let clean_hash = hash_val.trim();
                                if (/^[a-fA-F0-9]{40}$/.test(clean_hash) || /^[a-zA-Z2-7]{32}$/.test(clean_hash)) {
                                    links.magnet = 'magnet:?xt=urn:btih:' + clean_hash;
                                }
                            }

                            // Ищем готовые ссылки во всех свойствах объекта раздачи
                            for (let key in obj) {
                                let val = obj[key];
                                if (typeof val === 'string') {
                                    val = val.trim();
                                    if (val.toLowerCase().startsWith('magnet:')) {
                                        links.magnet = val;
                                    } else if ((val.toLowerCase().startsWith('http') || val.toLowerCase().startsWith('ftp')) && 
                                               (val.includes('.torrent') || key.toLowerCase().includes('link') || key.toLowerCase().includes('url') || key.toLowerCase().includes('file') || key.toLowerCase().includes('torrent') || key.toLowerCase().includes('uri'))) {
                                        // Отсекаем постеры и картинки
                                        if (!links.direct && !val.match(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mkv|avi|m3u8)$/i) && !key.toLowerCase().includes('img') && !key.toLowerCase().includes('poster') && !key.toLowerCase().includes('icon')) {
                                            links.direct = val;
                                        }
                                    }
                                }
                            }
                        }

                        search_sources.forEach(extractFromObj);

                        // 4. Добавляем наши пункты в меню
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

                        // Обработка клика по пункту
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

                return original_select_show(params);
            };
        }
    }

    // Надежная инициализация (с защитой от особенностей загрузки форков)
    if (window.appready) initPlugin();
    else {
        let listener = window.Lampa && window.Lampa.Listener;
        if (listener && listener.follow) {
            listener.follow('app', function (e) {
                if (e.type == 'ready') initPlugin();
            });
        } else {
            // Если Lampa загружается нестандартно, ждем появления нужных модулей
            let checkInterval = setInterval(function () {
                if (window.Lampa && window.Lampa.Select && window.Lampa.Template) {
                    clearInterval(checkInterval);
                    initPlugin();
                }
            }, 500);
        }
    }
})();
