(function () {
    'use strict';

    // НАШИ ВИЗУАЛЬНЫЕ ПРАВКИ (Внедряем в стиль оригинального плагина)
    var style = document.createElement('style');
    style.innerHTML = `
        /* Увеличиваем размер рейтинга для дивана */
        .card__vote .rate-value, .card__vote-line .card__rate-item > div { font-size: 14px !important; font-weight: 800 !important; }
        
        /* Цвета качества */
        .card__quality { background: rgba(0,0,0,0.85) !important; font-weight: 800 !important; font-size: 12px !important; }
        .card__quality-4k { color: #FFC107 !important; }
        .card__quality-fhd { color: #00E5FF !important; }
        
        /* Точка статуса */
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-left: 5px; }
        .dot-green { background-color: #00FF66; box-shadow: 0 0 6px #00FF66; }
        .dot-red   { background-color: #FF3333; box-shadow: 0 0 4px #FF3333; }
    `;
    document.head.appendChild(style);

    // ДАЛЬШЕ ИДЕТ ОРИГИНАЛЬНЫЙ КОД AMIKDN (Твой рабочий)
    // ... [Тут твой полный код amikdn, который ты прислал] ...
    // ВСТАВЬ СЮДА ВЕСЬ ТОТ КОД, КОТОРЫЙ ТЫ СКИНУЛ МНЕ В ПРОШЛОМ СООБЩЕНИИ
    
})();
