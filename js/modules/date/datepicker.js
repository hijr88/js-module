import './datepicker.scss';

let instanceList = [];
const days = ['일', '월', '화', '수', '목', '금', '토'];
const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const sides = {
    // `t`, `r`, `b`, and `l` are all positioned relatively to the input the calendar is attached to.
    t: 'top',
    r: 'right',
    b: 'bottom',
    l: 'left',

    // `centered` fixes the calendar smack in the middle of the screen. Useful for mobile devices.
    c: 'centered'
};

function noop() {
}

const events = ['click', 'change', 'focusin'];

const calendarContainer = document.createElement('div');
/*
  달력은 컨테이너의 글꼴 크기를 기준으로 조정됩니다.
  사용자는 글꼴 크기 또는 테마를 설정하는 클래스 이름을 제공할 수 있습니다.
  따라서 달력의 전체 크기와 모양을 제어할 수 있습니다.
*/
calendarContainer.className = 'qs-datepicker-container qs-hidden';

const calendar = document.createElement('div');
calendar.className = 'qs-datepicker';
calendar.innerHTML = `
<div class="qs-controls"></div>
<div class="qs-squares"></div>
<div class="qs-overlay qs-hidden">
    <div>
        <select class="qs-overlay-year"></select>
    </div>
    <div class="qs-overlay-month-container"></div>
</div>`;
calendarContainer.appendChild(calendar);

/*
 *  datepicker 생성!
 */
function datepicker(selectorOrElement, options) {
    const instance = createInstance(selectorOrElement, options);
    if (instanceList.length === 0) {
        applyListeners(document);
        document.body.appendChild(calendarContainer);
    }

    //인스턴스 추가
    instanceList.push(instance);

    //페어가 존재하는 경우 날짜범위(min & max) 재조정
    if (instance.second) {
        const first = instance.sibling;
        adjustDateRanges({ instance: instance, deselect: !instance.dateSelected });
        adjustDateRanges({ instance: first, deselect: !first.dateSelected });
    }
    return instance;
}

/*
 * 이벤트 세팅
 */
function applyListeners(document) {
    /*
      Using document instead of window because #iphone :/
      Safari won't handle the click event properly if it's on the window.
    */
    events.forEach(function (event) {
        document.addEventListener(event, oneHandler);
    });
}

/*
 *  Creates a datepicker instance after sanitizing the options.
 *  Calls `setCalendarInputValue` and conditionally `showCal`.
 */
function createInstance(selectorOrElement, opts) {
    const options = sanitizeOptions(opts || defaults());

    let el = selectorOrElement;
    if (typeof el === 'string') el = el[0] === '#' ? document.getElementById(el.slice(1)) : document.querySelector(el);
    if (!el) throw new Error('No selector / element found.');

    // 이미 설정된 Element 이면 throw
    if (instanceList.some(instance => instance.el === el))
        throw new Error('A datepicker already exists on that element.');

    const isBody = el === document.body;

    const instance = {
        // The calendar will become a sibling to this element in the DOM and be positioned relative to it (except when <body>).
        el: el,

        // Indicates whether the calendar is used with an <input> or not. Affects login in the event listener.
        nonInput: el.nodeName !== 'INPUT',

        // Flag indicating if `el` is 'body'. Used below and by `calculatePosition`.
        isBody: isBody,

        // Calendar position relative to `el`.
        position: isBody ? false : options.position,

        // Date obj used to indicate what month to start the calendar on.
        startDate: options.startDate,

        // Starts the calendar with a date selected.
        dateSelected: options.dateSelected,

        // An array of dates to disable - these are unix timestamps and not date objects (converted in `sanitizeOptions`).
        disabledDates: options.disabledDates,

        // Low end of selectable dates - override for dateRange pairs below.
        minDate: options.minDate,

        // High end of selectable dates - override for dateRange pairs below.
        maxDate: options.maxDate,

        // Disabled the ability to select days on the weekend.
        noWeekends: !!options.noWeekends,

        // Indices for "Saturday" and "Sunday" respectively.
        weekendIndices: options.weekendIndices,

        // Month of `startDate` or `dateSelected` (as a number).
        currentMonth: (options.startDate || options.dateSelected).getMonth(),

        // Month name in plain english - or not.
        currentMonthName: (options.months || months)[(options.startDate || options.dateSelected).getMonth()],

        // Year of `startDate` or `dateSelected`.
        currentYear: (options.startDate || options.dateSelected).getFullYear(),

        // Events will show a small circle on calendar days.
        events: options.events || {},

        defaultView: options.defaultView,

        // Method to programmatically set the calendar's date.
        setDate: setDate,

        // Method that removes the calendar from the DOM along with associated events.
        remove: remove,

        // Method to programmatically change the minimum selectable date.
        setMin: setMin,

        // Method to programmatically change the maximum selectable date.
        setMax: setMax,

        // Method to programmatically show the calendar.
        show: show,

        // Method to programmatically hide the calendar.
        hide: hide,

        // Method to programmatically navigate the calendar
        navigate: navigate,

        // Method to programmatically toggle the overlay.
        toggleOverlay: instanceToggleOverlay,

        // Callback fired when a date is selected - triggered in `selectDay`.
        onSelect: options.onSelect,

        // Callback fired when the calendar is shown - triggered in `showCal`.
        onShow: options.onShow,

        // Callback fired when the calendar is hidden - triggered in `hideCal`.
        onHide: options.onHide,

        // Callback fired when the month is changed - triggered in `changeMonthYear`.
        onMonthChange: options.onMonthChange,

        // Function to customize the date format updated on <input> elements - triggered in `setCalendarInputValue`.
        formatter: options.formatter,

        // Function with custom logic that determines wether a given date is disabled or not.
        disabler: options.disabler,

        // Labels for months - custom or default.
        months: options.months || months,

        // Labels for days - custom or default.
        days: options.customDays || days,

        // Start day of the week - indexed from `days` above.
        startDay: options.startDay,

        // Custom overlay months - only the first 3 characters are used.
        overlayMonths: options.overlayMonths || (options.months || months).map(m => m.slice(0, 3)),

        // Disable the overlay for changing the year.
        disableYearOverlay: !!options.disableYearOverlay,

        // Disable the datepicker on mobile devices.
        // Allows the use of native datepicker if the input type is 'date'.
        disableMobile: !!options.disableMobile,

        // Used in conjuntion with `disableMobile` above within `oneHandler`.
        isMobile: 'ontouchstart' in window,

        // Used to connect 2 datePickers together to form a dateRange picker.
        id: options.id,

        // Shows a date in every square rendered on the calendar (preceding and trailing month days).
        showAllDates: !!options.showAllDates,

        // Prevents Datepicker from selecting dates when attached to inputs that are `disabled` or `readonly`.
        respectDisabledReadOnly: !!options.respectDisabledReadOnly,

        // Indicates this is the 1st instance in a dateRange pair.
        first: options.first,

        // Indicates this is the 2nd instance in a dateRange pair.
        second: options.second,

        //선택 취소 가능여부
        enableDeselect: !!options.enableDeselect,

        isMonthPicker: !!options.isMonthPicker
    };

    /*
      DateRange processing!
      Ensure both instances have a reference to one another.
      Set min/max and original min/max dates on each instance.
    */
    if (options.sibling) {
        /* If we're here, we're encountering the 2nd instance in a dateRange pair. */
        const first = options.sibling;
        const second = instance;
        const minDate = first.minDate || second.minDate;
        const maxDate = second.maxDate || first.maxDate;

        // Store the 1st instance as a sibling on the 2nd.
        second.sibling = first;

        // Store the 2nd instance as a sibling on the 1st.
        first.sibling = second;

        /*
          DateRange pairs share a min & max date.
          The 1st instance overrides the 2nd.
        */
        first.minDate = minDate;
        first.maxDate = maxDate;
        second.minDate = minDate;
        second.maxDate = maxDate;

        // Used to restore the min / max dates when a date is deselected.
        first.originalMinDate = minDate;
        first.originalMaxDate = maxDate;
        second.originalMinDate = minDate;
        second.originalMaxDate = maxDate;

        // Add a method that returns an object with start & end date selections for the pair.
        first.getRange = getRange;
        second.getRange = getRange;
    }

    // Initially populate the <input> field / set attributes on the `el`.
    if (options.dateSelected) setCalendarInputValue(el, instance);

    return instance;
}

