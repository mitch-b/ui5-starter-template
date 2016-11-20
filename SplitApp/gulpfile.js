var gulp = require("gulp"),             // core
    gutil = require("gulp-util"),       // for displaying build log text
    fs = require("fs"),                 // for config copy

    uglify = require("gulp-uglify"),    // this section for minifying
    gulpif = require('gulp-if'),        // for gulp pipe conditionals
    rename = require('gulp-rename'),    // for 'save-dbg-sources'

    shell = require('gulp-shell'),      // to execute 'jsdoc'

    moment = require("moment");         // for build date


var config = {
    src: "./app/",
    ignoreSrc: [
        "!./app/*.webinfo",
        "!./app/*.publishproj"
    ],
    ignoreMinify: [
        "!./app/assets{,/**}"
    ],
    dist: "./dist/",
    buildConfigFile: "./config.json",
    webConfigFile: "model/appConfig.json",
    buildVersion: ""
};

// jsdoc : Build jsdoc documentation using ./jsdoc.conf.json
gulp.task('jsdoc', shell.task([
    'jsdoc -c jsdoc.conf.json'
]));

var environments = ["local", "dev", "qa", "prod"];

// copy : copy everything in config.src (ignoring config.ignoreSrc) into config.dist folder
// ** This is absolutely required in a successful gulp deployment
gulp.task("copy", function () {
    gutil.log("Copy from source to destination.");
    gutil.log(config.src + " -> " + config.dist);
    gulp.src([config.src + "**"].concat(config.ignoreSrc))
        .pipe(gulp.dest(config.dist));
});

// minify : Run minify tool against all js files to create un-minified "-dbg" versions
//          and minify the original filenames (non "-dbg" versions) which UI5 will load
gulp.task("minify", ["minify-js"], function () {
    gutil.log("Minify source");
});

// save-dbg-sources : create "-dbg" versions of JavaScript resources (unminified) before
//                    minification occurs in the minify-js task
gulp.task("save-dbg-sources", function () {
    // copy all JS web assets (js with -dbg suffix)
    return gulp.src(
            [config.src + "**"]
            .concat(config.ignoreSrc)
            .concat(config.ignoreMinify)
           )
        .pipe(gulpif('**/*.js',

            rename(function (path) {
                var dbg = "-dbg";
                // get index of first "." in name if one exists
                var firstSeparator = path.basename.indexOf(".");
                if (firstSeparator > -1) {
                    // insert -dbg before ".", useful for controllers: App-dbg.controller.js
                    path.basename = path.basename.slice(0, firstSeparator) + dbg + path.basename.slice(firstSeparator);
                } else {
                    path.basename = path.basename + dbg;
                }

            }))
        )
        .pipe(gulpif('**/*.js', gulp.dest(config.dist)));
});

// minify-js : called by minify task. Take each javascript file in the *source*
//             run uglify task, and write to config.dist (overwriting unminified file)
gulp.task("minify-js", ["save-dbg-sources"], function () {
    // now make minified js versions
    return gulp.src([config.src + "**"]
            .concat(config.ignoreSrc)
            .concat(config.ignoreMinify)
        )
        .pipe(gulpif('**/*.js', uglify().on('error', gutil.log)))
        .pipe(gulpif('**/*.js', gulp.dest(config.dist)));
});


environments.forEach(function (env) {
    // config-[env] : This task simply merges the ./config.json file with ./model/appConfig.json
    //                in order to have environment-specific settings at runtime.
    gulp.task("config-" + env, function () {
        gutil.log("Building application for " + env);
        var envConfig = require(config.buildConfigFile);
        var appConfig = {};

        appConfig.environment = env;

        // copy all shared simple attributes (non-objects)
        for (var attr in envConfig) {
            if (typeof envConfig[attr] !== "object") {
                appConfig[attr] = envConfig[attr];
            }
        }
        // copy all environment-specific settings (at object)
        if (!envConfig[env]) {
            gutil.log("No config specified for " + env);
        } else {
            for (var attr in envConfig[env]) {
                appConfig[attr] = envConfig[env][attr];
            }
        }
        // copy all non-environment settings (at object)
        for (var attr in envConfig) {
            if (typeof envConfig[attr] === "object") {
                if (environments.indexOf(attr) === -1) { // not an environment
                    appConfig[attr] = envConfig[attr];
                }
            }
        }

        // TODO: move versioning into separate gulp task?
        appConfig = updateBuildVersion(appConfig);

        fs.writeFile(
            config.src + "/" + config.webConfigFile,
            JSON.stringify(appConfig)
        );
    });

    if (env === "prod" || env === "qa") {
        gulp.task("tfbuild-" + env, ["config-" + env, "copy", "minify", "jsdoc"]);
    } else {
        gulp.task("tfbuild-" + env, ["config-" + env, "copy", "jsdoc"]);
    }

});

/**
 * Will keep running in your command window. As you change files,
 * Gulp will re-run 'config-dev' and 'copy' to update the bin\ folder.
 *
 * You can watch and build for specific environments:
 * $ gulp watch --env local
 * $ gulp watch --env dev
 *
 * You can start a web-server in the bin\ folder as you develop to
 * keep getting auto-updates as you work.
 */
gulp.task("watch", function() {
    var watchEnv = 'local';
    if (environments.indexOf(gutil.env.env) > -1) {
      watchEnv = gutil.env.env;
    }
    gulp.run("tfbuild-" + watchEnv);

    gulp.watch(config.src + "**/*", function() {
        gulp.run(['config-' + watchEnv, 'copy']);
        if (watchEnv === 'local') {
          gulp.run(['jsdoc']);
        }
    });
});

/**
 * Will update a configuration object's version property
 *
 * If appConfig.build exists and is a number, it will increment
 * this property and apply as build version.
 *
 * @param appConfig configuration object
 * @returns {appConfig}
 */
function updateBuildVersion(appConfig) {
    var hour = '' + new Date().getHours();
    var min = '' + new Date().getMinutes();
    var pad = "00";
    var paddedHour = pad.substring(0, pad.length - hour.length) + hour;
    var paddedMin = pad.substring(0, pad.length - min.length) + min;
    var buildNumber = paddedHour + paddedMin;

    appConfig.version =
      "1." + moment().format("YYYY.MMDD") + "." + buildNumber;

    config.buildVersion = appConfig.version;

    return appConfig;
}
