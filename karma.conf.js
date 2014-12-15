module.exports = function(config){
  config.set({

    basePath : 'dcs-app/www/',

    files : [
      'js/lib/angular.js',
      'js/lib/*.js',

      'js/dcsApp.js',
      'js/routes.js',

      'js/controllers/*.js',
      'js/services/*.js',
      'js/modules/device-handler.js',
      'js/modules/file-handler.js',
      'js/modules/*.js',

      //'../../test/unit/mocks.js',
      '../../test/unit/media-test.js',
      { pattern: 'i18n/resourceBundle.json',
          watched: true,
          served:  true,
          included: false
      }
    ],

    frameworks: ['jasmine-jquery', 'jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-jasmine-jquery'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};