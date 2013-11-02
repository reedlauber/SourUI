(function(global) {
	sour.__service = function service(name, config) {
		var dependencies = [],
			constructor;

		if(config.forEach) {
			config.forEach(function(param) {
				if(typeof param === 'string') {
					dependencies.push(param);
				} else if(typeof param === 'function') {
					constructor = param;
					return false;
				}
			});
		} else if(typeof config === 'function') {
			constructor = config;
		}

		return { name:name, dependencies:dependencies, constructor:constructor };
	};
})(window.sour);
