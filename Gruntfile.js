/*global module*/
/*jshint unused:false*/
module.exports = function (grunt) {
  grunt.loadNpmTasks("dts-generator");

  grunt.initConfig({
   dtsGenerator: {
     options: {
       name: "drawtools4x",
       project: ".",
       out: "dist/drawtools-js-4.d.ts"
     },
     default: {
       src: "./**/*.ts"
     }
   }
  });

  grunt.registerTask("build", ["dtsGenerator"]);
};