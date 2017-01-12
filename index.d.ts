import {WebView} from 'ui/web-view';

/**
 * WebViewInterface Class containing common functionalities for Android and iOS
 */
export class WebViewInterface {
  constructor(webView: WebView, src?: string);

  /**
   * WebView to setup interface for
   */
  webView: WebView;

  /**
   * Web-view instance unique id to handle scenarios of multiple webview on single page.
   */
  readonly id: number;

  /**
   * Registers handler for event/command emitted from webview
   * @param   {string}    eventName - Any event name except reserved '_jsCallResponse'
   * @param   {function}  callback - Callback function to be executed on event/command receive.
   */
  on(eventName: string, callback: (event: any) => void): void;

  /**
   * Deregisters handler for event/command emitted from webview
   * @param   {string}    eventName - Any event name except reserved '_jsCallResponse'
   * @param   {function}  callback - Callback function to be executed on event/command receive.
   **/
  off(eventName: string, callback?: (event: any) => void): void;

  /**
   * Emits event/command with payload to webView.
   * @param   {string}    eventName - Any event name
   * @param   {any}       data - Payload to send wiht event/command
   */
  emit(eventName: string, value: any): void;

  /**
   * Calls function in webView
   * @param   {string}    functionName - Function should be in global scope in webView
   * @param   {any[]}     args - Arguments of the function
   * @param   {function}  callback - Function to call on result from webView      
   */
  callJSFunction(functionName: string, args: any[], successHandler: (response: any) => void, errorHandler: (response: any) => void): void;

  /**
   * Clears mappings of callbacks and webview.
   * This needs to be called in navigatedFrom event handler in page where webviewInterface plugin is used.
   */
  destroy(): void;
}
