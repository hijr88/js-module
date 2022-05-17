import { isEmpty } from "./validator";

/**
 * 검색폼 관리
 * 검색값에 포함 되려면 name 속성이 반드시 있어야 함.
 */
export default function search(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw "Only HTMLFormElement allow";
  }

  const dateNames = ["date", "beginDate", "startDate", "endDate"];
  let cachedData = null;

  //필드 수집
  const f = Array.from(form.querySelectorAll("input[name], select[name]")).reduce((map, el) => {
    const name = el.name;
    if (el.type === "radio") {
      Array.isArray(map.get(name)) ? map.get(name).push(el) : map.set(name, [el]);
    } else {
      if (map.has(name)) throw `name=${name} duplicate`;
      map.set(name, el);
    }
    return map;
  }, new Map());

  //검색창 초기화
  function reset() {
    form.reset();
    cachedData = null;
  }

  /**
   * name에 해당하는 element 리턴
   * @param {string} name 필드 name
   * @return {HTMLElement || Array[HTMLElement] || null} 엘리먼트, 라디오는 배열
   */
  function getField(name) {
    return f.get(name);
  }

  function getValue(name) {
    const element = getField(name);

    if (Array.isArray(element)) {
      const checkedRadio = element.find((input) => input.checked);
      return checkedRadio ? checkedRadio.value.trim() : "";
    } else if (element.type === "checkbox") {
      return element.checked ? element.value.trim() : "";
    } else {
      return element.value.trim();
    }
  }

  /**
   * {name:value} 리턴
   * @param useCache {boolean} true 최근값 리턴, false 새로운값 리턴
   * @returns {Object}
   */
  function getData(useCache = false) {
    if (useCache && cachedData) {
      return { ...cachedData };
    }

    const newData = {};
    for (const name of f.keys()) {
      newData[name] = getValue(name);
    }
    cachedData = Object.assign({}, newData);
    return newData;
  }

  function setValue(name, value) {
    const element = getField(name);

    if (Array.isArray(element)) {
      const radio = element.find((radio) => radio.value === value);
      if (radio != null) radio.checked = true;
    } else if (element.type === "checkbox") {
      element.checked = element.value === value;
    } else {
      element.value = value;

      //date 세팅
      if (dateNames.includes(name)) {
        element.dispatchEvent(new Event("updateDate"));
      }

      if (element.nodeName === "SELECT" && element.selectedIndex === -1) {
        element.selectedIndex = 0;
      }
    }
  }

  //검색창 데이터 채우기
  function setData(obj) {
    if (isEmpty(obj)) {
      reset();
      return;
    }
    for (const name of f.keys()) {
      if (obj.hasOwnProperty(name) === false) continue;

      setValue(name, obj[name]);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });

  form.addEventListener("reset", reset);

  return { form: form, reset: reset, getField: getField, getValue: getValue, setValue: setValue, getData: getData, setData: setData };
}
