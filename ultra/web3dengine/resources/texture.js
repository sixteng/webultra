define(['ultra/ultra', 'underscore', 'Jvent', 'ultra/common/indexed_db', 'ultra_engine/resources/manager'], function(Ultra, _, Jvent) {
	Ultra.Resources.Texture = function(config) {
		this.id = _.uniqueId('file');
		this.data = {};

		if(!config)
			config = {};

		_.defaults(config, {
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.UByteType,
			magFilter : Ultra.Consts.LinearFilter,
			minFilter : Ultra.Consts.LinearMipMapLinearFilter,
			wrap_s : Ultra.Consts.RepeatWrap,
			wrap_t : Ultra.Consts.RepeatWrap
		});

		this.config = config;
		this.collection = {};
	};

	_.extend(Ultra.Resources.Texture.prototype, Jvent.prototype);

	Ultra.Resources.TextureCube = function(textures, config) {
		this.id = _.uniqueId('file');
		this.textures = textures;
		this.data = {};

		if(!config)
			config = {};

		_.defaults(config, {
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.UByteType,
			magFilter : Ultra.Consts.LinearFilter,
			minFilter : Ultra.Consts.LinearMipMapLinearFilter,
			wrap_s : Ultra.Consts.RepeatWrap,
			wrap_t : Ultra.Consts.RepeatWrap
		});

		this.config = config;
		this.textures_loaded = 0;
		this.collection = {};

		for(var i = 0; i < this.textures.length; i++)
			this.textures[i].on('load', this.onTextureLoaded.bind(this));

	};

	_.extend(Ultra.Resources.TextureCube.prototype, Jvent.prototype, {
		onTextureLoaded: function() {
			this.textures_loaded++;
			if(this.textures_loaded != this.textures.length)
				return;

			this.data.raw = [];
			for(var i = 0; i < this.textures.length; i++)
				this.data.raw.push(this.textures[i].data.raw);
		}
	});

	Ultra.Consts.add('RGBFormat');
	Ultra.Consts.add('RGBAFormat');
	Ultra.Consts.add('FloatType');
	Ultra.Consts.add('UByteType');
	Ultra.Consts.add('NearestFilter');
	Ultra.Consts.add('NearestMipMapNearestFilter');
	Ultra.Consts.add('NearestMipMapLinearFilter');
	Ultra.Consts.add('LinearFilter');
	Ultra.Consts.add('LinearMipMapNearestFilter');
	Ultra.Consts.add('LinearMipMapLinearFilter');
	Ultra.Consts.add('RepeatWrap');
	Ultra.Consts.add('ClampWrap');
	Ultra.Consts.add('MirroredWrap');

	Ultra.Resources.TextureManager = function(config) {
		var self = this;
		this.config = config;
		this.cache = Ultra.Resources.CacheManager;
	};

	_.extend(Ultra.Resources.TextureManager.prototype, {
		getTextureCube : function(images, config) {
			var tex = [];
			for(var i = 0; i < images.length; i++)
				tex.push(this.getTexture(images[i], config));

			return new Ultra.Resources.TextureCube(tex, config);
		},
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