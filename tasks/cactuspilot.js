/*
 * grunt-cactuspilot
 * https://github.com/Solid/grunt-cactuspilot
 *
 * Copyright (c) 2013 Kim Frost
 * Licensed under the MIT license.
 */


module.exports = function(grunt) {

	'use strict';

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks


/*---------------------------------------------------------------
 DEFAULTS
---------------------------------------------------------------*/
	var fs = require('fs'),
		path = require('path'),
		plugin = {};

/*---------------------------------------------------------------
 PLUGIN
---------------------------------------------------------------*/
	plugin = {
		data: {
			css: null,
			cactuscss: ""
		},
		options: null,
		generateHtmlPage: function() {

		},
		getSegmentContent: function(string, type) {
			var contentList = [];
			var propertySegments = string.split(type+":OPEN");
			for (var i=1;i<propertySegments.length;i++	) {
				var segment = propertySegments[i];
				var segmentCut = segment.split(type+":CLOSE");
				var propertyValue = segmentCut[0];
				propertyValue = propertyValue.replace(/\/\*/g,"").replace(/\*\//g,"").replace(/\*/g,"");
				propertyValue = propertyValue.trim();
				contentList.push({
					type: type,
					value: propertyValue
				});
			}
			return contentList;
		},
		// Get Elements of blockname
		getElements: function(string, blockName) {
			grunt.log.writeln("------------getElements------------");
			var elements = [];
			var elementsEnriched = [];
			var lineArray = string.toString().split(/\n/);
			for (var i=0;i<lineArray.length;i++) {
				var line = lineArray[i];
				if (line.indexOf(blockName + "__") != -1) {
					var temp = line.split(/\{/g)[0];
					var elementList = temp.split(/\,/g);
					for (var ii=0;ii<elementList.length;ii++) {
						var element = elementList[ii];
						var index = element.indexOf("__");
						element = element.split('__')[1];
						element = element.split('--')[0];
						element = element.replace(/ /g,"");
						var className = blockName + '__' + element;

						var found = false;
						for (var iii=0;iii<elements.length;iii++) {
							var _element = elements[iii];
							if (_element.className === className) {
								found = true;
								break;
							}
						}
						if (!found) {
							elements.push({
								name: element,
								className: className,
								master: blockName,
								states: []
							});
							grunt.log.writeln('element: ' + className);
						}
					}
				}
			}
			grunt.log.writeln("------------!getElements------------");
			return elements;
		},
		getStates: function(string, name) {
			grunt.log.writeln("------------getStates------------");
			grunt.log.writeln('for: ' + name);
			var states = [];
			var lineArray = string.toString().split(/\n/);
			for (var i=0;i<lineArray.length;i++) {
				var line = lineArray[i];
				if (line.indexOf(name + "--") != -1) {
					var temp = line.split(/\{/g)[0];
					var statesList = temp.split(/\,/g);
					for (var ii=0;ii<statesList.length;ii++) {
						var state = statesList[ii];
						var index = state.indexOf("--");
						state = state.split('--')[1];
						state = state.split(' ')[0];
						state = state.replace(/ /g,"");

						// Remove pseudo classes ?
						state = state.replace(/\:hover/g,"").replace(/\::hover/g,"").replace(/\:active/g,"").replace(/\::active/g,"");

						var className = name + '--' + state;

						var found = false;
						for (var iii=0;iii<states.length;iii++) {
							var _state = states[iii];
							if (_state.className === className) {
								found = true;
								break;
							}
						}
						if (!found) {
							states.push({
								name: state,
								className: className,
								master: name
							});
							grunt.log.writeln('state: ' + className);
						}

					}
				}
			}
			grunt.log.writeln("------------!getStates------------");
			return states;
		}
	}
/*---------------------------------------------------------------
 TASK
---------------------------------------------------------------*/

	grunt.registerMultiTask('cactuspilot', 'Sass BEM styleguide generation', function() {

		var cactuspilot = {
			options: this.options(),
			async: grunt.util.async,
			done: this.async(),
			files: this.files
		};

		this.files.forEach(function(f) {
			grunt.log.writeln("--> file", f.dest);
			grunt.log.writeln("--> file", f.src);
			plugin.data.src = f.src;
			// Create destination folder
			if (fs.existsSync(f.dest)) {
				//console.log("folder is there");
			}
			else {
				//console.log("folder is not there");
				fs.mkdir(f.dest, function(err) {
					if (err) { throw err; }
				});
			}

			/* Check if source is there
		 	************************************************************/
			var src = f.src.filter(function(filepath) {
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					return false;
				}
				else {
					return true;
				}
			}).map(function(filepath) {
				// Read file source.
				return grunt.file.read(filepath);
			});

			//var testArray = src.toString().split(/\n/); // Split string into lines array

			/* Get a list of all modules
			************************************************************/
			var modules = src.toString().split("/*CACTUSPILOT:OPEN*/");
			var dataList = [];
			// For each module
			for (var i=1;i<modules.length;i++) {
				var segment = modules[i];
				var segmentCut = segment.split("/*CACTUSPILOT:CLOSE*/");
				var cssAfterCactus = segmentCut[1];
				var cactusSegment = segmentCut[0];

				var modulename = plugin.getSegmentContent(cactusSegment, "MODULE")[0].value;
				var moduleDesc = plugin.getSegmentContent(cactusSegment, "DESC")[0].value;
				var moduleMarkup = plugin.getSegmentContent(cactusSegment, "MARKUP")[0].value;

				var data = {
					name: modulename,
					description: moduleDesc,
					markup: moduleMarkup,
					states: plugin.getStates(cssAfterCactus, modulename),
					elements: plugin.getElements(cssAfterCactus, modulename)
				}

				// Enrich elements with states
				for (var ii=0;ii<data.elements.length;ii++) {
					var element = data.elements[ii];
					//data.elements[ii].states = plugin.getStates(cssAfterCactus, element.name);
					element.states = plugin.getStates(cssAfterCactus, element.className);
				}

				/*
				var generatedHtml = plugin.geneateHtmlPage();
				grunt.file.write(f.dest + modulename + ".html", generatedHtml, {
					encoding: "utf-8"
				});
				*/

				dataList.push(data);
			}

			// Creta a single data json file
			var jsonData = JSON.stringify({blocks:dataList});
			grunt.file.write(f.dest + 'data' + ".json", jsonData, {
				encoding: "utf-8"
			});

		});
	});
};
