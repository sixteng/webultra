/*global JS:false, Ultra:false*/
/*
var db = new Ultra.IndexDB('test', 1, {test : {keyPath: 'id', autoIncrement: false}});
db.deleteDB(function() {
    db.open(function() {
       db.insert('test', {id : '1', text : 'hello'}, function() {
       db.getAll('test', function(data) {
        console.log(data);
       })
       });
       
    });
});
*/

//TODO: ALOT!!!

define(['ultra/ultra', 'underscore'], function(Ultra, _) {
	'use strict';
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
	var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

	Ultra.IndexDB = function(name, dbVersion, schemas) {
		this.db = null;
		this.state = false;
		this.queue = [];
		this.name = name;
		this.schemas = schemas;
		this.dbVersion = dbVersion;
	};

	Ultra.IndexDB.prototype.open = function(callback) {
		var self = this;
		var request = indexedDB.open(this.name, this.dbVersion);
		request.onsuccess = function(event) {
			self.db = request.result;

			// Interim solution for Google Chrome to create an objectStore. Will be deprecated
			if(self.db.setVersion) {
				if(self.db.version != this.dbVersion) {
					var setVersion = self.db.setVersion(this.dbVersion);
					setVersion.onsuccess = function() {
						self.onupgradeneeded(self.db);
						self.state = true;

						if(self.queue.length !== 0) {
							for(var i in self.queue) {
								self[self.queue[i].func].apply(self, self.queue[i].args);
							}
						}

						if(callback) callback();
					};

					return;
				}
			}

			self.state = true;
			if(self.queue.length !== 0) {
				for(var i in self.queue) {
					self[self.queue[i].func].apply(self, self.queue[i].args);
				}
			}

			if(callback) callback();
		};

		request.onupgradeneeded = function(event) {
			self.onupgradeneeded(event.target.result);
		};
	};

	Ultra.IndexDB.prototype.deleteDB = function(callback) {
		var req = indexedDB.deleteDatabase(this.name);
		req.onsuccess = function(e) {
			if(callback) callback();
		};

		req.onerror = function(e) {
			console.log(e);
		};
	};

	Ultra.IndexDB.prototype.onupgradeneeded = function(db) {
		for(var key in this.schemas) {
			db.createObjectStore(key, this.schemas[key]);
		}
	};

	Ultra.IndexDB.prototype.checkDB = function(func, args) {
		if(this.state) return true;


		this.queue.push({
			func: func,
			args: args
		});

		return false;
	};

	Ultra.IndexDB.prototype.get = function(table, key, callback) {
		if(!this.checkDB('get', arguments)) return;

		try {
			var transaction = this.db.transaction([table], IDBTransaction.READ_ONLY);
			var request = transaction.objectStore(table).get(key);

			var data = [];
			request.onsuccess = function(e) {
				var result = e.target.result;

				if( result === false || result === null) return callback(false);

				if(callback) callback(result);
			};
		} catch(e) {
			console.log(e);
		}
	};

	Ultra.IndexDB.prototype.getAll = function(table, callback) {
		if(!this.checkDB('getAll', arguments)) return;

		try {
			var transaction = this.db.transaction([table], IDBTransaction.READ_ONLY);
			var request = transaction.objectStore(table).openCursor();

			var data = [];
			transaction.oncomplete = function() {
				if(callback) callback(data);
			};

			request.onsuccess = function(e) {
				var result = e.target.result;
				if( result === false || result === null || _.isUndefined(result)) return;

				data.push(result.value);

				result.continue();
			};
		} catch(e) {
			console.log(e);
		}
	};

	Ultra.IndexDB.prototype.insert = function(table, data, callback) {
		if(!this.checkDB('insert', arguments)) return;

		var transaction = this.db.transaction([table], IDBTransaction.READ_WRITE);
		var store = transaction.objectStore(table);
		var request = store.put(data);
		request.onsuccess = callback;
	};
});