/**
 * Parses json string to object if valid.
 */
function parseJSON(data) {
    var oData;
    try {
        oData = JSON.parse(data);
    } catch (e) {
        return false;
    }
    return oData;
}

/**
 * WebViewInterface Class containing common functionalities for Android and iOS
 */
function WebViewInterface(webView) {
    /**
     * WebView to setup interface for
     */
    this.webView = webView;
    
    /**
     * Mapping of webView event/command and its native handler 
     */
    this.eventListenerMap = {};
    
    /**
     * Mapping of js call request id and its success handler. 
     * Based on this mapping, the registered success handler will be called 
     * on successful response from the js call
     */
    this.jsCallReqIdSuccessCallbackMap = {};
    
    /**
     * Mapping of js call request id and its error handler. 
     * Based on this mapping, the error handler will be called 
     * on error from the js call
     */
    this.jsCallReqIdErrorCallbackMap = {};
    
    /**
     * Web-view instance unique id to handle scenarios of multiple webview on single page.
     */
    this.id = ++WebViewInterface.cntWebViewId;
    
    /**
     * Maintaining mapping of webview instance and its id, to handle scenarios of multiple webview on single page.
     */
    WebViewInterface.webViewInterfaceIdMap[this.id] = this;
}

/**
 * Prepares call to a function in webView, which handles native event/command calls
 */
WebViewInterface.prototype._prepareEmitEventJSCall = function (eventName, data) {
    data = JSON.stringify(data);    // calling stringify for all types of data. Because if data is a string containing ", we need to escape that. Ref: https://github.com/shripalsoni04/nativescript-webview-interface/pull/6
    return 'window.nsWebViewInterface._onNativeEvent("' + eventName + '",' + data + ');'
};

/**
 * Prepares call to a function in webView, which calls the specified function in the webView
 */
WebViewInterface.prototype._prepareJSFunctionCall = function (functionName, arrArgs, successHandler, errorHandler) {
    arrArgs = arrArgs || [];
    
    // converts non array argument to array
    if (typeof arrArgs !== 'object' || arrArgs.length === void (0)) {
        arrArgs = [arrArgs];
    }
    var strArgs = JSON.stringify(arrArgs);
    // creating id with combination of web-view id and req id
    var reqId = '"'+this.id+'#'+ (++WebViewInterface.cntJSCallReqId)+'"';
    this.jsCallReqIdSuccessCallbackMap[reqId] = successHandler;
    this.jsCallReqIdErrorCallbackMap[reqId] = errorHandler;
    return 'window.nsWebViewInterface._callJSFunction(' + reqId + ',"' + functionName + '",' + strArgs + ');'
}

/**
 * Handles response/event/command from webView.
 */
WebViewInterface.prototype._onWebViewEvent = function (eventName, data) {
    var oData = parseJSON(data) || data;
    
    // in case of JS call result, eventName will be _jsCallResponse
    if (eventName === '_jsCallResponse') {
        var reqId = '"'+oData.reqId+'"';
        var callback;
        
        if(oData.isError){
            callback = this.jsCallReqIdErrorCallbackMap[reqId];
        }else{
            callback = this.jsCallReqIdSuccessCallbackMap[reqId];
        }
        
        if (callback) {
            callback(oData.response);
        }
    } else {
        var lstCallbacks = this.eventListenerMap[eventName] || [];
        for (var i = 0; i < lstCallbacks.length; i++) {
            var retnVal = lstCallbacks[i](oData);
            if (retnVal === false) {
                break;
            }
        }
    }
};

/**
 * Registers handler for event/command emitted from webview
 * @param   {string}    eventName - Any event name except reserved '_jsCallResponse'
 * @param   {function}  callback - Callback function to be executed on event/command receive.
 */
WebViewInterface.prototype.on = function (eventName, callback) {
    if(eventName === '_jsCallResponse'){
        throw new Error('_jsCallResponse eventName is reserved for internal use. You cannot attach listeners to it.');    
    }
    
    (this.eventListenerMap[eventName] || (this.eventListenerMap[eventName] = [])).push(callback);
};

/**
 * Deregisters handler for event/command emitted from webview
 * @param   {string}    eventName - Any event name except reserved '_jsCallResponse'
 * @param   {function}  callback - Callback function to be executed on event/command receive.
 **/
WebViewInterface.prototype.off = function (eventName, callback) {
    if(eventName === '_jsCallResponse'){
        throw new Error('_jsCallResponse eventName is reserved for internal use. You cannot deattach listeners to it.');
    }

    if (!this.eventListenerMap[eventName] || this.eventListenerMap[eventName].length === 0) {
      return;
    }

    if (callback) {
      this.eventListenerMap[eventName] = this.eventListenerMap[eventName].filter(function(oldCallback) {
        return oldCallback !== callback;
      });
    } else {
      delete this.eventListenerMap[eventName];
    }
};

/**
 * Emits event/command with payload to webView.
 * @param   {string}    eventName - Any event name
 * @param   {any}       data - Payload to send wiht event/command
 */
WebViewInterface.prototype.emit = function (eventName, data) {
    var strJSFunction = this._prepareEmitEventJSCall(eventName, data);
    this._executeJS(strJSFunction);
}

/**
 * Calls function in webView
 * @param   {string}    functionName - Function should be in global scope in webView
 * @param   {any[]}     args - Arguments of the function
 * @param   {function}  callback - Function to call on result from webView      
 */
WebViewInterface.prototype.callJSFunction = function (functionName, args, successHandler, errorHandler) {
    var strJSFunction = this._prepareJSFunctionCall(functionName, args, successHandler, errorHandler);
    this._executeJS(strJSFunction);
};

/**
 * Clears mappings of callbacks and webview.
 * This needs to be called in navigatedFrom event handler in page where webviewInterface plugin is used.
 */
WebViewInterface.prototype.destroy = function(){
    // call platform specific destroy function if available. Currently used only for iOS to remove loadStarted event listener.
    if(this._destroy) {
        this._destroy();
    }

    /**
     * 
     * Resetting src to blank. This needs to be done to avoid issue of communication stops working from webView to nativescript when 
     * page with webVeiw is opened on back button press on android.
     * This issue occurs because nativescript destroys the native webView element on navigation if cache is disabled, and when we navigate back
     * it recreates the native webView and attaches it to nativescript webView element. So we have to reinitiate this plugin with new webView instance.
     * Now, to make communication from webVeiw to nativescript work on android, 
     * androidJSInterface should be loaded before any request loads on webView. So if we don't reset src on nativescript webView, that src will start
     * loading as soon as the native webView is created and before we add androidJSInterface. This results in stoppage of communication from webView 
     * to nativescript when page is opened on back navigation.
     */
    if(this.webView) {
        this.webView.src = '';
    }

    this.eventListenerMap = null;
    this.jsCallReqIdSuccessCallbackMap = null;
    this.jsCallReqIdErrorCallbackMap = null;
    delete WebViewInterface.webViewInterfaceIdMap[this.id]; 
};

/**
 * Counter to create unique requestId for each JS call to webView.
 */
WebViewInterface.cntJSCallReqId = 0;
WebViewInterface.cntWebViewId = 0;
WebViewInterface.webViewInterfaceIdMap = {};

exports.WebViewInterface = WebViewInterface;
exports.parseJSON = parseJSON;