/*
 *  Helper function to duplicate an object or array.
 *  Should help Babel avoid adding syntax that isn't IE compatible.
 */
function freshCopy(item) {
    if (Array.isArray(item)) return item.map(freshCopy);

    if (type(item) === '[object Object]') {
        return Object.keys(item).reduce(function (newObj, key) {
            newObj[key] = freshCopy(item[key]);
            return newObj;
        }, {});
    }

    return item;
}

/*
 *  Will run checks on the provided options object to ensure correct types.
 *  Returns an options object if everything checks out.
 */
function sanitizeOptions(opts) {
    // Avoid mutating the original object that was supplied by the user.
    const options = freshCopy(opts);

    /*
      Check and ensure all events in the provided array are JS dates.
      Store these on the instance as an object with JS datetimes as keys for fast lookup.
    */
    if (options.events) {
        options.events = options.events.reduce(function (acc, date) {
            if (!dateCheck(date)) throw new Error('"options.events" must only contain valid JavaScript Date objects.');
            acc[+stripTime(date)] = true;
            return acc;
        }, {});
    }

    /*
      Check that various options have been provided a JavaScript Date object.
      If so, strip the time from those dates (for accurate future comparisons).
    */
    ['startDate', 'dateSelected', 'minDate', 'maxDate'].forEach(function (value) {
        const date = options[value];
        if (date && !dateCheck(date)) throw new Error('"options.' + value + '" needs to be a valid JavaScript Date object.');

        /*
          Strip the time from the date.
          For dates not supplied, stripTime will return undefined.
        */
        options[value] = stripTime(date);
    });

    const position = options.position;
    const maxDate = options.maxDate;
    const minDate = options.minDate;
    const dateSelected = options.dateSelected;
    const startDay = options.startDay;
    const id = options.id;

    options.startDate = stripTime(options.startDate || dateSelected || new Date());

    // Checks around disabled dates.
    options.disabledDates = (options.disabledDates || []).reduce(function (acc, date) {
        const newDateNum = +stripTime(date);

        if (!dateCheck(date)) throw new Error('You supplied an invalid date to "options.disabledDates".');
        if (newDateNum === +stripTime(dateSelected)) throw new Error('"disabledDates" cannot contain the same date as "dateSelected".');

        // Store a number because `createMonth` checks this array for a number match.
        acc[newDateNum] = 1;
        return acc;
    }, {});

    // If id was provided, it cannot be null or undefined.
    if (options.hasOwnProperty('id') && id == null) {
        throw new Error('`id` cannot be `null` or `undefined`');
    }

    /*
      달력 범위 계산
      No more than 2 pickers can have the same id.
      Later on in `createInstance` we'll process the dateRange pair further.
      Store values for `originalMinDate` & `originalMaxDate`.
      Store a reference to the 1st instance on the 2nd in the options -
        the 1st will get its reference to the 2nd in `createInstance`.
    */
    if (id != null) {
        // Search through pickers already created and see if there's an id match for this one.
        const pickers = instanceList.filter(instance => instance.id === id);

        // No more than 2 pickers can have the same id.
        if (pickers.length > 1) throw new Error('Only two datePickers can share an id.');

        // 2nd - If we found a picker, THIS will be the 2nd in the pair. Set the sibling property on the options.
        if (pickers.length) {
            options.second = true;
            options.sibling = pickers[0];

            // 1st - If no pickers were found, this is the 1st in the pair.
        } else {
            options.first = true;
        }
    }

    /*
      Ensure the accuracy of `options.position` & call `establishPosition`.
      The 'c' option positions the calendar smack in the middle of the screen,
      *not* relative to the input. This can be desirable for mobile devices.
    */
    const positionFound = ['tr', 'tl', 'br', 'bl', 'c'].some(dir => position === dir);
    if (position && !positionFound) {
        throw new Error('"options.position" must be one of the following: tl, tr, bl, br, or c.');
    }
    options.position = establishPosition(position || 'bl');

    function dsErr(min) {
        const lessOrGreater = min ? 'less' : 'greater';
        throw new Error('"dateSelected" in options is ' + lessOrGreater + ' than "' + (min || 'max') + 'Date".');
    }

    // Check proper relationship between `minDate`, `maxDate`, & `dateSelected`.
    if (maxDate < minDate) throw new Error('"maxDate" in options is less than "minDate".');
    if (dateSelected) {
        if (minDate > dateSelected) dsErr('min');
        if (maxDate < dateSelected) dsErr();
    }

    // Callbacks - default to a noop function.
    ['onSelect', 'onShow', 'onHide', 'onMonthChange', 'formatter', 'disabler'].forEach(function (fxn) {
        if (typeof options[fxn] !== 'function') options[fxn] = noop; // `noop` defined at the top.
    })

    // Custom labels for months & days.
    ;['customDays', 'customMonths', 'customOverlayMonths'].forEach(function (label, i) {
        const custom = options[label];
        const num = i ? 12 : 7;

        // Do nothing if the user hasn't provided this custom option.
        if (!custom) return;

        if (
            !Array.isArray(custom) || // Must be an array.
            custom.length !== num || // Must have the correct length.
            custom.some(function (item) {
                return typeof item !== 'string';
            }) // Must be an array of strings only.
        ) throw new Error('"' + label + '" must be an array with ' + num + ' strings.');

        options[!i ? 'days' : i < 2 ? 'months' : 'overlayMonths'] = custom;
    });

    /*
      Adjust days of the week for user-provided start day.
      If `startDay` is a bad value, it will simply be ignored.
    */
    if (startDay && startDay > 0 && startDay < 7) {
        // [sun, mon, tues, wed, thurs, fri, sat]             (1) - original supplied days of the week
        const daysCopy = (options.customDays || days).slice();

        // Example with startDay of 3 (Wednesday)
        // daysCopy => [wed, thurs, fri, sat]                 (2) - the 1st half of the new array
        // chunk    => [sun, mon, tues]                       (3) - the 2nd half of the new array
        const chunk = daysCopy.splice(0, startDay);

        // [wed, thurs, fri, sat, sun, mon, tues]             (4) - the new days of the week
        options.customDays = daysCopy.concat(chunk);

        options.startDay = +startDay;
        options.weekendIndices = [
            daysCopy.length - 1, // Last item in the 1st half of the edited array.
            daysCopy.length // Next item in the array, 1st item in the 2nd half of the edited array.
        ];
    } else {
        options.startDay = 0;
        options.weekendIndices = [6, 0]; // Indices of "Saturday" and "Sunday".
    }

    // Show either the calendar (default) or the overlay when the calendar is open.
    const defaultView = options.defaultView;
    if (defaultView && (defaultView !== 'calendar' && defaultView !== 'overlay')) {
        throw new Error('options.defaultView must either be "calendar" or "overlay".');
    }
    options.defaultView = defaultView || 'calendar';

    return options;
}

