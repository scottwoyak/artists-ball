const path = require('path');
const TypedocWebpackPlugin = require('typedoc-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
   devServer: {
      host: '0.0.0.0',
      port: 80,
      contentBase: path.join(__dirname, 'dist'),
   },
   entry: './src/index.ts',
   devtool: 'inline-source-map',
   mode: 'development',
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
         },
         {
            test: /\.css$/,
            use: [
               'style-loader',
               'css-loader',
            ],
         },
         {
            test: /\.(glsl|vs|fs)$/,
            loader: 'ts-shader-loader',
         }
      ],
   },
   resolve: {
      extensions: ['.tsx', '.ts', '.js']
   },
   output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist')
   },
   // add to webpack plugins
   plugins: [
      new TypedocWebpackPlugin({
         name: 'Artist\'s Ball',
         mode: 'file',
         includeDeclarations: false,
         ignoreCompilerErrors: true,
      }),
      new HtmlWebpackPlugin({
         title: 'Artist\'s Ball'
      })
   ]
};


