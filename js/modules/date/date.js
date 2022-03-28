import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "events-polyfill";
import _datepicker from "./datepicker";

dayjs.extend(customParseFormat);

export class DateUtil {
  #date;

  //https://day.js.org/docs/en/parse/string-format
  constructor(date = new Date(), formatString = undefined) {
    if (date instanceof Date) {
      this.#date = dayjs(date);
    } else if (typeof date === "string") {
      this.#date = dayjs(date, formatString);
    } else if (date instanceof DateUtil) {
      this.#date = dayjs(date.toDate());
    } else if (Number.isInteger(date)) {
      this.#date = dayjs(date);
    } else {
      throw "not supported " + Object.prototype.toString.call(date);
    }

    if (this.#date.isValid() === false) {
      throw "Invalid Date";
    }
  }

  /**
   * 현재 달의 1일
   * @param formatString
   * @return {string}
   */
  firstDayOfMonth(formatString = "YYYY-MM-DD") {
    return this.#date.startOf("month").format(formatString);
  }

  /**
   * 현재 달의 마지막일
   * @param formatString
   * @return {string}
   */
  lastDayOfMonth(formatString = "YYYY-MM-DD") {
    return this.#date.endOf("month").format(formatString);
  }

  /**
   * https://day.js.org/docs/en/manipulate/add
   * @param {string} unit  y=year, M=month, d=day, h=hour, m=minute, s=second
   * @param {number} value 증감할 숫자
   * @return {DateUtil}
   */
  update(unit, value) {
    return new DateUtil(this.#date.add(value, unit).toDate());
  }

  //https://day.js.org/docs/en/display/format
  format(formatString) {
    return this.#date.format(formatString);
  }

  toDate() {
    return this.#date.toDate();
  }

  toString() {
    return this.#date.format("YYYY-MM-DD HH:mm:ss");
  }
}

/**
 * 현재 날짜 포맷 형식으로 리턴
 * @param formatString
 * @return {string}
 */
export function now(formatString = "YYYY-MM-DD") {
  return dayjs().format(formatString);
}

/**
 * https://day.js.org/docs/en/display/format
 * 해당 날짜 형식으로 리턴
 * @param date
 * @param formatString
 * @return {string}
 */
export function dateFormatter(date, formatString = "YYYY-MM-DD") {
  return dayjs(date).format(formatString);
}

/**
 * @param {string || Date} date
 * @param formatString
 * @return {Date}
 */
export function parseDate(date, formatString = undefined) {
  return new DateUtil(date, formatString).toDate();
}

/**
 * https://www.npmjs.com/package/js-datepicker
 * @param {string || Node} selector  ex) '.my-class', '#my-id' || document.querySelector('#my-id')
 * @param initialDate 초기 날짜
 * @param minDate 최소 날짜
 * @param maxDate 최대 날짜
 * @param pairId 시작 달력과 끝 달력을 연결할 아이디
 * @param formatString 날짜 형식
 * @param enableDeselect 날짜 취소 가능 여부
 * 페어인 경우 min은 첫번째, max는 두번째 객체의 옵션 적용
 */
export function datePicker({
  selector,
  initialDate = undefined,
  minDate = dayjs().add(-2, "year").toDate(),
  maxDate = new Date(),
  pairId = null,
  formatString = "YYYY-MM-DD",
  enableDeselect = false,
}) {
  const options = {
    showAllDates: true,
    enableDeselect: enableDeselect,

    //선택했을때 날자형식
    formatter: (input, date) => (input.value = dateFormatter(date, formatString)),

    //초기 날짜
    dateSelected: initialDate ? parseDate(initialDate) : undefined,
    //최소 날짜
    minDate: parseDate(minDate),
    //최대 날짜
    maxDate: parseDate(maxDate),
  };
  if (options.dateSelected && options.minDate > options.dateSelected) options.dateSelected = options.minDate;
  if (options.dateSelected && options.maxDate < options.dateSelected) options.dateSelected = options.maxDate;

  if (pairId != null) options["id"] = pairId;

  const datepicker = _datepicker(selector, options);
  pickerAddEvent(datepicker);

  return datepicker;
}

function pickerAddEvent(picker) {
  const el = picker.el;
  el.addEventListener("initDate", () => picker.setDate(options.dateSelected));
  el.addEventListener("updateDate", () => {
    try {
      picker.setDate(parseDate(el.value));
    } catch {
      picker.setDate(options.dateSelected);
    }
  });
}

export function monthPicker({
  selector,
  initialDate = new Date(),
  minDate = dayjs().add(-2, "year").toDate(),
  maxDate = new Date(),
  pairId = null,
  formatString = "YYYY-MM",
  onMonthChange,
}) {
  const toYearMonth = (date) => new Date(date.getFullYear(), date.getMonth());
  initialDate = toYearMonth(parseDate(initialDate));
  minDate = toYearMonth(parseDate(minDate));
  maxDate = toYearMonth(parseDate(maxDate));

  if (minDate > initialDate) initialDate = minDate;
  if (maxDate < initialDate) initialDate = maxDate;

  const options = {
    defaultView: "overlay",

    //선택했을때 날자형식
    formatter: (input, date) => (input.value = dateFormatter(date, formatString)),

    //초기 날짜
    dateSelected: initialDate,
    //최소 날짜
    minDate: minDate,
    //최대 날짜
    maxDate: maxDate,

    isMonthPicker: true,

    onMonthChange: onMonthChange,
  };

  if (pairId != null) options["id"] = pairId;

  const datepicker = _datepicker(selector, options);
  pickerAddEvent(datepicker);

  return datepicker;
}
