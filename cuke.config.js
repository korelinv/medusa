const webdriver = require('selenium-webdriver');
const all = require('./steps/all.js');

module.exports = {
    steps: [
        all
    ],
    features: [
        './features/example.feature'
    ],
    options: {
        maxInstances: 1
    },
    hooks: {
        //before: () => console.log('before'),
        //after: () => console.log('after'),
        beforeTest: ({context, test}) => {
            context.name = test.name;
            context.by = webdriver.By;
            context.until = webdriver.until;
            context.driver = new webdriver.Builder()
                .forBrowser('chrome')
                .usingServer('http://localhost:4444/wd/hub')
                .build();

            return context.driver.manage().window().maximize();
        },
        afterTest: (data) => {
            return data.context.driver.close();
        },
        //testPassed: () => console.log('testPassed'),
        //testFailed: () => console.log('testFailed'),
        //beforeStep: () => console.log('beforeStep'),
        //afterStep: () => console.log('afterStep'),
        //stepPassed: () => console.log('stepPassed'),
        //stepFailed: () => console.log('stepFailed')
    }
};
