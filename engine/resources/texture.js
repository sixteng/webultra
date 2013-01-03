define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/common/indexed_db', 'ultra_engine/resources/manager'], function(Ultra, _, Jvent) {
	Ultra.Texture = {};
	Ultra.Resources.Texture = function() {
		this.id = _.uniqueId('file');
		this.collection = {};
	};

	_.extend(Ultra.Resources.Texture.prototype, Jvent.prototype);

	Ultra.Resources.TextureManager = function(config) {
		var self = this;
		this.config = config;
		this.cache = Ultra.Resources.CacheManager;
	};

	_.extend(Ultra.Resources.TextureManager.prototype, {
		getTexture : function(name, device, config) {
			//TODO: Maybe add default settings to texture ???
			//TODO: Implement whole config chain, MAG_FILTER, FLIP, etc

			var key = _.reduce(config, function(key, param, value) { return key += '_' + param + '=' + value; }, name + '_' + device.getName());

			var tex = this.cache.get('texture', key);
			if(tex)
				return tex;

			return this.createTexture(name, key, device, config);
		},
		createTexture: function(path, key, device, config) {
			var tex = new Ultra.Resources.Texture();
			var file = Ultra.Resources.FileManager.loadFile(path);
			file.on('load', function(e, file) {
				var img = new Image();
				img.onload = function(e) {
					tex.data = device.createTexture(img, config);
					tex.emit('load', tex);
				};

				img.src = window.URL.createObjectURL(file.data);
			});

			return tex;
		}
	});
});