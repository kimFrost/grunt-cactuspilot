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
		getSegmentContent: function(string, type) {
			var contentList = [];

			var propertySegments = string.split(type+":OPEN");

			for (var i=1;i<propertySegments.length;i++) {
				var segment = propertySegments[i];
				var segmentCut = segment.split(type+":CLOSE");
				var propertyValue = segmentCut[0];
				//propertyValue = propertyValue.replace(/\/*/g,"").replace(/\*\//g,"").replace(/\*/g,"");
				propertyValue = propertyValue.replace(/\/\*/g,"").replace(/\*\//g,"").replace(/\*/g,"");
				propertyValue = propertyValue.trim();
				contentList.push({
					type: type,
					value: propertyValue
				});
			}
			return contentList;
		},
		getBlockStates: function(string, blockName) {
			console.log(" \n --- States Generation --- \n ");
			var states = [];
			//console.log("blockName:",blockName);
			var lineArray = string.toString().split(/\n/);

			for (var i=0;i<lineArray.length;i++) {
				var line = lineArray[i];
				if (line.indexOf(blockName) != -1) {

					// Make a raw module without states
					var state = {
						name: "",
						target: blockName,
						isClass: true
					};
					states.push(state); // send the raw module to the states array

					if (line.indexOf("--") != -1) {
						//console.log("line: ",line);

						var lineString = line;
						var isClass = false;
						lineString = lineString.replace(/{/g,"").trim();
						lineString = lineString.split(" ")[0];
						if (lineString.indexOf(".") != -1) isClass = true;
						lineString = lineString.replace(".","").replace(/ /,"");
						var targetElem = lineString.split("--")[0].replace("--","");
						var elemState = lineString.split("--")[1].replace("--","");

						console.log("lineString: ",lineString, targetElem, elemState);

						var state = {
							name: elemState,
							target: targetElem,
							isClass: isClass
						};
						states.push(state);
					}
					else if (line.indexOf(":") != -1) {
						if (line.indexOf(":hover") != -1 || line.indexOf(":active") != -1) {
							var lineString = line;
							var isClass = false;
							lineString = lineString.replace(/{/g,"").trim();
							if (lineString.indexOf(".") != -1) isClass = true;
							lineString = lineString.replace(".","").replace(/ /,"");
							var targetElem = lineString.split(":")[0];
							var elemState = lineString.split(":")[1];

							if (elemState === "hover") {
								elemState = ":hover";
							}
							else if (elemState === "active") {
								elemState = ":active";
							}

							console.log("lineString: ",lineString, targetElem, elemState);


							var state = {
								name: elemState,
								target: targetElem,
								isClass: isClass
							};
							states.push(state);

						}
					}
				}
			}
			console.log(" \n --- !States Generation --- \n ");
			return states;
		},
		generateHtmlPage: function(name,desc,states,markup) {
			console.log(" \n --- Html Generation --- \n ");
			var html = "";

			//console.log(name);
			//console.log(desc);
			//console.log(states);
			//console.log(markup);

			html += "<html>";
			html += "<head>";
				html += "<title>"+ name +"</title>";
				// put css src file relation
				html += '<link href="'+ plugin.data.src +'" rel="stylesheet" type="text/css">';
				// put cactus css file relation
				html += '<link href="cactuspilot.css" rel="stylesheet" type="text/css">';

				html += '<script src="cactuspilot.js"></script>';

			html += "</head>";
			html += "<body>";

				html += "<div class='l-modules'>";
					html += "<div class='l-modules__navigation'></div>";

					html += "<div class='l-modules__title'>";
						html += "<h1>"+ name +"</h1>";
					html += "</div>";

					html += "<div class='l-modules__description'>";
						html += "<p>"+ desc +"</p>";
					html += "</div>";

					html += "<div class='l-modules__list'>";
						var statesGenerated = [];
						// calculate variants
						for (var i=0;i<states.length;i++) {
							var state = states[i];

							// check for dublications and skip them
							var generate = true;
							for (var m=0;m<statesGenerated.length;m++) {
								var generatedState = statesGenerated[m]
								if (state.name === generatedState.name && state.target === generatedState.target) {
									generate = false;
									break;
								}
							}
							if (generate) {

								console.log("   State.name:" + state.name +"   State.target:" + state.target);

								var blockMarkup = markup;

								if (state.name.indexOf(":") != -1) {
									html += '<p>'+ state.target + state.name +'</p>';
									blockMarkup = blockMarkup.replace(state.target, state.target + " " + state.name);
								}
								else {
									html += '<p>'+ state.target+"--"+state.name +'</p>';
									blockMarkup = blockMarkup.replace(state.target, state.target + " " + state.target + "--" + state.name);

								}

								html += "<div class='cactus-module'>";

								html += blockMarkup;
								html += "</div>";





								/*
								if (state.target === name) {
									var blockMarkup = markup;

									if (state.name.indexOf(":") != -1) {
										html += '<p>'+ state.target + state.name +'</p>';
										blockMarkup = blockMarkup.replace("$$modifiers", state.name);
									}
									else {
										html += '<p>'+ state.target+"--"+state.name +'</p>';
										blockMarkup = blockMarkup.replace("$$modifiers", state.target+"--"+state.name);
									}

									html += "<div class='cactus-module'>";

										html += blockMarkup;
									html += "</div>";
								}
								*/
								statesGenerated.push(state);
							}
						}
					html += "</div>";
				html += "</div>";
			html += "</body>";
			html += "</html>";

			console.log(" \n --- !Html Generation --- \n ");
			return html;
		}
	}
/*---------------------------------------------------------------
 TASK
---------------------------------------------------------------*/

	grunt.registerMultiTask('cactuspilot', 'Sass BEM styleguide generation', function() {
		// Merge task-specific and/or target-specific options with these defaults.

		//console.log("options -->",this.options);

		var cactuspilot = {
			options: this.options(),
			async: grunt.util.async,
			done: this.async(),
			files: this.files
		};

		//grunt.task.run('compile');

		//console.log("-->", cactuspilot);

		//console.log("Find me", this);

		//console.log("--> Files: ",this.files);

		// Iterate over all specified file groups.
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

			// Check if source is there
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

			var testArray = src.toString().split(/\n/);

			//grunt.log.writeln("------------Source------------");
			//grunt.log.writeln("src",src);
			//grunt.log.writeln(src);
			//grunt.log.writeln("-----------!Source------------");


			var modules = src.toString().split("/*CACTUSPILOT:OPEN*/");
			for (var i=1;i<modules.length;i++) {
				var segment = modules[i];
				var segmentCut = segment.split("/*CACTUSPILOT:CLOSE*/");
				var moduleSegment = segmentCut[0];
				//grunt.log.writeln("------------Module------------");
				//grunt.log.writeln(moduleSegment);
				//grunt.log.writeln("-----------!Module------------");

				var modulename = plugin.getSegmentContent(moduleSegment, "MODULE");
				var moduleDesc = plugin.getSegmentContent(moduleSegment, "DESC");
				var moduleMarkup = plugin.getSegmentContent(moduleSegment, "MARKUP");


				var moduleStates = plugin.getBlockStates(src, modulename[0].value);

				//console.log(modulename);
				//console.log(moduleStates);
				//console.log(moduleDesc);
				//console.log(moduleMarkup);

				/*
				var strippedModuleStates = [];
				for (var m=0;m<moduleStates.length;m++) {
					var state = moduleStates[m];
					var _state = {

					};
					strippedModuleStates.push(_state);
				}
				*/

				var generatedHtml = plugin.generateHtmlPage(modulename[0].value, moduleDesc[0].value, moduleStates, moduleMarkup[0].value);

				//Create test file for module in destination
				grunt.file.write(f.dest + modulename[0].value + ".html", generatedHtml, {
					encoding: "utf-8"
				});

				// copy cactus style to dest folder




			}



			/*
			var stringArray = src.toString().split("\/*START*\/");
			for (var i=1;i<stringArray.length;i++) {
				var segment = stringArray[i];
				//grunt.log.writeln("segment",segment);
				var segmentCut = segment.split("\/*END*\/");
				var moduleSegment = segmentCut[0];
				grunt.log.writeln("------------Module------------");
				//grunt.log.writeln(moduleSegment);
				grunt.log.writeln("-----------!Module------------");

				var modulename = "";
				var modulenameArray = moduleSegment.split("MODULE:");
				grunt.log.writeln(modulenameArray[1]);

				//Create test file for module in destination
				grunt.file.write(f.dest + Math.random() + ".html", "<html><head></head><body><p>MEH!</p><div>"+src+"</div></body></html>", {
					encoding: "utf-8"
				});
			}
			*/

			/*

			// Concat specified files.
			var src = f.src.filter(function(filepath) {
				// Warn on and remove invalid source files (if nonull was set).
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
			}).join(grunt.util.normalizelf(options.separator));

			// Handle options.
			src += options.punctuation;

			// Write the destination file.
			grunt.file.write(f.dest, src);

			// Print a success message.
			grunt.log.writeln('File "' + f.dest + '" created.');

			*/

		});
	});

};
