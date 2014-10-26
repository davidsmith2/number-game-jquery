var loadConfig = function (path) {
    var glob = require('glob');
    var object = {};
    var key;
    glob.sync('*', {cwd: path}).forEach(function(option) {
        key = option.replace(/\.js$/,'');
        object[key] = require(path + option);
    });
    return object;
};

/*global module:false*/
module.exports = function (grunt) {
  var config;
  // load "grunt-"-prefixed modules
  require('load-grunt-tasks')(grunt, {
    scope: 'devDependencies'
  });
  // project config
  config = {
    pkg: grunt.file.readJSON('package.json')
  };
  // merge config and options for "grunt-"-prefixed modules
  grunt.util._.extend(config, loadConfig('./tasks/options/'));
  // init config
  grunt.initConfig(config);
  // load tasks
  grunt.loadTasks('tasks');
};
