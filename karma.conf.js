var APP = 'dcs-app/'
var JS = APP+'www/js/';
var SPECS = 'test/unit/';

module.exports = function(config){
  config.set({

    files : [
      JS+'lib/angular.js',
      JS+'lib/underscore-min.js',
      JS+'lib/*.js',

      JS+'dcsApp.js',
      JS+'routes.js',

      JS+'controllers/*.js',
      JS+'services/*.js',
      JS+'modules/device-handler.js',
      JS+'modules/file-handler.js',
      JS+'modules/*.js',

      SPECS+'mocks.js',
      SPECS+'button-factory-specs.js',
      SPECS+'correlated-forms-specs.js',
      SPECS+'device-back-handler-specs.js',
      SPECS+'file-handler-specs.js',
      SPECS+'project-controller-tests.js',
      SPECS+'back-button-service-specs.js',
      //SPECS+'submission-controller-specs.js',

      { pattern: APP+'www/i18n/resourceBundle.json',
          watched: true,
          served:  true,
          included: false
      },
      { pattern: SPECS+'xform_html.html',
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