(function () {
    'use strict';

    var VERSION = '7.0';

    // 1. ВИЗУАЛЬНЫЙ МАЯЧОК (Чистый HTML/CSS, независимый от Лампы)
    function showBanner(text, isError) {
        function create() {
            var div = document.createElement('div');
            div.style.cssText = 'position:fixed;top:15px;right:15px;z-index:999999;padding:12px 20px;background:' + (isError ? '#e74c3c' : '#2ecc71') + ';color:#fff;font-size:16px;font-weight:bold;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.5);pointer-events:none;';
            div.innerText = text;
            document.body.appendChild(div);
            setTimeout(function () {
                try { document.body.removeChild(div); } catch(e){}
            }, 5000);
        }
        if (document.body) create();
        else window.addEventListener('DOMContentLoaded', create);
    }

    showBanner('🚀 Torrents Copy v' + VERSION + ' запущен!');

    // 2. ПЕРЕХВАТ ШАБЛОНОВ (Тот самый секрет цветных плагинов!)
    // Когда Лампа или любой парсер создает строчку торрента, мы сохраняем данные в память элемента.
    function initTemplateHook() {
        if (!window.Lampa || !window.Lampa.Template) return false;
        if (window.Lampa.Template._torrents_copy_hooked) return true;
        window.Lampa.Template._torrents_copy_hooked = true;

        var orig_get = Lampa.Template.get;
        Lampa.Template.get = function (name, data) {
            var el = orig_get(name, data);
            if (data && typeof data === 'object' && el) {
                try {
                    if (window.$ && $(el).data) {
                        $(el).data('injected_torrent_data', data);
                        $(el).addClass('has-torrent-data');
                    }
                } catch (e) {}
            }
            return el;
        };
        return true;
    }

    // 3. Отслеживаем касания (пальцем на смартфоне, пультом на ТВ)
    var last_torrent_data = null;

    function extractDataFromElement(targetElement) {
        if (!targetElement || !window.$) return null;
        var el = $(targetElement);
        var max_depth = 15; // Поднимаемся вверх по дереву DOM до 15 уровней
        while (el.length && max_depth > 0 && !el.is('body') && !el.is('html')) {
            // Проверяем память jQuery (именно там лежат настоящие данные раздачи!)
            var d = el.data('injected_torrent_data') || el.data('element') || el.data('item') || el.data('torrent') || el.data('data');
            if (d && typeof d === 'object') {
                if (d.magnet || d.hash || d.Hash || d.link || d.url || d.MagnetUri || d.file || d.title || d.seeds) {
                    return d;
                }
            }
            el = el.parent();
            max_depth--;
        }
        return null;
    }

    ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (eventType) {
        document.addEventListener(eventType, function (e) {
            var found = extractDataFromElement(e.target);
            if (found) last_torrent_data = found;
        }, true);
    });

    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 || e.key === 'Enter') {
            var active = document.activeElement || (window.$ && $('.focus')[0]) || (window.$ && $('.selector.focus')[0]);
            var found = extractDataFromElement(active);
            if (found) last_torrent_data = found;
        }
    }, true);

    // 4. Поиск ссылок во всех полях объекта
    function findLinksInObject(obj, links, depth) {
        if (!obj || typeof obj !== 'object' || depth > 3) return;

        var hash_val = obj.hash || obj.Hash || obj.info_hash || obj.infoHash || obj.btih;
        if (!links.magnet && hash_val && typeof hash_val === 'string') {
            var clean_hash = hash_val.trim();
            if (/^[a-fA-F0-9]{40}$/.test(clean_hash) || /^[a-zA-Z2-7]{32}$/.test(clean_hash)) {
                links.magnet = 'magnet:?xt=urn:btih:' + clean_hash;
            }
        }

        for (var key in obj) {
            try {
                var val = obj[key];
                if (typeof val === 'string') {
                    val = val.trim();
                    if (val.toLowerCase().indexOf('magnet:') === 0) {
                        links.magnet = val;
                    } else if ((val.toLowerCase().indexOf('http') === 0 || val.toLowerCase().indexOf('ftp') === 0) &&
                               (val.indexOf('.torrent') !== -1 || key.toLowerCase().indexOf('link') !== -1 || key.toLowerCase().indexOf('url') !== -1 || key.toLowerCase().indexOf('file') !== -1 || key.toLowerCase().indexOf('torrent') !== -1)) {
                        if (!links.direct && !val.match(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mkv|avi|m3u8)$/i) && key.toLowerCase().indexOf('img') === -1 && key.toLowerCase().indexOf('poster') === -1) {
                            links.direct = val;
                        }
                    }
                } else if (typeof val === 'object' && val !== null) {
                    findLinksInObject(val, links, depth + 1);
                }
            } catch (e) {}
        }
    }

    // 5. Копирование в буфер (синтаксис проверен и исправлен!)
    function copyText(text, successMessage) {
        function showSuccess() {
            showBanner('📋 ' + successMessage);
            if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(successMessage);
        }
        function showError() {
            showBanner('❌ Ошибка копирования', true);
            if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Ошибка копирования');
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
                fallbackCopy(text, showSuccess, showError);
            }); // <-- Ошибка v6 была здесь! Теперь скобка закрыта правильно.
        } else {
            fallbackCopy(text, showSuccess, showError);
        }
    }

    function fallbackCopy(text, onSuccess, onError) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            var successful = document.execCommand('copy');
            if (successful) onSuccess();
            else if (onError) onError();
        } catch (err) {
            if (onError) onError();
        }
        
        document.body.removeChild(textArea);
    }

    // 6. Перехват контекстного меню
    function initSelectHook() {
        if (!window.Lampa || !window.Lampa.Select) return false;
        if (window.Lampa.Select._torrents_copy_hooked) return true;
        window.Lampa.Select._torrents_copy_hooked = true;

        var original_select_show = Lampa.Select.show;

        Lampa.Select.show = function (params) {
            if (params && params.items && Array.isArray(params.items)) {
                var links = { magnet: '', direct: '' };
                
                // 1. Ищем в параметрах самого меню
                findLinksInObject(params, links, 0);

                // 2. Ищем в последнем элементе, которого коснулись пальцем или пультом
                if (!links.magnet && !links.direct) {
                    findLinksInObject(last_torrent_data, links, 0);
                }

                // 3. Если всё еще пусто, проверяем текущий фокус на экране
                if (!links.magnet && !links.direct && window.$) {
                    var focusData = extractDataFromElement($('.focus, .selector.focus, :focus')[0]);
                    findLinksInObject(focusData, links, 0);
                }

                // Если нашли хотя бы одну ссылку — гарантированно добавляем кнопки в меню!
                if (links.magnet || links.direct) {
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

                    var original_onSelect = params.onSelect;
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
        return true;
    }

    // Запуск с постоянным контролем загрузки модулей форка
    initTemplateHook();
    initSelectHook();

    var checkInterval = setInterval(function () {
        var t = initTemplateHook();
        var s = initSelectHook();
        if (t && s) {
            clearInterval(checkInterval);
        }
    }, 300);
})();
