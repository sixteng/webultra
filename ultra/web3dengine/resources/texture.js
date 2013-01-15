define(['ultra/ultra', 'underscore', 'Jvent', 'ultra/common/indexed_db', 'ultra_engine/resources/manager'], function(Ultra, _, Jvent) {

	Ultra.Resources.Texture = function(config) {
		this.id = _.uniqueId('file');
		this.data = {};

		//TODO: Maybe add default settings to texture ???
		//TODO: Implement whole config chain, MAG_FILTER, FLIP, etc

		this.config = config;
		this.collection = {};
	};

	_.extend(Ultra.Resources.Texture.prototype, Jvent.prototype);

	Ultra.Resources.Texture.Formats = {
		RGB : 0,
		RGBA : 1
	};

	Ultra.Resources.TextureManager = function(config) {
		var self = this;
		this.config = config;
		this.cache = Ultra.Resources.CacheManager;
	};

	_.extend(Ultra.Resources.TextureManager.prototype, {
		getTexture : function(name, config) {

			var key = _.reduce(config, function(key, param, value) { return key += '_' + param + '=' + value; }, name);

			var tex = this.cache.get('texture', key);
			if(tex) {
				return tex;
			}

			return this.createTexture(name, key, config);
		},
		createTexture: function(path, key, config) {
			var tex = new Ultra.Resources.Texture(config);
			var file = Ultra.Resources.FileManager.loadFile(path);
			file.on('load', function(e, file) {
				var img = new Image();
				img.onload = function(e) {
					tex.data.raw = img;
					tex.emit('load', tex);
				};

				img.src = window.URL.createObjectURL(file.data);
			});
			this.cache.set('texture', key, tex);
			return tex;
		}
	});

	Ultra.Resources.TextureManager.Class = Ultra.Resources.TextureManager;
	Ultra.Resources.TextureManager = new Ultra.Resources.TextureManager({});
});