/*
 *  Returns an object containing all the default settings.
 */
function defaults() {
    return {
        startDate: stripTime(new Date()),
        position: 'bl',
        defaultView: 'calendar'
    };
}

/*
 *  Returns an object representing the position of the calendar
 *  relative to the calendar's <input> element.
 */
function establishPosition(positions) {
    const p1 = positions[0];
    const p2 = positions[1];
    const obj = {};

    obj[sides[p1]] = 1;
    if (p2) obj[sides[p2]] = 1;

    return obj;
}

/*
 *  Renders a calendar, defaulting to the current year & month of that calendar.
 *  Populates `calendar.innerHTML` with the contents of the calendar controls, month, and overlay.
 *  This method does NOT *show* the calendar on the screen. It only affects the html structure.
 */
function renderCalendar(instance, date) {
    const overlay = calendar.querySelector('.qs-overlay');
    const overlayOpen = overlay && !overlay.classList.contains('qs-hidden');

    // Default to rendering the current month. This is helpful for re-renders.
    date = date || new Date(instance.currentYear, instance.currentMonth);

    calendar.innerHTML = [
        createControls(date, instance, overlayOpen),
        createMonth(date, instance, overlayOpen),
        createOverlay(instance, overlayOpen)
    ].join('');

    /*
      When the overlay is open and we submit a year (or click a month), the calendar's
      html is recreated here. To make the overlay fade out the same way it faded in,
      we need to create it with the appropriate classes (triggered by `overlayOpen`),
      then wait for the next repaint, triggering a fade out.

      Good for IE >= 10.
    */
    if (overlayOpen && instance.isMonthPicker === false) window.requestAnimationFrame(function () {
        toggleOverlay(true, instance);
    });
}

