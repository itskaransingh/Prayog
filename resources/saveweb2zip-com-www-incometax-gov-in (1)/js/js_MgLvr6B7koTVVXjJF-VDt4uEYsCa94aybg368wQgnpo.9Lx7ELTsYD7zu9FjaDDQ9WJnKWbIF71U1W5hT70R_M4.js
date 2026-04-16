(function (Drupal, once) {

  Drupal.behaviors.taxCalendar = {
    attach: function (context) {

      const monthNames = [
 "Jan","Feb","Mar","Apr","May","Jun",
 "Jul","Aug","Sep","Oct","Nov","Dec"
];

      function updateMonthButtonLabels(year, month) {

  let prevMonth = month - 1;
  let prevYear = year;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  let nextMonth = month + 1;
  let nextYear = year;

  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }

  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");

  if (prevBtn) {
    prevBtn.setAttribute(
      "aria-label",
      "Go to " + monthNames[prevMonth - 1] + " " + prevYear
    );
  }

  if (nextBtn) {
    nextBtn.setAttribute(
      "aria-label",
      "Go to " + monthNames[nextMonth - 1] + " " + nextYear
    );
  }
}

      const today = new Date(); 
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayYear = today.getFullYear();
      const iconPath = drupalSettings.path.baseUrl;
      const MAX_EVENTS = 3;
      function formatDate(date) {

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}, ${day} ${year}`;
}

      let monthCache = {};
      let isLoading = false;

      // ===============================
      // LOAD MONTH (Fixed Navigation)
      // ===============================
      function loadMonth(year, month) {

        // 🔥 VERY IMPORTANT
        currentYear = year;
        currentMonth = month;

        // Update title
        document.getElementById('calendar-title').innerHTML =
          'Year ' + year + ' ' + monthNames[month - 1];

        updateMonthButtonLabels(year, month); 

        let key = `${year}-${month}`;

        // If already cached with data
        if (monthCache[key] && monthCache[key].data) {
          events = monthCache[key].data;
          buildCalendar(year, month, events);
          prefetchNextMonth(year, month);
          return;
        }

        // If fetch is already running
        if (monthCache[key] && monthCache[key].promise) {
          monthCache[key].promise.then(() => {
            events = monthCache[key].data;
            buildCalendar(year, month, events);
            prefetchNextMonth(year, month);
          });
          return;
        }

        // New fetch
        let promise = fetch(`${ajaxUrl}?year=${year}&month=${month}`)
          .then(res => res.json())
          .then(data => {

            data.sort((a,b)=>a.dueDay-b.dueDay);

            monthCache[key] = { data };
            events = data;

            buildCalendar(year, month, data);
            prefetchNextMonth(year, month);

          });

        monthCache[key] = { promise };
      }

      // ===============================
      // PREFETCH NEXT MONTH
      // ===============================
      function prefetchNextMonth(year, month) {

        let nextMonth = month + 1;
        let nextYear = year;

        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }

        let key = `${nextYear}-${nextMonth}`;

        if (monthCache[key]) return;

        let promise = fetch(`${ajaxUrl}?year=${nextYear}&month=${nextMonth}`)
          .then(res => res.json())
          .then(data => {
            data.sort((a,b)=>a.dueDay-b.dueDay);
            monthCache[key] = { data };
          });

        monthCache[key] = { promise };
      }

      // ===============================
      // SHOW EVENTS
      // ===============================
      async function showEvents(day, shouldFocus = false) {

  const container = document.getElementById('event-details');
  container.innerHTML = '<p>Loading...</p>';

  let output = '';
  let rowColors = ['row-green', 'row-orange', 'row-red'];

  let clickedDate = new Date(currentYear, currentMonth - 1, day);
  clickedDate.setHours(0,0,0,0);

  let todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  let sortedEvents = [...events].sort((a,b)=>a.dueDay-b.dueDay);

  // 1️⃣ Exact match
  let exactEvents = sortedEvents.filter(e => e.dueDay == day);

  if (exactEvents.length > 0) {

    exactEvents.slice(0, MAX_EVENTS).forEach((event, index) => {

      let dueDate = new Date(event.dueYear, event.dueMonth - 1, event.dueDay);
      let rowClass = rowColors[index % rowColors.length];

      output += `
        <div class="deadline-card ${rowClass} bg-off-Black">
          <div class="deadline-content">
            <h4 class="font-white">${event.formCd}</h4>
            <p class="font-ash">${event.dueDescription}</p>
            <div class="deadline-date font-white"><span class="itr-date-icon">
                  <img class="icon-bright-mode" src="${iconPath}themes/custom/itdbase/images/svg/clockicon.svg">
                  <img class="icon-dark-mode" src="${iconPath}themes/custom/itdbase/images/svg/clockicon-dark.svg">
                </span>

              ${formatDate(dueDate)}
            </div>
          </div>
        </div>
      `;
    });

  } else {

    // 2️⃣ Future in current month
    let nextEvent = sortedEvents.find(e => e.dueDay > day);

    if (nextEvent) {

      let nextEventDate = new Date(
        nextEvent.dueYear,
        nextEvent.dueMonth - 1,
        nextEvent.dueDay
      );
      nextEventDate.setHours(0,0,0,0);

      let diffDays = Math.ceil(
        (nextEventDate - clickedDate) / (1000 * 60 * 60 * 24)
      );

      let daysColor = 'green';

if (diffDays <= 7) {
  daysColor = 'red';
} else if (diffDays <= 15) {
  daysColor = 'amber';
}

      let nextDayEvents = sortedEvents.filter(
        e => e.dueDay == nextEvent.dueDay
      );

      nextDayEvents.slice(0, MAX_EVENTS).forEach((event, index) => {

        let rowClass = rowColors[index % rowColors.length];

        output += `
          <div class="deadline-card ${rowClass} bg-off-Black">
            <div class="deadline-content">
              <h4 class="font-white">${event.formCd}</h4>
              <p class="font-ash">${event.dueDescription}</p>
              <div class="deadline-date font-white"><span class="itr-date-icon">
                  <img class="icon-bright-mode" src="${iconPath}themes/custom/itdbase/images/svg/clockicon.svg">
                  <img class="icon-dark-mode" src="${iconPath}themes/custom/itdbase/images/svg/clockicon-dark.svg">
                </span>
                ${formatDate(nextEventDate)}
              </div>
            </div>
            ${
              clickedDate >= todayDate
                ? `<div class="days-remaining deadline-card tile-left ${daysColor}">
  ${diffDays} ${diffDays === 1 ? 'day' : 'days'}
</div>`
                : ''
            }
          </div>
        `;
      });

    } else {

      // 3️⃣ MUST WAIT for next month properly
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;

      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
      }

      let key = `${nextYear}-${nextMonth}`;
      let nextMonthData = [];

      // 🔥 IMPORTANT FIX
      if (monthCache[key]?.data) {

        nextMonthData = monthCache[key].data;

      } else {

        // If promise exists, wait
        if (monthCache[key]?.promise) {
          await monthCache[key].promise;
          nextMonthData = monthCache[key].data || [];
        } else {

          // If not even prefetched, fetch now
          let response = await fetch(`${ajaxUrl}?year=${nextYear}&month=${nextMonth}`);
          let data = await response.json();
          data.sort((a,b)=>a.dueDay-b.dueDay);

          monthCache[key] = { data };
          nextMonthData = data;
        }
      }

      if (nextMonthData.length > 0) {

        let firstEvent = nextMonthData[0];

        let nextEventDate = new Date(
          firstEvent.dueYear,
          firstEvent.dueMonth - 1,
          firstEvent.dueDay
        );
        nextEventDate.setHours(0,0,0,0);

        let diffDays = Math.ceil(
          (nextEventDate - clickedDate) / (1000 * 60 * 60 * 24)
        );

        let daysColor = 'green';

if (diffDays <= 7) {
  daysColor = 'red';
} else if (diffDays <= 15) {
  daysColor = 'amber';
}

        let firstDayEvents = nextMonthData.filter(
          e => e.dueDay == firstEvent.dueDay
        );

        firstDayEvents.slice(0, MAX_EVENTS).forEach((event, index) => {

          let rowClass = rowColors[index % rowColors.length];

          output += `
            <div class="deadline-card ${rowClass} bg-off-Black">
              <div class="deadline-content">
                <h4 class="font-white">${event.formCd}</h4>
                <p class="font-ash">${event.dueDescription}</p>
                <div class="deadline-date font-white"><span class="itr-date-icon">
                  <img class="icon-bright-mode" src="${iconPath}themes/custom/itdbase/images/svg/clockicon.svg">
                  <img class="icon-dark-mode" src="${iconPath}themes/custom/itdbase/images/svg/clockicon-dark.svg">
                </span>
                  ${formatDate(nextEventDate)}  
                </div>
              </div>
              ${
                clickedDate >= todayDate
                  ? `<div class="days-remaining deadline-card tile-left ${daysColor}">
${diffDays} ${diffDays === 1 ? 'day' : 'days'}
</div>`
                  : ''
              }
            </div>  
          `;
        });

      } else {
        output = '<p>No upcoming events</p>';
      }
    }
  }

  // ✅ Make screen reader read updates (NO HTML change)
container.setAttribute('aria-live', 'polite');
container.setAttribute('aria-atomic', 'true');

// Clear first (important for NVDA)
container.innerHTML = '';

// Small delay ensures announcement
setTimeout(() => {
  container.innerHTML = output;
}, 50);
    

} 


      // ===============================
      // BUILD CALENDAR
      // ===============================
      function buildCalendar(year, month, data) {

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        const firstDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

        let totalCells = 42;
        let dayCounter = 1;
        let nextMonthDay = 1;

        for (let i = 0; i < totalCells; i++) {

          let div = document.createElement('div');
          div.classList.add('calendar-day');

          if (i < firstDayIndex) {

            div.innerHTML = daysInPrevMonth - firstDayIndex + i + 1;
            div.classList.add('other-month');
            div.setAttribute('aria-hidden','true');
            div.setAttribute('tabindex','-1');

          } else if (dayCounter <= daysInMonth) {

            let currentDay = dayCounter;
            div.innerHTML = currentDay;
            div.setAttribute('data-day', currentDay);
            div.classList.add('current-month');

const hasEvent = data.some(event => event.dueDay == currentDay);

if (hasEvent) {
  div.classList.add('highlight');

  // ? Only event dates are focusable
  div.setAttribute('tabindex', '0'); 
  div.setAttribute('role', 'button');
  div.setAttribute(
  'aria-label',
  'Events on ' + formatDate(new Date(year, month - 1, currentDay))
);
} else {
  // ? Non-event dates should NOT be focusable
  div.setAttribute('tabindex', '-1');
}

            if (year == todayYear && month == todayMonth && currentDay == todayDay) {
              div.classList.add('today');
            }

            function activateDay() {
              document.querySelectorAll('.calendar-day')
                .forEach(d => d.classList.remove('active'));

              div.classList.add('active');
              showEvents(currentDay, true);
            }

            div.addEventListener('click', activateDay);
            div.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateDay();
              }
            });
            /*div.addEventListener('click', function () {

              document.querySelectorAll('.calendar-day')
                .forEach(d => d.classList.remove('active'));

              this.classList.add('active');
              showEvents(currentDay);
            });*/

            dayCounter++;

          } else {

            div.innerHTML = nextMonthDay++;
            div.classList.add('other-month');
            div.setAttribute('aria-hidden','true');
            div.setAttribute('tabindex','-1');
          }

          grid.appendChild(div);
        }

        // if (year == todayYear && month == todayMonth) {
        //   let todayElement = document.querySelector('.calendar-day.today');
        //   if (todayElement) {
        //     todayElement.classList.add('active');
        //     showEvents(todayDay);
        //   }
        // }
        // ===============================
// AUTO SELECT DAY
// ===============================

// If current month ? behave like today logic
if (year == todayYear && month == todayMonth) {

  let todayElement = document.querySelector('.calendar-day.today');

  if (todayElement) {
    todayElement.classList.add('active');
    showEvents(todayDay,false);
  }

} else {

  // For previous/next month ? select 1st day automatically
  let firstDayElement = document.querySelector('.calendar-day.current-month[data-day="1"]');

  if (firstDayElement) {
    firstDayElement.classList.add('active');
    showEvents(1,false);
  }
}
      }

      // once('nextMonth', context.querySelectorAll('#next-month'))
      //   .forEach(btn => {
      //     btn.addEventListener('click', function () {
      //       let month = currentMonth + 1;
      //       let year = currentYear;
      //       if (month > 12) { month = 1; year++; }
      //       loadMonth(year, month);
      //     });
      //   });

      // once('prevMonth', context.querySelectorAll('#prev-month'))
      //   .forEach(btn => {
      //     btn.addEventListener('click', function () {
      //       let month = currentMonth - 1;
      //       let year = currentYear;
      //       if (month < 1) { month = 12; year--; }
      //       loadMonth(year, month);
      //     });
      //   });
      once('nextMonth', context.querySelectorAll('#next-month'))
  .forEach(btn => {
    btn.addEventListener('click', function () {

      let month = currentMonth + 1;
      let year = currentYear;

      if (month > 12) {
        month = 1;
        year++;
      }

      const monthName = monthNames[month - 1];
      btn.setAttribute('aria-label', 'Go to ' + monthName + ' ' + year);

      loadMonth(year, month);

    });
  });


once('prevMonth', context.querySelectorAll('#prev-month'))
  .forEach(btn => {
    btn.addEventListener('click', function () {

      let month = currentMonth - 1;
      let year = currentYear;

      if (month < 1) {
        month = 12;
        year--;
      }

      const monthName = monthNames[month - 1];
      btn.setAttribute('aria-label', 'Go to ' + monthName + ' ' + year);

      loadMonth(year, month);

    });
  });


      loadMonth(currentYear, currentMonth);

    }
  };

})(Drupal, once);
