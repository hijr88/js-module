const path = require("path");
const JS_ROOT = './src/main/webapp/js';
const MODULE_DIR = './modules';

module.exports = (env) => {

    return {
        target: 'web',
        mode: env["production"] ? 'production' : 'development',
        entry: {
            'rcs/brandRequest':   [JS_ROOT + '/src/rcs/brand/request/index.js'],
        },
        output: {
            publicPath: '/',
            path: path.resolve(__dirname, JS_ROOT + '/dist'),
            filename: '[name].js',
            clean: true,
            environment: {
                arrowFunction: false,
                bigIntLiteral: false,
                const: true,
                destructuring: false,
                dynamicImport: false,
                forOf: false,
                module: false,
            },
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader"
                    },
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                url: false
                            }
                        },
                        'sass-loader'
                    ],
                }
            ],
        },
        optimization: {
            runtimeChunk: {
                name: "runtime"
            },
            splitChunks: {
                name: "vendor",
                chunks: "all"
            },
        },
        resolve: {
            alias: {
                '@modules': path.resolve(__dirname, MODULE_DIR),
                '@css': path.resolve(__dirname, 'src/main/webapp/css'),
            },
            modules: [path.resolve(__dirname, 'src/main/webapp'), 'node_modules'],
            extensions: ['.js'],
        },
        plugins: [],
        devServer: {
            host: "localhost",
            port: 9090,
            proxy: {
                '**' : "http://localhost:8080"
            },

            hot: true,
            open: false,
            devMiddleware: {
                writeToDisk: false,
            },
            static: [
                {
                    serveIndex: true,
                    watch: true,
                }
            ],
        },
        devtool: env["production"] ? false : 'source-map'
    }
};