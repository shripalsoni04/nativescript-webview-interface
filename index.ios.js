 var common = require("./index-common");
 
 /**
  * iOS specific WebViewInterface Class 
  */ 
 var WebViewInterface = (function(_super){
    __extends(WebViewInterface, _super);
    
    function WebViewInterface(webView, src){
        _super.call(this, webView);

        /**
         * Since NativeScript v3.4.0 the UI component WebView is using WKWebView which broke this plugin.
         * This property is used to overcome this issue and maintain compatibility with older versions of NativeScript.
         *
         * @see https://github.com/shripalsoni04/nativescript-webview-interface/issues/22
         *
         */
        this.isUsingWKWebView = this.webView.ios.constructor.name === "WKWebView";

        this._listenWebViewLoadStarted();
        if(src){
            this.webView.src = src;
        }
    }
    
    /**
     * Intercepts all requests from webView and processes requests with js2ios: protocol.
     * Communication from webView to iOS is done by custom urls. 
     * e.g js2ios:{"eventName": "anyEvent", "resId": number}. Here resId is used as unique message id 
     * to fetch result from webView as we cannot rely on url for large results.
     * 
     */
    WebViewInterface.prototype._interceptCallsFromWebview = function (args) {
        var request = args.url;
        var reqMsgProtocol = 'js2ios:';
        var reqMsgStartIndex = request.indexOf(reqMsgProtocol);
        if (reqMsgStartIndex === 0) {
            var reqMsg = decodeURIComponent(request.substring(reqMsgProtocol.length, request.length));
            var oReqMsg = common.parseJSON(reqMsg);
            if(oReqMsg){
                var eventName = oReqMsg.eventName;
                this._executeJS('window.nsWebViewInterface._getIOSResponse('+oReqMsg.resId+')')
                    .then(function(data) {
                        this._onWebViewEvent(eventName, data);
                    }.bind(this))
                    .catch(function(error) {
                        throw error;
                    });
            }
        }
    };

    /**
     * Attaches loadStarted event listener on webView to intercept calls and process them.
     */
    WebViewInterface.prototype._listenWebViewLoadStarted = function(){
        this.webView.on('loadStarted', this._interceptCallsFromWebview, this); 
    }
    
    /**
     * Executes event/command/jsFunction in webView.
     */
    WebViewInterface.prototype._executeJS = function(strJSFunction) {
        return new Promise(function(resolve, reject) {
            if (this.isUsingWKWebView) {
                this.webView.ios.evaluateJavaScriptCompletionHandler(strJSFunction, function(data, error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data);
                    }
                });
            } else {
                resolve(this.webView.ios.stringByEvaluatingJavaScriptFromString(strJSFunction));
            }
        }.bind(this));
    };

    /**
     * Removes loadStarted event listener.
     */
    WebViewInterface.prototype._destroy = function () {
        this.webView.off('loadStarted', this._interceptCallsFromWebview, this);
    };
    
    return WebViewInterface;
 })(common.WebViewInterface);
 
 exports.WebViewInterface = WebViewInterface;
