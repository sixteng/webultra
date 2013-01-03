define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/input_manager', 'ultra_engine/resources/manager', 'ultra_engine/mesh/mesh', 'ultra_engine/shader_manager'], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	Ultra.Web3DEngine.Devices = {};

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

	Ultra.Web3DEngine.TRIANGLE_STRIP = 1;
	Ultra.Web3DEngine.TRIANGLES = 2;

	Ultra.Web3DEngine.Engine = function(config) {
		var self = this;
		//TODO: Check that all params are included
		this.fileManager = Ultra.Resources.FileManager;
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
		createRenderDevice: function(key, device, config) {
			var self = this;
			if(_.isUndefined(Ultra.Web3DEngine.Devices[device])) {
				require(['ultra_engine/devices/webgl/device'], function(device2) {
					if(!_.isUndefined(Ultra.Web3DEngine.Devices[device].Device)) self.createRenderDevice(key, device, config);
				});
				return;
			}

			this.renderDevices[key] = new Ultra.Web3DEngine.Devices[device].Device(this, config);
			this.emit('init', this.renderDevices[key]);
		},
		getRenderDevice: function(key) {
			return this.renderDevices[key];
		},
		mainloop: function() {
			var timeNow = new Date().getTime();
			window.requestAnimFrame(this.mainloop.bind(this));

            var elapsed = timeNow - this.lastTime;
            if(elapsed < 0) elapsed = 0;
			
			for(var key in this.renderDevices) {
				this.renderDevices[key].clear();
				this.emit('tick', this, this.renderDevices[key], elapsed);
			}

			this.frames++;
			if(timeNow - this.lastFPSTime > 1000) {
				console.log(this.frames);
				this.lastFPSTime = timeNow;
				this.frames = 0;
			}
				
			this.lastTime = timeNow;
		}
	});
});