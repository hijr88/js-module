import dayjs from "dayjs";
import customParseFormat  from 'dayjs/plugin/customParseFormat'
import 'events-polyfill'
import _datepicker from "./datepicker";
dayjs.extend(customParseFormat);

export class CustomDate {
    #date;
    //https://day.js.org/docs/en/parse/string-format
    constructor(date, formatString) {
        this.#date = dayjs(date ?? new Date(), formatString ?? undefined);
    }

    /**
     * 현재 달의 1일
     * @param formatString
     * @return {string}
     */
    firstDayOfMonth(formatString = 'YYYY-MM-DD') {
        return this.#date.date(1).format(formatString);
    }

    /**
     * https://day.js.org/docs/en/manipulate/add
     * @param {string} unit ex) y, M, d, h, m, s
     * @param {number} value 증감할 숫자
     * @return {CustomDate}
     */
    update(unit, value) {
        return new CustomDate(dayjs(this.#date).add(value, unit).toDate());
    }

    //https://day.js.org/docs/en/display/format
    format(formatString) {
        return this.#date.format(formatString);
    }

    toDate() {
        return this.#date.toDate();
    }

    toString() {
        return this.#date.format('YYYY-MM-DD HH:mm:ss');
    }
}

/**
 * 현재 날짜 포맷 형식으로 리턴
 * @param formatString
 * @return {string}
 */
export function now(formatString = 'YYYY-MM-DD') {
    return dayjs().format(formatString);
}

/**
 * https://day.js.org/docs/en/display/format
 * 해당 날짜 형식으로 리턴
 * @param date
 * @param formatString
 * @return {string}
 */
export function dateFormatter(date, formatString = 'YYYY-MM-DD') {
    return dayjs(date).format(formatString);
}

/**
 * @param {string || Date} date
 * @param formatString
 * @return {Date}
 */
export function parseDate(date, formatString = undefined) {
    return dayjs(date ?? new Date(), formatString ?? undefined).toDate();
}


/**
 * https://www.npmjs.com/package/js-datepicker
 * @param {string || Node} selector  ex) '.my-class', '#my-id' || document.querySelector('#my-id')
 * @param initialDate 초기 날짜
 * @param minDate 최소 날짜
 * @param maxDate 최대 날짜
 * @param pairId 시작 달력과 끝 달력을 연결할 아이디
 * @param formatString 날짜 형식
 * 페어인 경우 min, max는 첫번째 객체의 옵션 적용
 */
export function datePicker({
                               selector,
                               initialDate = new Date(),
                               minDate = dayjs().add(-2, 'year').toDate(),
                               maxDate = new Date(),
                               pairId = null,
                               formatString = 'YYYY-MM-DD'
                           })
{
    const options = {
        customMonths: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
        customDays: ['일', '월', '화', '수', '목', '금', '토'],
        overlayPlaceholder: '연도(YYYY)',
        overlayButton: "확인",
        showAllDates: true,
        enableDeselect: false,

        //선택했을때 날자형식
        formatter: (input, date) => input.value = dateFormatter(date, formatString),

        //초기 날짜
        dateSelected: parseDate(initialDate),
        //최소 날짜
        minDate: parseDate(minDate),
        //최대 날짜
        maxDate: parseDate(maxDate),
    };

    if (pairId != null) options["id"] = pairId;

    const datepicker = _datepicker(selector, options);

    const el = datepicker.el;
    el.addEventListener('initDate', ()=> datepicker.setDate(initialDate));
    el.addEventListener('updateDate', ()=> {
        try {
            datepicker.setDate(parseDate(el.value));
        } catch {
            datepicker.setDate(initialDate);
        }
    });

    return datepicker;
}

export function monthPicker({
                               selector,
                               initialDate = new Date(),
                               minDate = dayjs().add(-2, 'year').toDate(),
                               maxDate = new Date(),
                               pairId = null,
                               formatString = 'YYYY-MM'
                           })
{
    const toYearMonth = (date) => new Date(date.getFullYear(), date.getMonth());
    initialDate = toYearMonth(parseDate(initialDate))
    minDate = toYearMonth(parseDate(minDate))
    maxDate = toYearMonth(parseDate(maxDate))

    const options = {
        customMonths: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
        overlayPlaceholder: '연도(YYYY)',
        overlayButton: "확인",
        defaultView: "overlay",

        //선택했을때 날자형식
        formatter: (input, date) => input.value = dateFormatter(date, formatString),

        //초기 날짜
        dateSelected: initialDate,
        //최소 날짜
        minDate: minDate,
        //최대 날짜
        maxDate: maxDate,

        isMonthPicker: true,
    };

    if (pairId != null) options["id"] = pairId;

    const datepicker = _datepicker(selector, options);

    const el = datepicker.el;
    el.addEventListener('initDate', ()=> datepicker.setDate(initialDate));
    el.addEventListener('updateDate', ()=> {
        try {
            datepicker.setDate(parseDate(el.value));
        } catch {
            datepicker.setDate(initialDate);
        }
    });

    return datepicker;
}