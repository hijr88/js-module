import 'whatwg-fetch'
import {isEmpty} from '@modules/validator'

const request = (()=>{
    function serialize(obj) {
        const str = [];
        for (let p in obj)
            if (obj.hasOwnProperty(p) && !isEmpty(obj[p])) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    }

    function getHeaders(headerOptions) {
        const headers = {
            'Accept': 'application/json',
            'fetch': 'true'
        };
        Object.assign(headers, headerOptions);
        return headers;
    }

    //beforesend
    //https://stackoverflow.com/questions/66080100/beforesend-function-in-fetch-api
    async function getResponse(url, method, headers, body, failMessage) {

        if (method.toLowerCase() === 'get') {
            console.log(`url = '${url}'`);
        } else {
            console.log(`url = ${url}\nbody = '${body}'`);
        }

        let response;
        try {
            response = await fetch(url, {
                method: method,
                headers: headers,
                body: body
            });
        } catch (err) { //서버 연결 실패
            alert('서버 연결에 실패하였습니다.');
            throw 'Connection Failed';
        }

        if (response.ok) {
            const data = await (async () => {
                try {
                    const data = await response.json();
                    console.log(data);
                    return data;
                } catch (err) {
                    console.error(err);
                    return {resultCd: '-1'};
                }
            })();

            if (data["resultCd"] !== '0') {
                if (failMessage)
                    alert(failMessage);
                else if (data["failMessage"])
                    alert(data["failMessage"]);
                else
                    alert('Error!');
                throw 'Server Error';
            }

            return data;
        } else {
            switch (response.status) {
                case 400: {
                    alert('잘못된 요청입니다.');
                    throw 'Bad Request';
                }
                case 401: {
                    alert('세션이 종료되었습니다.');
                    location.href = '/';
                    break;
                }
                case 404: {
                    alert('해당 URL이 존재하지 않습니다.');
                    throw 'Not Found';
                }
            }
        }
    }

    /**
     * @param {string} url
     * @param {Object} data
     * @param {Object} headerOptions
     * @param {string} failMessage
     */
    function get({url, data = undefined, headerOptions = undefined, failMessage = undefined}) {
        const headers = getHeaders(headerOptions);
        const queryString = serialize(data);

        if (queryString) url = url + '?' + queryString;

        return getResponse(url, 'get', headers, undefined, failMessage);
    }

    /**
     * @param {string} url
     * @param {Object} data
     * @param {Object} headerOptions
     * @param {string} failMessage
     */
    async function post({url, data, headerOptions = undefined, failMessage= undefined}) {
        const _h = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        };
        Object.assign(_h, headerOptions);
        const headers = getHeaders(_h);
        const body = serialize(data);

        return await getResponse(url, 'post', headers, body, failMessage);
    }

    /**
     * @param {string} url
     * @param {string} method
     * @param {Object} data
     * @param {Object} headerOptions
     * @param {string} failMessage
     */
    async function json({url, method, data = {}, headerOptions = undefined, failMessage= undefined}) {
        const _h = {
            'Content-Type': 'application/json;charset=UTF-8'
        };

        Object.assign(_h, headerOptions);
        const headers = getHeaders(_h);
        const body = JSON.stringify(data);

        return await getResponse(url, method, headers, body, failMessage);
    }


    /**
     * @param {string} url
     * @param {string} method
     * @param {FormData} formData
     * @param {Object} headerOptions
     * @param {string} failMessage
     */
    async function formData({url, method, formData, headerOptions = undefined, failMessage= undefined}) {
        if (!(formData instanceof FormData)) throw 'data is not a FormData';

        const _h = {};

        Object.assign(_h, headerOptions);
        const headers = getHeaders(_h);

        return await getResponse(url, method, headers, formData, failMessage);
    }

    return {
        get: get,
        post: post,
        json: json,
        formData: formData
    }
})();

export default request;