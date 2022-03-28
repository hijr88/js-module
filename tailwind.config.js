const plugin = require("tailwindcss/plugin");
const jsDir = "./js/src";

module.exports = {
  content: [jsDir + "/**/*.js", "./html/**/*.html"],
  corePlugins: {
    //초기 세팅 제거
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        //초기세팅에 추가할것
        button: {
          border: 0,
          cursor: "pointer",
          "font-family": "inherit",
        },
      });
    }),
  ],
  prefix: "",
};
