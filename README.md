[![npm](https://img.shields.io/npm/v/nativescript-webview-interface.svg)](https://www.npmjs.com/package/nativescript-webview-interface)
[![npm](https://img.shields.io/npm/dt/nativescript-webview-interface.svg?label=npm%20downloads)](https://www.npmjs.com/package/nativescript-webview-interface)

# Nativescript-WebView-Interface
Nativescript Plugin for bi-directional communication between WebView and Android/iOS

## Installation
From the terminal, go to your app's root folder and execute:
```
tns plugin add nativescript-webview-interface
```

Once the plugin is installed, you need to copy plugin file for webView into your webView content folder.
e.g
```
cp node_modules/nativescript-webview-interface/www/nativescript-webview-interface.js app/www/lib/
```

## Usage
For a quick start, you can check this [Demo App](https://github.com/shripalsoni04/nativescript-webview-interface-demo) and [Blog Post](http://shripalsoni.com/blog/nativescript-webview-native-bi-directional-communication/).
If you are using this plugin with **Angular 2**, you can check this [angular version of the demo app](https://github.com/shripalsoni04/ns-ng-webview-interface-demo).

### Inside Native App

Insert a `web-view` somewhere in your page.
```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd" loaded="pageLoaded">
....
<web-view id="webView"></web-view>
....
</Page>
```

Initialize `WebViewInterface` Plugin in your javascript file.
```javascript
var webViewInterfaceModule = require('nativescript-webview-interface');
var oWebViewInterface;

function pageLoaded(args){
    page = args.object;
    setupWebViewInterface(page) 
}

// Initializes plugin with a webView
function setupWebViewInterface(page){
    var webView = page.getViewById('webView');
    oWebViewInterface = new webViewInterfaceModule.WebViewInterface(webView, '~/www/index.html');
}
```
**Note**: Please note in above example that, we have not set **src** in template and we have passed it in **constructor** of *WebViewInterface*. This is recommended way to use this plugin to avoid issue
of communication from web-view to android not working sometimes on some devices.

Use any [API Method](#native-app-api) of WebViewInterface Class
```javascript
function handleEventFromWebView(){
    oWebViewInterface.on('anyEvent', function(eventData){
        // perform action on event
    });
}

function emitEventToWebView(){
    oWebViewInterface.emit('anyEvent', eventData);
}

function callJSFunction(){
    oWebViewInterface.callJSFunction('functionName', args, function(result){
        
    });
}
```

If you want to emit an event or call a JS function on load of the page, you need to call all such code once webView is loaded
```javascript
webView.on('loadFinished', (args) => {
    if (!args.error) {
        // emit event to webView or call JS function of webView
    }
});
```

### Inside WebView

Import `nativescript-webview-interface.js` in your html page.
```html
<html>
    <head></head>
    <body>
        <script src="path/to/nativescript-webview-interface.js"></script>
        <script src="path/to/your-custom-script.js"></script>        
    </body>
</html>
```

Use any [API Method](#webview-api) of `window.nsWebViewInterface` inside webview

```javascript
var oWebViewInterface = window.nsWebViewInterface;

// register listener for any event from native app
oWebViewInterface.on('anyEvent', function(eventData){
    
});

// emit event to native app
oWebViewInterface.emit('anyEvent', eventData);

// function which can be called by native app
window.functionCalledByNative = function(arg1, arg2){
    // do any processing
    return dataOrPromise;
}
```
## API

### Native App API

*Constructor:*

#### WebViewInterface(webView: WebView, src?: string)
**webView** is an instance of nativescript [web-view](https://docs.nativescript.org/cookbook/ui/web-view). 

**src** is the url/local path to be loaded in web-view. If it is set, then you don't need to set it in *src* attribute in xml file. For proper functioning of web-view to native communication on all device's it is **recommended** to set src here.

*API Methods of WebViewInterface Class:*

#### on(eventOrCmdName: string, callback: (eventData: any) => void): void
Use this method to assign listener to any event/command emitted from webView.

Callback will be executed with the data sent from webView in any format. 

#### off(eventOrCmdName: string, callback?: (eventData: any) => void): void
Use this method to de-register listener of any event/command emitted from webView.

If callback is not set, all the event listeners for this event will be de-registered.

#### emit(eventOrCmdName: string, data: any): void
Use this method to emit any event/command from native app to webView with data in any format.

#### callJSFunction(webViewFunctionName: string, args: any[], successHandler: (result: any) => void, errorHandler: (error: any) => void): void
Use this method to call to any javascript function in global scope in webView.

Arguments are optional. But if supplied, must be in array format.

If the function is successfully executed, the successHandler will be called with the result returned by the JS Function. If promise is returned from the JS Function, the resolved value will come as result.<br/>
If the function execution generates any error, the errorHandler will be called with the error.

#### destroy(): void
Use this method to clean up webviewInterface resources (eventListeners) to avoid memory leak.

### WebView API

API Methods available in `window.nsWebViewInterface` global variable.

#### on(eventOrCmdName: string, callback: (eventData: any) => void): void
Use this method to assign listener to  any event/command emited from native app.

Callback will be executed with the data sent from native app in any format.

#### emit(eventOrCmdName: string, data: any): void 
Use this method to emit any event/command from webView to native app with data in any format.
