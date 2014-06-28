/*
 * grunt-contrib-serverify-ts
 * https://github.com/madmaw/grunt-contrib-serverify-ts
 *
 * Copyright (c) 2014 Chris Glover
 * Licensed under the MIT license.
 */

'use strict';

var os = require('os');

var classNameStartValues = ">= :<;,)({}[]+";
var classNameEndValues = ">= :<;,)({}[]+.";
var localFileExtensions = [".js", ".js.map", ".ts"];
var dtsExtension = ".d.ts";

module.exports = function(grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('serverify', 'Task to turn your client-side TypeScript source into node friendly equivalents', function() {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            replacements: [
                {
                    // TODO make this pattern matching a bit more robust (detect line start)
                    from: 'module',
                    to: 'export module'
                }
            ],
            libraries: [
                /*
                {
                    ambientDefinitionFile: "somePath", // only required for a rewrite
                    moduleName: "a.b.c", //  either classNames or moduleName must be specified, if both are specified then the module name will be prefixed onto the class names
                    requireName: "myModule", // required, defaults to moduleName if specified
                    variableName: "myVariable": // the name of the variable used in the code, defaults to requireName
                    classNames: [
                        {
                            from: "D",
                            to: "E"
                        },
                        "F"
                    ]
                }
                */
            ]
        });
        var replacements = options.replacements;
        var libraries = options.libraries;

        // Iterate over all specified file groups.
        this.files.forEach(function(f) {

            var libraryDestDir = options.libraryDestDir;
            if( libraryDestDir == null ) {
                // write to destination path
                libraryDestDir = f.dest;
                if( libraryDestDir ) {
                    // get parent directory
                    var lastSlash = libraryDestDir.lastIndexOf('/');
                    if( lastSlash >= 0 ) {
                        libraryDestDir = libraryDestDir.substring(0, lastSlash + 1);
                    }
                }
            }
            if( libraryDestDir ) {
                if( libraryDestDir.charAt(libraryDestDir.length - 1) != '/' ) {
                    libraryDestDir += '/';
                }
            }
            var references = [];

            // pre-process libraries
            for( var i in libraries ) {
                var library = libraries[i];
                var ambientDefinitionFile = library.ambientDefinitionFile;
                var referenceDefinitionFile = library.referenceDefinitionFile;
                if( ambientDefinitionFile ) {
                    if( !grunt.file.exists(ambientDefinitionFile) ) {
                        grunt.log.warn("no such ambient definition file "+ambientDefinitionFile+" skipping");
                    } else {
                        // add some extra definitions to the library
                        var libraryDestFile;
                        if( libraryDestDir == null ) {
                            grunt.log.warn('overwriting ambient definition file "' + ambientDefinitionFile + '".');
                            // overwrite
                            libraryDestFile = ambientDefinitionFile;
                        } else {
                            var ambientDefinitionFileNameIndex = ambientDefinitionFile.lastIndexOf('/');
                            var ambientDefinitionFileName;
                            if( ambientDefinitionFileNameIndex < 0 ) {
                                ambientDefinitionFileName = ambientDefinitionFile;
                            } else {
                                ambientDefinitionFileName = ambientDefinitionFile.substring(ambientDefinitionFileNameIndex + 1);
                            }
                            libraryDestFile = libraryDestDir + ambientDefinitionFileName;

                            if( library.local ) {
                                // copy the other generated files
                                var libraryFilePrefix;
                                var libraryFileNamePrefix;
                                if( ambientDefinitionFile.lastIndexOf(dtsExtension) == ambientDefinitionFile.length - dtsExtension.length ) {
                                    libraryFilePrefix = ambientDefinitionFile.substring(0, ambientDefinitionFile.length - dtsExtension.length );
                                    libraryFileNamePrefix = ambientDefinitionFileName.substring(0, ambientDefinitionFileName.length - dtsExtension.length );
                                } else {
                                    libraryFilePrefix = ambientDefinitionFile;
                                    libraryFileNamePrefix = ambientDefinitionFileName;
                                }
                                for( var j in localFileExtensions ) {
                                    var localFileExtension = localFileExtensions[j];
                                    var localFileSrc = libraryFilePrefix + localFileExtension;
                                    if( grunt.file.exists(localFileSrc) ) {
                                        var localFileDest = libraryDestDir + libraryFileNamePrefix + localFileExtension;
                                        grunt.log.writeln('copying local file ' + localFileSrc+" to "+localFileDest);
                                        grunt.file.copy(localFileSrc, localFileDest);
                                    }
                                }
                            }
                        }

                        // read in the ambient definition file
                        var src = grunt.file.read(ambientDefinitionFile);
                        /*
                         var moduleName = library.moduleName;
                         var requireName = library.requireName || moduleName;

                         // remove awful typescript crud (actually, probably just want to leave it!)
                         src.replace('export declare', 'declare');
                         src += os.EOL;
                         src += "declare module '"+requireName+"' {" + os.EOL;
                         if( typeof exports === 'string') {
                         // only one export
                         src += "  export = "+exports+";" + os.EOL;
                         } else {
                         // iterate
                         for( var key in exports ) {
                         var value = exports[key];
                         src += "  export."+key+" = " + value + os.EOL;
                         }
                         }
                         src += "}" + os.EOL;
                         */
                        grunt.log.writeln('writing ambient definition file ' + libraryDestFile);
                        grunt.file.write(libraryDestFile, src);
                        if( referenceDefinitionFile ) {
                            references.push(ambientDefinitionFileName);
                        }
                    }
                }
            }

            if(f.dest) {

                var files = [];

                // TODO look up the files from the reference file and add those in order
                var reference = options.reference;
                if( reference ) {
                    if( grunt.file.exists(reference) ) {
                        var referenceContent = grunt.file.read(reference);
                        referenceContent.replace(/(\'|\").+\.ts(\'|\")/g, function(m) {
                            // TODO use path relative to reference file
                            var file = m.substring(1, m.length - 1);
                            // exclude d.ts files
                            if( !file.match(/\.d\.ts/g) ) {
                                files.push(file);
                            }
                            return m;
                        });
                    } else {
                        grunt.log.warn("reference file "+reference+" not found");
                    }
                }


                f.src.forEach(function(filepath) {
                    if( files.indexOf(filepath) < 0 ) {
                        files.push(filepath);
                    }
                });

                // Concat specified files.
                var src = files.filter(function(filepath) {
                    // Warn on and remove invalid source files (if nonull was set).
                    if (!grunt.file.exists(filepath)) {
                        grunt.log.warn('Source file "' + filepath + '" not found.');
                        return false;
                    } else {
                        return true;
                    }
                }).map(function(filepath) {
                    // Read file source.
                    var result = '//' + filepath + os.EOL;
                    var filesrc = grunt.file.read(filepath);
                    // add in export statements
                    for( var i in replacements ) {
                        var replacement = replacements[i];
                        filesrc = filesrc.replace(replacement.from, replacement.to);
                    }
                    result += filesrc;
                    return result;
                }).join(grunt.util.normalizelf(os.EOL));

                var prefix = "";
                // add in the references
                for( var i in references ) {
                    // TODO relative paths
                    var reference = references[i];
                    prefix += '///<reference path="' + reference + '"/>' + os.EOL;
                }

                // add in libraries
                for( var i in libraries ) {
                    var library = libraries[i];
                    // rewrite the paths
                    var moduleName = library.moduleName;
                    var requireName = library.requireName || moduleName;
                    var variableName = library.variableName || requireName;
                    var classNames = library.classNames;
                    if( classNames == null ) {
                        classNames = [];
                    }
                    // add the module name as that can be referred to directly
                    if( moduleName ) {
                        classNames.push({
                            from: moduleName,
                            to: null,
                            endValues: classNameStartValues // can't end in a dot
                        });
                    }

                    var parseClassNames = library.parseClassNames;
                    if( parseClassNames ) {
                        var ambientDefinitionFile = library.ambientDefinitionFile;
                        if( ambientDefinitionFile && grunt.file.exists(ambientDefinitionFile) ) {
                            var librarySrc = grunt.file.read(ambientDefinitionFile);
                            var currentModule = moduleName;
                            librarySrc.replace(/(function|class|interface|module|enum)\s+(\w|\.)+/g, function(m) {
                                var nameIndex = m.lastIndexOf(' ');
                                var name = m.substring(nameIndex+1);
                                var type = m.substring(0, nameIndex).trim();
                                if( type == 'module' ) {
                                    currentModule = name;
                                } else {
                                    grunt.log.writeln("found "+type+" "+name+" in module "+currentModule);
                                    classNames.push({
                                        from: name,
                                        to: name,
                                        moduleName: currentModule
                                    });
                                    classNames.push({
                                        from: currentModule + '.' + name,
                                        to: name,
                                        moduleName: currentModule
                                    });
                                }
                                return m;
                            });

                        } else {
                            grunt.log.warn('must specify valid ambientDefinitionFile to if parseClassNames is enabled');
                        }
                    }

                    if( classNames ) {
                        for( var j in classNames ) {
                            var className = classNames[j];
                            var froms;
                            var to = variableName;
                            var classModuleName = className.moduleName;
                            var localClassNameEndValues = className.endValues;
                            var localClassNameStartValues = className.startValues;
                            if( !localClassNameEndValues ) {
                                localClassNameEndValues = classNameEndValues;
                            }
                            if( !localClassNameStartValues ) {
                                localClassNameStartValues = classNameStartValues;
                            }

                            if( classModuleName == null ) {
                                classModuleName = moduleName;
                            }
                            if( classModuleName ) {
                                to += '.' + classModuleName;
                            }
                            if( className.from ) {
                                // replace
                                froms = [className.from];
                                if( className.to ) {
                                    to += '.' + className.to;
                                }
                            } else {
                                froms = [className];
                                if( classModuleName ) {
                                    froms.push(classModuleName + '.' + className);
                                }
                                to += '.' + className;
                            }

                            for( var k in froms ) {
                                var from = froms[k];
                                var escaped = from.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                                var regex = new RegExp('.' + escaped + '.', 'g');
                                src = src.replace(regex, function(v) {
                                    // ensure white space is on both sides of value
                                    var first = v.charAt(0);
                                    var last = v.charAt(v.length - 1);
                                    var result;
                                    if( localClassNameStartValues.indexOf(first) >= 0 && localClassNameEndValues.indexOf(last) >= 0 ) {
                                        result = first + to + last;
                                    } else {
                                        result = v;
                                    }
                                    return result;
                                });
                            }
                        }
                    }
                    // add the includes
                    prefix += "import " + variableName+ " = require('"
                    var local = library.local;
                    if( local ) {
                        prefix += "./";
                    }
                    prefix += requireName + "');" + os.EOL;
                }

                src = prefix + src;

                // Write the destination file.
                grunt.file.write(f.dest, src);

                // Print a success message.
                grunt.log.writeln('File "' + f.dest + '" created.');
            }
        });
    });
};
