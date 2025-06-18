const scriptURL = "https://script.google.com/macros/s/AKfycbwd9H6HDIiTgsiPuIOWb07tVrBllZB_tzxIV8wH11W0jmuYv64KNRzmT7d-40JHwmFWNA/exec";

const form = document.getElementById("attendance-form");
const checkboxesDiv = document.getElementById("checkboxes");
const resultDiv = document.getElementById("result");
const historyContainer = document.getElementById("history-container");
const ratingDiv = document.getElementById("rating");
const punishmentDiv = document.getElementById("punishment");

const names = [
  "Яна Сайгон", "Паша Сайгон", "Олеся", "Слава", "Таня",
  "Паша Персик", "Кирилл", "Оля", "Инна", "Яна Арчи", "Саша"
];
const emojis = ["🐶","🐕","🐩","🦴","🐾","🐕‍🦺","🐺","🌭","🦮","🐹","🐰"];

names.forEach((name, i) => {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = name;
  label.appendChild(checkbox);
  label.append(` ${emojis[i % emojis.length]} ${name}`);
  checkboxesDiv.appendChild(label);
});

form.addEventListener("submit", e => {
  e.preventDefault();
  const checked = Array.from(form.querySelectorAll("input:checked")).map(cb => cb.value);
  const today = new Date().toISOString().split("T")[0];

  resultDiv.textContent = "⏳ Сохраняем...";

  const url = new URL(scriptURL);
  url.searchParams.set("date", today);
  url.searchParams.set("marked", checked.join(","));
  url.searchParams.set("names", names.join(","));

  fetch(url)
    .then(res => res.json())
    .then(data => {
      resultDiv.textContent = "✔️ Сохранено!";
      localStorage.setItem("dog_diary_cache", JSON.stringify(data));
      renderHistory(data);
    })
    .catch(e => {
      console.error(e);
      resultDiv.textContent = "❌ Ошибка сохранения";
    });
});

function renderHistory(data) {
  const header = data[0];
  const rows = data.slice(1);

  // построить таблицу
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  header.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach((cell, i) => {
      const td = document.createElement("td");
      td.textContent = cell;
      if (i > 0) td.className = cell === "1" ? "present" : "absent";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  historyContainer.innerHTML = "";
  historyContainer.appendChild(table);

  // рейтинг
  const stats = new Map();
  header.slice(1).forEach(name => stats.set(name, 0));
  rows.forEach(row => {
    row.slice(1).forEach((cell, i) => {
      if (cell === "1") {
        const name = header[i + 1];
        stats.set(name, stats.get(name) + 1);
      }
    });
  });

  const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
  ratingDiv.innerHTML = "<h2>Рейтинг посещаемости</h2>";
  sorted.forEach(([name, count]) => {
    const div = document.createElement("div");
    div.innerHTML = `<span class="name">${name}</span>: <span class="count">${count}</span>`;
    ratingDiv.appendChild(div);
  });

  // проставляющийся
  const now = new Date();
  const monthName = now.toLocaleString("ru-RU", { month: "long" });
  const low = sorted[sorted.length - 1]?.[0] || "никто";
  const lastDate = rows.at(-1)?.[0] || "";
  const last = new Date(lastDate);
  const isCurrentMonth = now.getMonth() === last.getMonth() && now.getFullYear() === last.getFullYear();

  punishmentDiv.textContent = isCurrentMonth
    ? `Месяц пока не кончился, но пока, скорее всего, проставляться будет ${low} 🍾`
    : `В ${monthName} слабым звеном была ${low}. ${low} проставляется 🍾`;
}

window.addEventListener("DOMContentLoaded", () => {
  const cached = localStorage.getItem("dog_diary_cache");
  if (cached) {
    try {
      renderHistory(JSON.parse(cached));
    } catch {}
  }

  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {
      renderHistory(data);
      localStorage.setItem("dog_diary_cache", JSON.stringify(data));
    })
    .catch(e => console.error("Ошибка загрузки:", e));
});