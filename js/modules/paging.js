import { getUrlParams, toQueryString } from "./common";
import { isEmpty, isInteger } from "./validator";

/**
 * @param {Object}   search             모듈에 있는 search 리턴 값
 * @param {function} findPage           리스트 불러올 함수
 * @param {function} printList          리스트 그릴 함수
 * @param {boolean} usePagination      페이징버튼 사용유무
 * @param {Number} pageSize           페이지 리스트 개수
 * @param {Number} pageRange          페이징 버튼 범위
 * @param {function} customPagination   커스텀 페이징 버튼
 */
export default function paging({ search, findPage, printList, usePagination = true, pageSize = 20, pageRange = 10, customPagination = undefined }) {
  if (search === undefined) throw "require search";
  if (findPage === undefined) throw "require findPage()";
  if (printList === undefined) throw "require printList()";

  //페이징 초기화
  function init() {
    goSearch(1);
  }

  //페이지 번호
  function goSearch(num = 1) {
    num = !isInteger(num) ? 1 : Number(num) <= 0 ? 1 : Number(num);
    goPage(num);
  }

  const { goPage, getPageNumber } = (() => {
    let cachedCount = null;
    let cachedPageNumber = 1;

    return {
      goPage: async function (pageNumber = 1, useCacheParam = false, useCachedCount = false) {
        const params = search.getData(useCacheParam);

        if (useCachedCount && cachedCount != null) {
          params.cachedCount = cachedCount;
        }

        if (pageNumber === 0) {
          pageNumber = cachedPageNumber;
        } else {
          cachedPageNumber = pageNumber;
        }

        params.pageNumber = pageNumber;
        params.pageSize = pageSize;

        const page = await findPage(params);
        cachedCount = page["totalElements"];

        printList(page);
        if (usePagination === true) {
          if (customPagination) {
            customPagination(page, pageRange, (n) => goPage(n, true, true), getInfo);
          } else {
            defaultPrintButton(page, pageRange);
          }
        }
      },
      getPageNumber: function () {
        return cachedPageNumber;
      },
    };
  })();

  //검색값이랑 페이징 정보 포함해서 리턴
  function getInfo() {
    return Object.assign(search.getData(true), {
      pageNumber: getPageNumber(),
      pageSize: pageSize,
    });
  }

  function reload(useCachedCount = false) {
    goPage(0, true, useCachedCount);
  }

  /**
   * 페이징 버튼 생성
   * @param page {Object}     서버에서 응답한 페이지객체
   * @param size {Number}     페이징 버튼 개수
   */
  const defaultPrintButton = (() => {
    if (!usePagination || customPagination) return;

    const wrap = document.querySelector("#pagination");
    const left = wrap.querySelector(".pageLeft");
    const list = wrap.querySelector(".pageList");
    const right = wrap.querySelector(".pageRight");

    let previousNumber, nextNumber, maxNumber;

    wrap.addEventListener("click", (e) => e.preventDefault());

    function go(num) {
      const newInfo = { ...getInfo(), pageNumber: Number(num) };
      history.pushState({ page: newInfo }, null, "?" + toQueryString(newInfo));
      goPage(num, true, true);
    }

    left.children[0].addEventListener("click", () => go(1));
    left.children[1].addEventListener("click", () => go(previousNumber));

    right.children[0].addEventListener("click", () => go(nextNumber));
    right.children[1].addEventListener("click", () => go(maxNumber));

    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li || li.classList.contains("on")) return;

      go(li.dataset.num);
    });

    return function (page, size = 10) {
      const params = getInfo();
      const startNum = page.number - ((page.number - 1) % size);

      //이전버튼
      if (page.number > size) {
        previousNumber = page.number - size;
        left.children[0].href = `${location.pathname}?${toQueryString({ ...params, pageNumber: 1 })}`;
        left.children[1].href = `${location.pathname}?${toQueryString({ ...params, pageNumber: previousNumber })}`;
        left.style.display = "";
      } else {
        left.style.display = "none";
      }

      //다음버튼
      if (startNum + size <= page["totalPages"]) {
        nextNumber = startNum + size;
        right.children[0].href = `${location.pathname}?${toQueryString({ ...params, pageNumber: nextNumber })}`;
        maxNumber = page["totalPages"];
        right.children[1].href = `${location.pathname}?${toQueryString({ ...params, pageNumber: maxNumber })}`;
        right.style.display = "";
      } else {
        right.style.display = "none";
      }

      let html = "";
      for (let i = 0; startNum + i <= page["totalPages"] && i < size; i++) {
        params.pageNumber = startNum + i;

        html += `
          <li class="${startNum + i === page.number ? "on" : ""} cursor-pointer" data-num="${params.pageNumber}">
              <a href="${location.pathname}?${toQueryString(params)}">${startNum + i}</a>
          </li>`;
      }
      list.innerHTML = html;
    };
  })();

  //검색테이블 이벤트 설정
  (function setEvent() {
    //초기화버튼
    search.form.addEventListener("reset", () => {
      if (isEmpty(getUrlParams())) return;

      setTimeout(function () {
        history.pushState(null, null, location.pathname);
        init();
      }, 1);
    });
    //검색버튼
    search.form.addEventListener("submit", () => {
      search.getData(false);
      history.pushState({ page: getInfo() }, null, "?" + toQueryString(getInfo()));
      goPage(1, true);
    });

    window.addEventListener("popstate", (e) => {
      const page = e.state?.page;
      search.setData(page);
      if (page) {
        goSearch(page.pageNumber);
      } else {
        init();
      }
    });
  })();

  return { init: init, info: getInfo, goSearch: goSearch, reload: reload };
}
