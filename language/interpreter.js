(function (global) {
  "use strict";

  const DEFAULT_PROGRAM = `Страница
Фон: #f4f5f8

Заголовок
Текст: «Моя первая программа»
Положение: центр

Текст
Текст: «Я создал её на языке MORO.»
Положение: центр

Кнопка (центр)
Текст: «Нажми меня»
При нажатии: показать «У тебя получилось!»
`;

  const EXAMPLES = {
    button: `Страница
Фон: #f4f5f8

Кнопка (центр)
Текст: «Привет»
При нажатии: показать «Добро пожаловать в MORO!»
`,
    page: `Страница
Фон: #111827

Заголовок
Текст: «Мой первый сайт»
Положение: центр
Цвет: #ffffff

Текст
Текст: «Я сделал эту страницу без сложного кода.»
Положение: центр
Цвет: #d1d5db

Кнопка
Положение: центр
Текст: «Узнать больше»
При нажатии: показать «Продолжай создавать!»
`,
    image: `Страница
Фон: #f4f5f8

Заголовок
Текст: «Моя картинка»
Положение: центр

Картинка
Адрес: https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900
Описание: Красивый пейзаж
`
  };

  function unquote(value) {
    const s = String(value || "").trim();
    if ((s.startsWith("«") && s.endsWith("»")) || (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
    return s;
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) { return ""; }
  }

  function parse(source) {
    const lines = String(source || "").replace(/\r/g, "").split("\n");
    const result = { background: "#f4f5f8", elements: [], warnings: [], errors: [] };
    let current = null;

    function addElement(type, position) {
      current = { type, text: "", position: position || "left", color: "", background: "", action: "", address: "", description: "" };
      result.elements.push(current);
      return current;
    }

    for (let index = 0; index < lines.length; index++) {
      const raw = lines[index].trim();
      if (!raw || raw.startsWith("#") || raw.startsWith("//")) continue;

      if (/^страница\b/i.test(raw)) { current = null; continue; }

      // Short, human-friendly form: Кнопка (центр) текст «Привет» нажатие https://...
      const inline = raw.match(/^(кнопка|заголовок|текст|картинка|изображение)\s*(?:\(([^)]+)\))?(.*)$/i);
      if (inline) {
        const typeName = inline[1].toLowerCase();
        const type = typeName === "изображение" ? "image" : ({ "кнопка":"button", "заголовок":"heading", "текст":"text", "картинка":"image" })[typeName];
        const tail = inline[3] || "";
        const hasInlineProps = Boolean(inline[2] || /текст\s*[:=]|нажатии?\s*[:=]|адрес\s*[:=]/i.test(tail));
        if (hasInlineProps) {
          const el = addElement(type, inline[2] || "");
          const textMatch = tail.match(/текст\s*[:=]?\s*(«[^»]*»|"[^"]*"|'[^']*'|.+?)(?=\s+нажат(?:ии|ие)?\s*[:=]|\s+адрес\s*[:=]|$)/i);
          const actionMatch = tail.match(/нажат(?:ии|ие)?\s*[:=]?\s*(.+)$/i);
          const addressMatch = tail.match(/адрес\s*[:=]?\s*(\S+)/i);
          if (textMatch) el.text = unquote(textMatch[1]);
          if (actionMatch) el.action = actionMatch[1].trim();
          if (addressMatch) el.address = addressMatch[1].trim();
          continue;
        }
      }

      const heading = raw.match(/^(кнопка|заголовок|текст|картинка|изображение)\s*(?:\(([^)]+)\))?$/i);
      if (heading) {
        const name = heading[1].toLowerCase();
        const type = name === "изображение" || name === "картинка" ? "image" : ({ "кнопка":"button", "заголовок":"heading", "текст":"text" })[name];
        addElement(type, heading[2] || "");
        continue;
      }

      const property = raw.match(/^([^:：=]+)\s*[:：=]\s*(.*)$/);
      if (!property) {
        result.warnings.push("Строка " + (index + 1) + ": не понял «" + raw + "». Попробуй написать свойство, например «Текст: Привет».");
        continue;
      }
      const key = property[1].trim().toLowerCase();
      const value = unquote(property[2]);
      if (/^(фон|цвет фона)$/.test(key)) { result.background = value; continue; }
      if (/^(положение|выравнивание)$/.test(key)) {
        if (current) current.position = value;
        else result.warnings.push("Строка " + (index + 1) + ": сначала создай элемент.");
        continue;
      }
      if (!current) {
        result.warnings.push("Строка " + (index + 1) + ": это свойство пока не относится ни к одному элементу.");
        continue;
      }
      if (/^(текст|надпись|название)$/.test(key)) current.text = value;
      else if (/^(при нажатии|нажатие|действие)$/.test(key)) current.action = value;
      else if (/^(адрес|ссылка|изображение)$/.test(key)) current.address = value;
      else if (/^(цвет)$/.test(key)) current.color = value;
      else if (/^(цвет фона элемента|фон элемента)$/.test(key)) current.background = value;
      else if (/^(описание|альтернативный текст)$/.test(key)) current.description = value;
      else result.warnings.push("Строка " + (index + 1) + ": пока не знаю свойство «" + property[1].trim() + "».");
    }

    if (!result.elements.length && !result.errors.length) result.warnings.push("Добавь элемент: например, «Кнопка (центр)».");
    return result;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
  }

  function render(source) {
    const parsed = parse(source);
    const parts = [];
    const pageBg = /^#[0-9a-f]{3,8}$/i.test(parsed.background) || /^(white|black|transparent|[a-z]+)$/i.test(parsed.background) ? parsed.background : "#f4f5f8";
    parts.push('<main class="moro-page" style="background:' + escapeHtml(pageBg) + '">');
    parsed.elements.forEach((el, index) => {
      const align = /центр|center/i.test(el.position) ? "center" : /справа|право|right/i.test(el.position) ? "right" : "left";
      const style = 'text-align:' + align + ';' + (el.color && /^#[0-9a-f]{3,8}$/i.test(el.color) ? 'color:' + el.color + ';' : '');
      if (el.type === "heading") parts.push('<h1 style="' + style + '">' + escapeHtml(el.text || "Заголовок") + '</h1>');
      else if (el.type === "text") parts.push('<p style="' + style + '">' + escapeHtml(el.text || "Новый текст") + '</p>');
      else if (el.type === "image") {
        const src = safeUrl(el.address);
        if (src) parts.push('<div class="moro-image-wrap" style="text-align:' + align + '"><img class="moro-image" src="' + escapeHtml(src) + '" alt="' + escapeHtml(el.description || el.text || "Изображение") + '"></div>');
        else parsed.warnings.push("У картинки нет корректного адреса. Добавь «Адрес: https://…».");
      } else if (el.type === "button") {
        const action = el.action.trim();
        const openMatch = action.match(/^(?:открыть|перейти|перейти по ссылке)\s+(.+)$/i);
        const url = openMatch ? safeUrl(openMatch[1].trim()) : "";
        const messageMatch = action.match(/^(?:показать|вывести)\s+(.+)$/i);
        const message = messageMatch ? unquote(messageMatch[1]) : "";
        const bg = /^#[0-9a-f]{3,8}$/i.test(el.background) ? el.background : "#7658dc";
        parts.push('<div class="moro-button-wrap" style="text-align:' + align + '"><button class="moro-button" style="background:' + bg + ';' + (el.color && /^#[0-9a-f]{3,8}$/i.test(el.color) ? 'color:' + el.color + ';' : '') + '" data-message="' + escapeHtml(message) + '" data-url="' + escapeHtml(url) + '" data-index="' + index + '">' + escapeHtml(el.text || "Нажми меня") + '</button></div>');
        if (action && !url && !message) parsed.warnings.push("Действие кнопки «" + (el.text || "Нажми меня") + "» пока не распознано. Используй «показать …» или «открыть https://…».");
      }
    });
    parts.push('<div id="moro-notice" class="moro-notice" role="status" aria-live="polite"></div></main>');
    const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#202433}.moro-page{min-height:100vh;padding:38px 24px;display:flex;flex-direction:column;gap:18px;align-items:stretch}.moro-page h1{font-size:clamp(25px,5vw,38px);margin:0 0 4px}.moro-page p{font-size:15px;line-height:1.65;margin:0}.moro-button-wrap{width:100%}.moro-button{border:0;border-radius:10px;padding:12px 20px;color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 5px 16px #0002}.moro-button:active{transform:scale(.98)}.moro-image-wrap{width:100%}.moro-image{max-width:min(100%,560px);max-height:340px;object-fit:cover;border-radius:14px}.moro-notice{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#202433;color:white;padding:11px 16px;border-radius:10px;font-size:13px;box-shadow:0 8px 30px #0003;display:none;max-width:90%;text-align:center}.moro-notice.show{display:block}</style></head><body>' + parts.join("") + '<script>document.addEventListener("click",function(e){var b=e.target.closest(".moro-button");if(!b)return;var u=b.getAttribute("data-url"),m=b.getAttribute("data-message");if(u){window.open(u,"_blank","noopener,noreferrer");return}if(m){var n=document.getElementById("moro-notice");n.textContent=m;n.classList.add("show");setTimeout(function(){n.classList.remove("show")},2600)}});<\/script></body></html>';
    return { html, parsed };
  }

  global.MORO = { parse, render, examples: EXAMPLES, defaultProgram: DEFAULT_PROGRAM };
})(window);