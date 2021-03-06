/// <reference path="../../../typings/jquery/jquery.d.ts"/>
/* global $get */
/* global SP */
/* global NWF$ */
/* global Microsoft */
(function (exports, $, SP) {
	'use strict';

	$.getParameterByName = function (paramName) {
        var name = paramName.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    $.fn.selectByName = function (value) {
        var selection = this.find('option:selected');
        if (selection.length == 1 && selection.attr('value') != "0") {
            return this;
        }
        $('option', this)
            .prop('selected', false).filter(function () {
			return ($(this).text() == value);
		}).prop('selected', true);

    };

    $.fn.selectTerm = function (value) {
        var div = this.find('div[contenteditable]');
        if (div.length == 0)
            return;

        div.text(value);
        var webTaggingId = this.find('.ms-taxonomy').attr('id');
        if (webTaggingId == null)
            return;

        var webTaggingCtl = $get(webTaggingId);
        var ctlObject = new Microsoft.SharePoint.Taxonomy.ControlObject(webTaggingCtl);
        ctlObject.validateAll();
    };
	
	/* Used to extend an AutoComplete instance - extension points e.g. _resizeMenu, _renderItem */
	$.fn.setInstance = function (options) {
        var ui = $(this).autocomplete().data('ui-autocomplete');
        $.extend(ui, options);
        return ui;
	};
	
	/* Used to apply additional callbacks after SPLookup calls */
	exports.hookSPLookup = function (NWF, predicate, callback) {
        if (NWF === null)
			return;
        if (predicate === null)
			return;
        if (callback === null)
			return;

        var old = NWF.RuntimeFunctions.SPLookup;
        NWF.RuntimeFunctions.SPLookup = function (listNameAndOptionalSitePath, filterColumn, filterValue, returnValueColumn, multi, filterColumnType) {
			var promise = old.apply(this, arguments);
			if (predicate(returnValueColumn, arguments)) {
				return promise.then(function (data) {
					callback(data);
				});
			}
			return promise;
        };
	};
	
	/* use to combine a custom function signature with a nintex forms js validator call */
	exports.curry = function (validator) {
        var originalArgs = Array.prototype.slice.call(arguments, 1);
        return function (source, args) {
            originalArgs.unshift(args);
            originalArgs.unshift(source);
            validator.apply(null, originalArgs);
        };
    };

	function configurePeoplePickers() {
		var pickers = $('.js-pp-single');
		if (pickers.length == 0) {
			return;
		}

		function invalidate(el) {
			var container = el.parent();
			setTimeout(function () {
				var items = container.find('div.ip-item');
				var visible = items.length > 0;
				if (visible) {
					items.find('span').on('remove', function (e) {
						invalidate(el);
					});
					container.find('textarea').hide();
				} else {
					container.find('textarea').show();
				}
			}, 0);
		}

		$(document).on('nf-visible', function () {
			pickers.each(function (index, el) {
				var containers = $(el).find('.ip-container');
				containers.css('overflow-y', 'hidden');
				var textArea = $(el).find('.ip-container').find('textarea');
				textArea.on('autocompleteselect', function (event, ui) {
					invalidate($(this));
				});
				var items = $(el).find('div.ip-item:visible');
				if (items.length > 0) {
					invalidate($(items[0]));
				}
			});
		});
	}

	var init = false;
	$.fn.applyConventions = function () {
		if (init) {
			return;
		}
		var timer = setInterval(function () {
			var filler = $('#formFillerDiv');
			if (filler.is(':visible')) {
				if ($('ul.ui-widget').length > 0) {
					clearInterval(timer);
					$(document).trigger('nf-visible');
				}
			}
		}, 10);
		configurePeoplePickers();
		init = true;
	};
})(window, NWF$, SP);