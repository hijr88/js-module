//공통적으로 사용될만한 이벤트 모음
import { isNumber } from "@modules/validator";

/**
 * 입력창(input) 숫자만 허용하기
 * @param {HTMLInputElement} input 이벤트 추가할 input
 * @param allowPoint 소수점 허용
 */
export function inputOnlyNumber(input, allowPoint = false) {
  const allowKey = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Backspace",
    "Delete",
    "Home",
    "End",
    "Tab",
    "paste",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ".",
    "-",
  ]);

  function onInput(e) {
    const target = e.target;
    const value = target.value;
    const selectionStart = target.selectionStart;
    const data = e.data;

    const min = isNumber(e.target.min) ? Number(e.target.min) : null;
    const max = isNumber(e.target.max) ? Number(e.target.max) : null;

    if ([""].includes(value)) {
      //값이 없으면 0 또는 min
      target.value = min <= 0 && 0 <= max ? "0" : min;
    } else if (["-", "-0", "0-"].includes(value)) {
      if (min >= 0) {
        target.value = "0";
      } else {
        target.value = "-";
      }
    } else if (["00"].includes(value)) {
      target.value = "0";
    } else if (isNumber(value)) {
      //숫자인 경우
      //유효성 체크
      if (max != null && Number(value) > max) {
        target.value = max;
        return;
      } else if (min != null && Number(value) < min) {
        target.value = min;
        return;
      }

      const v = value.replace(/^(-?)0+/, "$1");
      if (allowPoint === false) {
        target.value = Number(v).toFixed(0);
      } else {
        target.value = v;
      }
      target.setSelectionRange(selectionStart, selectionStart);
    } else {
      //숫자가 아닌경우
      //(한글, 이모지, 복붙) 처리
      if (e.inputType === "insertFromPaste") {
        const n = target.value.length - target.oldValue.length;
        target.value = e.target.oldValue;
        target.setSelectionRange(selectionStart - n, selectionStart - n);
      } else {
        target.value = value.replaceAll(data, "");
        target.setSelectionRange(selectionStart - 1, selectionStart - 1);
      }
    }
  }

  /**
   * (한글, 이모지) 여기서 못거름 onInput에서 처리
   */
  function onKeyDown(e) {
    const key = e.key;
    const value = e.target.value;

    if (e.ctrlKey && key === "v") {
      e.target.oldValue = e.target.value;
      return;
    }

    if (allowKey.has(key) === false) {
      e.preventDefault();
      return;
    }

    if (key === "-" && value.includes("-")) {
      e.preventDefault();
      return;
    }

    if (key === ".") {
      if (allowPoint) {
        if (value.includes(".")) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
      }
    }
  }

  input.addEventListener("keydown", onKeyDown);
  input.addEventListener("input", onInput);
}

export function tableCheckboxEvent(table) {
  if (table.querySelector("thead input[type=checkbox]") == null) return;

  //thead 이벤트
  table.querySelector("thead").addEventListener("input", (e) => {
    if (e.target.type !== "checkbox") return;
    const ck = e.target;
    const bool = ck.checked;

    const th = ck.closest("td, th");
    const colNum = Array.from(th.closest("tr").children).findIndex((c) => c === th) + 1;

    Array.from(table.querySelectorAll(`tbody tr td:nth-child(${colNum}) input[type=checkbox]`)).forEach((c) => (c.checked = bool));
  });

  //tbody 이벤트
  table.querySelector("tbody").addEventListener("input", (e) => {
    if (e.target.type !== "checkbox") return;

    const ck = e.target;
    const td = ck.closest("td, th");
    const colNum = Array.from(td.closest("tr").children).findIndex((c) => c === td) + 1;

    table.querySelector(`thead tr :nth-child(${colNum}) input[type=checkbox]`).checked = Array.from(
      table.querySelectorAll(`tbody tr td:nth-child(${colNum}) input[type=checkbox]`)
    ).every((c) => c.checked);
  });
}

/**
 * 폼 서브밋 방지
 * @param {HTMLFormElement} form
 */
export function preventSubmitForm(form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });
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

  input.addEventListener("focus", focus);
  input.addEventListener("paste", paste);
}

/**
 * 입력한 글자수만큼 (? / max) 숫자 변화 이벤트
 * .check-length 붙은 element에 전부 이벤트 부여
 */
export function fixedCheckLength(parentElement) {
  parentElement.querySelectorAll(".check-length").forEach((input) => {
    const maxLength = input.maxLength;
    const span = input.parentElement.querySelector("span.length");

    input.addEventListener("input", function () {
      if (maxLength && this.value.length > maxLength) {
        this.value = this.value.substring(0, maxLength);
      }
      if (span == null) return;
      span.textContent = this.value.length;
    });
  });

  /* ex)
    <div>
        <input class"check-length" maxlength="30">
        <span class="length">0</span><span> /max</span>
    </div>
    */
}

/**
 * 입력한 글자수만큼 (? / max) 숫자 변화 이벤트
 * 부모 element에 부여하여 공통 처리
 */
export function flexibleCheckLength(parentElement) {
  parentElement.addEventListener("input", function (e) {
    const target = e.target;
    if (!target.classList.contains("check-length")) return;
    const maxLength = target.maxLength;
    const span = target.parentElement.querySelector("span.length");

    if (maxLength && target.value.length > maxLength) {
      target.value = target.value.substring(0, maxLength);
    }
    if (span == null) return;
    span.textContent = target.value.length;
  });
}
