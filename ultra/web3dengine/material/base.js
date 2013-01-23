define(['ultra/ultra', 'underscore', 'Jvent'], function(Ultra, _, Jvent) {
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Material))
		Ultra.Web3DEngine.Material = {};

	Ultra.Web3DEngine.Material.Base = function() {
		this.transparent = false;
		this.light = false;
		this.affectedByLight = true;
	};

	_.extend(Ultra.Web3DEngine.Material.Base.prototype, {
		isOpaque: function() {
			return !this.transparent;
		},
		isTransparent: function() {
			return this.transparent;
		},
		isLight: function() {
			return this.light;
		}
	});
});