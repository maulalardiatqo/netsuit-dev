    /**
     * @NApiVersion 2.1
     * @NScriptType Suitelet
     */

    define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
      function getAllResults(s) {
      var results = s.run();
      var searchResults = [];
      var searchid = 0;
      do {
          var resultslice = results.getRange({
          start: searchid,
          end: searchid + 1000,
          });
          resultslice.forEach(function (slice) {
          searchResults.push(slice);
          searchid++;
          });
      } while (resultslice.length >= 1000);
      return searchResults;
      }
  
      function onRequest(context) {
      var contextRequest = context.request;
      var form = serverWidget.createForm({
          title: "PR to PO",
      });
      var filterOption = form.addFieldGroup({
          id: "filteroption",
          label: "FILTERS",
      });
      var prSelect = form.addField({
        id: 'custpage_pr', 
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
        label: 'PR Number',
      });
      prSelect.addSelectOption({
          value: '', 
          text: '-Select-'
      });
      var purchaseorderSearchObj = search.create({
        type: "purchaseorder",
        filters:
        [
            ["type","anyof","PurchOrd"], 
            "AND", 
            ["numbertext","contains","PR"], 
            "AND", 
            ["approvalstatus","anyof","2"], 
            "AND", 
            ["mainline","is","T"], 
            "AND", 
            ["taxline","is","F"]
        ],
        columns:
        [
            search.createColumn({name: "internalid", label: "Internal ID"}),
            search.createColumn({name: "tranid", label: "Document Number"})
        ]
      });
      var searchResultCount = purchaseorderSearchObj.runPaged().count;
      log.debug("purchaseorderSearchObj result count",searchResultCount);
      purchaseorderSearchObj.run().each(function(result){
          var prId = result.getValue({
            name: "internalid"
          })
          var docNum = result.getValue({
            name: "tranid"
          })
          prSelect.addSelectOption({
            value: prId, 
            text: docNum 
        });
          return true;
      });
      var vendorField = form.addField({
          id: "custpage_vendor",
          label: "Vendor",
          type: serverWidget.FieldType.SELECT,
          source: "vendor",
          container: "filteroption",
      })
      var itemField = form.addField({
          id: "custpage_item_name",
          label: "Item Name",
          type: serverWidget.FieldType.SELECT,
          source: "item",
          container: "filteroption",
      });
      form.addButton({
          id: "convertPO",
          label: "Convert to PO",
          functionName: "prToPO",
      });
  
      form.addSubmitButton({
          label: "Search",
      });
  
      form.addResetButton({
          label: "Clear",
      });
      form.clientScriptModulePath = "SuiteScripts/pr_to_po_form_cs.js";
  
      if (contextRequest.method == "GET") {
  
          context.response.writePage(form);
  
          var scriptObj = runtime.getCurrentScript();
          log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage(),
          });
      } else {
          let filterVendor = context.request.parameters.custpage_vendor;
          let filterItem = context.request.parameters.custpage_item_name;
          let filterPR = context.request.parameters.custpage_pr;
          vendorField.defaultValue = filterVendor;
          if(!filterVendor && !filterItem){
              var errorField = form.addField({
                  id: 'custpage_error_message',
                  type: serverWidget.FieldType.INLINEHTML,
                  label: 'Error',
              });
              errorField.defaultValue = '<p style="color:red;">Please Select Vendor or Item Name.</p>';
              
              context.response.writePage(form);
              return;
          }
          log.debug("filter", {
          filterVendor: filterVendor,
          filterItem: filterItem,
          });
  
          var prToPO = search.load({
          id: "customsearch1021",
          });
          if (filterVendor) {
          prToPO.filters.push(
              search.createFilter({
              name: "internalid",
              join: "vendor",
              operator: search.Operator.ANYOF,
              values: [filterVendor],
              })
          );
          
          }
          if (filterItem) {
          prToPO.filters.push(
              search.createFilter({
              name: "custrecord_iss_pr_item",
              join : "custrecord_iss_pr_parent",
              operator: search.Operator.ANYOF,
              values: [filterItem],
              })
          );
          itemField.defaultValue = filterItem;
          }
          if (filterPR) {
            prToPO.filters.push(
                search.createFilter({
                  name: "internalid",
                  operator: search.Operator.ANYOF,
                  values: filterPR,
                })
            );
            prSelect.defaultValue = filterPR;
          }
  
          var prToPOSet = prToPO.run();
          var prToPO = prToPOSet.getRange(0, 1000);
  
          var currentRecord = createSublist("custpage_sublist_item", form);
          if (prToPO.length > 0) {
            for (let i = 0; i < prToPO.length; i++) {
              let itemName = prToPO[i].getText({
                name: prToPOSet.columns[0],
              });
              let itemID = prToPO[i].getValue({
                name: prToPOSet.columns[0],
              });
              let vendorName = prToPO[i].getValue({
                name: prToPOSet.columns[1],
              });
              let currentStock = prToPO[i].getValue({
                name: prToPOSet.columns[2],
              });
              let incomingStock = prToPO[i].getValue({
                name: prToPOSet.columns[3],
              });
              let salesRep = prToPO[i].getText({
                name: prToPOSet.columns[4],
              });
              let salesRepID = prToPO[i].getValue({
                name: prToPOSet.columns[4],
              });
              let customerName = prToPO[i].getText({
                name: prToPOSet.columns[26],
              });
              let customerID = prToPO[i].getValue({
                name: prToPOSet.columns[26],
              });
              let forecastBusdev = prToPO[i].getValue({
                name: prToPOSet.columns[6],
              });
              let forecastPerhitungan = prToPO[i].getValue({
                name: prToPOSet.columns[7],
              });
              let avgBusdev = prToPO[i].getValue({
                name: prToPOSet.columns[8],
              });
              let avgAccounting = prToPO[i].getValue({
                name: prToPOSet.columns[9],
              });
              let note = prToPO[i].getValue({
                name: prToPOSet.columns[10],
              });
              let internalID = prToPO[i].getValue({
                name: prToPOSet.columns[11],
              });
              let osPO = prToPO[i].getValue({
                name: prToPOSet.columns[12],
              });
              let cek2 = prToPO[i].getValue({
                name: prToPOSet.columns[15],
              });
              let leadTimeKirim = prToPO[i].getValue({
                name: prToPOSet.columns[16],
              });
              let units = prToPO[i].getValue({
                name: prToPOSet.columns[17],
              });
              let unitsText = prToPO[i].getText({
                name: prToPOSet.columns[17],
              });
              let docNumber = prToPO[i].getValue({
                name: prToPOSet.columns[18],
              });
              let soNO = prToPO[i].getValue({
                name: prToPOSet.columns[19],
              });
              let taxItem = prToPO[i].getValue({
                name: prToPOSet.columns[20],
              });
              let taxItemRate = prToPO[i].getValue({
                name: prToPOSet.columns[21],
              });
              let tanggalKirim = prToPO[i].getValue({
                name: prToPOSet.columns[22],
              });
              let packSize = prToPO[i].getValue({
                name: prToPOSet.columns[23],
              });
              let packSizeText = prToPO[i].getText({
                name: prToPOSet.columns[23],
              });
              let soNumber = prToPO[i].getValue({
                name: prToPOSet.columns[19],
              });
              let soNumberText = prToPO[i].getText({
                name: prToPOSet.columns[19],
              });
              let totalOrder = prToPO[i].getValue({
                name: prToPOSet.columns[28],
              })
              let qtyPO = prToPO[i].getValue({
                name: prToPOSet.columns[27],
              })
              let lineId = prToPO[i].getValue({
                name : prToPOSet.columns[29]
              })
              let currency = prToPO[i].getValue({
                name : prToPOSet.columns[31]
              })
              let idSum = prToPO[i].getValue({
                name : prToPOSet.columns[32]
              });
              let lastPurchise = prToPO[i].getValue({
                name : prToPOSet.columns[33]
              });
              let poCust = prToPO[i].getValue({
                name : prToPOSet.columns[34]
              });
              var totalPackaging = 0
              var customrecord_pr_summary_customerSearchObj = search.create({
                type: "customrecord_pr_summary_customer",
                filters: [
                    ["internalid", "anyof", idSum]
                ],
                columns: [
                    search.createColumn({name: "custrecord_iss_total_order_formula", label: "Total Packaging"})
                ]
              });
              var searchResult = customrecord_pr_summary_customerSearchObj.run().getRange({
                  start: 0,
                  end: 1
              });
              
              if (searchResult.length > 0) {
                  var package = searchResult[0].getValue("custrecord_iss_total_order_formula");
                  if(package){
                    totalPackaging = package
                  }
              }
              log.debug('currency', currency)
              totalPackaging = Math.abs(parseFloat(totalPackaging || 0)) - parseFloat(qtyPO || 0);
              var itemRate
              let cek1 = prToPO[i].getValue({
                name: prToPOSet.columns[25],
              });
              if(totalPackaging > 0){
                if(cek1 || cek1 != ''){
                  itemRate = cek1
                }else{
                  itemRate = cek2
                }
                log.debug('internalID', internalID)
                // currentRecord.setSublistValue({
                //   sublistId: "custpage_sublist_item",
                //   id: "custpage_sublist_view_link",
                //   value: `https://9274135.app.netsuite.com/app/accounting/transactions/purchord.nl?id=${internalID}&whence=`,
                //   line: i,
                // });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_item_name",
                  value: itemName || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_vendor",
                  value: vendorName || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_current_stock",
                  value: currentStock || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_incoming_stock",
                  value: incomingStock || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_sales_rep",
                  value: salesRep || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_customer",
                  value: customerName || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_forecast_busdev",
                  value: forecastBusdev || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_forecast_perhitungan",
                  value: forecastPerhitungan || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_avg_busdev",
                  value: avgBusdev || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_avg_accounting",
                  value: avgAccounting || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_total_order",
                  value: Math.abs(totalOrder),
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_packsize",
                  value: packSize || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_packsize_text",
                  value: packSizeText || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_qty_po",
                  value: Math.abs(qtyPO),
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_note",
                  value: note || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_os_po",
                  value: osPO || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_internalid",
                  value: internalID,
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_item_internalid",
                  value: itemID || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_salesrep_internalid",
                  value: salesRepID || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_customer_internalid",
                  value: customerID || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_rate",
                  value: itemRate || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_lead_time_kirim",
                  value: leadTimeKirim || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_units",
                  value: units || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_doc_number",
                  value: docNumber || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_taxitem",
                  value: 5,
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_taxrate",
                  value: taxItemRate || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_so_no",
                  value: soNO || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_tanggal_kirim",
                  value: tanggalKirim || " ",
                  line: i,
                });
               
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_sonumber",
                  value: soNumber || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_sonumber_text",
                  value: soNumberText || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_line_id",
                  value: lineId || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_currency",
                  value: currency || " ",
                  line: i,
                });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_total_packaging",
                  value: totalPackaging || " ",
                  line: i,
                });
                // currentRecord.setSublistValue({
                //   sublistId: "custpage_sublist_item",
                //   id: "custpage_sublist_last_purchase",
                //   value: lastPurchise || " ",
                //   line: i,
                // });
                currentRecord.setSublistValue({
                  sublistId: "custpage_sublist_item",
                  id: "custpage_sublist_pocust",
                  value: poCust || " ",
                  line: i,
                });
              }
              
            }
          }
          context.response.writePage(form);
      }
      }
  
      function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
          id: sublistname,
          type: serverWidget.SublistType.LIST,
          label: "PR List",
          tab: "matchedtab",
        });
        sublist_in.addMarkAllButtons();
    
        sublist_in
          .addField({
            id: "custpage_sublist_item_select",
            label: "Select",
            type: serverWidget.FieldType.CHECKBOX,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
    
        // sublist_in.addField({
        //   id: "custpage_sublist_view_link",
        //   label: "VIEW",
        //   type: serverWidget.FieldType.URL,
        // }).linkText = "View";
    
        sublist_in.addField({
          id: "custpage_sublist_doc_number",
          label: "DOC NUMBER",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_item_name",
          label: "ITEM",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_vendor",
          label: "VENDOR",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_current_stock",
          label: "CURRENT STOCK",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_incoming_stock",
          label: "INCOMING STOCK",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_sales_rep",
          label: "SALES REP",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_customer",
          label: "CUSTOMER",
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_os_po",
          label: "OS PO TERBARU",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_tanggal_kirim",
          label: "TANGGAL KIRIM",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_forecast_busdev",
          label: "FORECAST BUSDEV",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_forecast_perhitungan",
          label: "FORECAST PERHITUNGAN",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_avg_busdev",
          label: "AVG BUSDEV",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_avg_accounting",
          label: "AVG ACCOUNTING",
          type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_total_order",
          label: "TOTAL ORDER/1KG",
          type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
          id: "custpage_sublist_packsize",
          label: "PACK SIZE ORDER",
          type: serverWidget.FieldType.TEXT,
        }) .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
       
        sublist_in.addField({
          id: "custpage_sublist_packsize_text",
          label: "PACK SIZE ORDER",
          type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
          id: "custpage_sublist_total_packaging",
          label: "TOTAL PACKAGING",
          type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
          id: "custpage_sublist_qty_po",
          label: "QTY PO",
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_note",
          label: "NOTE",
          type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
          id: "custpage_sublist_currency",
          label: "Currency",
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_sonumber_text",
          label: "SO NUMBER",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
    
        sublist_in.addField({
          id: "custpage_sublist_sonumber",
          label: "SO NUMBER",
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        sublist_in.addField({
          id: "custpage_sublist_line_id",
          label: "Line Id",
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
    
        sublist_in
          .addField({
            id: "custpage_sublist_internalid",
            label: "INTERNALID",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_item_internalid",
            label: "ITEM INTERNALID",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_salesrep_internalid",
            label: "SALES INTERNALID",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_customer_internalid",
            label: "CUSTOMER INTERNALID",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_rate",
            label: "RATE",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_lead_time_kirim",
            label: "LEAD TIME KIRIM",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_units",
            label: "UNITS",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
          sublist_in
          .addField({
            id: "custpage_sublist_last_purchase",
            label: "UNITS",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_taxitem",
            label: "TAX ITEM",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_so_no",
            label: "SO NO",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        sublist_in
          .addField({
            id: "custpage_sublist_taxrate",
            label: "TAX RATE",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
          sublist_in
          .addField({
            id: "custpage_sublist_pocust",
            label: "POCust",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
    
        return sublist_in;
      }
  
      return {
      onRequest: onRequest,
      };
  });
  