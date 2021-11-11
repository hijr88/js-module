//공통적으로 사용될만한 이벤트 모음

/**
 * 입력창(input) 숫자만 허용하기
 * @param {HTMLInputElement} input 이벤트 추가할 input
 */
export function inputOnlyNumber(input) {
    function removeNotNumber(str) {
        if (!Number.isInteger(str)) {
            str = str.replace( /[^0-9]/g, '')
        }
        return str;
    }
    function addEvent(e) {
        if (e.type === 'keydown') {
            const key = e.key;
            if (e.ctrlKey && key === 'v') return;

            const allowKey = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', 'Home', 'End', 'Tab']);
            const num = Number.parseInt(key);

            if (! (Number.isInteger(num) || allowKey.has(key))) {
                e.preventDefault();
            }
        } else if (e.type === 'paste') {
            this.value += removeNotNumber(e.clipboardData.getData('Text'));
            e.preventDefault();
        } else if (e.type === 'keyup') {
            this.value = removeNotNumber(this.value);
        }
    }

    ['paste', 'keydown', 'keyup'].forEach(event => input.addEventListener(event, addEvent));
}

/**
 * allCheckBox 변하면 area에 있는 모든 checkBox도 같이 변하기
 * @param {HTMLInputElement & checkbox} allCheckBox 이벤트 추가할 checkBox
 * @param area 변할 체크박스가 포함된 영역
 */
export function changeAllCheckBox(allCheckBox, area) {
    if (allCheckBox.tagName !== 'INPUT' || allCheckBox.type !== 'checkbox') return;
    allCheckBox.addEventListener('change', function (e){
        const checkBox = e.target;
        area.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = checkBox.checked);
    });

    area.addEventListener('change', function (e) {
        const checkBox = e.target;
        if (checkBox.tagName !== 'INPUT' || checkBox.type !== 'checkbox') return;

        allCheckBox.checked = checkBox.checked && Array.from(area.querySelectorAll('input[type=checkbox]') ).every(cb => cb.checked);
    })
}

/**
 * 폼 서브밋 방지
 * @param {HTMLFormElement} form
 */
export function preventSubmitForm(form) {
    form.addEventListener('submit', function (e){
        e.preventDefault();
    })
}

/**
 * 입력 못하게 막기
 * @param {HTMLInputElement} input 입력할 수 있는 엘리먼트 ex) input, textArea
 */
export function preventInput(input) {
    function focus(e) {
        e.target.blur();
    }
    function paste(e) {
        e.preventDefault();
    }
    input.addEventListener('focus', focus);
    input.addEventListener('paste', paste);
}

/**
 * 입력한 글자수만큼 (? / max) 숫자 변화 이벤트
 * .checkLength가 붙은 element에 전부 이벤트 부여
 */
export function fixedCheckLength(parentElement) {
    parentElement.querySelectorAll('.checkLength').forEach(input => {
        const maxLength = input.maxLength;
        const span = input.parentElement.querySelector('span.length');

        input.addEventListener('input', function (e){
            if (maxLength && this.value.length > maxLength) {
                this.value = this.value.substring(0, maxLength);
            }
            if (span == null) return;
            span.textContent = this.value.length;
        })
    });

    //nextElementSibling
    /*
    <div style="display: inline-block">
        <span> 0</span><span> /max</span>
    </div>
    */
}

/**
 * 입력한 글자수만큼 (? / max) 숫자 변화 이벤트
 * 부모 element에 부여하여 공통 처리
 */
export function flexibleCheckLength(parentElement) {
    parentElement.addEventListener('input', function (e){
        e.preventDefault();

        const target = e.target;
        if (!target.classList.contains('checkLength')) return;
        const maxLength = target.maxLength;
        const span = target.parentElement.querySelector('span.length');

        if (maxLength && target.value.length > maxLength) {
            target.value = target.value.substring(0, maxLength);
        }
        if (span == null) return;
        span.textContent = target.value.length;
    })
}