/** 달력 선택 DOM elements */
function createControls(date, instance, overlayOpen) {
    const minMonth = (() => {
        const minDate = instance.minDate;
        return new Date(minDate.getFullYear(), minDate.getMonth()).getTime();
    })();
    const maxMonth = (() => {
        const maxDate = instance.maxDate;
        return new Date(maxDate.getFullYear(), maxDate.getMonth()).getTime();
    })();
    const currentMonth = new Date(instance.currentYear, instance.currentMonth).getTime();

    return `
    <div class="qs-controls${overlayOpen ? ' qs-blur' : ''}">
        <div class="qs-arrow qs-left${minMonth >= currentMonth ? ' qs-disabled' : ''}"></div>
        <div class="qs-month-year">
          <span class="qs-year">${date.getFullYear()}년</span>
          <span class="qs-month">${instance.months[date.getMonth()]}</span>
        </div>
        <div class="qs-arrow qs-right${maxMonth <= currentMonth ? ' qs-disabled' : ''}"></div>
    </div>`;
}

/*
 *  Creates the calendar month structure.
 *  Returns a string representation of DOM elements.
 */
function createMonth(date, instance, overlayOpen) {
    // Dynamic properties.
    const currentMonth = instance.currentMonth;
    const currentYear = instance.currentYear;
    const dateSelected = instance.dateSelected;
    const maxDate = instance.maxDate;
    const minDate = instance.minDate;
    const showAllDates = instance.showAllDates;

    // Static properties.
    const days = instance.days;
    const disabledDates = instance.disabledDates;
    const startDay = instance.startDay;
    const weekendIndices = instance.weekendIndices;
    const events = instance.events;

    // If we have a dateRange picker, get the current range.
    const range = instance.getRange ? instance.getRange() : {};
    const start = +range.start;
    const end = +range.end;

    // 1st of the month for whatever date we've been provided.
    const copy = stripTime(new Date(date).setDate(1)); // 1st of the month.

    // copy.getDay() - day of the week, 0-indexed.
    // startDay      - day of the week the calendar starts on, 0-indexed.
    const offset = copy.getDay() - startDay; // Preceding empty squares.

    // Offsetting the start day may move back to a new 1st row.
    const precedingRow = offset < 0 ? 7 : 0;

    // Bump the provided date to the 1st of the next month.
    copy.setMonth(copy.getMonth() + 1);

    // Move the provided date back a single day, resulting in the last day of the provided month.
    copy.setDate(0);

    // Last day of the month = how many quares get a number on the calendar.
    const daysInMonth = copy.getDate(); // Squares with a number.

    // This array will contain string representations of HTML for all the calendar squares.
    const calendarSquares = [];

    // Fancy calculations for the total # of squares.
    // The pipe operator truncates any decimals.
    let totalSquares = precedingRow + (((offset + daysInMonth) / 7 | 0) * 7);
    totalSquares += (offset + daysInMonth) % 7 ? 7 : 0;

    /*
      Create all the numbered calendar days.
      Days of the week (top row) created below this loop.
    */
    for (let i = 1; i <= totalSquares; i++) {
        // The index of the day of the week that the current iteration is at.
        const weekdayIndex = (i - 1) % 7; // Round robin values of 0 - 6, back to 0 again.

        /*
          "Thu" - text name for the day of the week as displayed on the calendar.
          Added as a class name to each numbered day in the calendar.
        */
        const weekday = days[weekdayIndex];

        // Number displayed in the calendar for current iteration's day.
        const num = i - (offset >= 0 ? offset : (7 + offset));

        /*
          JavaScript date object for the current iteration's day.
          It has no time so we can compare accurately.
          Used to find out of the current iteration is today.
        */
        const thisDay = new Date(currentYear, currentMonth, num);

        // Does this iteration's date have an event?
        const hasEvent = events[+thisDay];

        /*
          Is the current iteration's date outside the current month?
          These fall into the before & after squares shown on the calendar.
        */
        const outsideOfCurrentMonth = num < 1 || num > daysInMonth;

        /*
          Days outside the current month need a [data-direction] attribute.
          In the case we're showing all dates, users can click dates outside the current
          month to navigate. This attribute tells the event handler the direction
          of the month to navigate to.
        */
        const direction = outsideOfCurrentMonth ? num < 1 ? -1 : 1 : 0;

        // Flag indicating the square on the calendar should be empty.
        const isEmpty = outsideOfCurrentMonth && !showAllDates;

        // The display number to this iteration's date - can be an empty square as well.
        let thisDayNum = isEmpty ? '' : thisDay.getDate();

        // Is this iteration's date currently selected?
        const isSelected = +thisDay === +dateSelected;

        // Is this day a weekend? Weekends for Datepicker are strictly Saturday & Sunday.
        const isWeekend = weekdayIndex === weekendIndices[0] || weekdayIndex === weekendIndices[1];

        // Is this iteration's date disabled?
        const isDisabled = disabledDates[+thisDay] ||
            instance.disabler(thisDay) ||
            (isWeekend && instance.noWeekends) ||
            (minDate && +thisDay < +minDate) ||
            (maxDate && +thisDay > +maxDate);

        // Is this iteration's date today?
        const isToday = +stripTime(new Date()) === +thisDay;

        // DateRange variables.
        const isRangeStart = +thisDay === start;
        const isRangeEnd = +thisDay === end;
        const isRangeMiddle = +thisDay > start && +thisDay < end;
        const rangeIsNotSingleDay = start !== end;

        // Base class name that every square will have.
        let className = 'qs-square ' + weekday;

        // Create the rest of the class name for our calendar day element.
        if (hasEvent && !isEmpty) className += ' qs-event'; // Don't show events on empty squares.
        if (outsideOfCurrentMonth) className += ' qs-outside-current-month';
        if (showAllDates || !outsideOfCurrentMonth) className += ' qs-num';
        if (isSelected) className += ' qs-active';
        if (isDisabled && !isEmpty) className += ' qs-disabled'; // Empty dates don't need the class name.
        if (isToday) className += ' qs-current';
        if (isRangeStart && end && rangeIsNotSingleDay) className += ' qs-range-start';
        if (isRangeMiddle) className += ' qs-range-middle';
        if (isRangeEnd && start && rangeIsNotSingleDay) className += ' qs-range-end';
        if (isEmpty) {
            className += ' qs-empty';
            thisDayNum = ''; // Don't show numbers for empty squares.
        }

        calendarSquares.push('<div class="' + className + '" data-direction="' + direction + '">' + thisDayNum + '</div>');
    }

    // Add the header row of days of the week.
    const daysAndSquares = days.map(day => `<div class="qs-square qs-day">${day}</div>`).concat(calendarSquares);

    // Wrap it all in a tidy div.
    daysAndSquares.unshift('<div class="qs-squares' + (overlayOpen ? ' qs-blur' : '') + '">');
    daysAndSquares.push('</div>');
    return daysAndSquares.join('');
}

