module.exports = function(config){
  config.set({

    basePath : '../../dcs-app/www/js/',

    files : [
      'lib/angular.js',
      'lib/*.js',

      'dcsApp.js',
      'routes.js',

      'controllers/*.js',
      'services/*.js',


      '../../../test/unit/*.js'
    ],

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-jasmine'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};