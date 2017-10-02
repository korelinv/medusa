const openUrl = require('../support/steps/openUrl');
const captureImage = require('../support/steps/captureImage');

module.exports = function()
{

    this.Given(/^goto '(.*)'$/, openUrl);

    this.Then(/^capture '(.*)'$/, captureImage);

}
