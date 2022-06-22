import axios from "axios";

const color = (() => {
  const base = "font-weight: bold; padding: 3px 7px 3px 7px; border-radius: 3px 3px 3px 3px;";
  const red = base + "background-color: #e0005a; color: #fff;";
  const orange = base + "background-color: #fb923c; color: #fff;";
  const yellow = base + "background-color: gold; color: black;";
  const sky = base + "background-color: #c8ebff; color: black;";
  const purple = base + "background-color: #c084fc; color: #fff;";

  function random() {
    const array = Object.values(this).filter((k) => typeof k === "string");
    return array[Math.floor(Math.random() * array.length)];
  }

  return {
    red,
    orange,
    yellow,
    sky,
    purple,
    random,
  };
})();

const request = axios.create({
  headers: {
    Accept: "application/json",
    fetch: "true",
  },
});

request.interceptors.request.use(
  (config) => {
    if (config.beforeMethod) {}

    console.log(`method:${config.method}  url: ${config.url}`);

    if (config.headers["Content-Type"] === "application/x-www-form-urlencoded") {
      if (typeof config.data !== "string") {
      }
    }

    const data = config.data;
    if (data) {
      console.log("data:", data);
    }
    if (config.params) {
      console.log("params:", config.params);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    const config = response.config;
    console.log(config);
    const data = response.data;
    if (data) {
      console.log("%cresponse:", color.random(), data);
    }

    if (data["resultCd"] !== "0") {
      if (data["failMessage"]) alert(data["failMessage"]);
      else if (config["failMessage"]) alert(config["failMessage"]);
      else alert("예기치 못한 문제가 발생하였습니다.\n관리자에게 문의하시기 바랍니다.");
      throw "fail";
    }

    if (config.afterMethod) {}
    return data;
  },
  (error) => {
    console.log(error);
    const status = error.response.status;
    switch (status) {
      case 400: {
        alert("잘못된 요청입니다.");
        throw "Bad Request";
      }
      case 401: {
        alert("세션이 종료되었습니다.");
        location.href = "/";
        throw "session lose";
      }
      case 404: {
        //alert('해당 URL이 존재하지 않습니다.');
        throw "Not Found URL";
      }
      case 405: {
        //alert('허용하지 않는 method입니다.');
        throw "Method Not Allowed";
      }
      default: {
        alert("예기치 못한 문제가 발생하였습니다.\n관리자에게 문의하시기 바랍니다.");
        throw "response error";
      }
    }
    //return Promise.reject(error);
  }
);

export default request;
