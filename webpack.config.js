const path = require('path');
const jsDir = './js';

module.exports = () => {

    return {
        target: 'web',
        mode: process.env.NODE_ENV,
        entry: {
            'index': [jsDir + '/src/index.js']
        },
        output: {
            publicPath: '/',
            path: path.resolve(__dirname, jsDir + '/dist'),
            filename: '[name].js',
            clean: true,
            environment: {
                arrowFunction: false,
                bigIntLiteral: false,
                const: true,
                destructuring: false,
                dynamicImport: false,
                forOf: false,
                module: false
            }
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                url: false
                            }
                        },
                        'sass-loader'
                    ]
                }
            ]
        },
        optimization: {
            runtimeChunk: {
                name: 'runtime'
            },
            splitChunks: {
                name: 'vendor',
                chunks: 'all'
            }
        },
        resolve: {
            alias: {
                '@modules': path.resolve(__dirname, jsDir + '/modules')
            },
            modules: ['node_modules'],
            extensions: ['.js']
        },
        plugins: [],
        devServer: {
            host: 'localhost',
            port: 9090,
            proxy: {
                '**': 'http://localhost:8080'
            },

            hot: true,
            open: false,
            devMiddleware: {
                writeToDisk: false
            },
            static: [
                {
                    serveIndex: true,
                    watch: true
                }
            ]
        },
        devtool: process.env.NODE_ENV === 'production' ? false : 'source-map'
    };
};