/*
 *  Creates the overlay for users to
 *  manually navigate to a month & year.
 */
function createOverlay(instance, overlayOpen) {
    const minYear = instance.minDate.getFullYear();
    const maxYear = instance.maxDate.getFullYear();

    const yearOption = (function () {
        let html = '';
        for (let i = minYear; i <= maxYear; i++) {
            html += `<option value="${i}">${i}</option>`;
        }
        return html;
    })();

    const shortMonths = makeShortMonths(instance);

    return `
    <div class="qs-overlay${overlayOpen ? '' : ' qs-hidden'}">
      <div>
        <select class="qs-overlay-year" >
            ${yearOption}
        </select>
        <div class="qs-close">&#10005;</div>
      </div>
      <div class="qs-overlay-month-container">${shortMonths}</div>
    </div>`;
}

/**
 * 월 html 생성
 * @param instance
 * @param changeYear undefined or select 값 변경시 담길 year
 */
function makeShortMonths(instance, changeYear) {
    const overlayMonths = instance.overlayMonths;

    const minDate = instance.minDate;
    const minYear = minDate.getFullYear();
    const minMonth = minDate.getMonth();

    const maxDate = instance.maxDate;
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    const year = Number(changeYear) || instance.currentYear;

    const isMinYear = year <= minYear;
    const isMaxYear = year >= maxYear;
    const isSameYear = year === instance.currentYear;

    return overlayMonths.map(function (m, i) {
        const bool = (isMinYear && i < minMonth) || (isMaxYear && i > maxMonth);
        return `<div class="qs-overlay-month${bool ? ' qs-disabled' : ''}${(isSameYear && instance.currentMonth === i) ? ' active' : ''}" data-month-num="${i}">${m}</div>`;
    }).join('');
}

function changeSelectMonth(instance, year) {
    calendar.querySelector('.qs-overlay-month-container').innerHTML = makeShortMonths(instance, year);
}

/*
 *  Highlights the selected date - or deselects it.
 *  Calls `setCalendarInputValue`.
 */
function selectDay(target, instance, enableDeselect) {
    const el = instance.el;
    const num = target.textContent;
    const sibling = instance.sibling;

    // Prevent Datepicker from selecting (or deselecting) dates.
    if ((el.disabled || el.readOnly) && instance.respectDisabledReadOnly) return;

    // 선택 취소가능한 경우 undefined
    instance.dateSelected = enableDeselect ? undefined : new Date(instance.currentYear, instance.currentMonth, num);

    if (sibling) {
        // Update minDate & maxDate of both calendars.
        adjustDateRanges({ instance: instance, deselect: enableDeselect });

        //첫번째 달력이면서 페어의 달력이 선택되지 않은 경우
        if (instance.first && !sibling.dateSelected) {
            sibling.currentYear = instance.currentYear;
            sibling.currentMonth = instance.currentMonth;
            sibling.currentMonthName = instance.currentMonthName;
        }
    }

    //선택 취소 가능한 경우
    if (enableDeselect) {
        renderCalendar(instance);
    } else {
        hideCal(instance);
    }

    //날짜를 필드에 세팅
    setCalendarInputValue(el, instance, enableDeselect);

    // onSelect 콜백
    // Passing in new date so there's no chance of mutating the original object.
    // In the case of a dateRange, min & max dates are automatically set.
    instance.onSelect(instance, enableDeselect ? undefined : new Date(instance.dateSelected));
}

/*
  When selecting / deselecting a date, this resets `minDate` or `maxDate` on
  both pairs of a dateRange based upon `originalMinDate` or `originalMaxDate`.
*/
function adjustDateRanges(args) {
    const first = args.instance.first ? args.instance : args.instance.sibling;
    const second = first.sibling;

    if (first === args.instance) {
        if (args.deselect) {
            first.minDate = first.originalMinDate;
            second.minDate = second.originalMinDate;
        } else {
            second.minDate = first.dateSelected;
        }
    } else {
        if (args.deselect) {
            second.maxDate = second.originalMaxDate;
            first.maxDate = first.originalMaxDate;
        } else {
            first.maxDate = second.dateSelected;
        }
    }
}

/**
 * 날짜 형식을 input value 채우기
 * @param el
 * @param instance
 * @param {boolean} deselect 선택 취소
 */
function setCalendarInputValue(el, instance, deselect = undefined) {
    if (instance.nonInput) return;
    if (deselect) return el.value = '';
    if (instance.formatter !== noop) return instance.formatter(el, instance.dateSelected, instance);
    el.value = instance.dateSelected.toDateString();
}

/*
 * 함수 발생 조건
 * 1. 제어창의 방향(◀, ▶)표시로 월을 바꾸거나
 * 2. 월 선택창에서 선택할때
 */
