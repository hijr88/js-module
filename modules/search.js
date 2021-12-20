/**
 * 검색기능 함수
 * 매번 검색 화면 만들때마다 비슷한거 만들기 귀찮아서 만듬.
 * @param {HTMLElement} searchArea 검색 필드가 모두 포함된 부모 엘리먼트
 * @param {string}  attrName   필드에 포함 될 데이터 속성 키, 기본값 data-name
 */
export default function search(searchArea, attrName = 'data-name') {

    const f = Array.from(searchArea.querySelectorAll('[data-name]')).reduce((obj, el)=>{
        const name = el.getAttribute(attrName);
        if (el.type === 'radio') {
            if (Array.isArray(obj[name])) {
                obj[name].push(el);
            } else {
                obj[name] = [el];
            }
        } else {
            if (obj.hasOwnProperty(name)) throw `${attrName}=${name} duplicate`;
            obj[name] = el;
        }
        return obj;
    },{});
    const dateNames = ['date', 'beginDate', 'startDate', 'endDate'];
    let cashedData = null;

    /** 검색창 초기화 */
    function initValue() {
        for (const [name, element] of Object.entries(f)) {
            if (Array.isArray(element)) {
                element[0].checked = true;
            } else if (dateNames.includes(name)) {
                element.dispatchEvent(new Event('initDate'));
            } else {
                element.value = '';
                if (element.tagName === 'SELECT') {
                    validSelect(element);
                }
            }
        }
        cashedData = null;
    }

    /**
     * name에 해당하는 값 리턴
     * @param {string} name 필드 name
     * @return {HTMLElement || Array[HTMLElement]} 엘리먼트, 라디오는 배열
     */
    function getField(name) {
        return f[name];
    }

    /**
     * 검색 필드중 tagName과 같은 엘리먼트 리턴
     * 대소문자 구별 안함
     * @param {string} tagName 태그 이름
     * @param {string} typeName  타입
     * @return {Array}
     */
    function getTags(tagName, typeName = undefined) {
        let tags = [];
        tagName = tagName.toUpperCase();
        typeName = typeName?.toUpperCase();

        for (const element of Object.values(f)) {
            if (Array.isArray(element) && tagName === 'INPUT') {
                if (typeName) {
                    if (typeName === 'RADIO') {
                        tags = [...tags, ...element];
                    }
                } else {
                    tags = [...tags, ...element];
                }
            } else {
                if (element.tagName === tagName) {
                    if (typeName) {
                        if (typeName === element.type.toUpperCase()) {
                            tags.push(element);
                        }
                    } else {
                        tags.push(element);
                    }
                }
            }
        }
        return tags;
    }

    /**
     * attrName 값을 키로 실제 값을 Object 담아 리턴
     * @param create {boolean} true 새로운값 리턴, false 기존값 리턴
     * @returns {Object}
     */
    function getData(create = false) {
        if (create === false && cashedData) {
            return Object.assign({},cashedData);
        }

        const newData = {};
        for (const [name,element] of Object.entries(f)) {
            if (Array.isArray(element)) {
                const checkedRadio = element.find(input => input.checked);
                newData[name] = checkedRadio.value.trim();
            } else {
                //data-value가 존재하는 경우 select의 값은 value가 아닌 data-value에 담긴 키로 조회
                if (element.tagName === 'SELECT' && element.getAttribute('data-value') != null) {
                    const key = element.getAttribute('data-value');
                    newData[name] = element.querySelector('option:checked').getAttribute(key);
                } else {
                    newData[name] = element.value.trim();
                }
            }
        }
        cashedData = Object.assign({}, newData);
        return newData;
    }

    /**
     * 검색창 데이터 채우기
     * @param obj
     */
    function setData(obj) {
        for (const [name, element] of Object.entries(f)) {
            if (obj.hasOwnProperty(name) === false) continue;

            if (Array.isArray(element)) {
                for (const radio of element) {
                    if (radio.value === obj[name]) {
                        radio.checked = true;
                        break;
                    }
                }
            } else {
                if (element.tagName === 'SELECT' && element.getAttribute('data-value') != null) {
                    const key = element.getAttribute('data-value');
                    const option = element.querySelector(`option[${key}="${obj[name]}"]`);
                    if (option) option.selected = true;
                } else {
                    element.value = obj[name];

                    //date 세팅
                    if (dateNames.includes(name)) {
                        element.dispatchEvent(new Event('updateDate'));
                    }
                }

                if (element.tagName === 'SELECT') {
                    validSelect(element);
                }
            }
        }
    }

    //select 값이 존재하지 않은경우 첫번째 값으로
    function validSelect(select) {
        if (select.selectedIndex === -1) {
            select.selectedIndex = 0;
        }
    }

    return {
        init: initValue,
        get: getField,
        getTags: getTags,
        data: getData,
        setData: setData,
    }
}