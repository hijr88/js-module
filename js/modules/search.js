/**
 * 검색폼 관리
 * @param {HTMLFormElement} form 필드가 모두 포함된 form
 */
export default function search(form) {
  const dateNames = ["date", "beginDate", "startDate", "endDate"];
  let cachedData = null;

  //필드 수집
  const f = Array.from(form.querySelectorAll("[name]")).reduce((map, el) => {
    const name = el.name;
    if (el.type === "radio") {
      Array.isArray(map.get(name)) ? map.get(name).push(el) : map.set(name, [el]);
    } else {
      if (map.has(name)) throw `name=${name} duplicate`;
      map.set(name, el);
    }
    return map;
  }, new Map());

  /** 검색창 초기화 */
  function initValue() {
    for (const [name, element] of f) {
      if (Array.isArray(element)) {
        element[0].checked = true;
      } else if (dateNames.includes(name)) {
        element.dispatchEvent(new Event("initDate"));
      } else {
        element.value = "";
        if (element.nodeName === "SELECT") {
          validSelect(element);
        }
      }
    }
    cachedData = null;
  }

  /**
   * name에 해당하는 값 리턴
   * @param {string} name 필드 name
   * @return {HTMLElement || Array[HTMLElement]} 엘리먼트, 라디오는 배열
   */
  function getField(name) {
    return f.get(name);
  }

  /**
   * 속성 값을 키로 실제 값을 Object 담아 리턴
   * @param create {boolean} true 새로운값 리턴, false 기존값 리턴
   * @returns {Object}
   */
  function getData(create = false) {
    if (create === false && cachedData) {
      return { ...cachedData };
    }

    const newData = {};
    for (const [name, element] of f) {
      if (Array.isArray(element)) {
        const checkedRadio = element.find((input) => input.checked);
        newData[name] = checkedRadio.value.trim();
      } else {
        //data-name 존재하는 경우 select의 값은 value가 아닌 data-name에 담긴 키로 조회
        if (element.nodeName === "SELECT" && element.getAttribute("data-name") != null) {
          const key = element.getAttribute("data-name");
          newData[name] = element.querySelector("option:checked").getAttribute(key);
        } else {
          newData[name] = element.value.trim();
        }
      }
    }
    cachedData = Object.assign({}, newData);
    return newData;
  }

  /**
   * 검색창 데이터 채우기
   * @param obj
   */
  function setData(obj) {
    for (const [name, element] of f) {
      if (obj.hasOwnProperty(name) === false) continue;

      if (Array.isArray(element)) {
        element.find((radio) => radio.value === obj[name]).checked = true;
      } else {
        if (element.nodeName === "SELECT" && element.getAttribute("data-name") != null) {
          const key = element.getAttribute("data-name");
          const option = element.querySelector(`option[${key}="${obj[name]}"]`);
          if (option) option.selected = true;
        } else {
          element.value = obj[name];

          //date 세팅
          if (dateNames.includes(name)) {
            element.dispatchEvent(new Event("updateDate"));
          }
        }

        if (element.nodeName === "SELECT") {
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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });

  form.addEventListener("reset", (e) => {
    e.preventDefault();
    initValue();
  });

  return {
    init: initValue,
    get: getField,
    data: getData,
    setData: setData,
    form: form,
  };
}
