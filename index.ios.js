 var common = require("./index-common");
 
 /**
  * iOS specific WebViewInterface Class 
  */ 
 var WebViewInterface = (function(_super){
    __extends(WebViewInterface, _super);
    
    function WebViewInterface(webView, src){
        _super.call(this, webView);
        this._interceptCallsFromWebview();
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
    WebViewInterface.prototype._interceptCallsFromWebview = function(){
        this.webView.on('loadStarted', function (args) {
            var request = args.url;
            var reqMsgProtocol = 'js2ios:';
            var reqMsgStartIndex = request.indexOf(reqMsgProtocol);
            if (reqMsgStartIndex === 0) {
                var reqMsg = decodeURIComponent(request.substring(reqMsgProtocol.length, request.length));
                var oReqMsg = common.parseJSON(reqMsg);
                if(oReqMsg){
                    var eventName = oReqMsg.eventName;
                    var data = this._executeJS('window.nsWebViewInterface._getIOSResponse('+oReqMsg.resId+')');
                    this._onWebViewEvent(eventName, data);    
                }
            }
        }.bind(this)); 
    }
    
    /**
     * Executes event/command/jsFunction in webView.
     */
    WebViewInterface.prototype._executeJS = function(strJSFunction){
        return this.webView.ios.stringByEvaluatingJavaScriptFromString(strJSFunction);
    };
    
    return WebViewInterface;
 })(common.WebViewInterface);
 
 exports.WebViewInterface = WebViewInterface;