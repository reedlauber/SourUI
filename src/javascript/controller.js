(function(sour) {
	function Controller(name, dependencies, constructor) {
		var self = this;
		self.name = name;
		self.dependencies = dependencies;
		self.constructor = constructor;
		self.parent = null;
		self.children = [];
		self.$elem = null;

		self.set_child = function(child) {
			child.parent = self;
			self.children.push(child);
		};

		self.set_elem = function($elem) {
			self.$elem = $elem;

			$elem.parents().each(function() {
				if($(this).data('sour-ctrl')) {
					$(this).data('sour-ctrl').set_child(self);
					return false;
				}
			});

			$elem.data('sour-ctrl', self);

			self.$elem.$emit = function(type, args) {
				if(self.parent) {
					$(self.parent).trigger(type, args);
					self.parent.$elem.$emit(type, args);
				}
			};

			self.$elem.$broadcast = function(type, args) {
				self.children.forEach(function(child) {
					$(child).trigger(type, args);
					child.$elem.$broadcast(type, args);
				});
			};

			function handler(callback) {
				return function() {
					if(typeof callback === 'function') {
						callback.apply(this, Array.prototype.slice.call(arguments, 1));
					}
				};
			}
			self.$elem.$on = function(type, callback) {
				$(self).bind(type, handler(callback));
			};
		};
	}

	sour.__controller = function controller(name, config, collection) {
		if(config) {
			if(name in collection) {
				throw new Error('Controller ' + name + ' already exists.');
			}

			var dependencies = [],
				constructor = sour.noop;

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

		if(collection[name]) {
			var def = collection[name];
			return new Controller(def.name, def.dependencies, def.constructor);
		}
	};
})(window.sour);