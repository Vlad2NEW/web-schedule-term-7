const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця"];
const pairsTimes = [
  "8:00 - 9:20",
  "9:35 - 10:55",
  "11:10 - 12:30",
  "13:00 - 14:20",
  "14:35 - 15:55",
  "16:10 - 17:30",
  "17:45 - 19:05",
  "19:20 - 20:40",
];

let currentWeek = "numerator";

const scheduleTableBody = document.querySelector("#scheduleTable tbody");
const showNumeratorBtn = document.getElementById("showNumerator");
const showDenominatorBtn = document.getElementById("showDenominator");
const addButtonsContainer = document.getElementById("addButtonsContainer");
const themeToggleBtn = document.getElementById("theme-toggle");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const clearBtn = document.getElementById("clearBtn");

function saveSchedule(data) {
  localStorage.setItem("scheduleData", JSON.stringify(data));
}

function loadSchedule() {
  const data = localStorage.getItem("scheduleData");
  return data ? JSON.parse(data) : { numerator: {}, denominator: {} };
}

function createEmptyWeekSchedule() {
  let schedule = {};
  days.forEach(day => {
    pairsTimes.forEach((_, i) => {
      schedule[`${day}-${i + 1}`] = "";
    });
  });
  return schedule;
}

function renderSchedule() {
  scheduleTableBody.innerHTML = "";
  const data = loadSchedule();

  if (!data[currentWeek] || Object.keys(data[currentWeek]).length === 0) {
    data[currentWeek] = createEmptyWeekSchedule();
    saveSchedule(data);
  }

  const weekData = data[currentWeek];

  for (let pairIndex = 0; pairIndex < pairsTimes.length; pairIndex++) {
    const tr = document.createElement("tr");

    const tdPair = document.createElement("td");
    tdPair.innerHTML = `<strong>${pairIndex + 1}</strong><br><small>${pairsTimes[pairIndex]}</small>`;
    tr.appendChild(tdPair);

    days.forEach(day => {
      const key = `${day}-${pairIndex + 1}`;
      const td = document.createElement("td");
      td.classList.add("subject-cell");
      td.contentEditable = "true";

      const subject = weekData[key] || "";
      td.textContent = subject === "" ? "—" : subject;

      td.dataset.key = key;

      td.addEventListener("blur", () => {
        updateSubject(currentWeek, key, td.textContent.trim());
        renderSchedule();
      });

      td.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          td.blur();
        }
      });

      if (subject === "") {
        td.classList.add("empty");
      }

      tr.appendChild(td);
    });

    scheduleTableBody.appendChild(tr);
  }

  renderAddButtons();
  highlightCurrentDayAndPair();
}

function updateSubject(week, key, value) {
  const data = loadSchedule();

  if (!data[week]) data[week] = {};

  if (value === "" || value === "—") {
    delete data[week][key];
  } else {
    data[week][key] = value;
  }

  saveSchedule(data);
}

function renderAddButtons() {
  addButtonsContainer.innerHTML = "";
  days.forEach(day => {
    const btn = document.createElement("button");
    btn.textContent = `+ Додати пару (${day})`;
    btn.classList.add("add-pair-btn");
    btn.addEventListener("click", () => addNewPair(day));
    addButtonsContainer.appendChild(btn);
  });
}

function addNewPair(day) {
  const data = loadSchedule();

  if (!data[currentWeek]) data[currentWeek] = {};

  const pairs = Object.entries(data[currentWeek])
    .filter(([key]) => key.startsWith(day + "-"))
    .sort((a, b) => {
      const aNum = parseInt(a[0].split("-")[1], 10);
      const bNum = parseInt(b[0].split("-")[1], 10);
      return aNum - bNum;
    });

  for (const [key, val] of pairs) {
    if (val.trim() === "") {
      alert(`Вільна пара вже існує в ${day}. Заповніть її перш ніж додавати нову.`);
      return;
    }
  }

  const maxPairNum = pairs.length > 0 ? parseInt(pairs[pairs.length - 1][0].split("-")[1]) : 0;

  if (maxPairNum >= 12) {
    alert("Максимальна кількість пар досягнута.");
    return;
  }

  const newPairNum = maxPairNum + 1;
  data[currentWeek][`${day}-${newPairNum}`] = "";

  saveSchedule(data);
  renderSchedule();
}

