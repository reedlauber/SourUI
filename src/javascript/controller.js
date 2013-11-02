(function(sour) {
	sour.__controller = function controller(name, config, collection) {
		if(config) {
			if(name in collection) {
				throw new Error('Controller ' + name + ' already exists.');
			}

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

			collection[name] = { name:name, dependencies:dependencies, constructor:constructor };

			return sour;
		}

		return collection[name];
	};
})(window.sour);