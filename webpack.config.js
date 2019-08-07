const path = require('path');

module.exports = (env, argv) => {
    if (argv.mode === 'development') {
        return {
            mode: 'development',
            entry: './src/index.js',
            output: {
                path: path.resolve('dist'),
                filename: 'TimeCharts.js',
                library: "TimeCharts",
                libraryTarget: 'umd',
            },
            module: {
                rules: [
                    {
                        test: /\.js?$/,
                        include: [path.resolve('src')],
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        }
                    },
                    {
                        test: /\.css$/,
                        include: [path.resolve('src')],
                        use: ['style-loader', 'css-loader']
                    }
                ],
            },
            resolve: {
                extensions: ['.js'],
            },
        };
    }

    if (argv.mode === 'production') {
        return {
            mode: 'production',
            entry: './src/index.js',
            output: {
                path: path.resolve('dist'),
                filename: 'TimeCharts.min.js',
                library: "TimeCharts",
                libraryTarget: 'umd',
            },
            module: {
                rules: [
                    {
                        test: /\.js?$/,
                        include: [path.resolve('src')],
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['minify']
                            }
                        }
                    },
                    {
                        test: /\.css$/,
                        include: [path.resolve('src')],
                        use: ['style-loader', 'css-loader']
                    }
                ],
            },
            resolve: {
                extensions: ['.js'],
            },
        };
    }
};
