const weekContainer = document.getElementById('weekContainer');
const days = ['Понеділок','Вівторок','Середа','Четвер','П’ятниця','Субота','Неділя'];
let weekType = 'numerator';

const defaultData = {
  numerator: Array(7).fill().map(() => ({
    date: '',
    lessons: Array(8).fill(null).map(() => ({ subject: '', hw: '', grade: '', done: false }))
  })),
  denominator: Array(7).fill().map(() => ({
    date: '',
    lessons: Array(8).fill(null).map(() => ({ subject: '', hw: '', grade: '', done: false }))
  }))
};

let diaryData = JSON.parse(localStorage.getItem('diaryData')) || structuredClone(defaultData);

function ensureLessonsLength(day) {
  while (day.lessons.length < 8) {
    day.lessons.push({ subject: '', hw: '', grade: '', done: false });
  }
  if (day.lessons.length > 8) {
    day.lessons = day.lessons.slice(0, 8);
  }
}

function fixDiaryData(data) {
  ['numerator', 'denominator'].forEach(type => {
    data[type].forEach(day => {
      if (!day.lessons) day.lessons = [];
      ensureLessonsLength(day);
      if (!day.date) day.date = '';
    });
  });
}

fixDiaryData(diaryData);

function cleanData(data) {
  return data.map(day => {
    const cleanedLessons = day.lessons.map(lesson => {
      if (
        lesson.subject.trim() !== '' ||
        lesson.hw.trim() !== '' ||
        lesson.grade.trim() !== '' ||
        lesson.done === true
      ) {
        return lesson;
      } else {
        return { subject: '', hw: '', grade: '', done: false };
      }
    });
    return { date: day.date, lessons: cleanedLessons };
  });
}

function saveData() {
  diaryData.numerator = cleanData(diaryData.numerator);
  diaryData.denominator = cleanData(diaryData.denominator);
  localStorage.setItem('diaryData', JSON.stringify(diaryData));
}

function renderDiary() {
  weekContainer.innerHTML = '';

  diaryData[weekType].forEach((day, dayIndex) => {
    const dayBlock = document.createElement('div');
    dayBlock.className = 'day-block';

    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = days[dayIndex];
    dayBlock.appendChild(header);

    const dateInput = document.createElement('input');
    dateInput.className = 'date-input';
    dateInput.type = 'text';
    dateInput.placeholder = 'Дата';
    dateInput.value = day.date;
    dateInput.addEventListener('input', () => {
      diaryData[weekType][dayIndex].date = dateInput.value;
      saveData();
    });
    dayBlock.appendChild(dateInput);

    const table = document.createElement('table');
    table.className = 'table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>№ пари</th>
        <th>Предмет</th>
        <th>ДЗ</th>
        <th>Оцінка</th>
        <th>Виконано</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    day.lessons.forEach((lesson, lessonIndex) => {
      const tr = document.createElement('tr');

      // Нумерація пари
      const numTd = document.createElement('td');
      numTd.textContent = lessonIndex + 1;
      numTd.className = 'lesson-number';
      tr.appendChild(numTd);

      // Предмет
      const subjectTd = document.createElement('td');
      subjectTd.classList.add('subject-cell');
      const subjectInput = document.createElement('input');
      subjectInput.classList.add('subject-input');
      subjectInput.value = lesson.subject;
      subjectInput.addEventListener('input', e => {
        diaryData[weekType][dayIndex].lessons[lessonIndex].subject = e.target.value;
        saveData();
      });
      subjectTd.appendChild(subjectInput);
      tr.appendChild(subjectTd);

      // ДЗ
      const hwTd = document.createElement('td');
      const hwTextarea = document.createElement('textarea');
      hwTextarea.value = lesson.hw;
      hwTextarea.addEventListener('input', e => {
        hwTextarea.style.height = 'auto';
        hwTextarea.style.height = hwTextarea.scrollHeight + 'px';
        diaryData[weekType][dayIndex].lessons[lessonIndex].hw = e.target.value;
        saveData();
      });
      hwTd.appendChild(hwTextarea);
      tr.appendChild(hwTd);

      // Оцінка
      const gradeTd = document.createElement('td');
      const gradeInput = document.createElement('input');
      gradeInput.type = 'number';
      gradeInput.min = 2;
      gradeInput.max = 5;
      gradeInput.value = lesson.grade;
      gradeInput.addEventListener('input', e => {
        const val = +e.target.value;
        gradeInput.className = '';
        if ([2, 3, 4, 5].includes(val)) {
          gradeInput.classList.add(`grade-${val}`);
        }
        diaryData[weekType][dayIndex].lessons[lessonIndex].grade = e.target.value;
        saveData();
      });
      gradeTd.appendChild(gradeInput);
      tr.appendChild(gradeTd);

      // Виконано
      const doneTd = document.createElement('td');
      doneTd.className = 'done-cell';
      if (lesson.done) doneTd.classList.add('done');
      doneTd.textContent = lesson.done ? 'Так' : 'Ні';

      doneTd.addEventListener('click', () => {
        diaryData[weekType][dayIndex].lessons[lessonIndex].done = !diaryData[weekType][dayIndex].lessons[lessonIndex].done;
        renderDiary();
        saveData();
      });
      tr.appendChild(doneTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    dayBlock.appendChild(table);
    weekContainer.appendChild(dayBlock);
  });
}

function switchWeekType(type) {
  weekType = type;
  renderDiary();
}

function exportData() {
  const blob = new Blob([JSON.stringify(diaryData)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'diary.json';
  link.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      diaryData = JSON.parse(e.target.result);
      fixDiaryData(diaryData);
      saveData();
      renderDiary();
    } catch (err) {
      alert('Невірний формат файлу.');
    }
  };
  reader.readAsText(file);
}

// Початковий виклик для відображення
renderDiary();
