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
     * Mapping of js call request id and its response handler. 
     * Based on this mapping, the registered handler will be called 
     * on response of a js call
     */
    this.jsCallReqIdCallbackMap = {};
    
    /**
     * Clears mappings of callbacks on webView unload
     */
    webView.on('unloaded', function () {
        this.eventListenerMap = null;
        this.jsCallReqIdCallbackMap = null;
    }.bind(this));
}

/**
 * Prepares call to a function in webView, which handles native event/command calls
 */
WebViewInterface.prototype._prepareEmitEventJSCall = function (eventName, data) {
    data = typeof data === 'object' ? JSON.stringify(data) : '"' + data + '"';
    return 'window.nsWebViewInterface._onNativeEvent("' + eventName + '",' + data + ');'
};

/**
 * Prepares call to a function in webView, which calls the specified function in the webView
 */
WebViewInterface.prototype._prepareJSFunctionCall = function (functionName, arrArgs, callback) {
    arrArgs = arrArgs || [];
    
    // converts non array argument to array
    if (typeof arrArgs !== 'object' || arrArgs.length === void (0)) {
        arrArgs = [arrArgs];
    }
    var strArgs = JSON.stringify(arrArgs);
    var reqId = ++WebViewInterface.cntJSCallReqId;
    this.jsCallReqIdCallbackMap[reqId] = callback;
    return 'window.nsWebViewInterface._callJSFunction(' + reqId + ',"' + functionName + '",' + strArgs + ');'
}

/**
 * Handles response/event/command from webView.
 */
WebViewInterface.prototype._onWebViewEvent = function (eventName, data) {
    var oData = parseJSON(data) || data;
    
    // in case of JS call result, eventName will be _jsCallResponse
    if (eventName === '_jsCallResponse') {
        var reqId = oData.reqId;
        var callback = this.jsCallReqIdCallbackMap[reqId];
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
WebViewInterface.prototype.callJSFunction = function (functionName, args, callback) {
    var strJSFunction = this._prepareJSFunctionCall(functionName, args, callback);
    this._executeJS(strJSFunction);
};
    
/**
 * Counter to create unique requestId for each JS call to webView.
 */
WebViewInterface.cntJSCallReqId = 0;

exports.WebViewInterface = WebViewInterface;
exports.parseJSON = parseJSON;