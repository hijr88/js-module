//공통적으로 사용될만한 함수 모음
import {isEmpty, isEnter, isNumber} from "./validator";

/** 인자가 문자열인 경우 엘리먼트로 리턴 */
export function parseElement(selectorOrElement) {
    let el = selectorOrElement
    if (el instanceof HTMLElement) return el

    if (typeof el === 'string') {
        el = document.querySelector(el)
        if (!el) throw new Error('not found element.')
        return el
    }

    throw new Error('parameter only access string or HTMLElement.')
}

/**
 * 부모 element 를 찾아서 리턴
 * @param {HTMLElement || String} target         시작 el 위치
 * @param {string}  parentElName   찾을 부모 element 이름
 */
export function findParentElement(target, parentElName) {
    if (target.nodeType !== 1) {
        console.error('only element allowed');
        return;
    }

    parentElName = parentElName.toUpperCase(); //tagName은 대문자

    for (let el = target; el !== null; el=el.parentElement) {
        if (el.tagName !== parentElName) continue;
        return el;
    }
    console.error(parentElName + '을 찾지 못하였습니다.');
}

/**
 * 입력값이 null 일경우 기본값 또는 입력한 대체 값으로 리턴
 * @param value  입력값
 * @param defaultValue 대체될 값
 */
export function nvl(value, defaultValue = '') {
    if (value == null || value === 'null') {
        return defaultValue;
    }
    return value;
}

/**
 * 팝업창 가운데에서 열기
 * @param {HTMLElement || String} element
 * @param showDark 어두운 배경 키기
 */
export function openPopup(element, showDark = true) {
    //#layerMask {z-index:300; display:none; position:fixed; top: 0; width:100%; height:100%; background-color: rgba(0,0,0,0.7);}
    element = parseElement(element);
    if (showDark) document.querySelector('#layerMask').style.display = 'block';

    element.style.position = 'fixed';
    element.style.display = 'block';
    element.style.marginTop = `-${element.offsetHeight/2}px`;
    element.style.marginLeft = `-${element.offsetWidth/2}px`;
    element.style.top = '50%';
    element.style.left = '50%';
    element.style.zIndex = '999';
}

/**
 * 팝업창 닫기
 * @param {HTMLElement || String} element
 * @param hideDark 어두운 배경 끄기
 */
export function closePopup(element, hideDark = true) {
    element = parseElement(element);
    if (hideDark) document.querySelector('#layerMask').style.display = 'none';
    element.style.display = 'none';
}

/**
 * 입력키가 엔터인 경우 전달 받은 함수 실행
 * @param {Event | KeyboardEvent} e
 * @param {function || function[]} func
 */
export function isEnterExec(e, ...func) {
    if (isEnter(e)) {
        func.forEach(f => f());
        e.target.blur();
    }
}

/**
 * Object 순회 하면서 빈값은 제거
 * @param {Object} obj
 * @return {Object}
 */
function removeEmptyObject(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([,v]) => isEmpty(v) === false));
}

/**
 * url 파라미터 오브젝트로 변환해서 리턴
 * @return {Object}
 */
export function getUrlParams(useSession = false) {
    const urlSearchParams = (()=> {
        if (useSession === false) {
            return new URLSearchParams(window.location.search)
        }
        else {
            return new URLSearchParams(sessionStorage.getItem('queryString'));
        }
    })();
    return Object.fromEntries(urlSearchParams.entries());
}

/**
 * 해당 url로 이동
 * 데이터 넣으면 querystring    채워서 이동
 * 세션 이용하면 sessionStorage 채워서 이동
 * @param {string} url
 * @param {Object} data
 * @param useSession
 */
export function pageRedirect(url, data = undefined, useSession = false) {
    if (data) {
        const obj = removeEmptyObject(data);
        const queryString = new URLSearchParams(obj).toString();
        if (useSession) {
            sessionStorage.setItem('queryString', queryString);
            location.href = url;
        } else {
            location.href = `${url}?${queryString}`;
        }
    } else {
        location.href = url;
    }
}

/**
 * url 파라미터 제거
 */
export function initUrlQueryString() {
    history.replaceState('','', location.pathname);
}

/**
 * for IE
 * disabled 상태 일때 event 발동이 안됨
 * 이를 위해 disabled 제거하고 이벤트 발생 시키고 다시 disabled 상태로
 * @param {HTMLElement || String} element
 * @param {Event} event
 */
export function dispatchEvent(element, event) {
    element = parseElement(element);
    if (element["disabled"] === true) {
        element["disabled"] = false;
        element.dispatchEvent(event);
        element["disabled"] = true;
    } else {
        element.dispatchEvent(event);
    }
}

/**
 * 숫자 콤마 찍기
 * @param num
 * @param {number} maximumFractionDigits 사용할 최대 소수점 자릿수
 * @return {string}      자리수마다 콤마가 찍힌 문자열
 */
export function comma(num, maximumFractionDigits = 0) {
    if (isNumber(num) === false) return num;

    return Number(num).toLocaleString('ko-KR', {maximumFractionDigits: maximumFractionDigits});
}

/**
 * 문자열의 바이트 크기를 리턴
 * @param   {string} s 문자열
 * @returns {number} 바이트
 */
export function getByteLength(s) {
    let b,i,c;// byte, index, character
    for (b = i = 0; i<s.length; i++) {
        c = s.charCodeAt(i)
        b += c >> 11 ? 3 : c >> 7 ? 2 : 1; //2048로나눴을때 몫이 있으면 3바이트 다시 128이랑비교해서 몫이 있으면 2바이트 없으면1바이트
    }
    return b;
}

/**
 * byte 용량을 환산하여 반환
 * 용량의 크기에 따라 GB, MB, KB, B 단위로 환산
 * @param {number} fileSize  byte
 * @param {number} maximumFractionDigits 사용할 최대 소수 자릿수
 * @returns {String}
 */
export function toByte(fileSize, maximumFractionDigits = 0) {
    const KB = 1024;
    const MB = KB * KB;
    const GB = MB * KB;
    let str;

    //GB 단위 이상일때 GB 단위로 환산
    if (fileSize >= GB) {
        fileSize = fileSize / (GB);
        str = comma(fileSize, maximumFractionDigits) + ' GB';
    }
    //MB 단위 이상일때 MB 단위로 환산
    else if (fileSize >= MB) {
        fileSize = fileSize / (MB);
        str = comma(fileSize, maximumFractionDigits) + ' MB';
    }
    //KB 단위 이상일때 KB 단위로 환산
    else if (fileSize >= KB) {
        fileSize = fileSize / KB;
        str = comma(fileSize, maximumFractionDigits) + ' KB';
    }
    //KB 단위보다 작을때 B 단위로 환산
    else {
        str = comma(fileSize) + ' B';
    }
    return str;
}