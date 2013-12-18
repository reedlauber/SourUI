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
			sour.__parse(selector, _self);
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
	sour.__parse = function parse(selector, module) {
		var $elem = $(selector, module.$elem),
			$parent = $elem.parent();

		if(!$parent.length) {
			$parent = $elem;
		}

		$('[ctrl], [data-ctrl]', $parent).each(function() {
			var $ctrl = $(this);
			if(!$ctrl.data('sour-ctrl')) {
				var ctrl_name = $ctrl.attr('ctrl') || $ctrl.attr('data-ctrl'),
					ctrl = module.controller(ctrl_name);

				if(ctrl) {
					ctrl.set_elem($ctrl);

					var args = [];
					ctrl.dependencies.forEach(function(dep_name) {
						if(dep_name === '$elem') {
							args.push($ctrl);
						} else if(dep_name === 'module') { 
							args.push(module);
						} else {
							args.push(module.dependency(dep_name));
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
