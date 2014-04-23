module.exports = function(grunt){

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        exec:{
        	prepare:{
        		command:"cordova prepare",
      		stdout:true,
        		stderror:true
        	}
        },
        watch:{
        	files:['www/**/*.*'],
        	tasks:['exec:prepare']
        }
    });

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('default', ['watch']);

};
