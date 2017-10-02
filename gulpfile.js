const fs = require('fs');
const gulp = require('gulp');
const selenium = require('selenium-standalone');
const runSequence = require('run-sequence');
const jimp = require("jimp");
const resemble = require('node-resemble-js');
const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));
const RunBundle = require('cuke-js-framework');
const path = require('path');

const config = require('./cuke.config');
const artifacts = require('./artifacts.config');

const crop = require('./support/process/crop');

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

gulp.task('tests:run', function(done) {
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
        .concat(fs.readdirSync(DIFF).map((name) => path.join(DIFF,name)))
        .concat(fs.readdirSync(CANDIDATE).map((name) => path.join(CANDIDATE)));
    return Promise.all(files.map((file) => {
        return fs.unlink(file);
    }));
});

gulp.task('shots:crop', function() {
    return crop({META, RAW, CANDIDATE});
});

gulp.task('shots:diff', function(done) {

    let q = [];
    let score = 0;
    let all = 0;

    let files = fs.readdirSync(CANDIDATE);
    all = files.length;
    files.forEach((file) => {

        let candidate = fs.readFileSync(path.join(CANDIDATE, file));
        if (fs.existsSync(path.join(MASTER, file)))
        {
            let master = fs.readFileSync(path.join(MASTER, file));
            q.push(new Promise(function(resolve, reject) {
                resemble(candidate)
                    .compareTo(master)
                    .onComplete(function(data) {
                        let {isSameDimensions, dimensionDifference, misMatchPercentage} = data;
                        if (!isSameDimensions || (0 < dimensionDifference.width + dimensionDifference.height) || 0 < parseFloat(misMatchPercentage)) {

                            console.log(chalk.yellow(`\n\tDiff created for "${file}"\n`) +
                                '\tDetails:\n' +
                                `\t\tSame dimensions: ${isSameDimensions ? 'yes' : 'no'}\n` +
                                `\t\tMismatch percentage: ${misMatchPercentage}%\n`);

                            score++;
                            data.getDiffImage().pack().pipe(fs.createWriteStream(path.join(DIFF, file)));
                        }
                        resolve();
                    });
            }));
        }
        else
        {
            fs.writeFileSync(path.join(MASTER, file), candidate);
        }

    });

    Promise.all(q)
        .then(() => {
            console.log('\n\tMedusa report:\n');
            if (0 === score) console.log('\t' + chalk.green(`${all} out of ${all} tests passed`) + '\n');
            else console.log('\n\t' + chalk.red(`${score} out of ${all} tests failed`) + '\n' +
                             '\tsee ./shots/diff for more info\n\n' +
                             '\tgulp shots:setmaster [--test "<name>"][--all] for set new master images\n\n');
            done();
        });

});

gulp.task('shots:setmaster', function() {
    console.log('\n\tSetting master images:\n');
    if (!!argv.all) {
        let files = fs.readdirSync(CANDIDATE);
        files.forEach((file) => {
            let candidate = fs.readFileSync(path.join(CANDIDATE, file));
            fs.writeFileSync(path.join(MASTER, file), candidate);
            console.log('\t\tNew master set for ' + chalk.yellow(file));
        });
    }
    else if (!!argv.test) {
        if (fs.existsSync(path.join(CANDIDATE, `${argv.test}.png`))) {
            let candidate = fs.readFileSync(`./shots/candidate/${argv.test}.png`);
            fs.writeFileSync(path.join(MASTER, `${argv.test}.png`), candidate);
            console.log('\t\tNew master set for ' + chalk.yellow(argv.test + '.png'));
        }
        else {
            throw 'test does not exist';
        }
    }
    else {
        throw 'test is not specified'
    }
    console.log('\n\n');
});


gulp.task('test:local', function() {
    return runSequence('artifacts:set', 'artifacts:clean', 'selenium:start', 'tests:run', 'selenium:end', 'shots:crop', 'shots:diff');
});
