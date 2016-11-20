Using UI5 Template
==================

## Developer/Build Machine Requirements (for preparing deployments)
1. npm (Node.js)
2. gulp installed globally (`npm i -g gulp`)

## Notes of Interest
* The OpenUI5 runtime is not distributed with this template (it is loaded from `https://openui5.hana.ondemand.com`)
    * When you deploy to destination web servers, ensure you are using an approved, local version (via CDN or distributed with this application)

## Getting Started

### Customizing Template

Simply do a full text replace on all files of this solution with the following keywords:

* Namespace
  * Template value: `replace.namespace`
    * Replace with a value like: `openui5.test.app`
  * Template value: `replace/namespace`
    * Replace with a value like: `openui5/test/app` (this is folder representation of your namespace)
* App Title
  * Template value: `replace_title`
* App Description
  * Template value: `replace_description`
* App version
  * Template value: `replace_appVersion`

### Using Text Editor with Companion Shell (cmd, Git Bash, Terminal)
1. Download source
2. Open cmd/shell to downloaded directory root (which contains package.json)
3. Run `npm i` (will install build deps)
4. Run `gulp watch`
5. Run static web server from `/dist/` directory

### Running `gulp watch`

This process will always watch your files and drop a _build_ in `./dist/` where you will run your web server.

1. Navigate to `$(ProjectRoot)/` (not inside `app`)
1. Run gulp build with `gulp watch --env local`

* There are 4 possible environments, `[local, dev, qa, prod]`.
* Each of these environments will use the API service configured in `$(ProjectRoot)/config.json`

Running this process will detect any changes made to existing files. Any changes (saving in your editor) will trigger a re-build of the project and a re-deployment to `./dist/`.

### Static web server
A good solution for a static web server is to use a node server.  You can use the following command: `'npm i -g http-server'`.  This will install a basic
http server. You can run the server with the following commands:

### Run a basic server
1. `cd dist/`
2. `http-server`

## Adding Your Site-Specific Settings
At the root of the project, there is a `config.json` file. Here, you can set values that make sense for your application.
By running the `gulp build-<env>` commands, the `/app/model/appConfig.json` will be re-built using proper environment settings
as configured in the config file you just altered.
> Changes you make to the `/app/model/appConfig.json` will be overwritten during Gulp build! Ensure you are adding your settings in `./config.json` instead (which feeds Gulp build settings).

## Project Structure

        controller\
        i18n\
        model\
        util\
        view\
        Component.js
        index.html
        manifest.json

* `controller\` will store all the JavaScript controllers behind each view (XML templates) in the `view\` folder.
    * You will modify/delete the existing views, and certainly add new ones. Most of your development will occur in these files.
* `i18n\` will store localization strings.
    * You will modify this file **heavily** with your application text.
* `model\` stores a JavaScript promise callback, and the `appConfig.json` for app environment-specific settings (adjusted at build-time by Gulp).
    * You should consider only adjusting the root `.\config.json` file instead of this. Add any local enums here (if they can't be provided by the service API).
* `util\` contains a `BaseController` and an `ErrorHandler`. Formatters would belong here as well.
    * You may not need to adjust these files, but adding to the Util namespace is likely.
* `Component.js` is the entry-point for this SAPUI5 application, this would be the first place to start adding custom start-up code.
    * You will modify this file to adjust the global models, and any custom start-up behavior
* `index.html` is the initial page served to the client. The only custom code in this file initializes the UIComponent in `Component.js`.
    * You may not need to adjust this file much.
* `manifest.json` contains URL routes, UI5 libraries, and additional runtime configuration for the UIComponent.
    * You will modify this file to adjust the URL routes and libraries
