import path from 'path';
import webpack from 'webpack';
import { CLIEngine } from 'eslint';
import HtmlPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { CleanWebpackPlugin as CleanPlugin } from 'clean-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';

const analyzeBundle = Boolean(process.env.ANALYZE_BUNDLE);
const dev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.API_URL;

const plugins = [
  new CleanPlugin(),
  new StylelintPlugin({
    configFile: '.stylelintrc',
    context: 'src',
    files: '**/*.scss',
    failOnError: true,
    quiet: false,
    syntax: 'scss'
  }),
  new MiniCSSExtractPlugin({
    filename: '[name].css'
  }),
  new webpack.DefinePlugin({
    API_URL: JSON.stringify(dev || !apiUrl ? 'http://localhost:3000' : apiUrl)
  })
];

if (dev) {
  plugins.push(
    new HtmlPlugin({
      template: './src/index.html'
    }),
    new webpack.HotModuleReplacementPlugin()
  );
}

if (analyzeBundle) {
  plugins.push(new BundleAnalyzerPlugin());
}

export default {
  mode: dev ? 'development' : 'production',
  devtool: dev ? 'cheap-module-eval-source-map' : 'cheap-module-source-map',
  entry: './src/index.js',
  devServer: {
    compress: dev,
    open: true,
    overlay: true,
    historyApiFallback: true,
    hot: dev,
    port: 9000
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'eslint-loader',
            options: {
              formatter: CLIEngine.getFormatter('stylish')
            }
          }
        ]
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          dev ? 'style-loader' : MiniCSSExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                require('autoprefixer'),
                require('postcss-flexbugs-fixes')
              ],
              sourceMap: dev
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true }
          }
        ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    chunkFilename: '[name].js'
  },
  plugins,
  resolve: {
    extensions: ['.js', '.json'],
    modules: ['node_modules', 'src']
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 9
        }
      }),
      new OptimizeCSSAssetsPlugin({})
    ],
    splitChunks: {
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          priority: -2,
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/
        },
        react: {
          priority: -1,
          name: 'vendor-react',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](react|redux)/
        }
      }
    }
  }
};
