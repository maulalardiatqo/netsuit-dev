/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record',
    'N/runtime',
    'N/ui/serverWidget',
    'N/ui/message',
    'N/search',
    'N/url',
    'N/format',
    'N/redirect'
  ],
  function(record, runtime, serverWidget, message, search, url, format, redirect) {

    function onRequest(context) {
      var params = context.request;
      var postid = params.parameters.postid;
      log.debug("postid", postid);

      if (error > 0) {
        var mType = message.Type.ERROR;
        var mTitle = "Error";
        var mMessage = `<html>
          <h3>Error</h3>
          <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
        <body></html>`;
        var form = serverWidget.createForm({
          title: "Good Receipt Result",
        });
        form.addPageInitMessage({
          type: mType,
          title: mTitle,
          message: mMessage,
        });
        context.response.writePage(form);
      } else {
        window.history.go(-1)
      }
    }

    return {
      onRequest: onRequest
    };
  });