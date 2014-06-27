# grunt-contrib-serverify-ts

> Task to turn your client-side TypeScript libraries into node friendly equivalents.

You can code your entire project in AMD style then compile it out to CommonJS or AMD as required. This is handy as it allows you to
  * have one project with all your code in Visual Studio instead of having to break the project down into seperate projects based on compilation target
  * use a file-per-class coding style without having a ridiculous number of imports
  * avoid using RequireJS or Browserify to share code between the client and the server
  * switch between APIs on the client and the server (eg. Q and JQuery promises)

It does this by combining your typescript files into one file, generating the imports as required, and rewriting any referenced classes.

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

## The "contrib_serverify_ts" task

### Overview
In your project's Gruntfile, add a section named `contrib_serverify_ts` to the data object passed into `grunt.initConfig()`.

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


