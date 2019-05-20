const sass = require('node-sass');
module.exports = function (grunt) {
    grunt.initConfig({
        sass: {
            options: {
                implementation: sass,
                sourceMap: false
            },
            dist: {
                files: {
                    'style.css': './sass/style.scss'
                }
            }
        },
        watch: {
            options: {
            },
            css: {
                files: ['sass/*.scss'],
                tasks: ['sass'],
            },
        },
        browserSync: {
            dev: {
                bsFiles: {
                    src : [
                        'style.css',
                        'index.html'
                    ]
                },
                options: {
                    watchTask: true,
                    server: '.'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');

    grunt.registerTask('default', ['browserSync', 'watch']);

};