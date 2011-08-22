/** @namespace */
var Sour = {};

(function(Sour, $) {	
	/* Miscellaneous Static Values */
	
	/**
	 * Quick, named access to common keyboard codes
	 */
    Sour.KeyCode = {
        BACKSPACE:  8,
        TAB:        9,
        ENTER:     13,
        LEFT:      37,
        UP:        38,
        RIGHT:     39,
        DOWN:      40,
        DELETE:    46,
        PERIOD:   190
    };

	/* Prototypal "Sugar" Functions */
    Function.prototype.curry = Function.prototype.curry || function () {
        var fn = this, args = Array.prototype.slice.call(arguments);
        return function () {
            return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
        };
    };

	// Checks if a string starts with a given string of characters
    String.prototype.startsWith = String.prototype.startsWith || function(chars) {
        return this && this.length && this.indexOf(chars) === 0;
    };
	
	/* === UTIL === */
	/** 
	 * @namespace
	 */
	Sour.Util = {};
	
	// "private" local variable for internal usage.
	var _u = {};
	
    /** 
     * Quick utility to either get an existing element by ID, or create it if not.
     * Takes either the id, and target inside of which it should exist (or be added), 
     * or an object with "id", "target", "type", etc properties (often an options object).
	 *
	 * @param {String|Object} id An element id to use to find the element, or an object containing the "id", "target" and "type" params.
	 * @param {String} [target] A context to limit the scope of the search.
	 * @param {String} [type] The html node type. Defaults to <div>.
	 * @param {String} [html] Default innerHtml for the element that is created.
	 * @returns {jQuery} jQuery object containg the element that was just found or created.
	 */
    Sour.Util.getOrCreate = function (id, target, type, html) {
		// If we have an object for the first argument, split it out into named values
        if(typeof id === 'object') {
            target = id.target;
            type = id.type;
            id = id.id; // must be set last
        }
		target = target || 'body';
		// By default, a <div> will be created
        type = type || 'div';
		// Selector to check for existing. Can pass in a falsey id, and look up an element by node type.
        var selector = id ? '#' + id : type; // look up by type if not by ID
        var $c = $(selector, target);
        if(!$c.length) {
            $c = $('<' + type + ' />', { id: id }).appendTo(target).html(html || '');
        }
        return $c;
    };

    /**
	 * Safely parses a String or Date to a Date object.
	 * 
	 * @param {String|Date} toParse The date-parsable string value, or a Date if you don't know which it is.
	 * @returns {Date} The date parsed from the supplied string.
	 */
    Sour.Util.parseDate = function (toParse) {
        if(toParse.getDate) { // If we already have a date object, just return it.
            return toParse;
        } else if(typeof toParse === 'string') {
            var ts = Date.parse(toParse);
            if(!ts) {
                ts = Date.parse(toParse.replace(/\-/ig, '/').replace(/T/g, ' ').split('.')[0]); // IE date parsing
            }
            if(ts) {
                return new Date(ts);
            }
        }
    };

	/**
	 * Decodes a URL-encoded string.
	 * 
	 * @param {String} url The URL string to decode
	 * @param {Number} [count] Number of time to decode, for string that are encoded multiple times.
	 * @returns {String} The decoded url.
	 */
    Sour.Util.decodeUrl = function(url, count) {
        var decoded = window.decodeURIComponent(url);
        count = count || 0;
        if(count < 2 && (decoded.indexOf('%2F') > -1 || decoded.indexOf('%25') > -1)) {
            return Sour.Util.decodeUrl(decoded, ++count);
        }
        return decoded;
    };

	/**
	 * Finds the (0-based) position of an object in an array based on a single property value; usually an ID.
	 *
	 * @param {Number|String} val The value on which to match.
	 * @param {Array} array The array to search.
	 * @param {String} [prop] The property name in each object in the array on which to search. Defaults to "id"
	 * @returns {Number} The 0-based position of the matched object in the array, or -1 of not found.
	 */
    Sour.Util.positionInArray = function (val, array, prop) {
        var idx = -1;
        if(array && array.length) {
			prop = prop || 'id';
            $.each(array, function (i, o) {
                if(o[prop] === val) {
                    idx = i;
                    return false;
                }
            });
        }
        return idx;
    };

	/**
	 * Finds an object in a one-dimensional array based on a single property value; usually an ID.
	 *
	 * @param {Number|String} val The value on which to match.
	 * @param {Array} array The array to search.
	 * @param {String} [prop] The property name in each object in the array on which to search. Defaults to "id"
	 * @param {Object} Returns the matched object, or undefined.
	 */
    Sour.Util.objFromArray = function (val, array, prop) {
        var obj, idx = Sour.Util.positionInArray(val, array, prop);

        if(idx > -1) {
            obj = array[idx];
        }

        return obj;
    };
	
	/**
	 * Gets or sets a http cookie value.
	 *
	 * @param {String} name The name of the cookie
	 * @param {Mixed} [val] The value of the cookie. If undefined, cookie value be returned instead of set.
	 * @param {Object} [opts] Additional configuration values for setting a cookie value.
	 * @param opts.expires
	 * @param opts.path
	 * @param opts.domain
	 * @param opts.secure
	 */
    Sour.Util.cookie = function(name, val, opts) {
        if(val === undefined) { // if no value, it's a "get"
            if(document.cookie) {
                var cookies = document.cookie.split(';');
                for(var i = 0, len = cookies.length; i < len; i++) {
                    var cookie = $.trim(cookies[i]);
                    if(cookie.startsWith(name+'=')) {
                        val = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
                return val;
            }
        } else { // if we have a value, it's a "set"
            opts = opts || {};
            if(val === null) { val = ''; }
            var expires = ''
            if(opts.expires) {
                var date;
                if(opts.expires.getDate) {
                    date = opts.expires;
                } else if(typeof opts.expires === 'number') {
                    date = new Date();
                    date.setTime(date.getTime() + (opts.expires * 86400000)); // 8640000 = days (1000 * 60 * 60 * 24)
                }
                if(date) {
                    expires = '; expires=' + date.toUTCString();
                }
            }

            var path = opts.path ? '; path=' + (opts.path) : '',
                domain = opts.domain ? '; domain=' + (opts.domain) : '',
                secure = opts.secure ? '; secure' : '';
            // Write cookie value
            document.cookie = name + '=' + encodeURIComponent(val) + expires + path + domain + secure;
        }
    };
	
	// Dialog and Overlay
	_u.$overlay = $('.sour-overlay');
	_u.$dialog = $('.sour-dialog-fake'); // Use a fake class name just to get an empty jQuery object, so we can safely run functions on it
	
	_u.ensureOverlay = function() {
		if(!_u.$overlay.length) {
			_u.$overlay = $('<div class="sour-overlay" />').appendTo('body');
		}
	};
	
	/**
	 * Hides any open Sour UI dialogs.
	 */
    Sour.Util.closeDialog = function() {
		_u.$dialog.remove();
        _u.$overlay.hide();
    };

	/**
	 * Creates and opens a very simple modal dialog that is centered.
	 * 
	 * @param {String} html Content to display within the dialog.
	 * @param {Boolean} [closable] Sets whether an icon to close the dialog is added to the top-right corner.
	 * @returns {jQuery} jQuery object representing the dialog. 
	 */
	Sour.Util.simpleDialog = function (html, closable) {
        _u.$overlay.height($(document).height()).show();
        _u.$dialog = $('<div class="sour-corner-all sour-dialog-simple">' + (html || '') + '</div>').appendTo('body');
        _u.$dialog.css({
            'margin-top': '-' + (_u.$dialog.outerHeight() / 2) + 'px',
            'margin-left': '-' + (_u.$dialog.outerWidth() / 2) + 'px'
        });
        if(closable) {
            $('<span class="ui-icon ui-icon-close"></span>').appendTo(_u.$dialog).click(function () {
                Sour.Util.closeDialog();
            });
        }
        return _u.$dialog;
	};
	/* === /UTIL === */
	
	
	
	/* === DATA === */
	/** @namespace */
	Sour.Data = {};
	
	/** 
	  * Prefix to use before all Ajax service requests. E.g '/services/
	  * This allows all Ajax requests through sour to use simplified endpoint names. E.g 'users'
	  */
	Sour.Data.ajaxPathPrefix = '';
	/**
	 * Sets whether to actually use HTTP methods for operations or just use GET and POST, and pass others as a special param "_method"
	 * This allows for everything to work if the browser/web server setup doesn't handle all HTTP methods correctly, 
	 * but is not technically correct in REST, and the server-side handling needs to catch this special param.
	 */
	Sour.Data.safeHttpMethods = false;
	Sour.Data.safeHttpMethodName = '_method';
	
	// "private" local variable for internal usage.
	var _d = {};
	
    // generic ajax wrapper, handles default values and behaviors for this app without having to define full jQuery ajax request each time
    _d.ajax = function (url, method, data, success, error, customParams) {
        // this removes nulls because they serialize as "null" not "", which will be interpreted as a string.
        if (data && typeof data === 'object') {
            $.each(data, function (p, v) {
                if (v === null) {
                    data[p] = undefined;
                }
            });
        }

        function errorFn(resp, status) {
            // This object gets passed through the custom error function so it can communicate back
            var errEvt = { message: true, resp: resp };
            if (error && typeof error === 'function') {
                error.call(Sour.Data, errEvt);
            }
            if (errEvt.message && status !== 'abort') {
                $(Sour).trigger('message', [resp.message || 'Something bad happened with your request.', { error: true}]);
            }
        }

        var ajaxOpts = $.extend({
            url: Sour.Data.ajaxPathPrefix + url,
            type: method,
            data: data,
            dataType: 'json',
            success: function (resp) {
                if (resp && resp.success === false) {
                    errorFn(resp);
                } else if (success && typeof success === 'function') {
                    success.call(Sour.Data, resp);
                }
            },
            error: errorFn
        }, customParams);

        return $.ajax(ajaxOpts);
    };

    // quick method type wrappers for different request types
    Sour.Data.get = function (url, params, success, error, customParams) {
        params = params || {};
        _d.ajax(url, 'GET', params, success, error, customParams);
    };
    Sour.Data.post = function (url, params, success, error, customParams) {
        _d.ajax(url, 'POST', params, success, error, customParams);
    };
    Sour.Data.put = function (url, params, success, error, customParams) {
        params = params || {};
		var method = 'PUT'
		if(Sour.Data.safeHttpMethods) {
			mthod = 'POST';
        	params[Sour.Data.safeHttpMethodName] = 'PUT';
		}
        _d.ajax(url, method, params, success, error, customParams);
    };
    Sour.Data.del = function (url, params, success, error, customParams) {
        params = params || {};
		var method = 'DELETE';
		if(Sour.Data.safeHttpMethods) {
			method = 'POST';
        	params[Sour.Data.safeHttpMethodName] = 'DELETE';
		}
        _d.ajax(url, method, params, success, error, customParams);
    };
    // helper function to switch between POST and PUT more easily, and allow for currying below
    Sour.Data.save = function (url, params, success, error, customParams) {
        params = params || {};
        _d[params.id ? 'post' : 'put'](url, params, success, error, customParams);
    };

	// Currying examples:
	// MyApp.Data.getUsers = Sour.Data.get.curry('/users');
	// MyApp.Data.getUser = Sour.Data.get.curry('/user'); -- Assumes some kind of ID parameter as first argument
	// MyApp.Data.createUser = Sour.Data.put.curry('/user'); -- Assumes payload to create a user as first argument
	// MyApp.Data.updateUser = Sour.Data.post.curry('/user'); -- Assumes payload to update a user as first argument
	// MyApp.Data.deleteUser = Sour.Data.del.curry('/user'); -- Assumes some kind of ID parameter as first argument
	
    // Calls to "static" data
    Sour.Data.Months = [
        { id: '01', text: 'January', shorttext: 'Jan' },
        { id: '02', text: 'February', shorttext: 'Feb' },
        { id: '03', text: 'March', shorttext: 'Mar' },
        { id: '04', text: 'April', shorttext: 'Apr' },
        { id: '05', text: 'May', shorttext: 'May' },
        { id: '06', text: 'June', shorttext: 'Jun' },
        { id: '07', text: 'July', shorttext: 'Jul' },
        { id: '08', text: 'August', shorttext: 'Aug' },
        { id: '09', text: 'September', shorttext: 'Sep' },
        { id: '10', text: 'October', shorttext: 'Oct' },
        { id: '11', text: 'November', shorttext: 'Nov' },
        { id: '12', text: 'December', shorttext: 'Dec' }
    ];

	/**
	 * Gets an array of months in the pattern of other Sour Data Ajax requests.
	 * @param {Function} success Callback function into which an Array of months will be passed
	 */
    Sour.Data.getMonths = function (success) {
        if (typeof success === 'function') {
            success(Sour.Data.Months);
        }
    };
	/* === /UTIL === */
	
	
	
	
	/* === FORMAT === */
	/** @namespace */
	Sour.Format = {};

	/**
	 * Formats a numeric value to US dollars notation
	 *
	 * @param {Number} val The value to format.
	 * @param {Boolean} [truncate] Optional setting whether formatted values that end in "00" should have cents removed to get whole dollars. Defaults to false
	 * @returns {String} US dollars-formatted string value.
	 */
    Sour.Format.money = function (val, truncate) {
        if (typeof val === 'number') {
            var s = val.toFixed(2).split('.');
            var p = s[0], d = s[1];
            var n = '';
            if (p.length > 3) {
                while (p) {
                    if (n) { n = ',' + n; }
                    n = p.substr(p.length - 3) + n;
                    p = p.substr(0, p.length - 3);
                }
            } else {
                n = p;
            }
            return '$' + n + ((truncate && d === '00') ? '' : '.' + d);
            return '$' + n;
        }
        return val;
    };

	/**
	 * Formats a Date (or date-parsable string) to HH:MM:AM notation
	 *
	 * @param {Date|String} val The Date or date-parsable string value to format.
	 * @returns {String} A time representation of the supplied date.
	 */
    Sour.Format.time = function (val) {
        var dt = DB.Util.parseDate(val);
        if (dt) {
            var mins = val.getMinutes(), hours = val.getHours(), ampm = 'AM';
            if (mins < 10) { mins = '0' + mins; }
            if (hours === 0) { hours = 12; }
            else if (hours >= 12) {
                if (hours > 12) { hours -= 12; }
                ampm = 'PM';
            }
            return hours + ':' + mins + ' ' + ampm;
        }
        return '';
    };

	/**
	 * Formats a Date object (or date-parsable string) to MM/DD/YYYY notation.
	 *
	 * @param {Date|String} val The Date or date-parsable string value to format.
	 * @returns {String} A human-friendly string version of the supplied date.
	 */
    Sour.Format.date = function (val) {
        var dt = Sour.Util.parseDate(val);
        if (dt) {
            return (dt.getMonth() + 1) + '/' + dt.getDate() + '/' + dt.getFullYear();
        }
        return '';
    };

	/**
	 * Formats a Date object (or date-parsable string) to MM/DD/YYYY HH:MM:AM notation.
	 *
	 * @param {Date|String} val The Date or date-parsable string value to format.
	 * @returns {String} A human-friendly string version of the supplied date.
	 */
    Sour.Format.datetime = function (val) {
        var dt = Sour.Util.parseDate(val);
        if (dt) {
            return Sour.Format.date(dt) + ' ' + Sour.Format.time(dt);
        }
    };

	/**
	 * Formats a Date object (or date-parsable string) to a more friendly "N units from now" notation.
	 *
	 * @param {Date|String} val The Date or date-parsable string value to format.
	 * @param {Date} [now] Optional current date so that a new one doesn't have to be created. Helpful if used in a large loop.
	 * @returns {String} A friendly text version of the future date.
	 */
    Sour.Format.futureDate = function (val, now) {
        now = now || new Date();
        var t = '',
            end = Sour.Util.parseDate(val);
        if (end) {
            var diff = end - now.getTime();
            var days = Math.floor(diff / 86400000),
                    hours = Math.floor((diff - (days * 86400000)) / 3600000),
                    minutes = Math.floor((diff - (days * 86400000) - (hours * 3600000)) / 60000);

            t = (days ? days + ' day' + (days === 1 ? '' : 's') + ' ' : '') +
                        (hours ? hours + ' hour' + (hours === 1 ? '' : 's') + ' ' : '') +
                        ((!days && minutes) ? minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ' : '');
        }
        return t;
    };

    // Adapted from:
    /*
    * JavaScript Pretty Date
    * Copyright (c) 2008 John Resig (jquery.com)
    * Licensed under the MIT license.
    */
    /**
	 * Formats a Date (or date-parsable string) to a more friendly "N units ago" notation.
	 * If the date is more than a month old, it falls back to MM/DD/YYYY notation.
	 *
	 * @param {Date|String} val The Date or date-parsable string to format.
	 * @returns {String} A friend text version of the date.
	 */
    Sour.Format.prettyDate = function (val) {
        var date = DB.Util.parseDate(val),
		    diff = (((new Date()).getTime() - date.getTime()) / 1000),
		    day_diff = Math.floor(diff / 86400);

        if(isNaN(day_diff) || day_diff < 0 || day_diff >= 31) {
            return Sour.Format.date(val);
        }

        return day_diff == 0 && (diff < 60 && "just now" ||
			    diff < 120 && "1 minute ago" ||
			    diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
			    diff < 7200 && "1 hour ago" ||
			    diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
		    day_diff == 1 && "Yesterday" ||
		    day_diff < 7 && day_diff + " days ago" ||
		    day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago" ||
            Sour.Format.date(date);
    };
	
	/**
	 * Normalizes a string value that may be stored in many different formats to standard US "(123) 456-7890" notation.
	 *
	 * @param {String} val The value to format.
	 * @param {String} [style="standard"] Optional format style. Values: {standard|dot|dash} Defaults to standard
	 * @returns {String} A phone number in standardizes format.
	 */
    Sour.Format.phoneNumber = function (val, style) {
		style = style || 'standard';
        var t = '',
			sep = style === 'dot' ? '.' : '-';
        if (typeof val === 'string') {
            val = val.replace(/[ -\.]/ig, '');
            var len = val.length;
            t = val;
            if (len === 7) {
                t = val.substr(0, 3) + sep + val.substr(3);
            } else if (len === 10) {
				if(style === 'standard') {
                	t = '(' + val.substr(0, 3) + ') ' + val.substr(3, 3) + sep + val.substr(6);
				} else {
					t = val.substr(0, 3) + sep + val.substr(3, 3) + sep + val.substr(6);
				}
            }
        }
        return t;
    };
	/* === /FORMAT === */
	
	
	
	/* === FORM === */
	/** @namespace */
	Sour.Form = {};
	
	// "private" local variable for internal usage.
	var _f = {};

    // Adds handling for a "placeholder" (default text) that appears/disappears on focus and blur
    _f.setupPlaceholder = function(def, $field) {
        $field.focus(function () {
            if ($(this).hasClass('sour-input-placeholder')) {
                $(this).val('').removeClass('sour-input-placeholder');
            }
        }).blur(function () {
            if (!$(this).val()) {
                $(this).addClass('sour-input-placeholder').val(def.placeholder);
            }
        }).val('').blur();
    }

    // Handles keyboard events for text inputs
    _f.setupKeyHandlers = function(def, $field) {
        $field.keyup(function (evt) {
            if (evt.keyCode === Sour.KeyCode.ENTER) {
                $field.trigger('keyenter', [evt]);
            }
        });
    }

    // Non-numeric key presses allowed for a numeric field
    _f.allow = (function (ch) {
        return [ch.BACKSPACE, ch.DELETE, ch.LEFT, ch.RIGHT, ch.TAB];
    })(Sour.KeyCode);
    // Prevents entering characters other than those needed for floating point number
    _f.restrictToNumbers = function(def, $field, places) {
        $field.keydown(function (evt) {
            if ($.inArray(evt.which, _f.allow) === -1) {
                var val = $(this).val(),
                    periodIdx = val.indexOf('.');
                if (evt.which === Sour.KeyCode.PERIOD) {
                    if (places < 1 || periodIdx > -1) {
                        return false;
                    }
                } else if (evt.which < 48 || evt.which > 57) {
                    return false;
                } else if (periodIdx > -1 && (val.length - periodIdx > places)) {
                    return false;
                }
            }
        });
    }
	
    // Loops over an array of fields and applies whatever field features are applicable
    _f.setupFields = function(fields, opts) {
        $.each(fields, function (i, field) {
			var context = opts.context || 'body',
                type = def.type || 'text',
				$field = $('#' + field.id, context);

            if($field.length) {
                var places = def.places || 0;
                if (type === 'money') {
                    type = 'number';
                    places = 2;
                }

                if(field.required && !opts.nolabels) {
                    var $label = $('label[for=' + field.id + ']', context);
                    if($label.length && !$('.sour-required-label', $label).length) {
                        $label.append('<span class="sour-required-label">Required</span>');
                    }
                }

                if ($field.length) {
                    switch (type) {
                        case 'date':
                            _f.setupDate(field, $field);
                            break;
                        case 'number':
                            _f.restrictToNumbers(field, $field, places);
                            break;
                        case 'text':
                            // setup keyboard events
                            _f.setupKeyHandlers(field, $field);
                            break;
                        default: break;
                    }

                    // setup watermark (default text)
                    if (field.placeholder) {
                        _f.setupPlaceholder(field, $field);
                    }
                }
            }
        });
    }
	
	// this = fieldDef
	Sour.Form.types = {
		yesno: {
			'get': function($field) {
	            return $field.is(':checked');
			},
			'set': function($field, val, dataObj) {
				if(val) { $field.attr('checked', 'checked'); }
			}
		},
		_default: {
			'get': function($field) {
				return $field.val();
			},
			'set': function($field, val, dataObj) {
				$field.val(val);
			}
		}
	};
	
    Sour.Form.getValues = function (fields, data) {
        var retVal = $.extend(true, {}, data);
        $.each(fields, function (i, field) {
			if(field.prop && !field.readonly) {
				var type = field.customType || field.type || 'text',
					val = (Sour.Form.types[type] || Sour.Form.types._default).get.apply(field, [$field]);
				if(val != undefined) {
					retVal[field.prop] = val;
				}
			}
        });
        return retVal;
    };

    Sour.Form.setValues = function (fields, data) {
        $.each(fields, function (i, field) {
			if(field.prop) {
	            var type = field.customType || field.type || 'text',
	                val = data[field.prop] || '';

				(Sour.Form.types[type] || Sour.Form.types._default).set.apply(field, [$field, val, data]);
			}
        });
    };

    Sour.Form.resetButton = function (button, text) {
        $(button).text(text || $(button).data('defaultText') || 'Submit').removeClass('sour-btn-disabled').addClass('sour-shadow-small');
    };
	
    // Binds a click even to given button object or selector and handles common tasks like validation and button masking
    Sour.Form.submit = function (button, fields, target, dataObj, onValid, submittingText) {
        $(button).data('defaultText', $(button).text()).click(function () {
            if ($(this).hasClass('db-btn-disabled')) { return false; }

            if (Sour.Form.validate(fields, dataObj, target)) {
                var newObj = Sour.Form.getValues(fields, dataObj);

                $(this).text(submittingText || 'Submitting...').addClass('sour-btn-disabled').removeClass('sour-shadow-small');
                onValid(newObj);
            }
        });
        $.each(fields, function(i, field) {
            if(field.submit) {
                $('#' + field.id).keyup(function(evt) {
                    if(evt.which === Sour.KeyCode.ENTER) {
                        $(button).click();
                    }
                });
            }
        });
    };
	
    Sour.Form.setupForm = function (fields, context, options) {
        context = context || 'body';
        var opts = $.extend({ validation:true, focus:true }, options || {});

        _f.setupFields(fields, context, opts);

        if (opts.focus) {
            $('.sour-input:visible:first', context).focus();
        }
    };

	Sour.Form.createForm = function(fields, options) {
		var _form = $.extend({ fields:fields, context:'body', data:null, submittedText:'Submitting...' }, options);
		
		// Set up public functions
		_form.submit = function(button, onValid, submittedText) {
			return Sour.Form.submit(button, _form.fields, _form.target, _form.data, onValid, submittedText);
		};
		_form.setValue = Sour.Form.setValues.curry(_form.fields);
		
		// Call startup functions
		Sour.Form.setupForm(_form.fields, _form.context, options);
		
		if(_form.button && _form.onValid) {
			_form.submit(_form.button, _form.onValid, _form.submittedText);
		}
		
		return _form;
	};
	/* === /FORM === */
})(Sour, jQuery);