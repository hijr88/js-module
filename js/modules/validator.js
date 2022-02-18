//공통적으로 사용될만한 유효성 모음

/**
 * 휴대폰 번호 유효성 검사
 * @param {string} phoneNumber 번호
 * (-)없이 번호로만 이루어진 상태로 받아서 10~11자만 통과하도록 한다.
 * @return {boolean}
 */
export function validPhoneNumber(phoneNumber) {
    return /^[0-9]{10,11}$/.test(phoneNumber);
}

/**
 * @param {Object} value
 * @return {boolean}
 */
function isPrimitive(value) {
    return value !== Object(value);
}

/**
 * @param {Object} obj
 * @return {boolean}
 */
export function isObjectLiteral(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * 문자열, [], {} 전부 확인
 * @param {string || Array || Object} obj
 * @return {boolean}
 */
export function isEmpty(obj) {
    if (obj == null) {
        return true;
    } else if (isPrimitive(obj)) {
        return String(obj) === '';
    } else if (Array.isArray(obj)) {
        return obj.length === 0;
    } else if (isObjectLiteral(obj)) {
        if (Object.keys(obj).length === 0) return true;
        return Object.keys(obj).every(k => isEmpty(obj[k]));
    }
    console.error('not supported type');
    return true;
}

/**
 * @param {KeyboardEvent} e
 * @return {boolean}
 */
export function isEnter(e) {
    return e.key === 'Enter';
}

/**
 * 테이블의 tr 클릭 전에 유효성 검사<br>
 * 체크박스이거나, 체크박스가 포함된 영역이거나, tbody => false
 * @param {Event} e
 * @return {boolean}
 */
export function isValidTr(e) {
    if (e.target.tagName === 'TBODY') return false;
    if (e.target.tagName === 'TR') return true;

    const td = e.target.closest('td');
    if (td.querySelector('input[type=checkbox]')) {
        e.stopPropagation();
        return false;
    }
    return true;
}

/**
 * 1. 문자열도 숫자로 인식하도록 하고
 * 2. 숫자가 아닌 값은 거르기
 * @param n
 * @return {boolean}
 */
export function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * 정수 체크
 */
export function isInteger(n) {
    return isNumber(n) && Number.isInteger(Number(n));
}