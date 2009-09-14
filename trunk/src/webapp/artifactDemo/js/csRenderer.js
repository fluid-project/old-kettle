/*
Copyright 2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0. 
ou may not use this file except in compliance with this License.

You may obtain a copy of the ECL 2.0 License at
https://source.collectionspace.org/collection-space/LICENSE.txt
*/

/*global jQuery, fluid_1_2*/

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

(function ($, fluid) {

    var createTemplateRenderFunc = function (that, resources, tree, opts) {
        return function () {
            var templateNames = [];
            var i = 0;
            for (var key in resources) {
                if (resources.hasOwnProperty(key)) {
                    var template = fluid.parseTemplates(resources, [key], {});
                    fluid.reRender(template, fluid.byId(resources[key].nodeId), tree, opts);
                }
            }
            that.events.pageRendered.fire();
        };
    };
    
    var buildFullUISpec = function (that) {
        var fullUISpec = fluid.copy(that.spec);
        
		// This makes the assumption that 'save' exists. This should be configurable.
        fullUISpec.save = {
            "selector": that.options.selectors.save,
            "validators": [],
            "decorators": [
                {type: "jQuery",
                    func: "click", 
                    args: that.save
                }
            ]
        };
        fullUISpec.saveSecondary = {
            "selector": that.options.selectors.saveSecondary,
            "validators": [],
            "decorators": [
                {type: "jQuery",
                    func: "click", 
                    args: that.save
                }
            ]
        };
        return fullUISpec;
    };
    
    var addCutpointsToList = function (list, spec) {
        var index = list.length;
        for (var spec_index in spec) {
        	var specPart = spec[spec_index];
	        for (var key in specPart) {
	            if (specPart.hasOwnProperty(key)) {
	                list[index] = {
	                    id: key + specPart[key].selector,
	                    selector: specPart[key].selector
	                };
	                if (specPart[key].hasOwnProperty("repeated")) {
	                    list[index].id = key + specPart[key].selector + ":";
	                    addCutpointsToList(list, specPart[key].repeated);
	                }
	                index = list.length;
	            }
	        }
        }
    };

    var buildCutpointsFromSpec = function (spec) {
        var cutpoints = [];
        addCutpointsToList(cutpoints, spec);
        return cutpoints;
    };

    var buildLinkComponent = function (key, modelPart, spec, i) {
        var targetString;
        if (spec.replacements) {
            var reps = [];
            for (var prop in spec.replacements) {
                if (spec.replacements.hasOwnProperty(prop)) {
                    reps[prop] = fluid.model.getBeanValue(modelPart[i], spec.replacements[prop]);
                }
            }
            targetString = fluid.stringTemplate(spec.href, reps);
        }
        return {
            ID: key + spec.selector,
            target: targetString,
            linktext: modelPart[i][key]
        };
    };

    var addRepeatedItemsToComponentTree = function (children, name, specPart, modelPart, el, that) {
        var index = children.length;
        for (var i = 0; i < modelPart.length; i++) {
            children[index] = {
                ID: name + ":",
                children: []
            };
            var j = 0;
            for (var key in specPart) {
                if (specPart.hasOwnProperty(key)) {
                    var spec = specPart[key];
                    if (spec.hasOwnProperty("type") && spec.type === "link") {
                        children[index].children[j] = buildLinkComponent(key, modelPart, spec, i);
                    } else {
                        children[index].children[j] = {
                            ID: key + spec.selector
                        };
                        if (spec.valuebinding) {
	                    	children[index].children[j].valuebinding = (el ? el + "." + i + "." + key : key);
	                    }
                        if (spec.decorators && spec.decorators.length > 0) {
                            children[index].children[j].decorators = [];
                            buildDecorators(children[index].children[j].decorators,
                            		spec.decorators, that, modelPart[key]);
                        }
                    }                    
                    j++;
                }
            }
            index++;
        }
    };
    
    var buildDecorators = function (list, decorators, that, arg) {
    	for (var i in decorators) {
    		if (decorators[i].type === "function") {
    			if (decorators[i].name === "decoratorFunction") {
    				list.push(fluid.model.getBeanValue(that, decorators[i].decoratorFunction)(arg));
    			}
    		}
    		if (decorators[i].type === "addClass") {
    			list.push({
    				type: "addClass",
    				classes: fluid.model.getBeanValue(that.styles, decorators[i].classes)
    			});
    		}
    	}
    };
    
    var buildComponentTreeChildren = function (that, el) {
        var children = [];
        var index = 0;
        var spec = that.spec;
        var modelPart = that.model;
        for (var spec_index in spec) {
        	var specPart = spec[spec_index];
	        for (var key in specPart) {
	            if (specPart.hasOwnProperty(key)) {
	                var elPath = (el ? fluid.model.composePath(el, key) : key);
	                if (specPart[key].hasOwnProperty("repeated")) {
	                    // repeated items need to be filled in based on the data, not the schema
	                    // the schema defines the fields for each row, but the data must be 
	                    // examined to fill in each row
	                    addRepeatedItemsToComponentTree(children, key + specPart[key].selector, specPart[key].repeated, modelPart[key], elPath, that);
	                } else {
	                    children[index] = {
	                        ID: key + specPart[key].selector,
	                    };
	                    if (specPart[key].valuebinding) {
	                    	children[index].valuebinding = elPath;
	                    }
	                    if (specPart[key].markup) {
	                    	children[index].markup = modelPart[key];
	                    }
	                    if (specPart[key].decorators && specPart[key].decorators.length > 0) {
	                    	children[index].decorators = [];
	                    	buildDecorators(children[index].decorators, specPart[key].decorators,
	                    			that, modelPart[key]);
	                    }
	                }
	                index = children.length;
	            }
	        }       
        }
        return children;
    };

    fluid.csRenderer = {
        buildComponentTree: function (that) {
            var tree = {children: buildComponentTreeChildren(that)};
            return tree;
        },

        renderPage: function (that) {
            var fullUISpec = buildFullUISpec(that);
            var renderOptions = {
                model: that.model,
                debugMode: true,
                autoBind: true
            };
            var cutpoints = buildCutpointsFromSpec(fullUISpec);            
            var tree = cspace.renderer.buildComponentTree(fullUISpec, that.model);
            var resources = {};
            for (var key in that.options.templates) {
                if (that.options.templates.hasOwnProperty(key)) {
                    var templ = that.options.templates[key];
                    resources[key] = {
                        href: templ.url,
                        nodeId: templ.id,
                        cutpoints: cutpoints
                    };
                }
            }
            fluid.fetchResources(resources,
                createTemplateRenderFunc(that, resources, tree, renderOptions));
        },
        
        createCutpoints: function (spec) {
            var cutpoints = [];
            addCutpointsToList(cutpoints, spec);
            return cutpoints;
        }
    };

})(jQuery, fluid_1_2);
