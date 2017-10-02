const fs = require('fs');
const gulp = require('gulp');
const selenium = require('selenium-standalone');
const runSequence = require('run-sequence');
const argv = require('minimist')(process.argv.slice(2));
const RunBundle = require('cuke-js-framework');
const path = require('path');

const config = require('./cuke.config');
const artifacts = require('./artifacts.config');

const crop = require('./support/process/crop');
const diff = require('./support/process/diff');
const setMaster = require('./support/process/setMaster');

const SHOTS = artifacts.SHOTS;
const CANDIDATE = path.join(SHOTS, artifacts.CANDIDATE);
const MASTER = path.join(SHOTS, artifacts.MASTER);
const DIFF = path.join(SHOTS, artifacts.DIFF);
const META = path.join(SHOTS, artifacts.META);
const RAW = path.join(SHOTS, artifacts.RAW);

gulp.task('selenium:start', function (done) {
    return selenium.install({}, function (err) {
        if (err)
        {
            return done(err);
        };
        selenium.start(function (err, child) {
            if (err)
            {
                return done(err);
            };
            selenium.child = child;
            done();
        });
    });
});

gulp.task('selenium:end', function () {
    if (selenium.child)
    {
        return selenium.child.kill();
    }
});

gulp.task('scenarios:run', function(done) {
    RunBundle(config, done);
});

gulp.task('artifacts:set', function() {
    if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS);
    if (!fs.existsSync(RAW)) fs.mkdirSync(RAW);
    if (!fs.existsSync(DIFF)) fs.mkdirSync(DIFF);
    if (!fs.existsSync(META)) fs.mkdirSync(META);
    if (!fs.existsSync(MASTER)) fs.mkdirSync(MASTER);
    if (!fs.existsSync(CANDIDATE)) fs.mkdirSync(CANDIDATE);
});

gulp.task('artifacts:clean', function() {
    let files = fs.readdirSync(META).map((name) => path.join(META, name))
        .concat(fs.readdirSync(RAW).map((name) => path.join(RAW, name)))
        .concat(fs.readdirSync(DIFF).map((name) => path.join(DIFF, name)))
        .concat(fs.readdirSync(CANDIDATE).map((name) => path.join(CANDIDATE, name)));
    return Promise.all(files.map((file) => {
        return fs.unlink(file);
    }));
});

gulp.task('shots:crop', function() {
    return crop({META, RAW, CANDIDATE});
});

gulp.task('shots:diff', function(done) {
    diff({MASTER, CANDIDATE, DIFF}).then((report) => {
        console.log(report);
        done();
    });
});

gulp.task('shots:setmaster', function() {
    let report = setMaster({MASTER, CANDIDATE}, {test: argv.test, all: argv.all});
    console.log(report);
});

gulp.task('test:local', function() {
    return runSequence('artifacts:set', 'artifacts:clean', 'selenium:start', 'scenarios:run', 'selenium:end', 'shots:crop', 'shots:diff');
});
