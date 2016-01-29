 var common = require("./index-common");
 
 global.moduleMerge(common, exports);
 
 /**
  * Factory function to provide instance of Android JavascriptInterface.      
  */ 
 function getAndroidJSInterface(oWebViewInterface){
    var AndroidWebViewInterface = com.shripalsoni.natiescriptwebviewinterface.WebViewInterface.extend({
        /**
         * On call from webView to android, this function is called from handleEventFromWebView method of WebViewInerface class
         */
        onWebViewEvent: function(eventName, jsonData){
            oWebViewInterface._onWebViewEvent(eventName, jsonData);
        }
    });
    
    return new AndroidWebViewInterface();
 }
 
 /**
  * Android Specific WebViewInterface Class
  */
 var WebViewInterface = (function(_super){
    __extends(WebViewInterface, _super);
    
    function WebViewInterface(webView){
        _super.call(this, webView);
        this._initWebView(); 
    }
    
    /**
     * Initializes webView for communication between android and webView.
     */
    WebViewInterface.prototype._initWebView = function(){
        var oJSInterface =  getAndroidJSInterface(this);
        var androidSettings = this.webView.android.getSettings();
        androidSettings.setJavaScriptEnabled(true);
        this.webView.android.addJavascriptInterface(oJSInterface, 'androidWebViewInterface');
    };
    
    /**
     * Executes event/command/jsFunction in webView.
     */
    WebViewInterface.prototype._executeJS = function(strJSFunction){
        var url = 'javascript:'+strJSFunction;
        this.webView.android.loadUrl(url);
    };
    
    return WebViewInterface;
 })(common.WebViewInterface);
 
 exports.WebViewInterface = WebViewInterface;