function highlightCurrentDayAndPair() {
  document.querySelectorAll("th.current-day").forEach(el => el.classList.remove("current-day"));
  document.querySelectorAll("td.current-pair").forEach(el => el.classList.remove("current-pair"));

  const now = new Date();
  let dayIndex = now.getDay() - 1; // JS: 0-неділя, 1-понеділок...
  if (dayIndex < 0 || dayIndex > 4) return; // вихідні не підсвічуємо

  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // Часи пар у хвилинах від початку дня
  // [початок, кінець]
  const scheduleInMinutes = [
    [8*60 + 0, 9*60 + 20],
    [9*60 + 35, 10*60 + 55],
    [11*60 + 10, 12*60 + 30],
    [13*60 + 0, 14*60 + 20],
    [14*60 + 35, 15*60 + 55],
    [16*60 + 10, 17*60 + 30],
    [17*60 + 45, 19*60 + 5],
    [19*60 + 20, 20*60 + 40],
  ];

  let pairIndex = null;
  for (let i = 0; i < scheduleInMinutes.length; i++) {
    const [start, end] = scheduleInMinutes[i];
    if (minutesNow >= start && minutesNow <= end) {
      pairIndex = i;
      break;
    }
  }

  if (pairIndex === null) return;

  // Підсвічуємо заголовок дня
  const ths = document.querySelectorAll("#scheduleTable thead th");
  if (ths[dayIndex + 1]) {
    ths[dayIndex + 1].classList.add("current-day");
  }

  // Підсвічуємо клітинку пари
  const trs = document.querySelectorAll("#scheduleTable tbody tr");
  if (trs[pairIndex]) {
    const tds = trs[pairIndex].querySelectorAll("td");
    if (tds[dayIndex + 1]) {
      tds[dayIndex + 1].classList.add("current-pair");
    }
  }
}

// Перемикання тижня
showNumeratorBtn.addEventListener("click", () => {
  currentWeek = "numerator";
  showNumeratorBtn.classList.add("active");
  showDenominatorBtn.classList.remove("active");
  renderSchedule();
});

showDenominatorBtn.addEventListener("click", () => {
  currentWeek = "denominator";
  showDenominatorBtn.classList.add("active");
  showNumeratorBtn.classList.remove("active");
  renderSchedule();
});

// Тема
function setTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    themeToggleBtn.textContent = "☀️ Світла тема";
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
    themeToggleBtn.textContent = "🌙 Темна тема";
  }
}

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = localStorage.getItem("theme") || "light";
  if (currentTheme === "light") {
    setTheme("dark");
  } else {
    setTheme("light");
  }
});

// Експорт даних
exportBtn.addEventListener("click", () => {
  const data = localStorage.getItem("scheduleData");
  if (!data) {
    alert("Немає даних для експорту");
    return;
  }
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "rozklad-data.json";
  a.click();

  URL.revokeObjectURL(url);
});

// Імпорт даних
importInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      localStorage.setItem("scheduleData", JSON.stringify(importedData));
      alert("✅ Дані імпортовано! Перезавантажте сторінку.");
    } catch (err) {
      alert("❌ Помилка при імпорті даних!");
    }
  };
  reader.readAsText(file);
});

// Очистити розклад
clearBtn.addEventListener("click", () => {
  if (confirm("Ви впевнені, що хочете очистити весь розклад? Ця дія незворотна.")) {
    localStorage.removeItem("scheduleData");
    renderSchedule();
  }
});

// Завантаження теми та рендер при старті
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);
  renderSchedule();
});
