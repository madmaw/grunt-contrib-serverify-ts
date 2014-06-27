# grunt-contrib-serverify-ts

> Task to turn your client-side TypeScript libraries into node-friendly equivalents with no (handwritten) code changes.

You can code your entire project in AMD style then compile it out to CommonJS or AMD as required. This is handy as it allows you to
  * have one project with all your code in Visual Studio instead of having to break the project down into seperate projects based on compilation target
  * use a file-per-class coding style without having a ridiculous number of imports
  * avoid using RequireJS or Browserify to share code between the client and the server
  * switch between APIs on the client and the server (eg. Q and JQuery promises)

It does this by combining your typescript files into one file, generating the imports as required, and rewriting any referenced classes.

After you have run serverify, you will want to compile the generated code (probably using grunt-ts with the module=commonjs option).

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-contrib-serverify-ts --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-contrib-serverify-ts');
```

## The "serverify" task

### Overview
In your project's Gruntfile, add a section named `serverify` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
    serverify: {
        commonjs: {
            src: ['src/main/ts/**/*.ts'],
            dest: 'build/commonjs/<%= pkg.name %>.ts',
            options: {
                libraries: [
                    {
                        ambientDefinitionFile: "lib/Q-1.0.1.d.ts",
                        referenceDefinitionFile: true,
                        requireName: "q",
                        variableName: "Q",
                        // convert from JQuery promises to Q promises
                        classNames: [
                            {
                                from: "JQueryPromise",
                                to: "IPromise"
                            }, {
                                from: "$",
                                to: null
                            }
                        ]
                    },
                    {
                        ambientDefinitionFile: "lib/jaydata-1.3.6.d.ts",
                        referenceDefinitionFile: true,
                        requireName: "jaydata",
                        variableName: "$data"
                    },
                    {
                        ambientDefinitionFile: "../sibling_project/build/commonjs/sibling_project.data.d.ts",
                        referenceDefinitionFile: true,
                        local: true,
                        requireName: "sibling_project",
                        moduleName: "Sibling.Project",
                        variableName: "sp",
                        parseClassNames: true
                    }
                ],
                libraryDestDir: "build/commonjs"
            }
        }
    }
});
```

### Options

#### options.libraries
Type: `array`
Default value: `[]`

Array of external libraries that this project depends upon, used to fix up references in your typescript code

##### options.libraries.ambientDefinitionFile
Type: `String`
Default value: `null`

The path to the d.ts file for the referenced library

##### options.libraries.referenceDefinitionFile
Type: `boolean`
Default value: `false`

Indicates whether the d.ts file should be referenced within the generated TypeScript. The TS compiler may complain if
you leave this out

##### options.libraries.local
Type: `boolean`
Default value: `false`

Indicates whether the corresponding .js and .js.map files should be copied across with the definition file. Also, if
the referenceDefinitionFile option is set to true, this will be prefixed with a './' instead of assuming the code is
on the path somewhere

##### options.libraries.requireName
Type: `String`
Default value: `null`

String to use when referencing the library, currently required, but easily could be extrapolated from the d.ts file.

##### options.libraries.moduleName
Type: `String`
Default value: `null`

The value to prefix onto any references to this library

##### options.libraries.variableName
Type: `String`
Default value: `null`

The name of the variable to use when importing this library, try to avoid clashing names.

##### options.libraries.classNames
Type: `array`
Default value: `null`

Class names to rewrite, can be either a string value (eg. MyClass) or a record (see below).

##### options.libraries.classNames.from

Type: `String`
Default value: `null`

The string to remove, must be an exact match

##### options.libraries.classNames.to

Type: `String`
Default value: `null`

The string to turn it into, will be prefixed with the moduleName if that is specified. May be null in which case only the module name will be used

##### options.libraries.classNames.moduleName

Type: `String`
Default value: `null`

Defaults to the global moduleName is not specified here.

##### options.libraries.parseClassNames
Type: `boolean`
Default value: `false`

Attempt to parse the class/interface/function/module names out of the specified ambient definition file instead of specifying them. Assumes
a fairly rigid coding style.