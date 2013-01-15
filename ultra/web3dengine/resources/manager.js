define(['ultra/ultra', 'underscore', 'Jvent', 'jquery', 'ultra/common/indexed_db'], function(Ultra, _, Jvent, $) {
	Ultra.Resources = {};
	Ultra.Resources.Resource = function() {
		this.id = _.uniqueId('file');
		this.collection = {};
	};

	_.extend(Ultra.Resources.Resource.prototype, Jvent.prototype);

	Ultra.Resources.CacheManager = function(config) {
		var self = this;
		this.config = config;
		this.cache = {};
	};

	_.extend(Ultra.Resources.CacheManager.prototype, {
		set : function(type, key, data) {
			if(!this.cache[type])
				this.cache[type] = {};

			//TODO: Maybe return old value ???
			this.cache[type][key] = data;
		},
		get : function(type, key) {
			if(!this.cache[type] || !this.cache[type][key])
				return null;

			return this.cache[type][key];
		},
		check : function(type, key) {
			return this.get(type, key) !== null;
		}
	});

	Ultra.Resources.CacheManager.Class = Ultra.Resources.CacheManager;
	Ultra.Resources.CacheManager = new Ultra.Resources.CacheManager({});

	Ultra.Resources.FileManager = function() {
		var self = this;
		this.config = {cache : true};
		this.files = {};
		this.db = new Ultra.IndexDB(this.db_name, 1, {
			'ultra-files': {
				keyPath: 'path',
				autoIncrement: false
			}
		});
		this.db.deleteDB(function() {
			self.db.open();
		});
	};

	_.extend(Ultra.Resources.FileManager.prototype, {
		db_name: 'ultra-files',
		loadFile: function(path, callback) {
			var self = this;
			if(!this.files[path]) {
				this.files[path] = new Ultra.Resources.Resource();
				//Check local storage
				setTimeout(function() {
					self.db.get(self.db_name, path, function(data) {
						if(!data || self.config.cache === false) return self.loadFileFromServer(path, callback);

						if(callback) callback(data);
						else self.files[path].emit('load', data);
						self.files[path] = undefined;
					});
				}, 0);
			}

			return this.files[path];
		},
		loadFileFromServer: function(path, callback) {
			var self = this;
			var xhr = new XMLHttpRequest();
			xhr.open("GET", path, true);
			xhr.responseType = "blob";

			xhr.addEventListener("load", function() {
				if(xhr.status === 200) {
					var blob = xhr.response;
					if(blob.type.indexOf('image') == -1) {
						var reader = new FileReader();

						reader.onload = function(evt) {
							var file = {
								path: path,
								data: evt.target.result,
								type: 'text'
							};
							self.db.insert(self.db_name, file, function() {
								if(callback) callback(file);
								else self.files[path].emit('load', file);
								
							});
						};
						reader.readAsText(blob);

						return;
					}

					var file = {
						path: path,
						data: blob,
						type: 'image'
					};
					self.db.insert(self.db_name, file, function() {
						if(callback) callback(file);
						else self.files[path].emit('load', file);
					});
				} else {
					if(callback) callback(false);
				}
			}, false);

			xhr.send();
		},
		loadFileAsJson: function(path) {
			var file = this.loadFile(path, function(data) {
				if(!data || data.type != 'text') ;
				try {
					var obj = JSON.parse(data.data);
					file.emit('load', obj);
					//callback(obj);
				} catch(e) {
					console.log(e);
				}
			});
			return file;
		},
		loadFileAsXml: function(path) {
			var file = this.loadFile(path, function(data) {
				if(!data || data.type != 'text') ;
				file.emit('load', $(data.data));
			}, 'xml');
			return file;
		}
	});

	Ultra.Resources.FileManager.Class = Ultra.Resources.FileManager;
	Ultra.Resources.FileManager = new Ultra.Resources.FileManager({});
});