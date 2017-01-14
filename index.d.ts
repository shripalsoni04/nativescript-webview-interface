import {WebView} from 'ui/web-view';

/**
 * WebViewInterface Class containing common functionalities for Android and iOS
 */
export class WebViewInterface {
  /**
   * Creates instance of WebViewInterface
   * @param {WebView} webView Instance of nativescript web-view with which you want to create interface
   * @param {string}  src URL/local path to be loaded in web-view. If it is set, then you don't need to set it in src attribute in xml/html file. For proper functioning of web-view to native communication on all device's it is recommended to set src here. 
   */
  constructor(webView: WebView, src?: string);

  /**
   * Registers handler for event/command emitted from webview
   * @param   {string}    eventName Any event name except reserved '_jsCallResponse'
   * @param   {function}  callback  Callback function to be executed on event/command receive.
   */
  on(eventName: string, callback: (event: any) => void): void;

  /**
   * Deregisters handler for event/command emitted from webview
   * @param   {string}    eventName Any event name except reserved '_jsCallResponse'
   * @param   {function}  callback  If callback is given then only event listener registered with this callback will be removed, else all the listeners for this event will be removed.
   **/
  off(eventName: string, callback?: (event: any) => void): void;

  /**
   * Emits event/command with payload to webView
   * @param   {string}    eventName Any event name
   * @param   {any}       value  Payload to send with event/command
   */
  emit(eventName: string, value: any): void;

  /**
   * Calls function in webView
   * @param   {string}    functionName  Function should be in global scope in webView
   * @param   {any[]}     args  Arguments of the function
   * @param   {function}  successHandler  Function to call on result from webView
   * @param   {function}  errorHandler  Function to call on error from webView      
   */
  callJSFunction(functionName: string, args?: any[], successHandler?: (response: any) => void, errorHandler?: (response: any) => void): void;

  /**
   * Clears mappings of callbacks and webview
   */
  destroy(): void;
}
