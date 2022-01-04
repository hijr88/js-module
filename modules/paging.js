/**
 * @param {Object}   search             모듈에 있는 search 구현한것
 * @param {function} findPage           리스트 불러올 함수
 * @param {function} printList          리스트 그릴 함수
 * @param {boolean} usePagination      페이징버튼 사용유무
 * @param {Number} pageSize           페이지 리스트 개수
 * @param {Number} pageRange          페이징 버튼 범위
 * @param {function} customPagination   커스텀 페이징 버튼
 * @return {Object}
 */
export default function paging({
    search,
    findPage,
    printList,
    usePagination = true,
    pageSize = 20,
    pageRange = 10,
    customPagination = undefined
   }) {

    if (search === undefined) throw 'require search';
    if (findPage === undefined) throw 'require findPage'
    if (printList === undefined) throw 'requirePrintList'

    //화면 초기화
    function init() {
        search.init();
        
        goSearch(1);
    }

    /**
     * @param e click 이벤트 또는 페이지 번호
     */
    function goSearch(e = undefined) {
        const params = search.data(true);

        if (e instanceof Event) {
            e.preventDefault();
            goPage.bind(params, 1, false)();
        } else if (typeof e === 'number') {
            goPage.bind(params, e, false)();
        } else if (typeof e === 'string') {
            const n = Number.parseInt(Number(e).toString());
            if (Number.isNaN(n) || n <=0) {
                goPage.bind(params, 1, false)();
            } else {
                goPage.bind(params, n, false)();
            }
        }
        else {
            goPage.bind(params, 1, false)();
        }
    }

    const {goPage, getPageNumber} = (() => {
        let cachedCount = undefined;
        let cachedPageNumber = 1;

        return {
            goPage: async function (pageNumber = 1,  useCachedCount = true, e) {
                if (e instanceof Event) {
                    e.preventDefault();
                }

                const params = this ?? search.data(false);

                if (useCachedCount === true && cachedCount !== undefined) {
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
                        customPagination(page, pageRange);
                    } else {
                        printButton(page, pageRange);
                    }
                }
            },
            getPageNumber : function () {
                return cachedPageNumber;
            }
        };
    })();

    /** 검색값이랑 페이징 정보 포함해서 리턴 */
    function getPageInfo() {
        return Object.assign(search.data(),{
            pageNumber: getPageNumber(),
            pageSize: pageSize
        })
    }

    /**
     * @param {boolean} useCachedCount
     */
    function reload(useCachedCount = true) {
        goPage(0, useCachedCount);
    }

    /**
     * 페이징 버튼 생성
     * @param page {Object}     서버에서 응답한 페이지객체
     * @param size {Number}     페이징 버튼 개수
     */
    const printButton = (()=> {
        const div = document.querySelector('div#pagination');
        const left  = div.querySelector('.pageLeft');
        const list  = div.querySelector('.pageList');
        const right = div.querySelector('.pageRight');

        let previousNumber, nextNumber, maxNumber;

        function go(num, e) {
            e.preventDefault();
            goPage.bind(null,num, true)();
        }
        left.children[0].addEventListener('click', (e) => go(1, e));
        left.children[1].addEventListener('click', (e) => go(previousNumber, e));

        right.children[0].addEventListener('click', (e) => go(nextNumber, e));
        right.children[1].addEventListener('click', (e) => go(maxNumber, e));

        return function (page, size= 10) {

            const startNum = page.number- ( (page.number-1)%size );

            if (page.number > size) { //이전버튼
                previousNumber = page.number - size;
                left.style.display = '';
            } else {
                left.style.display = 'none';
            }

            if (startNum + size <= page["totalPages"]) { //다음버튼
                nextNumber = startNum + size;
                maxNumber = page["totalPages"];
                right.style.display = '';
            } else {
                right.style.display = 'none';
            }

            list.innerHTML = '';
            for (let i=0; startNum+i <= page["totalPages"] && i<size; i++) {
                const html = `
                    <li class="${startNum+i === page.number ? 'on' : ''}">
                        <a href="${location.pathname}">${startNum+i}</a>
                    </li>`;
                list.insertAdjacentHTML('beforeend',html);
                if (startNum+i !== page.number) {
                    list.lastElementChild.addEventListener('click', goPage.bind(null, startNum +i, true));
                } else {
                    list.lastElementChild.addEventListener('click', e => e.preventDefault());
                }
            }
        }
    })();

    return {
        init: init,
        goPage: goPage,
        info: getPageInfo,
        goSearch: goSearch,
        reload: reload,
    }
}