function changeMonthYear(classList, instance, year, overlayMonthIndex) {
    // 월 선택창
    if (year || overlayMonthIndex) {
        if (year) instance.currentYear = +year;
        if (overlayMonthIndex) instance.currentMonth = +overlayMonthIndex;

    } else { // 제어창의 방향(◀, ▶)
        instance.currentMonth += classList.contains('qs-right') ? 1 : -1;

        // Month = 0 ~ 11 제어
        if (instance.currentMonth === 12) {
            instance.currentMonth = 0;
            instance.currentYear++;
        } else if (instance.currentMonth === -1) {
            instance.currentMonth = 11;
            instance.currentYear--;
        }
    }
    instance.currentMonthName = instance.months[instance.currentMonth];

    if (instance.isMonthPicker) {
        instance.dateSelected = new Date(instance.currentYear, instance.currentMonth);
        instance.formatter(instance.el, instance.dateSelected);
        instance.hide();

        const sibling = instance.sibling;
        if (sibling) { //페어가 존재하는 경우
            // 두 달력의 최소 날짜, 최대날짜 재조정
            adjustDateRanges({ instance: instance });
        }
    }
    renderCalendar(instance);
    instance.onMonthChange(instance);
}

/*
 *  달력을 해당 Element 기준으로 계산하여 좌표 지정
 */
function calculatePosition(instance) {
    // Don't try to position the calendar if its el is <body> or <html>.
    if (instance.isBody) return;

    const centered = instance.position['centered'];

    /*
      This positions the calendar `fixed` in the middle of the screen,
      so we don't need to do any calculations. We just add the class to trigger styles.
    */
    if (centered) return calendarContainer.classList.add('qs-centered');

    // Get the measurements.
    const elRects = instance.el.getBoundingClientRect();

    // Calculate the position!
    const topStyle = elRects.top + elRects.height + (window.scrollY || pageYOffset) + 'px';
    const leftStyle = elRects.left + 'px';

    // Set the styles.
    calendarContainer.style.setProperty('top', topStyle);
    calendarContainer.style.setProperty('left', leftStyle);
}

/*
 *  Checks for a valid date object.
 */
function dateCheck(date) {
    return (
        type(date) === '[object Date]' &&
        date.toString() !== 'Invalid Date'
    );
}

/*
 * 날짜 또는 숫자를 가져와서 시간(hh:mm:ss:ms) 제거한 날짜 반환
 * 유효하지 않은 날짜면 undefined 반환
 */
