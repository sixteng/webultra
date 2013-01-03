// Start the main app logic.


requirejs.onError = function (err) {
    console.log(err);
    if (err.requireType === 'timeout') {
        console.log('modules: ' + err.requireModules);
    }

    throw err;
};

define(['ultra', 'Jvent', 'ultra_engine/mainengine'], function(ultra) {
	return ultra;
});