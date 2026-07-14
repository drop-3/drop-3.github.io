// Версия: 1.0
// Описание: Плагин для сохранения и автозагрузки состояния фильтра.

(function () {
    'use strict';

    var plugin_version = '1.0';
    var plugin_name = 'SaveFilter';

    function init() {
        // Уведомление при успешной загрузке (как договаривались)
        Lampa.Noty.show('Плагин "Сохранение фильтра" версия ' + plugin_version + ' загружен');

        // Добавляем CSS стили для наших кнопок
        var css = `
            .filter-custom-buttons {
                position: absolute;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 15px;
                z-index: 100;
            }
            .filter-btn-action {
                background: rgba(255, 255, 255, 0.1);
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9em;
                transition: background 0.2s, color 0.2s;
                color: #fff;
            }
            .filter-btn-action:hover {
                background: rgba(255, 255, 255, 0.25);
            }
            .filter-btn-action.clear {
                color: #ff6666; /* Красноватый оттенок для кнопки очистки */
            }
            .filter-btn-action.clear:hover {
                background: rgba(255, 102, 102, 0.2);
            }
            /* Обеспечиваем позиционирование в шапке модального окна */
            .simple-modal__header, .filter--header {
                position: relative; 
            }
        `;
        $('head').append('<style>' + css + '</style>');

        // Функция добавления кнопок в интерфейс фильтра
        function addButtonsToFilter(node) {
            var header = $(node).find('.simple-modal__header, .filter__header, .modal__title').first();
            
            // Если заголовок не найден или кнопки уже есть — отмена
            if (header.length === 0 || header.find('.filter-custom-buttons').length > 0) return;

            var buttonsHtml = $(`
                <div class="filter-custom-buttons">
                    <div class="filter-btn-action save">Сохранить</div>
                    <div class="filter-btn-action clear">Очистить</div>
                </div>
            `);

            // Логика кнопки "Сохранить"
            buttonsHtml.find('.save').on('click', function () {
                // В Lampa параметры фильтра применяются к активной активности (странице)
                var activeActivity = Lampa.Activity.active();
                
                if (activeActivity && activeActivity.activity && activeActivity.activity.filter) {
                    var currentFilter = activeActivity.activity.filter;
                    // Сохраняем в память устройства
                    Lampa.Storage.set('custom_saved_filter', currentFilter);
                    Lampa.Noty.show('Настройки фильтра успешно сохранены!');
                } else {
                    // Если фильтр еще ни разу не применялся, просим нажать поиск для фиксации
                    Lampa.Noty.show('Сначала нажмите "Начать поиск", затем Сохранить');
                }
            });

            // Логика кнопки "Очистить"
            buttonsHtml.find('.clear').on('click', function () {
                Lampa.Storage.set('custom_saved_filter', null); // Сбрасываем память
                Lampa.Noty.show('Сохраненный фильтр сброшен по умолчанию');
            });

            header.append(buttonsHtml);
        }

        // Следим за изменениями в DOM (появлением окна фильтра на экране)
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.nodeType === 1) {
                            var $node = $(node);
                            // Ищем признаки того, что открылся именно фильтр (надпись "Начать поиск" или классы фильтра)
                            if ($node.hasClass('filter') || $node.find('.filter').length > 0 || $node.text().indexOf('Начать поиск') !== -1) {
                                addButtonsToFilter(node);
                            }
                        }
                    });
                }
            });
        });

        // Запускаем наблюдение за всем телом приложения
        observer.observe(document.body, { childList: true, subtree: true });

        // Перехватываем открытие категорий/каталогов для Авто-применения фильтра
        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'start' && (e.component === 'category' || e.component === 'catalog')) {
                var savedFilter = Lampa.Storage.get('custom_saved_filter', null);
                
                // Если есть сохраненный фильтр и текущий запрос идет без фильтров (чистый вход)
                if (savedFilter && !e.object.filter) {
                    e.object.filter = savedFilter; // Подставляем наши сохраненные значения
                }
            }
        });
    }

    // Проверяем, готова ли Lampa
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                init();
            }
        });
    }
})();
