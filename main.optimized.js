const scriptURL = "https://script.google.com/macros/s/AKfycbwd9H6HDIiTgsiPuIOWb07tVrBllZB_tzxIV8wH11W0jmuYv64KNRzmT7d-40JHwmFWNA/exec";
const names = ["Яна Сайгон", "Паша Сайгон", "Олеся", "Слава", "Таня", "Паша Персик", "Кирилл", "Оля", "Инна", "Яна Арчи", "Саша"];
const emojis = ["🐶", "🐕", "🐾", "🦴", "🎾", "🐩", "🦮", "🐕‍🦺", "🥎", "🐾", "🦴"];

const checkboxContainer = document.getElementById("checkboxes");
const resultDiv = document.getElementById("result");
const historyContainer = document.getElementById("history-container");
const ratingBlock = document.getElementById("rating");
const punishmentBlock = document.getElementById("punishment");
const skeleton = document.getElementById("loading-skeleton");

// Случайный эмоджи каждому имени
const nameEmojis = {};
names.forEach((name, i) => {
  nameEmojis[name] = emojis[i % emojis.length];
});

// Отрисовка чекбоксов
names.forEach(name => {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "names";
  checkbox.value = name;
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(`${nameEmojis[name]} ${name}`));
  checkboxContainer.appendChild(label);
});

// Форматирование даты
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня",
                  "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Отправка формы
document.getElementById("attendance-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const checked = Array.from(document.querySelectorAll("input[name='names']:checked")).map(cb => cb.value);
  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    date: today,
    names,
    marked: checked
  };
  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    resultDiv.textContent = "✔️ Сохранено!";
    localStorage.setItem("dog_diary_cache", JSON.stringify(data));
    renderHistory(data);
  } catch (error) {
    resultDiv.textContent = "❌ Ошибка сохранения";
  }
});

// Рендеринг таблицы и рейтинга
function renderHistory(data) {
  if (!data || data.length < 2) return;
  skeleton.remove();

  const header = data[0];
  const rows = data.slice(1);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  header.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h === "Дата" ? "📅 Дата" : `${nameEmojis[h] || ""} ${h}`;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach((val, i) => {
      const td = document.createElement("td");
      if (i === 0) {
        td.textContent = formatDate(val);
      } else {
        td.className = val === "1" ? "present" : "absent";
        td.textContent = val === "1" ? "✓" : "–";
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  historyContainer.innerHTML = "";
  historyContainer.appendChild(table);

  // Рейтинг
  const counts = {};
  names.forEach(name => counts[name] = 0);
  rows.forEach(row => {
    row.forEach((val, i) => {
      if (i > 0 && val === "1") counts[header[i]]++;
    });
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  ratingBlock.innerHTML = "<h2>🏆 Рейтинг по посещаемости</h2>";
  sorted.forEach(([name, count]) => {
    ratingBlock.innerHTML += `<div><span class="name">${name}</span>: <span class="count">${count}</span></div>`;
  });

  // Проставляется
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1, 0);
  const monthEnd = nextMonth.getDate();
  const lastName = sorted.at(-1)[0];
  const monthNames = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];
  const monthText = monthNames[now.getMonth()];
  punishmentBlock.innerHTML = now.getDate() === monthEnd
    ? `🍾 В ${monthText} слабым звеном была <b>${lastName}</b>. ${lastName} проставляется 🍾`
    : `🤔 Месяц ещё не закончился, но пока, скорее всего, проставляться будет <b>${lastName}</b> 🍾`;
}

// Подгрузка истории
async function loadHistory() {
  const cached = localStorage.getItem("dog_diary_cache");
  if (cached) {
    try {
      const data = JSON.parse(cached);
      renderHistory(data);
    } catch {}
  }
  try {
    const response = await fetch(scriptURL);
    const data = await response.json();
    localStorage.setItem("dog_diary_cache", JSON.stringify(data));
    renderHistory(data);
  } catch (e) {
    console.warn("Ошибка загрузки истории:", e);
  }
}

loadHistory();