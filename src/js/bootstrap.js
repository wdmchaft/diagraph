/**
 * initializing document: create UI, loading document data
 */

if (!window.vonline) {
	/**
	 * global application scope
	 * @name vonline
	 */
	window.vonline = {
		/** used for custom events */
		events: $({})
	};
}

// use always POST-method on ajax calls
$.ajaxSetup({type: 'post'});

// calls when dom is ready
$(function() {
	vonline.document = new vonline.Document();
});