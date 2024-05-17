/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/record", "N/file", "N/https", "N/runtime", "N/format"], /**
 * @param {search} search
 * @param {record} record
 * @param {file} file
 * @param {https} https
 * @param {runtime} runtime
 */ function (search, record, file, https, runtime, format) {
  /**
   * Function called upon sending a GET request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.1
   */
    function getItem(intID){
      log.debug('intID', intID);
      try{
        var dataObject = {};
        var response = [];
        var invDetail = [];
        
          var inventorybalanceSearchObj = search.create({
            type: "inventorybalance",
            filters:
            [
              ["item","anyof",intID]
            ],
            columns:
            [
                search.createColumn({
                    name: "item",
                    summary: "GROUP",
                    label: "Item"
                }),
                search.createColumn({
                    name: "location",
                    summary: "GROUP",
                    label: "Location"
                }),
                search.createColumn({
                    name: "status",
                    summary: "GROUP",
                    label: "Status"
                }),
                search.createColumn({
                    name: "available",
                    summary: "SUM",
                    label: "Available"
                })
            ]
          });
          var searchResultCount = inventorybalanceSearchObj.runPaged().count;
          log.debug("inventorybalanceSearchObj result count",searchResultCount);
          if(searchResultCount>0){
            inventorybalanceSearchObj.run().each(function(result){
              var location = result.getValue({
                name: "location",
                summary: "GROUP",
              }) || "" ;
              log.debug('location', location);
              var qtyAvailable = result.getValue({
                name: "available",
                summary: "SUM",
              }) || ""
              invDetail.push({
                location : location,
                qtyAvailable : qtyAvailable
              })
              return true;
            });
            dataObject = {
              iditem: intID,
              invDetail : invDetail
            }
            log.debug('dataObject', dataObject)
            response = {
              status: "success",
              data: dataObject,
              message: `ok`,
            };
          }else{
            response = {
              status: "failed",
              data: dataObject,
              message: `no item for internalid ${intID}`,
            };
          }
          log.debug('response', response)
          return JSON.stringify(response);
        }catch(e){
          return JSON.stringify(e);
        }
      
    }
    function getItemBulk(start, end){
      try{
        log.debug("bulk item", {
          start: start,
          end: end,
        });
        var dataObject = {};
        var response = [];
        var allInvDetail = []
        var inventorybalanceSearchObj = search.create({
          type: "inventorybalance",
          filters:
          [
          ],
          columns:
          [
              search.createColumn({
                  name: "item",
                  summary: "GROUP",
                  label: "Item"
              }),
              search.createColumn({
                  name: "location",
                  summary: "GROUP",
                  label: "Location"
              }),
              search.createColumn({
                  name: "status",
                  summary: "GROUP",
                  label: "Status"
              }),
              search.createColumn({
                  name: "available",
                  summary: "SUM",
                  label: "Available"
              })
          ]
        });
        var searchResultCount = inventorybalanceSearchObj.runPaged().count;
        log.debug("inventorybalanceSearchObj result count",searchResultCount);
        inventorybalanceSearchObj.run().each(function(result){
          var item = result.getValue({
            name: "item",
            summary: "GROUP",
          }) || "" ;
          var location = result.getValue({
            name: "location",
            summary: "GROUP",
          }) || "" ;
          log.debug('location', location);
          var qtyAvailable = result.getValue({
            name: "available",
            summary: "SUM",
          }) || ""
          allInvDetail.push({
            item : item,
            location : location,
            qtyAvailable : qtyAvailable
          })
          return true;
        });
        dataObject = {
          allInvDetail : allInvDetail
        }
        response = {
          status: "success",
          data: dataObject,
          message: `ok`,
        };
        return JSON.stringify(response);
      }catch(e){
        return JSON.stringify(e);
      }
        
    }
    function doGet(requestParams) {
        try {
            var record_type = requestParams.record_type;
            var intID = requestParams.internalid;
            var start = requestParams.start;
            var end = requestParams.end;
            if(record_type === 'getItem'){
              return getItem(intID);
            }else if(record_type === 'getBulkItem'){
              return getItemBulk(start, end)
            }else{
              return JSON.stringify("No intID");
            }
            // if (record_type === "itemPrice") return getItem(intID);
            // else return JSON.stringify("No record type selected");
        } catch (e) {
          log.debug("Error Get Method : ", e);
        }
    }

  /**
   * Function called upon sending a PUT request to the RESTlet.
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
    function doPut(requestBody) {}

    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
    }

    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {}

  return {
    get: doGet,
    put: doPut,
    post: doPost,
    delete: doDelete,
  };
});
