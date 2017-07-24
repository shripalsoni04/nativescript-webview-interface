 const common = require("./index-common");
 const platformModule = require("platform");

 global.moduleMerge(common, exports);
 
 /**
  * Factory function to provide instance of Android JavascriptInterface.      
  */ 
 function getAndroidJSInterface(oWebViewInterface){
    var AndroidWebViewInterface = com.shripalsoni.natiescriptwebviewinterface.WebViewInterface.extend({
        /**
         * On call from webView to android, this function is called from handleEventFromWebView method of WebViewInerface class
         */
        onWebViewEvent: function(webViewId, eventName, jsonData){
            // getting webviewInterface object by webViewId from static map.
            var oWebViewInterface = getWebViewIntefaceObjByWebViewId(webViewId);
            oWebViewInterface._onWebViewEvent(eventName, jsonData);
        }
    });
    
    // creating androidWebViewInterface with unique web-view id.
    return new AndroidWebViewInterface(new java.lang.String(''+oWebViewInterface.id));
 }
 
 /**
  * Returns webViewInterface object mapped with the passed webViewId.
  */
 function getWebViewIntefaceObjByWebViewId(webViewId){
     return common.WebViewInterface.webViewInterfaceIdMap[webViewId];
 }
 
 /**
  * Android Specific WebViewInterface Class
  */
 var WebViewInterface = (function(_super){
    __extends(WebViewInterface, _super);
    
    function WebViewInterface(webView, src){
        _super.call(this, webView);
        this._initWebView(src); 
    }
    
    /**
     * Initializes webView for communication between android and webView.
     */
    WebViewInterface.prototype._initWebView = function(src){
        var _this = this;
        if(this.webView.isLoaded) {
            _this._setAndroidWebViewSettings(src);
        } else {
            var handlerRef = _this.webView.on('loaded', function(){
                _this._setAndroidWebViewSettings(src);
                _this.webView.off('loaded', handlerRef);
            });
        }
    };
    
    WebViewInterface.prototype._setAndroidWebViewSettings = function(src) {
        var oJSInterface =  getAndroidJSInterface(this);
        var androidSettings = this.webView.android.getSettings();
        androidSettings.setJavaScriptEnabled(true);
        this.webView.android.addJavascriptInterface(oJSInterface, 'androidWebViewInterface');

        // If src is provided, then setting it.
        // To make javascriptInterface available in web-view, it should be set before 
        // web-view's loadUrl method is called. So setting src after javascriptInterface is set.
        if(src){
            this.webView.src = src;
        }
    }

    /**
     * Executes event/command/jsFunction in webView.
     */
    WebViewInterface.prototype._executeJS = function(strJSFunction){
      if (platformModule.device.sdkVersion >= 19) {
        this.webView.android.evaluateJavascript(strJSFunction, null);
      }
      else {
        this.webView.android.loadUrl('javascript:'+strJSFunction);
      }
    };
    
    return WebViewInterface;
 })(common.WebViewInterface);
 
 exports.WebViewInterface = WebViewInterface;