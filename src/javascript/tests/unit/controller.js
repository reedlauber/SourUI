$(function() {
	module('controller');

	var test_module = sour.module('test');

	test('controller should exist', function() {
		var ctrl = test_module.controller('test-ctrl-1', []);

		ok(ctrl, 'controller exists');
	});

	test('controller constructor should run', function() {
		var was_run = false;

		test_module.controller('test-ctrl-2', [function() {
			was_run = true;
		}]);

		var $div = $('<div />'),
			$ctrl = $('<div ctrl="test-ctrl-2" />').appendTo($div);

		test_module.parse($div);

		ok(was_run, 'controller constructor was run');
	});

	test('controller should receive $elem dependency', function() {
		var $di_elem;

		test_module.controller('test-ctrl-3', ['$elem', function($elem) {
			$di_elem = $elem;
		}]);

		var $div = $('<div />'),
			$ctrl = $('<div ctrl="test-ctrl-3" />').appendTo($div);

		test_module.parse($div);

		ok($di_elem, '$elem dependency exists');
		equal($di_elem.length, 1, '$elem has exactly 1 DOM node');
	});

	test('should emit up node tree', function() {
		var emitted_parent = false, 
			emitted_middle = false,
			a1, a2;

		test_module.controller('test-emit-ctrl-parent', ['$elem', function($elem) {
			$elem.$on('test-event', function(a, b) {
				emitted_parent = true;
				a1 = a;
				a2 = b;
			});
		}]);

		test_module.controller('test-emit-ctrl-child', ['$elem', function($elem) {
			$elem.$on('test-event', function() {
				emitted_middle = true;
			});
		}]);

		test_module.controller('test-emit-ctrl-child-child', ['$elem', function($elem) {
			$elem.$emit('test-event', [4, 6]);
		}]);

		var $div = $('<div />'),
			$parent = $('<div ctrl="test-emit-ctrl-parent" />').appendTo($div),
			$child = $('<div ctrl="test-emit-ctrl-child" />').appendTo($parent),
			$child_child = $('<div ctrl="test-emit-ctrl-child-child" />').appendTo($child);

		test_module.parse($div);

		ok(emitted_parent, 'top controller got emitted event');
		ok(emitted_middle, 'middle controller got emitted event');
		equal(a1, 4, 'first argument as expected');
		equal(a2, 6, 'second argument as expected');
	});

	test('should broadcast down node tree', function() {
		var broadcasted_bottom = false, 
			broadcasted_middle = false,
			a1, a2,
			on_parse_complete;

		test_module.controller('test-broadcast-ctrl-parent', ['$elem', function($elem) {
			on_parse_complete = function() {
				$elem.$broadcast('test-event', [3, 5]);
			};
		}]);

		test_module.controller('test-broadcast-ctrl-child', ['$elem', function($elem) {
			$elem.$on('test-event', function() {
				broadcasted_middle = true;
			});
		}]);

		test_module.controller('test-broadcast-ctrl-child-child', ['$elem', function($elem) {
			$elem.$on('test-event', function(a, b) {
				broadcasted_bottom = true;
				a1 = a;
				a2 = b;
			});
		}]);

		var $div = $('<div />'),
			$parent = $('<div ctrl="test-broadcast-ctrl-parent" />').appendTo($div),
			$child = $('<div ctrl="test-broadcast-ctrl-child" />').appendTo($parent),
			$child_child = $('<div ctrl="test-broadcast-ctrl-child-child" />').appendTo($child);

		test_module.parse($div);

		// Have to defer broadcast, because it will run before child controller have a chance to be created.
		on_parse_complete();

		ok(broadcasted_middle, 'middle controller got broadcasted event');
		ok(broadcasted_bottom, 'bottom controller got broadcasted event');
		equal(a1, 3, 'first argument as expected');
		equal(a2, 5, 'second argument as expected');
	});
});
