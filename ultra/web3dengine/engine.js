define([
	'ultra/ultra',
	'underscore',
	'Jvent',
	'ultra_engine/input_manager',
	'ultra_engine/resources/manager',
	'ultra_engine/shader_manager',
	'ultra_engine/resources/texture',
	'ultra_engine/rendersystem/rendertarget'
], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	Ultra.Web3DEngine.RenderSystem.Devices = {};

	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback, element) {
				window.setTimeout(callback, 1000/60);
			};
	})();

	Ultra.Consts.add('TRIANGLE_STRIP');
	Ultra.Consts.add('TRIANGLES');
	Ultra.Consts.add('POINTS');

	//Ultra.Web3DEngine.TRIANGLE_STRIP = 1;
	//Ultra.Web3DEngine.TRIANGLES = 2;
	//Ultra.Web3DEngine.POINTS = 3;

	//Interface for the devices, this is to make sure all functions exists for the device
	//to work correctly
	Ultra.Web3DEngine.RenderSystem.Devices.Interface = [
		'clear', 'getName', 'getType',
		'createVertexBuffer', 'createIndexBuffer',
		'deleteVertexBuffer', 'deleteIndexBuffer',
		'compilePixelShader', 'compileVertexShader',
		'compileShaderProgram', 'setShader',
		'createTexture', 'drawIndex', 'getContext'
	];

	Ultra.Web3DEngine.Engine = function(config) {
		var self = this;
		//TODO: Check that all params are included
		this.fileManager = Ultra.Resources.FileManager;
		this.textureManager = Ultra.Resources.TextureManager;
		this.cache = Ultra.Resources.CacheManager;
		this.shaderManager = new Ultra.Web3DEngine.ShaderManager(this, {});
		this.config = config;
		this.collection = {};
		this.lastTime = 0;
		this.lastFPSTime = 0;
		this.frames = 0;
		this.renderDevices = {};
	};

	_.extend(Ultra.Web3DEngine.Engine.prototype, Jvent.prototype, {
		init: function() {
			var self = this;
			for(var key in this.config.devices) {
				self.createRenderDevice(key, this.config.devices[key].device, this.config.devices[key]);
			}
		},
		run: function() {
			//TODO: Maybe check status of engine befor init on main loop ?
			this.mainloop();
		},
		setConfig: function(key, value) {
			if(!_.isString(key) && _.isUndefined(value)) {
				_.extend(this.config, key);
			} else if(_.isString(key)){
				this.config[key] = value;
			}
		},
		validateDevice: function(device) {
			for(var i = 0; i < Ultra.Web3DEngine.RenderSystem.Devices.Interface.length; i += 1) {
				if(!_.isFunction(device[Ultra.Web3DEngine.RenderSystem.Devices.Interface[i]])) {
					console.log('Device missing function ' + Ultra.Web3DEngine.RenderSystem.Devices.Interface[i]);
					return false;
				}
			}

			return true;
		},
		createRenderDevice: function(key, device, config) {
			var self = this;
			if(_.isUndefined(Ultra.Web3DEngine.RenderSystem.Devices[device])) {
				require(['ultra_engine/rendersystem/devices/webgl/device'], function(device2) {
					if(!_.isUndefined(Ultra.Web3DEngine.RenderSystem.Devices[device].Device)) self.createRenderDevice(key, device, config);
				});
				return;
			}

			this.renderDevices[key] = new Ultra.Web3DEngine.RenderSystem.Devices[device].Device(this, config);

			//validate device, and made sure it has all functions
			if(!this.validateDevice(this.renderDevices[key])) {
				delete this.renderDevices[key];
				return;
			}

			this.emit('init', this.renderDevices[key]);
		},
		createRenderTarget: function(width, height, config) {
			var renderTarget = new Ultra.Web3DEngine.RenderSystem.RenderTarget(width, height, config);
			return renderTarget;
		},
		getRenderDevice: function(key) {
			return this.renderDevices[key];
		},
		mainloop: function() {
			var timeNow = new Date().getTime();
			window.requestAnimFrame(this.mainloop.bind(this));

            var elapsed = (timeNow - this.lastTime) / 1000;
            if(elapsed < 0) elapsed = 0;
			
			for(var key in this.renderDevices) {
				this.renderDevices[key].clear(true, true, true);
				this.emit('tick', this, this.renderDevices[key], elapsed);
			}

			this.frames++;
			if(timeNow - this.lastFPSTime > 1000) {
				if(this.config.renderFPS)
					$(this.config.renderFPS).val(this.frames);

				this.lastFPSTime = timeNow;
				this.frames = 0;
			}
				
			this.lastTime = timeNow;
		}
	});
});