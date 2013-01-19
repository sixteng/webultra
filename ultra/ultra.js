define(function () {
	var Ultra = {};
	Ultra.Consts = {
		index : 0,
		add: function(key) {
			Ultra.Consts[key] = this.index;
			this.index++;
		}
	};

	return Ultra;
});