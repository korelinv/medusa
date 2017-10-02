const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = function({CANDIDATE, MASTER}, params) {

    let {all, test} = params;

    let tab = (indent) => '\t'.repeat(indent || 1);
    let newline = (times) => '\n'.repeat(times || 1);
    let report = [];

    report.push(newline() + tab() + 'Setting master images:' + newline());
    if (!!all) {
        let files = fs.readdirSync(CANDIDATE);
        files.forEach((file) => {
            let candidate = fs.readFileSync(path.join(CANDIDATE, file));
            fs.writeFileSync(path.join(MASTER, file), candidate);
            report.push(tab(2) + 'New master set for ' + chalk.yellow(file));
        });
    }
    else if (!!test) {
        if (fs.existsSync(path.join(CANDIDATE, `${test}.png`))) {
            let candidate = fs.readFileSync(path.join(CANDIDATE, `${test}.png`));
            fs.writeFileSync(path.join(MASTER, `${test}.png`), candidate);

            report.push(tab(2) + 'New master set for ' + chalk.yellow(test + '.png'));
        }
        else {
            throw 'test does not exist';
        }
    }
    else {
        throw 'test is not specified'
    }
    report.push(newline(2))

    return report.join('\n');
};