function stripTime(dateOrNum) {
    if (!dateCheck(dateOrNum) && (typeof dateOrNum !== 'number' || isNaN(dateOrNum))) return;

    const date = new Date(+dateOrNum);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/*
 * 날짜 또는 숫자를 가져와서 시간 제거하고 1일 고정 날짜 반환
 * 유효하지 않은 날짜면 undefined 반환
 */
function stripDay(dateOrNum) {
    if (!dateCheck(dateOrNum) && (typeof dateOrNum !== 'number' || isNaN(dateOrNum))) return;

    const date = new Date(+dateOrNum);
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** 달력 감추기 */
function hideCal(instance) {
    if (isShow()) {
        if (instance == null) {
            instance = instanceList.find(instance => instance.el === calendarContainer.showing);
        }

        instance.defaultView !== 'overlay' && toggleOverlay(true, instance);
        calendarContainer.classList.add('qs-hidden');

        //월 복구
        changeSelectMonth(instance);
        if (!instance.nonInput) instance.el.blur();

        instance.onHide(instance);
    }
    calendarContainer.showing = undefined;
}

/*
 * 달력 오픈!
 * onShow 콜백 실행
 */
function showCal(instance) {
    renderCalendar(instance);
    calendarContainer.showing = instance.el;

    calendarContainer.classList.remove('qs-hidden');
    instance.defaultView === 'overlay' && toggleOverlay(false, instance);
    calculatePosition(instance);
    instance.onShow(instance);
}

/*
 *  Show / hide the change-year overlay.
 */
function toggleOverlay(closing, instance) {
    /*
      .qs-overlay  - The dark overlay element containing the year select
      .qs-controls - The header of the calendar containing the left / right arrows & month / year.
      .qs-squares  - The container for all the squares making up the grid of the calendar.
    */
    const overlay = calendar.querySelector('.qs-overlay');
    const yearSelect = overlay.querySelector('.qs-overlay-year');
    const controls = calendar.querySelector('.qs-controls');
    const squaresContainer = calendar.querySelector('.qs-squares');

    if (closing) {
        overlay.classList.add('qs-hidden');
        controls.classList.remove('qs-blur');
        squaresContainer.classList.remove('qs-blur');
    } else {
        overlay.classList.remove('qs-hidden');
        controls.classList.add('qs-blur');
        squaresContainer.classList.add('qs-blur');
        yearSelect.value = instance.currentYear;
    }
}

/*
   월 선택창에서 선택하였을때
 */
function choiceMonth(instance, select, overlayMonthIndex) {
    const badDate = isNaN(+new Date().setFullYear(select.value || undefined));
    const value = badDate ? null : select.value;

    if (overlayMonthIndex) {
        changeMonthYear(null, instance, value, overlayMonthIndex);
    } else if (!badDate && !select.classList.contains('qs-disabled')) {
        changeMonthYear(null, instance, value);
    }
}

/*
 *  Returns the explicit type of something as a string.
 */
function type(thing) {
    return ({}).toString.call(thing);
}

///////////////////
// EVENT HANDLER //
///////////////////

/**
 * 이벤트 핸들러
 *  A single function to handle the 4 events we track - click, focusin, keydown, & input.
 *  Only one listener is applied to the document (not window). It is removed once
 *  all datepicker instances have had their `remove` method called.
 */
function oneHandler(e) {
    const type = e.type;
    let target = e.target;
    const classList = target.classList;
    const instance = instanceList.find(function (picker) {
        if (target === picker.el) return true;
        if (calendarContainer.contains(target) === false) return false;
        return !!(isShow() && calendarContainer.showing === picker.el);

    });

    const onCal = instance && calendar.contains(target);

    // Ignore event handling for mobile devices when disableMobile is true.
    if (instance && instance.isMobile && instance.disableMobile) return;

    ////////////
    // EVENTS //
    ////////////

    if (type === 'click') {
        //인스턴스가 존재하지 않는경우 == 다른곳 클릭 => 달력 숨기기
        if (!instance) return hideCal();

        const disableYearOverlay = instance.disableYearOverlay;
        const select = calendar.querySelector('.qs-overlay-year');
        const overlayClosed = !!calendar.querySelector('.qs-hidden');
        const monthYearClicked = calendar.querySelector('.qs-month-year')?.contains(target); //제어창의 x년x월을 선택하였는지
        const newMonthIndex = target.dataset.monthNum; // 오버레이창의 월('0'~'11')

        // Anything but the calendar was clicked.
        if (instance.isBody && !onCal) {
            // Show / hide a calendar whose el is html or body.
            const calendarClosed = calendarContainer.classList.contains('qs-hidden');
            (calendarClosed ? showCal : hideCal)(instance);

            // 제어창의 방향(◀, ▶)표시
        } else if (classList.contains('qs-arrow') && !classList.contains('qs-disabled')) {
            changeMonthYear(classList, instance);

            // 달력의 년월 선택기 || 월 선택창 x(닫기) 버튼
        } else if (monthYearClicked || classList.contains('qs-close')) {
            if (!disableYearOverlay) {
                if (instance.isMonthPicker) {
                    instance.hide();
                } else {
                    toggleOverlay(!overlayClosed, instance);
                }
            }

            // 오버레이창에서 월을 선택한 경우
        } else if (newMonthIndex) {
            if (classList.contains('qs-disabled')) return;
            choiceMonth(instance, select, newMonthIndex);

            // Clicking a disabled square or disabled overlay submit button.
        } else if (classList.contains('qs-disabled')) {

            // 달력에서 일을 선택한 경우
        } else if (classList.contains('qs-num')) {
            const num = target.textContent;
            const monthDirection = +target.dataset.direction; // -1, 0, or 1.
            const dateInQuestion = new Date(instance.currentYear, instance.currentMonth + monthDirection, num);

            //이전 또는 다음 달의 날짜를 클릭한 경우
            if (monthDirection) {
                instance.currentYear = dateInQuestion.getFullYear();
                instance.currentMonth = dateInQuestion.getMonth();
                instance.currentMonthName = months[instance.currentMonth];
            }

            if (+dateInQuestion === +instance.dateSelected) {
                selectDay(target, instance, instance.enableDeselect);
            } else if (!target.classList.contains('qs-disabled')) {
                selectDay(target, instance);
            }
        } else if (target === instance.el) { //달력 열기
            showCal(instance);
        }
    } else if (type === 'focusin' && instance && !onCal && !instance.nonInput) {
        target.blur();
    } else if (type === 'change') {
        target.blur();
        // Avoid applying these restrictions to other inputs on the page. 다른 요소에 피해 안주기 위한 예방.
        if (!instance || !calendar.contains(target)) return;

        changeSelectMonth(instance, target.value);
    }
}

/*
 *  Removes the event listeners on either the document or the shadow DOM.
 */
function removeEvents(node, listener) {
    events.forEach(function (event) {
        node.removeEventListener(event, listener);
    });
}

//////////////////////
// INSTANCE METHODS //
//////////////////////

function show() {
    showCal(this);
}

function hide() {
    hideCal(this);
}

/**
 날짜 재설정
 * @param {Date} newDate 설정할 날짜
 * @param {boolean} changeCalendar 달력도 업데이트 할지
 * this 인스턴스
 */
function setDate(newDate, changeCalendar = true) {
    const date = (() => {
        if (this.isMonthPicker) {
            return stripDay(newDate);
        } else {
            return stripTime(newDate); //시간 제거한 새로운 날짜 객체
        }
    })();
    const sibling = this.sibling;

    // Removing the selected date.
    if (newDate == null) {
        // Remove the date.
        this.dateSelected = undefined;

        // Clear the associated input field.
        setCalendarInputValue(this.el, this, true);

        // DateRange processing!
        if (sibling) {
            adjustDateRanges({ instance: this, deselect: true });
            renderCalendar(sibling);
        }

        // Re-render the calendar to clear the selected date.
        renderCalendar(this);

        // Return the instance to enable chaining methods.
        return this;

        // Date isn't undefined or null but still falsey.
    } else if (!dateCheck(newDate)) {
        throw new Error('`setDate` needs a JavaScript Date object.');
    }

    // Check if the date is selectable.
    if (
        this.disabledDates[+date] ||
        date < this.minDate ||
        date > this.maxDate
    ) throw new Error(`You can't manually set a date that's disabled.`);

    // Keep track of the new date.
    this.dateSelected = date;

    /*
      These properties indicate to the instance where the calendar is currently at.
      Only change them if we're also navigating to the new date in the UI.
    */
    if (changeCalendar) {
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth();
        this.currentMonthName = this.months[date.getMonth()];
    }

    setCalendarInputValue(this.el, this);

    if (sibling) {
        // Adjust other date properties and re-render the sibling to show the same month as the other.
        adjustDateRanges({ instance: this });
    }

    if (this.isMonthPicker) {
        this.onMonthChange(this);
    }

    return this;
}

/*
 *  Programmatically changes the minimum selectable date.
 */
function setMin(date) {
    return changeMinOrMax(this, date, true);
}

/*
 *  Programmatically changes the maximum selectable date.
 */
function setMax(date) {
    return changeMinOrMax(this, date);
}

/*
 *  Called by `setMin` and `setMax`.
 */
function changeMinOrMax(instance, date, isMin) {
    const dateSelected = instance.dateSelected;
    const first = instance.first;
    const sibling = instance.sibling;
    const minDate = instance.minDate;
    const maxDate = instance.maxDate;
    const newDate = stripTime(date);
    const type = isMin ? 'Min' : 'Max';

    function origProp() {
        return 'original' + type + 'Date';
    }

    function prop() {
        return type.toLowerCase() + 'Date';
    }

    function method() {
        return 'set' + type;
    }

    function throwOutOfRangeError() {
        throw new Error('Out-of-range date passed to ' + method());
    }

    // Removing min / max.
    if (date == null) {
        /*
          Scenarios:
            * minDate
              * 1st && 1st selected
              * 2nd && 1st selected
            * maxDate
              * 2nd && 2nd selected
              * 1st && 2nd selected
        */

        // When removing a date, always remove the original min/max date.
        instance[origProp()] = undefined;

        // DateRange processing!
        if (sibling) {
            sibling[origProp()] = undefined; // Remove the original min/max date.

            // Removing the min.
            if (isMin) {
                if ((first && !dateSelected) || (!first && !sibling.dateSelected)) {
                    instance.minDate = undefined;
                    sibling.minDate = undefined;
                }

                // Removing the max.
            } else if ((first && !sibling.dateSelected) || (!first && !dateSelected)) {
                instance.maxDate = undefined;
                sibling.maxDate = undefined;
            }

            // Regular instances.
        } else {
            instance[prop()] = undefined;
        }

        // Throw an error for invalid dates.
    } else if (!dateCheck(date)) {
        throw new Error('Invalid date passed to ' + method());

        // Setting min / max.
    } else if (sibling) {
        /*
          Acceptable ranges for setting minDate or maxDate:
            * DateRange
              * minDate
                * -∞ -> (dateSelected || maxDate)
              * maxDate
                * (dateSelected || minDate) -> ∞
            * Regular
              * minDate
                * -∞ -> (dateSeleted || maxDate)
              * maxDate
                * (dateSelected || minDate) -> ∞
        */

        // Check for dates out of range for dateRange pairs.
        if (
            // 1st instance checks.
            (first && isMin && newDate > (dateSelected || maxDate)) || // setMin
            (first && !isMin && newDate < (sibling.dateSelected || minDate)) || // setMax

            // 2nd instance checks.
            (!first && isMin && newDate > (sibling.dateSelected || maxDate)) || // setMin
            (!first && !isMin && newDate < (dateSelected || minDate)) // setMax
        ) throwOutOfRangeError();

        instance[origProp()] = newDate;
        sibling[origProp()] = newDate;

        if (
            //setMin
            (isMin && ((first && !dateSelected) || (!first && !sibling.dateSelected))) ||

            //setMax
            (!isMin && ((first && !sibling.dateSelected) || (!first && !dateSelected)))
        ) {
            instance[prop()] = newDate;
            sibling[prop()] = newDate;
        }

        // Individual instance.
    } else {
        // Check for dates our of range for single instances.
        if (
            (isMin && newDate > (dateSelected || maxDate)) || // minDate
            (!isMin && newDate < (dateSelected || minDate)) // maxDate
        ) throwOutOfRangeError();

        instance[prop()] = newDate;
    }

    if (sibling) renderCalendar(sibling);
    renderCalendar(instance);

    return instance;
}

/**
 *
 *  Returns an object with start & end date selections.
 *  Available onCal dateRange pairs only.
 */
function getRange() {
    const first = this.first ? this : this.sibling;
    const second = first.sibling;

    return {
        start: first.dateSelected,
        end: second.dateSelected
    };
}

/*
 *  Removes the current instance from the array of instances.
 *  Removes the instance calendar from the DOM.
 *  Removes the event listeners if this is the last instance.
 */
function remove() {
    const sibling = this.sibling;
    const _this = this;

    // Remove this instance from the list.
    instanceList = instanceList.filter(instance => instance !== _this);

    // Remove siblings references.
    if (sibling) delete sibling.sibling;

    // If this was the last datepicker in the list, remove the event handlers.
    if (instanceList.length === 0) removeEvents(document, oneHandler);

    // Empty this instance of all properties.
    for (const prop in this) delete this[prop];

    // If this was the last datepicker in the list, remove the event handlers.
    if (instanceList.length === 0) {
        events.forEach(event => document.removeEventListener(event, oneHandler));
        calendarContainer.remove();
    }
}

/*
 *  Navigates the calendar to a given year and month
 *  (parsed from the supplied date) without affecting any selections.
 */
function navigate(dateOrNum, triggerCb) {
    const date = new Date(dateOrNum);
    if (!dateCheck(date)) throw new Error('Invalid date passed to `navigate`');

    this.currentYear = date.getFullYear();
    this.currentMonth = date.getMonth();
    renderCalendar(this);

    if (triggerCb) {
        this.onMonthChange(this);
    }
}

/*
 *  Programmatically toggles the overlay.
 *  Only works when the calendar is open.
 */
function instanceToggleOverlay() {
    const calendarIsShowing = !this.calendarContainer.classList.contains('qs-hidden');
    const overlayIsShowing = !this.calendarContainer.querySelector('.qs-overlay').classList.contains('qs-hidden');

    calendarIsShowing && toggleOverlay(overlayIsShowing, this);
}

function isShow() {
    return !calendarContainer.classList.contains('qs-hidden');
}

export default datepicker;