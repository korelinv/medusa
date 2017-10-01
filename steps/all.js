const fs = require('fs');
const uuidv4 = require('uuid/v4');

module.exports = function()
{
    this.Given(/^goto "(.*)"$/, function(url) {
        return this.driver.get(url);
    });

    this.Then(/^capture (.*)$/, function(selector) {

        let name = this.name;
        let driver = this.driver;
        let by = this.by;
        let crop;
        let element;

        return driver.findElement(by.css(selector))
            .then((result) => {
                element = result;
                return driver.executeScript(function(selector) {
                    document.querySelector(selector).scrollIntoView();
                }, selector);
            })
            .then(() => {
                return driver.executeScript(function(selector) {
                    return document.querySelector(selector).getBoundingClientRect();
                }, selector);
            })
            .then(({x, y, width, height}) => {
                crop = {x, y, width, height};
                return driver.takeScreenshot();
            })
            .then((data) => new Promise(function(resolve, reject) {

                let id = uuidv4();

                fs.writeFile(`shots/source/${id}.png`, data, 'base64', (err) => {
                    if (err) reject(error);

                    fs.writeFile(`shots/meta/${id}.json`, JSON.stringify(Object.assign(crop, {name, id})), 'utf8', (err) => {
                        if (err) reject(error);
                        resolve();
                    });

                });
            }));

    });
}
