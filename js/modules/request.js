import "whatwg-fetch";
import { isEmpty } from "./validator";

const request = (() => {
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
      Accept: "application/json",
      fetch: "true",
    };
    Object.assign(headers, headerOptions);
    return headers;
  }

  let pool = 0;

  async function getResponse(url, method, headers, body, failMessage) {
    if (method.toLowerCase() === "get") {
      console.log(`url = '${url}'`);
    } else {
      console.log(`url = ${url}\nbody = '${body}'`);
    }

    let response;
    try {
      pool += 1;
      //before function
      response = await fetch(url, {
        method: method,
        headers: headers,
        body: body,
      });
    } catch (err) {
      //서버 연결 실패
      alert("서버 연결에 실패하였습니다.");
      throw "Connection Failed";
    } finally {
      if (pool === 1) {
        //after function ex) hide();
      }
      pool -= 1;
    }

    const data = await (async () => {
      try {
        const data = await response.json();
        console.log(data);
        return data;
      } catch (err) {
        console.error(err);
        throw "invalid json";
      }
    })();

    if (response.ok) {
      return data;
    }

    switch (response.status) {
      case 400: {
        alert("잘못된 요청입니다.");
        throw "Bad Request";
      }
      //TODO-YH 에러코드에 따라 분기
      case 401: {
        if (data.message) {
          alert(data.message);
          if (data["redirectUrl"]) {
            location.href = data["redirectUrl"];
          }
        }
        //alert('세션이 종료되었습니다.');
        //location.href = '/';
        throw "Unauthorized";
      }
      case 404: {
        //alert('해당 URL이 존재하지 않습니다.');
        throw "Not Found URL";
      }
      case 405: {
        //alert('허용하지 않는 method입니다.');
        throw "Method Not Allowed";
      }
      case 500: {
        if (data.code === 9999) {
          alert(data.message);
        }
        throw "Server Error";
      }
      default: {
        throw "response status error";
      }
    }
  }

  /**
   * @param {string} url
   * @param {Object} data
   * @param {Object} headerOptions
   * @param {string} failMessage
   */
  function get({ url, data = undefined, headerOptions = undefined, failMessage = undefined }) {
    const headers = getHeaders(headerOptions);
    const queryString = serialize(data);

    if (queryString) url = url + "?" + queryString;

    return getResponse(url, "get", headers, undefined, failMessage);
  }

  /**
   * @param {string} url
   * @param {Object} data
   * @param {Object} headerOptions
   * @param {string} failMessage
   */
  async function post({ url, data, headerOptions = undefined, failMessage = undefined }) {
    const _h = {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    };
    Object.assign(_h, headerOptions);
    const headers = getHeaders(_h);
    const body = serialize(data);

    return await getResponse(url, "post", headers, body, failMessage);
  }

  /**
   * @param {string} url
   * @param {string} method
   * @param {Object} data
   * @param {Object} headerOptions
   * @param {string} failMessage
   */
  async function json({ url, method, data = {}, headerOptions = undefined, failMessage = undefined }) {
    const _h = {
      "Content-Type": "application/json;charset=UTF-8",
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
  async function formData({ url, method, formData, headerOptions = undefined, failMessage = undefined }) {
    if (!(formData instanceof FormData)) throw "data is not a FormData";

    const _h = {};

    Object.assign(_h, headerOptions);
    const headers = getHeaders(_h);

    return await getResponse(url, method, headers, formData, failMessage);
  }

  return {
    get: get,
    post: post,
    json: json,
    formData: formData,
  };
})();

export default request;
