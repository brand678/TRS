/**
 * TRANSLINK - Bundle Analyzer Configuration
 * Advanced bundle analysis and optimization tracking
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
      logLevel: 'info'
    })
  ],
  
  // Custom analysis configuration
  analysis: {
    // Size thresholds (in bytes)
    thresholds: {
      maxBundleSize: 1024 * 1024, // 1MB
      maxChunkSize: 512 * 1024,   // 512KB
      maxAssetSize: 256 * 1024    // 256KB
    },
    
    // Performance budgets
    budgets: [
      {
        type: 'initial',
        maximumWarning: '500kb',
        maximumError: '1mb'
      },
      {
        type: 'allScript',
        maximumWarning: '2mb',
        maximumError: '5mb'
      },
      {
        type: 'anyComponentStyle',
        maximumWarning: '50kb',
        maximumError: '100kb'
      }
    ],
    
    // Optimization recommendations
    recommendations: {
      // Code splitting opportunities
      codeSplitting: {
        minChunkSize: 20000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30
      },
      
      // Tree shaking effectiveness
      treeShaking: {
        unusedExports: true,
        sideEffects: false
      },
      
      // Compression opportunities
      compression: {
        gzip: true,
        brotli: true
      }
    }
  }
};