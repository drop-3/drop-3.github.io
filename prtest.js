(function () {
    'use strict';

    function initPlugin() {
        if (!window.Lampa) return;

        // Универсальный поиск ссылок в объекте раздачи
        function getLinks(el) {
            let magnet = '';
            let direct = '';
            
            // Разные парсеры (JacRed, TorrServer, RuTracker) сохраняют ссылки в разные поля
            let fields = ['magnet', 'MagnetUri', 'link', 'url', 'torrent', 'file', 'uri'];
            
            fields.forEach(function (field) {
                if (el[field] && typeof el[field] === 'string') {
                    let val = el[field].trim();
                    if (val.toLowerCase().startsWith('magnet:')) {
                        if (!magnet) magnet = val;
                    } else if (val.toLowerCase().startsWith('http:') || val.toLowerCase().startsWith('https:') || val.toLowerCase().startsWith('ftp:')) {
                        if (!direct) direct = val;
                    }
                }
            });
            
            return { magnet: magnet, direct: direct };
        }

        // Копирование в буфер с защитой от блокировок в разных браузерах/HTTP
        function copyText(text, successMessage) {
            function showSuccess() {
                Lampa.Noty.show(successMessage);
            }
            function showError() {
                Lampa.Noty.show('Ошибка копирования. Проверьте разрешения браузера');
            }

            // Современный API (работает в HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
                    fallbackCopy(text, showSuccess, showError);
                });
            } else {
                // Фоллбэк для локальных IP (HTTP) и старых WebView
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

        // Слушаем инициализацию компонентов приложения
        Lampa.Listener.follow('component', function (e) {
            // Отслеживаем открытие компонента с торрентами
            if ((e.type == 'torrents' || e.type == 'torrent') && e.object) {
                let original_menu = e.object.menu;
                
                if (typeof original_menu === 'function') {
                    // Перехватываем вызов контекстного меню раздачи
                    e.object.menu = function (element) {
                        let original_show = Lampa.Select.show;
                        
                        // Временно подменяем отрисовку меню, чтобы добавить наши пункты
                        Lampa.Select.show = function (params) {
                            Lampa.Select.show = original_show; // Сразу возвращаем оригинальный метод
                            
                            if (params && params.items && element) {
                                let links = getLinks(element);
                                let original_onSelect = params.onSelect;

                                // Добавляем пункты только если ссылка реально существует в раздаче
                                if (links.magnet) {
                                    params.items.push({
                                        title: 'Скопировать Magnet-ссылку',
                                        copy_url: links.magnet,
                                        copy_msg: 'Magnet-ссылка скопирована в буфер'
                                    });
                                }

                                if (links.direct) {
                                    params.items.push({
                                        title: 'Скопировать .torrent ссылку',
                                        copy_url: links.direct,
                                        copy_msg: 'Прямая ссылка на .torrent скопирована'
                                    });
                                }

                                // Обрабатываем нажатие
                                params.onSelect = function (item) {
                                    if (item && item.copy_url) {
                                        copyText(item.copy_url, item.copy_msg);
                                    } else if (original_onSelect) {
                                        // Если нажали стандартный пункт Lampa (Добавить, Пометить и т.д.)
                                        original_onSelect(item);
                                    }
                                };
                            }
                            
                            return original_show(params);
                        };
                        
                        original_menu.call(e.object, element);
                        Lampa.Select.show = original_show; // Страховка
                    };
                }
            }
        });
    }

    // Запуск плагина при готовности приложения
    if (window.appready) initPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') initPlugin();
        });
    }
})();
