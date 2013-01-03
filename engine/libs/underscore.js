requirejs.config({
	shim: {
		'ultra_engine/libs/underscore.min': {
			exports: '_'
		}
	}
});

define(['ultra_engine/libs/underscore.min'], function(){
	return _;
});