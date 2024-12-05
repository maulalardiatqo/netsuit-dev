/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message'], function (serverWidget, task, search, log, record, message) {

//     function onRequest(context) {
//         if (context.request.method === 'GET') {
//             log.debug('masuk')
//             var form = serverWidget.createForm({
//                 title: 'Generate Accounting And Tax Period'
//             });
            
            
//             form.addSubmitButton({
//                 label: 'Generate'
//             });
//             context.response.writePage(form);

//         } else {
//             try{
//                     var id = 122
//                     var recLoad = record.load({
//                         type: "accountingperiod",
//                         id : id
//                     });
//                     recLoad.setValue({
//                         fieldId : "aplocked",
//                         value : true
//                     })
//                     var save = recLoad.save();
//                     log.debug('save', save)
                
//             }catch(e){
//                 log.debug('error', e)
//             }
           

//         }
//     }

//     return {
//         onRequest: onRequest
//     };
// });

define(['N/search', 'N/ui/serverWidget', 'N/url','N/runtime', 'N/record', 'N/log','N/task'], function(search, serverWidget, url, runtime, record,log, task) {
    var baseUrl = url.resolveDomain({
        hostType: url.HostType.APPLICATION
    });
    const assignRole = (userId, roleId) => {
        const employeeRecord = record.load({
            type: record.Type.EMPLOYEE,
            id: userId,
            isDynamic: true,
        });

        employeeRecord.selectNewLine({ sublistId: 'roles' });
        employeeRecord.setCurrentSublistValue({
            sublistId: 'roles',
            fieldId: 'selectedrole',
            value: roleId,
        });
        employeeRecord.commitLine({ sublistId: 'roles' });

        const updatedEmployeeId = employeeRecord.save();
        return updatedEmployeeId;
    };

    function formatDate(dateString) {
        let date = new Date(dateString);
        log.debug('DATE', date)
        let month = ('0' + (date.getMonth() + 1)).slice(-2);
        let day = ('0' + date.getDate()).slice(-2);
        let year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    function formatStringToDDMMYYYY(dateString) {
        let parts = dateString.match(/(\w{3}) (\w{3}) (\d{2}) (\d{4})/);

        if (!parts) {
            throw new Error("Invalid date format");
        }
    
        let day = parts[3];
        let month = parts[2];
        let year = parts[4];
    
        // Map month names to numbers
        const monthMap = {
            Jan: "01",
            Feb: "02",
            Mar: "03",
            Apr: "04",
            May: "05",
            Jun: "06",
            Jul: "07",
            Aug: "08",
            Sep: "09",
            Oct: "10",
            Nov: "11",
            Dec: "12",
        };
    
        // Convert the month name to a number
        let monthNumber = monthMap[month];
    
        // Return the formatted date
        return `${day}/${monthNumber}/${year}`;
    }

    function globalSearch(id, period, pageSize=0){
        // console.log('params',{id,period})
        let formattedDate = formatStringToDDMMYYYY(period);
    
        log.debug('Formated Date',formattedDate);
        try {
            let searchRec = search.load({
                id : id
            });
    
            
    
            if(id == 'customsearch_rda_list_gl_clearing_bal' || id == 'customsearch_rda_list_outst_ar' || id == 'customsearch_rda_list_outst_ar_2'){
                searchRec.filters.push(search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ON,
                    values: formattedDate 
                }))
            }
    
            if(pageSize > 0){
                let pagedData = searchRec.runPaged({
                    pageSize: pageSize
                });

                return pagedData
            }
            return searchRec.run().getRange({start : 0, end:100});
        } catch (error) {
            
            log.debug('Err',error)
        }
    }


    function setSublistColumn(sublist, columns){
        for (let i = 0; i < columns.length; i++) {
            let field = sublist.addField({
                id: 'custpage_column'+i,
                type: serverWidget.FieldType.TEXT,
                label: columns[i]
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
        }
    }

    function addColumns(list,columns){
        let response = [];
        for (let index = 0; index < columns.length; index++) {
            let listColumn = list.addColumn({
                id: columns[index].label === 'INTERNAL ID' ? 'internalid' : 'column'+ index,
                type: columns[index].type,
                label: columns[index].label,
                align: serverWidget.LayoutJustification.LEFT
            });
            if(columns[index].url){
                listColumn.setURL({
                    url : columns[index].url,
                })
                listColumn.addParamToURL({
                    param: 'id',
                    value: 'internalid',
                    dynamic: true
                });
            }
            response.push(listColumn)
        }
        return response;
    }

    function listGLClearing(context,period){
        log.debug('BASE URL', baseUrl);
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        let listColumns = [
            {
                label : 'INTERNAL ID',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/accounting/transactions/transaction.nl'
            },
            {
                label : 'ACCOUNT',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'DATE',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'DOCUMENT NUMBER',
                type : serverWidget.FieldType.TEXT,
                url : 'https://'+baseUrl+'/app/accounting/transactions/transaction.nl'
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'NAME',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'SUM OF AMOUNT(DEBIT)',
                type : serverWidget.FieldType.CURRENCY,
            },
            {
                label : 'SUM OF AMOUNT(CREDIT)',
                type : serverWidget.FieldType.CURRENCY,
            },
            {
                label : 'SUM OF AMOUNT(NET)',
                type : serverWidget.FieldType.CURRENCY,
            },
        ];
        var list = serverWidget.createList({
            title:"List of GL Clearing Balance"
        });
        
        let addColumn = addColumns(list,listColumns);
        log.debug('COLUMNS'.addColumn)
        let searchData = globalSearch('customsearch_rda_list_gl_clearing_bal',period);
        
        log.debug('Search GL', searchData);
        // Step 1: Process results and group by column1 (Account) and column2 (Date)
        let groupedResults = {};
        for (let i = 0; i < searchData.length; i++) {
            let result = searchData[i];
    
            // Get values
            let column0 = result.getValue({ name: 'accountgrouped', summary: search.Summary.GROUP });
            let column1 = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }); // Date
           
            let column6 = parseFloat(result.getValue({ name: 'netamount', summary: search.Summary.SUM })) || 0; // Net Amount
    
            // Create unique grouping key: combine Date (column1) and Transaction ID (column2)
            let groupKey = `${column0}-${column1}`;
    
            // Initialize or accumulate the net amount
            if (!groupedResults[groupKey]) {
                groupedResults[groupKey] = {
                    column0,
                    column1,
                    sum: 0, // Sum of column6 (Net Amount)
                    rows: [] // Store raw rows for this group
                };
            }
    
            groupedResults[groupKey].sum += column6;
            groupedResults[groupKey].rows.push(result);
        }

        let filteredGroups = Object.values(groupedResults).filter(group => group.sum !== 0);
        let rows = [];
        for (let group of filteredGroups) {
            for (let row of group.rows) {
                let internalid = row.getValue({name :'internalid', summary:  search.Summary.GROUP});
                let column1 = row.getValue({ name: 'accountgrouped', summary: search.Summary.GROUP });
                let column2 = row.getValue({ name: 'trandate', summary: search.Summary.GROUP });
                let column3 = row.getValue({ name: 'tranid', summary: search.Summary.GROUP });
                let column4 = row.getText({ name: 'entity', summary: search.Summary.GROUP });
                let column5 = row.getValue({ name: 'debitamount', summary: search.Summary.SUM });
                let column6 = row.getValue({ name: 'creditamount', summary: search.Summary.SUM });
                let column7 = row.getValue({ name: 'netamount', summary: search.Summary.SUM });
                rows.push({
                    internalid,
                    column1,
                    column2,
                    column3,
                    column4,
                    column5,
                    column6,
                    column7
                })
            }
        }
        
        list.addEditColumn({
            column : 'internalid',
            showHrefCol: true,
            showView : true,
            link: '/app/accounting/transactions/transaction.nl',
            linkParamName: 'id',
         });
        log.debug('ROWS',rows)
        list.addRows({
            rows: rows
        });
        context.response.writePage(list);
    }

    function listCashReconciliation(context, period){
        let listColumns = [
            {
                label : 'INTERNAL ID',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/accounting/transactions/transaction.nl'
            },
            {
                label : 'NAME',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'RDA - Reconcialiation Date',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'Balance',
                type : serverWidget.FieldType.CURRENCY,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'RDA - Balance Kas System',
                type : serverWidget.FieldType.CURRENCY,
            },
            {
                label : 'RDA - Balance Kas Fisik',
                type : serverWidget.FieldType.CURRENCY,
            }
        ];
        var list = serverWidget.createList({
            title:"Cash Reconciliation"
        });
        let addColumn = addColumns(list,listColumns);
        let searchData = globalSearch('customsearch_rda_cash_reconciliation',period);
        log.debug('Search AR', searchData);
        
        let rows = [];
        for (let i = 0; i < searchData.length; i++) {

            let result = searchData[i];
            let internalid = result.getValue({ name: 'internalid' });
            let column1 = result.getValue({ name: 'name',sort: search.Sort.ASC });
            let column2 = result.getValue({ name: 'custrecord_rda_reconciliation_date' });
            let column3 = result.getValue({ name: 'balance' });
            let column4 = result.getValue({ name: 'custrecord_rda_balance_kas_system' });
            let column5 = result.getValue({ name: 'custrecord_rda_balance_kas_fisik' });
            // Log each field's value to troubleshoot
            // addColumn[0].addParamToURL({
            //     param : 'id',
            //     value : column0,
            //     dynamic : "T"
            // })
            if(column4 != null && column5 != null && column4 == column5) continue;
            rows.push({
                internalid,
                column1,
                column2,
                column3,
                column4,
                column5
            })
        }
        list.addEditColumn({
            column : 'internalid',
            showHrefCol: true,
            showView : true,
            link: '/app/accounting/account/account.nl',
            linkParamName: 'id',
         });
        log.debug('ROWS',rows)
        list.addRows({
            rows: rows
        });
        context.response.writePage(list);
    }

    function listOutstandingAR(context,period){
        log.debug('BASE URL', baseUrl);
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        let listColumns = [
            {
                label : 'INTERNAL ID',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/accounting/transactions/transaction.nl'
            },
            {
                label : 'NAME',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'DATE',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'DOCUMENT NUMBER',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'AMOUNT(TRANSACTION TOTAL)',
                type : serverWidget.FieldType.CURRENCY,
            },
            {
                label : 'STATUS',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'AMOUNT REMAINING',
                type : serverWidget.FieldType.CURRENCY,
            },
        ];
        var list = serverWidget.createList({
            title:"List of Outstanding AR"
        });
        let addColumn = addColumns(list,listColumns);
        log.debug('COLUMNS'.addColumn)
        let searchData = globalSearch('customsearch_rda_list_outst_ar',period);
        
        log.debug('Search AR', searchData);
        let rows = [];
        for (let i = 0; i < searchData.length; i++) {

            let result = searchData[i];
            let internalid = result.getValue({ name: 'internalid' });
            let column1 = result.getText({ name: 'entity' });
            let column2 = result.getValue({ name: 'trandate' });
            let column3 = result.getValue({ name: 'tranid' });
            let column4 = result.getValue({ name: 'total' });
            let column5 = result.getText({ name: 'statusref' });
            let column6 = result.getValue({ name: 'amountremaining' });
            // Log each field's value to troubleshoot
            // addColumn[0].addParamToURL({
            //     param : 'id',
            //     value : column0,
            //     dynamic : "T"
            // })
            rows.push({
                internalid,
                column1,
                column2,
                column3,
                column4,
                column5,
                column6
            })
        }
        list.addEditColumn({
            column : 'internalid',
            showHrefCol: true,
            showView : true,
            link: '/app/accounting/transactions/transaction.nl',
            linkParamName: 'id',
         });
        log.debug('ROWS',rows)
        list.addRows({
            rows: rows
        });
        context.response.writePage(list);
    }

    function listOutstandingARSO(context,period){
        log.debug('BASE URL', baseUrl);
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        let listColumns = [
            {
                label : 'INTERNAL ID',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/accounting/transactions/transaction.nl'
            },
            {
                label : 'NAME',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'DATE',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'DOCUMENT NUMBER',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/accounting/transactions/transaction.nl'
            },
            {
                label : 'AMOUNT(TRANSACTION TOTAL)',
                type : serverWidget.FieldType.CURRENCY,
            },
            {
                label : 'STATUS',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'AMOUNT',
                type : serverWidget.FieldType.CURRENCY,
            },
        ];
        var list = serverWidget.createList({
            title:"List of Outstanding AR_SO"
        });
        let addColumn = addColumns(list,listColumns);
        log.debug('COLUMNS'.addColumn)
        let searchData = globalSearch('customsearch_rda_list_outst_ar_2',period);
        
        log.debug('Search GL', searchData);
        let rows = [];
        for (let i = 0; i < searchData.length; i++) {

            let result = searchData[i];

            // Log each field's value to troubleshoot
            let internalid = result.getValue({ name: 'internalid' });
            let column1 = result.getText({ name: 'entity' });
            let column2 = result.getValue({ name: 'trandate' });
            let column3 = result.getValue({ name: 'tranid' });
            let column4 = result.getValue({ name: 'total' });
            let column5 = result.getText({ name: 'statusref' });
            let column6 = result.getValue({ name: 'amount', join: 'payingtransaction' });

            
            rows.push({
                internalid: internalid,
                column1,
                column2,
                column3,
                column4,
                column5,
                column6
            })
        }
        list.addEditColumn({
            column : 'internalid',
            showHrefCol: true,
            showView : true,
            link: '/app/accounting/transactions/transaction.nl',
            linkParamName: 'id',
         });
        log.debug('ROWS',rows)
        list.addRows({
            rows: rows
        });
        context.response.writePage(list);
    }

    function stockInventory(context,period){
        const params = context.request.parameters;
        let page = params.page || 0;
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        // https://11069529.app.netsuite.com/app/accounting/transactions/icjournal.nl?id=3891&whence=
        // https://11069529.app.netsuite.com/app/common/item/item.nl?id=7
        let listColumns = [
            {
                label : 'INTERNAL ID',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/common/item/item.nl'
            },
            {
                label : 'NAME',
                type : serverWidget.FieldType.URL,
                url : 'https://'+baseUrl+'/app/common/item/item.nl'
            },
            {
                label : 'TYPE',
                type : serverWidget.FieldType.TEXT,
            },
            {
                label : 'INVENTORY LOCATION',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'MAXIMUM OF LOCATION ON HAND',
                type : serverWidget.FieldType.TEXT,
                // url : baseUrl+'/app/accounting/account/account.nl'
            },
            {
                label : 'MAXIMUM OF LOCATION TOTAL VALUE',
                type : serverWidget.FieldType.CURRENCY,
            }
        ];
        var list = serverWidget.createList({
            title:"Stock Inventory by In Transit Location"
        });
        let addColumn = addColumns(list,listColumns);
        log.debug('COLUMNS'.addColumn)
        let searchData = globalSearch('customsearch_rda_stock_inv_by_loc',period);
        
        // searchData.pageRanges.forEach(function (pageRange) {
        //     // var myPage = searchData.fetch({
        //     //     index: pageRange.index
        //     // });
        //     list.addButton({
        //         id : 'buttonid'+pageRange.index,
        //         label : pageRange.index + 1,
        //         functionName : `buttonPaginateOnClick(${pageRange.index})`
        //     });
        // });
        // searchData = searchData.fetch({index: page});
        
        log.debug('Search STOCK INVENTORY', searchData);
        let rows = [];
        for (let i = 0; i < searchData.length; i++) {

            let result = searchData[i];
            let internalid = result.getValue({name :'internalid', summary:  search.Summary.GROUP})
            // Log each field's value to troubleshoot
            let column1 = result.getValue({ name: 'itemid', summary: search.Summary.GROUP, sort: search.Sort.ASC });
            let column2 = result.getText({ name: 'type', summary: search.Summary.GROUP });
            let column3 = result.getText({ name: 'inventorylocation', summary: search.Summary.GROUP });
            let column4 = result.getValue({ name: 'locationquantityonhand', summary: search.Summary.MAX });
            let column5 = result.getValue({ name: 'locationtotalvalue', summary: search.Summary.MAX });
            
            list.addRow({
                row: {
                    internalid,
                    column1,
                    column2,
                    column3,
                    column4,
                    column5,
                }
            });
            log.debug('COLUM LINK', addColumn[0])
            // addColumn[0].addParamToURL({
            //     param : 'id',
            //     value : internalid,
            //     dynamic : "T"
            // })
            
        }
        list.addEditColumn({
            column : 'internalid',
            showHrefCol: true,
            showView : true,
            link: '/app/common/item/item.nl',
            linkParamName: 'id',
         });
        log.debug('ROWS',rows)
        list.clientScriptModulePath = "SuiteScripts/abj_cs_period_close.js"
        
        context.response.writePage(list);
    }

    function defaultPage(context){
        // Create the form
        var form = serverWidget.createForm({ title: 'Accounting Period Validation' });

        // Perform a search to check for pending transactions
        var hasPendingTransactions = false;

        var container1 = form.addFieldGroup({
            id: "container1",
            label: "FORM",
        });
        var container2 = form.addFieldGroup({
            id: "container2",
            label: "TABLE",
        });
        
        
        
        var periodSelect = form.addField({
            id: 'custpage_period_select',
            type: serverWidget.FieldType.DATE,
            label: 'Date',
            container : 'container1'
        }).defaultValue = new Date();

        var inlineHtml = form.addField({
            id: 'custpage_buttonhtml',
            type: serverWidget.FieldType.INLINEHTML,
            label: ' ',
            container: "container1",
        });

        inlineHtml.defaultValue = `
            <button type="button" value="Search" onclick="onSearch(); return false;" style="margin-top: 10px; padding:5px;">Search</button>
        `;
        
        

        

        form.addField({
            id: 'custpage_close_btn',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'CLOSE',
            container: 'container1'
        }).defaultValue = '';
       
       
        var sublist = form.addSublist({
            id: 'custpage_table_sublist',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'List of GL Clearing Balance',
            container : 'container1'
        });
        var sublist2 = form.addSublist({
            id: 'custpage_table_sublist2',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'List of Outstanding AR',
            container : 'container1'
        });
        var sublist3 = form.addSublist({
            id: 'custpage_table_sublist3',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'List of Outstanding AR_SO',
            container : 'container1'
        });
        var sublist4 = form.addSublist({
            id: 'custpage_table_sublist4',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'Stock Inventory by In Transit Location',
            container : 'container1'
        });
        var sublist5 = form.addSublist({
            id: 'custpage_table_sublist5',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'Cash Reconciliation',
            container : 'container1'
        });


        let sublist1Columns = [
            'ACCOUNT',
            'DATE',
            'DOCUMENT NUMBER',
            'NAME',
            'SUM OF AMOUNT(DEBIT)',
            'SUM OF AMOUNT(CREDIT)',
            'SUM OF AMOUNT(NET)',
        ];
        let sublist2Columns = [
            'INTERNAL ID',
            'NAME',
            'DATE',
            'DOCUMENT NUMBER',
            'AMOUNT(TRANSACTION TOTAL)',
            'STATUS',
            'AMOUNT REMAINING',
        ]
        let sublist3Columns = [
            'INTERNAL ID',
            'NAME',
            'DATE',
            'DOCUMENT NUMBER',
            'AMOUNT(TRANSACTION TOTAL)',
            'STATUS',
            'AMOUNT',
        ]
        let sublist4Columns = [
            'NAME',
            'TYPE',
            'INVENTORY LOCATION',
            'MAXIMUM OF LOCATION ON HAND',
            'MAXIMUM OF LOCATION TOTAL VALUE'
        ]
        let sublist5Columns = [
            'NAME',
            'RDA - RECONCIALIATION DATE',
            'BALANCE',
            'RDA - BALANCE KAS SYSTEM',
            'RDA - BALANCE KAS FISIK'
        ]

        
        // urlColumn.setLinkText('View Dashboard');
        setSublistColumn(sublist,sublist1Columns);
        setSublistColumn(sublist2,sublist2Columns);
        setSublistColumn(sublist3,sublist3Columns);
        setSublistColumn(sublist4,sublist4Columns);
        setSublistColumn(sublist5,sublist5Columns);

        

        // Populate a URL value dynamically
        // sublist.setSublistValue({
        //     id: 'custpage_dashboard_url',
        //     line: 0,
        //     value: 'https://system.netsuite.com/app/center/card.nl?sc=-69'
        // });

        let fieldWarning = form.addField({
            id: 'custpage_warning',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
        }).updateBreakType({
            breakType : serverWidget.FieldBreakType.STARTROW
        }).defaultValue = '';


        form.addField({
            id: 'custpage_scam',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).defaultValue = '';

        let fieldGl = form.addField({
            id: 'custpage_btn_gl_clearing_balance',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
        }).updateBreakType({
            breakType : serverWidget.FieldBreakType.STARTROW
        }).defaultValue = '';

       
        let fieldOutstandingAR = form.addField({
            id: 'custpage_btn_outstanding_ar',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
        }).updateBreakType({
            breakType : serverWidget.FieldBreakType.STARTROW
        }).defaultValue = '';
        

        
        let fieldOutstandingARSO = form.addField({
            id: 'custpage_btn_outstanding_ar_so',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
        }).updateBreakType({
            breakType : serverWidget.FieldBreakType.STARTROW
        }).defaultValue = '';
        
        
        let fieldStockInventory= form.addField({
            id: 'custpage_btn_stock_inventory',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
        }).updateBreakType({
            breakType : serverWidget.FieldBreakType.STARTROW
        }).defaultValue = '';

        let fieldCashRecon= form.addField({
            id: 'custpage_btn_cash_recon',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Warning',
            container: 'container1'
        }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
        }).updateBreakType({
            breakType : serverWidget.FieldBreakType.STARTROW
        }).defaultValue = '';
        

        
        

        

        form.clientScriptModulePath = "SuiteScripts/abj_cs_period_close.js"

        context.response.writePage(form);
    }

    function triggerTask(context,taskID){
        log.debug('Task Triggered', 'Your task logic goes here.');

        // Example: Run a task
        
        let scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_abj_sc_set_period_close', // Replace with your script ID
            deploymentId: 'customdeploy_abj_sc_set_period_close', // Replace with your deployment ID
            params: { 
                custscript_task_id: taskID,
            }
        });
        let taskId = scriptTask.submit();
        log.debug('Task Submitted', `Task ID: ${taskId}`);
        context.response.write('Task Submitted. Task ID: ' + taskId);
    }

    function onRequest(context) {
        const params = context.request.parameters;
        const task = params.task;
        const action = params.action;
        const period = params.period;
        const taskID = params.taskid;

        log.debug('CONTEXT',context.response)

        

        // if(task == 'assignRole'){
        //     const currentUser = runtime.getCurrentUser();

        //     // Retrieve details about the user
        //     const userId = currentUser.id; // User's internal ID
            
        //     const roleId = 55;
        //     result = assignRole(userId, roleId);
        //     context.response.write(JSON.stringify({ success: true, roleAssignmentId: result }));
        // }
        if (context.request.method === 'GET') {

            switch (action) {
                case 'listglclearing':
                    listGLClearing(context,period)
                    break;
                case 'listoutstandingar':
                    listOutstandingAR(context,period)
                    break;
                case 'listoutstandingarso':
                    listOutstandingARSO(context,period)
                    break;
                case 'stockinventory':
                    stockInventory(context,period)
                    break;
                case 'cashreconciliation':
                    listCashReconciliation(context,period)
                    break;
                case 'triggertask':
                    triggerTask(context,taskID)
                    break;
            
                default:
                    defaultPage(context)
                    break;
            }


            
        }
    }

    return { onRequest: onRequest };
});
