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