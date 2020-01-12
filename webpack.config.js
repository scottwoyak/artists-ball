const path = require('path');
var TypedocWebpackPlugin = require('typedoc-webpack-plugin');

module.exports = {
   devServer: {
      host: '0.0.0.0',
      port: 80,
      contentBase: path.join(__dirname, 'dist'),
   },
   entry: './src/app.ts',
   devtool: 'inline-source-map',
   mode: 'development',
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
         }
      ]
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
      })
   ]
};


