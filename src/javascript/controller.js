(function(sour) {
	function Controller(name, dependencies, constructor) {
		var self = this;
		self.name = name;
		self.dependencies = dependencies;
		self.constructor = constructor;
		self.parent = null;
		self.children = [];
		self.$elem = null;

		self.set_elem = function($elem) {
			self.$elem = $elem;

			$elem.parents().each(function() {
				if($(this).data('sour-ctrl')) {
					self.parent = $(this).data('sour-ctrl');
					self.foo = 'bar';
					self.parent.children.push(self);
					return false;
				}
			});

			$elem.data('sour-ctrl', self);

			self.$elem.emit = function(type, args) {
				if(self.parent) {
					$(self.parent).trigger(type + '--emit', args);
					self.parent.$elem.emit(type, args);
				}
			};

			self.$elem.broadcast = function(type, args) {
				self.children.forEach(function(child) {
					$(child).trigger(type + '--broadcast', args);
					child.$elem.broadcast(type, args);
				});
			};

			function handler(callback) {
				return function() {
					if(typeof callback === 'function') {
						callback.apply(this, Array.prototype.slice.call(arguments, 1));
					}
				};
			}
			self.$elem.on = function(type, callback) {
				$(self).bind(type + '--emit', handler(callback));
				$(self).bind(type + '--broadcast', handler(callback));
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

			collection[name] = new Controller(name, dependencies, constructor);

			return sour;
		}

		return collection[name];
	};
})(window.sour);