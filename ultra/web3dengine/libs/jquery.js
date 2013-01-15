requirejs.config({
	shim: {
		'ultra_engine/libs/jquery.min': {
			exports: '$'
		}
	}
});

define(['ultra_engine/libs/jquery.min'], function(){
	return $;
});