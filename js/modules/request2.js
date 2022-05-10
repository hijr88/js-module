import axios from "axios";

const request = axios.create({
  headers: {
    Accept: "application/json",
    fetch: "true",
  },
});

request.interceptors.request.use(
  (config) => {
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
      console.log("data:", data);
    }

    if (data["resultCd"] !== "0") {
      if (data["failMessage"]) alert(data["failMessage"]);
      else if (config["failMessage"]) alert(config["failMessage"]);
      else alert("예기치 못한 문제가 발생하였습니다.\n관리자에게 문의하시기 바랍니다.");
      throw "fail";
    }
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
