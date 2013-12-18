$(function() {
	module('parse');

	var test_module = sour.module('test'),
		test_ctrl = sour.module('test').controller('test-ctrl', []),
		test_child_ctrl = sour.module('test').controller('test-child-ctrl', []);

	test('module should exist', function() {
		ok(test_module, 'module exists.');
	});

	test('controller should exist', function() {
		ok(test_ctrl, 'controller exists.');
	});

	test('should find ctrl', function() {
		var $div = $('<div />'),
			$ctrl = $('<div ctrl="test-ctrl" />').appendTo($div);

		test_module.parse($div);

		ok($ctrl.data('sour-ctrl'), 'controller was parsed');
	});

	test('should find data-ctrl', function() {
		var $div = $('<div />'),
			$ctrl = $('<div data-ctrl="test-ctrl" />').appendTo($div);

		test_module.parse($div);

		ok($ctrl.data('sour-ctrl'), 'controller was parsed');
	});

	test('should find parent controller', function() {
		var $div = $('<div />'),
			$ctrl = $('<div ctrl="test-ctrl" />').appendTo($div),
			$child = $('<div ctrl="test-child-ctrl" />').appendTo($ctrl);

		test_module.parse($div);

		ok($ctrl.data('sour-ctrl'), 'parent controller was parsed');
		ok($child.data('sour-ctrl'), 'child controller was parsed');
		ok($child.data('sour-ctrl').parent, 'child controller parent was associated');
	});

	test('should find child controller', function() {
		var $div = $('<div />'),
			$ctrl = $('<div ctrl="test-ctrl" />').appendTo($div),
			$child = $('<div ctrl="test-child-ctrl" />').appendTo($ctrl);

		test_module.parse($div);

		ok($ctrl.data('sour-ctrl'), 'parent controller was parsed');
		ok($child.data('sour-ctrl'), 'child controller was parsed');
		equal($ctrl.data('sour-ctrl').children.length, 1, 'controller child was associated');
	});
});
