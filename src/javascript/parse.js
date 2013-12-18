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