define(function () {
	var Ultra = {};
	Ultra.Consts = {
		index : 0,
		add: function(key) {
			Ultra.Consts[key] = this.index;
			this.index++;
		}
	};

	Ultra.Enum = {
		add: function(base, key) {
			if(!Ultra.Enum[base]) {
				Ultra.Enum[base] = {
					index : 1
				};
			}
			Ultra.Enum[base].index *= 2;
			Ultra.Enum[base][key] = Ultra.Enum[base].index;
		}
	};

	return Ultra;
});