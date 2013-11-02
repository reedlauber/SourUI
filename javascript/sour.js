(function(global) {
	Function.prototype.curry = Function.prototype.curry || function () {
		var fn = this, args = Array.prototype.slice.call(arguments);
		return function () {
			return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
		};
	};
	
	var sour = global.sour = {};

	sour.noop = function noop() {};
})(window);
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
(function(sour) {
	var _modules = {};

	function Module(name, dependencies) {
		var _self = this,
			_config = sour.noop,
			_controllers = {},
			_services = {},
			$module;

		_self.CLASS = 'Module';
		_self.name = name;
		_self.dependencies = dependencies;
		_self.loaded = false;
		
		_self.config = function(callback) {
			if(typeof callback === 'function') {
				_config = callback;
			}
			return _self;
		};

		_self.dependency = function(depName) {
			var dep;
			if(depName in _services) {
				dep = _services[depName];
			} else {
				_self.dependencies.some(function(modDep) {
					dep = _modules[modDep].dependency(depName);
					return !!dep;
				});
			}
			return dep;
		};

		_self.run = function() {
			if(!_self.loaded) {
				_self.config();
				_self.dependencies.forEach(function(depName) {
					if(!(depName in _modules)) {
						throw new Error('Module ' + depName + ' doesn\'t exist.');
					}
					_modules[depName].run();
				});
				_self.loaded = true;
				$(function() {
					_self.$elem = $('[module=' + _self.name + ']');
					_self.parse('body');
					_self.dependency('content_settings').parse($('.js-content').html());
				});
			}
		};

		_self.service = function(name, dependencies) {
			if(name in _services) {
				throw new Error('A dependency named ' + name + ' already exists.');
			}

			var service_def = sour.__service(name, dependencies),
				args = [];

			service_def.dependencies.forEach(function(depName) {
				if(depName === 'module') {
					args.push(_self);
				} else {
					args.push(_self.dependency(depName));
				}
			});

			_services[name] = service_def.constructor.apply(service_def, args);

			return _self;
		};

		_self.controller = function(name, dependencies) {
			if(dependencies) {
				sour.__controller(name, dependencies, _controllers);
				return _self;	
			} else {
				return _controllers[name];
			}
		};

		_self.on = function(name, handler) {
			$(_self).bind(name, handler);
		};

		_self.emit = function(name, data) {
			$(_self).trigger(name, data);
		};

		_self.parse = function(selector) {
			sour.__parse(_self, selector);
		};

		var _data_store = {};
		_self.data = function(name, value) {
			if(typeof value === 'undefined') {
				return _data_store[name];
			} else {
				_data_store[name] = value;
			}
		};
	}

	sour.module = function module(name, dependencies) {
		dependencies = dependencies || [];

		if(!(name in _modules)) {
			_modules[name] = new Module(name, dependencies);
		}

		return _modules[name];
	};
})(window.sour);
(function(sour) {
	sour.__parse = function parse(module, selector) {
		var $elem = $(selector, module.$elem),
			$parent = $elem.parent();

		$('[ctrl]', $parent).each(function() {
			var $ctrl = $(this);
			if(!$ctrl.data('sour-ctrl')) {
				var ctrlName = $ctrl.attr('ctrl'),
					ctrl = module.controller(ctrlName);

				if(ctrl) {
					$ctrl.data('sour-ctrl', ctrl);

					var args = [];
					ctrl.dependencies.forEach(function(depName) {
						if(depName === '$elem') {
							args.push($ctrl);
						} else if(depName === 'module') { 
							args.push(module);
						} else {
							args.push(module.dependency(depName));
						}
					});

					ctrl.constructor.apply(ctrl, args);
				}	
			}
		});
	};
})(window.sour);
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
