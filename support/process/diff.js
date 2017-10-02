const fs = require('fs');
const path = require('path');
const resemble = require('node-resemble-js');
const chalk = require('chalk');

module.exports = function diff({MASTER, CANDIDATE, DIFF}) {

    let tab = (indent) => '\t'.repeat(indent || 1);
    let newline = (times) => '\n'.repeat(times || 1);

    let score = 0;
    let report = [];

    let onComplete = (name, data, callback) => {
        let {isSameDimensions, dimensionDifference, misMatchPercentage} = data;
        if (!isSameDimensions || (0 < dimensionDifference.width + dimensionDifference.height) || 0 < parseFloat(misMatchPercentage)) {
            data.getDiffImage().pack().pipe(fs.createWriteStream(path.join(DIFF, name)));

            score++;

            report.push(chalk.yellow(newline() + tab() + `Diff created for "${name}"`));
            report.push(tab() + 'Details:');
            report.push(tab(2) + `Same dimensions: ${isSameDimensions ? 'yes' : 'no'}`);
            report.push(tab(2) + `Mismatch percentage: ${misMatchPercentage}%`);
        }
        callback();
    };

    let diffPromise = (name, candidate, master) => new Promise(function(resolve, reject) {
        resemble(candidate).compareTo(master)
            .onComplete((data) => onComplete(name, data, resolve));
    });

    report.push(newline() + tab() + 'Medusa report:');

    let files = fs.readdirSync(CANDIDATE).map((file) => {
        let candidate = fs.readFileSync(path.join(CANDIDATE, file));
        if (fs.existsSync(path.join(MASTER, file)))
        {
            let master = fs.readFileSync(path.join(MASTER, file));
            return diffPromise(file, candidate, master);
        }
        else
        {
            fs.writeFileSync(path.join(MASTER, file), candidate);
            return true;
        }
    });

    return Promise.all(files)
        .then(() => {
            let all = files.length;

            if (0 === score)
            {
                report.push(newline() + tab() + chalk.green(`${all} out of ${all} tests passed`));
            }
            else
            {
                report.push(newline() + tab() + chalk.red(`${score} out of ${all} tests failed`));
                report.push(newline(1));
                report.push(tab() + 'see ./shots/diff for more info');
                report.push(tab() + 'gulp shots:setmaster [--test "<name>"][--all] for set new master images');
                report.push(newline(1));
            }

            return new Promise(function (resolve, reject) {
                resolve(report.join('\n'));
            });
        });

};
