(function () {
  "use strict";
  const editor = document.getElementById("code");
  const preview = document.getElementById("preview");
  const output = document.getElementById("output");
  const status = document.getElementById("runStatus");
  const empty = document.getElementById("emptyState");
  const lineNumbers = document.getElementById("lineNumbers");
  const lineCount = document.getElementById("lineCount");
  const runBtn = document.getElementById("runBtn");

  editor.value = MORO.defaultProgram;

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({length:count}, (_, i) => i + 1).join("\n");
    lineCount.textContent = count + " " + (count === 1 ? "строка" : count < 5 ? "строки" : "строк");
  }

  function run() {
    const source = editor.value.trim();
    if (!source) {
      output.textContent = "Программа пустая. Добавь, например, «Кнопка» и «Текст: Привет».";
      output.classList.add("error");
      status.textContent = "Нечего запускать";
      return;
    }
    try {
      const result = MORO.render(source);
      preview.srcdoc = result.html;
      empty.classList.add("hidden");
      const messages = ["Программа запущена. Элементов создано: " + result.parsed.elements.length + "."];
      if (result.parsed.warnings.length) messages.push(...result.parsed.warnings);
      output.textContent = messages.join("\n");
      output.classList.toggle("error", result.parsed.warnings.length > 0);
      status.textContent = result.parsed.warnings.length ? "Есть подсказки" : "Успешно";
    } catch (error) {
      output.textContent = "Не удалось запустить программу. Проверь написание команд. Подробности: " + error.message;
      output.classList.add("error");
      status.textContent = "Ошибка";
    }
  }

  runBtn.addEventListener("click", run);
  editor.addEventListener("input", updateLines);
  editor.addEventListener("scroll", () => { lineNumbers.scrollTop = editor.scrollTop; });
  editor.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.setRangeText("  ", start, end, "end");
      updateLines();
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") run();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    editor.value = MORO.defaultProgram;
    updateLines();
    run();
  });
  document.querySelectorAll("[data-example]").forEach(button => {
    button.addEventListener("click", () => {
      editor.value = MORO.examples[button.dataset.example] || MORO.defaultProgram;
      updateLines();
      run();
      editor.focus();
    });
  });
  updateLines();
  run();
})();