define(['ultra/ultra', 'underscore'], function(Ultra, _) {
	if(_.isUndefined(Ultra.Web3DEngine)) {
		Ultra.Web3DEngine = {};
	}

	if(_.isUndefined(Ultra.Web3DEngine.RenderSystem)) {
		Ultra.Web3DEngine.RenderSystem = {};
	}

	Ultra.Web3DEngine.RenderSystem.RenderTarget = function( width, height, config) {
		this.config = config;
		
		_.defaults(config, {
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.UByteType,
			magFilter : Ultra.Consts.LinearFilter,
			minFilter : Ultra.Consts.LinearMipMapLinearFilter,
			wrap_s : Ultra.Consts.RepeatWrap,
			wrap_t : Ultra.Consts.RepeatWrap,
			mipmap : false,
			depthBuffer : true,
			stencilBuffer : true
		});

		this.width = width;
		this.height = height;

		this.data = {};
		this.devices = {};
	};

	_.extend(Ultra.Web3DEngine.RenderSystem.RenderTarget.prototype, {

	});
});