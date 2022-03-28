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

/**
 * allCheckBox 변하면 area에 있는 모든 checkBox도 같이 변하기
 * @param {HTMLInputElement & checkbox} allCheckBox 이벤트 추가할 checkBox
 * @param area 변할 체크박스가 포함된 영역
 */
export function changeAllCheckBox(allCheckBox, area) {
  if (allCheckBox.tagName !== "INPUT" || allCheckBox.type !== "checkbox") return;
  allCheckBox.addEventListener("change", function (e) {
    const checkBox = e.target;
    area.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = checkBox.checked));
  });

  area.addEventListener("change", function (e) {
    const checkBox = e.target;
    if (checkBox.tagName !== "INPUT" || checkBox.type !== "checkbox") return;

    allCheckBox.checked = checkBox.checked && Array.from(area.querySelectorAll("input[type=checkbox]")).every((cb) => cb.checked);
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
 * .checkLength가 붙은 element에 전부 이벤트 부여
 */
export function fixedCheckLength(parentElement) {
  parentElement.querySelectorAll(".checkLength").forEach((input) => {
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
        <input class"checkLength" maxlength="30">
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
    e.preventDefault();

    const target = e.target;
    if (!target.classList.contains("checkLength")) return;
    const maxLength = target.maxLength;
    const span = target.parentElement.querySelector("span.length");

    if (maxLength && target.value.length > maxLength) {
      target.value = target.value.substring(0, maxLength);
    }
    if (span == null) return;
    span.textContent = target.value.length;
  });
}
