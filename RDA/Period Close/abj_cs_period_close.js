/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/log', 'N/record', 'N/search','N/currentRecord','N/ui/message','N/url', 'N/https'],
    /**
     * @param{format} format
     * @param{log} log
     * @param{record} record
     * @param{search} search
     */
    function(format, log, record, search,currentRecord,message,url,https) {
        var records = currentRecord.get();
        var baseUrl = window.location.origin;
    
        const callSuiteletFunction = (task, params) => {
            // Generate Suitelet URL
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_period_close', // Replace with your Suitelet script ID
                deploymentId: 'customdeploy_abj_sl_period_close', // Replace with your Suitelet deployment ID
                params: { task }, // Pass task and additional parameters
            });
    
            https.get.promise({ url: suiteletUrl })
                .then((response) => {
                    const data = JSON.parse(response.body);
                    console.log('RESPONSE JSON', data)
                })
                .catch((error) => {
                   console.log('ERR', error);
                });
        }
       
        function pageInit(scriptContext) {
            console.log('TEST', scriptContext.mode)
    
            var dateFieldId = 'custpage_period_select'; // Replace with your actual field ID
            
            // Get the field's value
            var dateValue = records.getValue({ fieldId: dateFieldId });
            
            // Get today's date and set time to 00:00:00 for comparison
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dateValue && new Date(dateValue) > today) {
                // Disable the field if the date is after today
                rec.getField({ fieldId: dateFieldId }).isDisabled = true;
            }
    
            jQuery(".uir-insert").remove();
            jQuery(".uir-remove").remove();
            jQuery(".uir-addedit").remove();
            jQuery(".uir-clear").remove();
        }
    
        function removeAllLines(sublistId) {
            var lineCount = records.getLineCount({ sublistId: sublistId });
    
            console.log('REMOVE',sublistId)
            // Loop from the last line to the first line
            for (var i = lineCount - 1; i >= 0; i--) {
                records.removeLine({
                    sublistId: sublistId,
                    line: i,
                    ignoreRecalc: true
                });
            }
            
        }
    
        function currencyFormat(val){
            try {
                return format.format({
                    value: val,
                    type: format.Type.CURRENCY
                });
            } catch (error) {
                return val
            }
        }
    
        function formatDate(dateString) {
            let date = new Date(dateString);
            let month = ('0' + (date.getMonth() + 1)).slice(-2);
            let day = ('0' + date.getDate()).slice(-2);
            let year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    
        function globalSearch(id, period){
            // console.log('params',{id,period})
            try {
                let searchRec = search.load({
                    id : id
                });
        
                let formattedDate = formatDate(period);
        
                console.log('Formated Date',formattedDate);
        
                if(id == 'customsearch_rda_list_gl_clearing_bal' || id == 'customsearch_rda_list_outst_ar' || id == 'customsearch_rda_list_outst_ar_2'){
                    searchRec.filters.push(search.createFilter({
                        name: "trandate",
                        operator: search.Operator.ON,
                        values: formattedDate 
                    }))
                }
        
                
                return searchRec.run().getRange({start : 0, end:100});
            } catch (error) {
                console.log('Err',error)
                log.debug('Err',error)
            }
        }
    
        function setCashRecon(period){
            let searchData = globalSearch('customsearch_rda_cash_reconciliation', period);
            console.log('searchData customsearch_rda_cash_reconciliation', searchData);
            removeAllLines('custpage_table_sublist5');
            if (searchData.length == 0) {
                return false;
            }
            for (let i = 0; i < searchData.length; i++) {
    
                let result = searchData[i];
                // let url = `${baseUrl}/app/accounting/transactions/transaction.nl?id=`
                let url = ''
                // Log each field's value to troubleshoot
                let column0 = result.getValue({ name: 'name', sort: search.Sort.ASC  });
                let column1 = result.getValue({ name: 'custrecord_rda_reconciliation_date' });
                let column2 = result.getValue({ name: 'balance' });
                let column3 = result.getValue({ name: 'custrecord_rda_balance_kas_system' });
                let column4 = result.getValue({ name: 'custrecord_rda_balance_kas_fisik' });
                // let column7 = result.getValue({ name: 'amount', join: 'payingtransaction' });
    
                records.selectNewLine({ sublistId: 'custpage_table_sublist5' });
    
                
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist5',
                    fieldId: 'custpage_column0',
                    value: column0
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist5',
                    fieldId: 'custpage_column1',
                    value: column1
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist5',
                    fieldId: 'custpage_column2',
                    value: currencyFormat(column2)
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist5',
                    fieldId: 'custpage_column3',
                    value: currencyFormat(column3)
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist5',
                    fieldId: 'custpage_column4',
                    value: currencyFormat(column4)
                });
               
               
    
                records.commitLine({ sublistId: 'custpage_table_sublist5' });
            
           }
           return searchData.length;
        }
        
        function setGlClearingBalance(period) {
            let searchData = globalSearch('customsearch_rda_list_gl_clearing_bal', period);
            console.log('searchData setGlClearingBalance', searchData);
            removeAllLines('custpage_table_sublist');
            
        
            if (searchData.length == 0) {
                return false;
            }
        
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
    
            console.log('GROUPED RESULT', groupedResults);
            // return groupedResults.length;
        
            // Step 2: Filter out groups where the sum of column6 (Net Amount) is 0
            let filteredGroups = Object.values(groupedResults).filter(group => group.sum !== 0);
        
            // If no data after filtering, return
            if (filteredGroups.length === 0) {
                console.log('All data has Net Amount sum = 0. No data to display.');
                return false;
            }
        
            let counter = 0;
            // Step 3: Render filtered data into sublist
            for (let group of filteredGroups) {
                for (let row of group.rows) {
                    let column0 = row.getValue({ name: 'accountgrouped', summary: search.Summary.GROUP });
                    let column1 = row.getValue({ name: 'trandate', summary: search.Summary.GROUP });
                    let column2 = row.getValue({ name: 'tranid', summary: search.Summary.GROUP });
                    let column3 = row.getText({ name: 'entity', summary: search.Summary.GROUP });
                    let column4 = row.getValue({ name: 'debitamount', summary: search.Summary.SUM });
                    let column5 = row.getValue({ name: 'creditamount', summary: search.Summary.SUM });
                    let column6 = row.getValue({ name: 'netamount', summary: search.Summary.SUM });
                    counter++;
        
                    records.selectNewLine({ sublistId: 'custpage_table_sublist' });
        
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column0',
                        value: column0
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column1',
                        value: column1
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column2',
                        value: column2
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column3',
                        value: column3
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column4',
                        value: currencyFormat(column4)
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column5',
                        value: currencyFormat(column5)
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'custpage_table_sublist',
                        fieldId: 'custpage_column6',
                        value: currencyFormat(column6)
                    });
        
                    records.commitLine({ sublistId: 'custpage_table_sublist' });
                }
            }
        
            console.log('Filtered Results', filteredGroups);
            // return filteredGroups.length;
            return counter;
        }
        
    
        function setOutstandingAR(period){
           let searchData = globalSearch('customsearch_rda_list_outst_ar',period)
           removeAllLines('custpage_table_sublist2')
           console.log('searchData Outstanding AR', searchData)
           if(searchData.length == 0){
            return false;
           }
           for (let i = 0; i < searchData.length; i++) {
    
                let result = searchData[i];
                // let url = `${baseUrl}/app/accounting/transactions/transaction.nl?id=`
                let url = ''
                // Log each field's value to troubleshoot
                let column0 = url + result.getValue({ name: 'internalid' });
                let column1 = result.getText({ name: 'entity' });
                let column2 = result.getValue({ name: 'trandate' });
                let column3 = result.getValue({ name: 'tranid' });
                let column4 = result.getValue({ name: 'total' });
                let column5 = result.getText({ name: 'statusref' });
                let column6 = result.getValue({ name: 'amountremaining' });
                // let column7 = result.getValue({ name: 'amount', join: 'payingtransaction' });
    
                records.selectNewLine({ sublistId: 'custpage_table_sublist2' });
    
                
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column0',
                    value: column0
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column1',
                    value: column1
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column2',
                    value: column2
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column3',
                    value: column3
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column4',
                    value: currencyFormat(column4)
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column5',
                    value: column5
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist2',
                    fieldId: 'custpage_column6',
                    value: currencyFormat(column6)
                });
               
    
                records.commitLine({ sublistId: 'custpage_table_sublist2' });
            
           }
           return searchData.length;
        }
    
        function setInventoryByTransitLocation(period){
           let searchData = globalSearch('customsearch_rda_stock_inv_by_loc',period)
           removeAllLines('custpage_table_sublist4')
           console.log('searchData setInventoryByTransitLocation', searchData)
            if(searchData.length == 0){
                return false;
            }
    
           for (let i = 0; i < searchData.length; i++) {
    
                let result = searchData[i];
    
                // Log each field's value to troubleshoot
                let column0 = result.getValue({ name: 'itemid', summary: search.Summary.GROUP, sort: search.Sort.ASC });
                let column1 = result.getText({ name: 'type', summary: search.Summary.GROUP });
                let column2 = result.getText({ name: 'inventorylocation', summary: search.Summary.GROUP });
                let column3 = result.getValue({ name: 'locationquantityonhand', summary: search.Summary.MAX });
                let column4 = result.getValue({ name: 'locationtotalvalue', summary: search.Summary.MAX });
               
                records.selectNewLine({ sublistId: 'custpage_table_sublist4' });
    
               
                
    
                
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist4',
                    fieldId: 'custpage_column0',
                    value: column0
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist4',
                    fieldId: 'custpage_column1',
                    value: column1
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist4',
                    fieldId: 'custpage_column2',
                    value: column2
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist4',
                    fieldId: 'custpage_column3',
                    value: currencyFormat(column3)
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist4',
                    fieldId: 'custpage_column4',
                    value: currencyFormat(column4)
                });
                
                records.commitLine({ sublistId: 'custpage_table_sublist4' });
            
           }
           return searchData.length;
        }
    
        function setOutstandingARSO(period){
           let searchData = globalSearch('customsearch_rda_list_outst_ar_2',period)
           removeAllLines('custpage_table_sublist3')
           console.log('searchData setOutstandingARSO', searchData)
           if(searchData.length == 0){
            return false;
           }
           
    
           for (let i = 0; i < searchData.length; i++) {
    
                let result = searchData[i];
                // let url = `${baseUrl}/app/accounting/transactions/transaction.nl?id=`
                let url = ''
                // Log each field's value to troubleshoot
                let column0 = url + result.getValue({ name: 'internalid' });
                let column1 = result.getText({ name: 'entity' });
                let column2 = result.getValue({ name: 'trandate' });
                let column3 = result.getValue({ name: 'tranid' });
                let column4 = result.getValue({ name: 'total' });
                let column5 = result.getText({ name: 'statusref' });
                
                let column6 = result.getValue({ name: 'amount', join: 'payingtransaction' });
    
                records.selectNewLine({ sublistId: 'custpage_table_sublist3' });
    
                
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column0',
                    value: column0
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column1',
                    value: column1
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column2',
                    value: column2
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column3',
                    value: column3
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column4',
                    value: currencyFormat(column4)
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column5',
                    value: column5
                });
                records.setCurrentSublistValue({
                    sublistId:'custpage_table_sublist3',
                    fieldId: 'custpage_column6',
                    value: currencyFormat(column6)
                });
    
                records.commitLine({ sublistId: 'custpage_table_sublist3' });
            
           }
           return searchData.length;
        }
    
        function searchAccountingPeriod(period){
            period = formatDate(period);
            var accountingperiodSearchObj = search.create({
                type: "accountingperiod",
                filters:
                [
                   ["startdate","within",period,period]
                ],
                columns:
                [
                   search.createColumn({name: "periodname", label: "Name"}),
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                ]
             });
             var searchResultCount = accountingperiodSearchObj.runPaged().count;
             log.debug("accountingperiodSearchObj result count",searchResultCount);
             let res = accountingperiodSearchObj.run().getRange({start : 0, end:10});
            return res[0].id
        }
    
        function showAlert(status, period){
            let value = `<p style="color: red;font-size:18px;">
                    There are transactions that must be resolved before closing the accounting period.
                </p>`;
                // callSuiteletFunction('assignRole');
            if(status){
                
                let idTask = searchAccountingPeriod(period);
    
                console.log('id task', idTask)
                value = `<div><a style="color:black;font-size:18px;" href="${baseUrl}/app/setup/period/periodcloseprocess.nl?pid=${idTask}" target="_blank">
                    Go to Manage Accounting Periods
                </a></div>`;
                records.setValue({
                    fieldId : 'custpage_close_btn',
                    value : `<div><a style="color:black;font-size:18px;" href="${baseUrl}/app/site/hosting/scriptlet.nl?script=937&deploy=1&action=triggertask&taskid=${idTask}" target="_blank">
                        RUN TASK
                    </a></div>`,
                })
            }
    
            records.setValue({
                fieldId : 'custpage_warning',
                value : value
            })
            
            
        }
    
        window.onSearch = ()=>{
            
            let period  = records.getValue({
                fieldId : 'custpage_period_select'
            });
            console.log('Account Period', period)
            
            let status1 = setGlClearingBalance(period);
            let status2 = setOutstandingAR(period)
            let status3 = setOutstandingARSO(period)
            let status4 = setInventoryByTransitLocation(period)
            let status5 = setCashRecon(period)
    
            records.setValue({
                fieldId : 'custpage_btn_gl_clearing_balance',
                value : ''
            })
            records.setValue({
                fieldId : 'custpage_btn_outstanding_ar',
                value : ''
            })
            records.setValue({
                fieldId : 'custpage_btn_outstanding_ar_so',
                value : ''
            })
            records.setValue({
                fieldId : 'custpage_btn_stock_inventory',
                value : ''
            })
            records.setValue({
                fieldId : 'custpage_btn_cash_recon',
                value : ''
            })
    
            if(status1){
                let url = `${baseUrl}/app/site/hosting/scriptlet.nl?script=937&deploy=1&action=listglclearing&period=${period}`;
                // let url = `https://11069529.app.netsuite.com/app/common/search/searchresults.nl?searchid=751&whence=Transaction_TRANDATEfrom=${formatDate(period)}&Transaction_TRANDATEto=${formatDate(period)}`
                // https://11069529.app.netsuite.com/app/common/search/searchresults.nl?searchid=751&whence=Transaction_TRANDATEfrom=${forma}&Transaction_TRANDATEto
                console.log('STATUS 1', status1)
                let value = `<div><a style="color:black;font-size:18px;" href="${url}" target="_blank">
                    List of GL Clearing Balance(${status1})
                </a></div>`
                records.setValue({
                    fieldId : 'custpage_btn_gl_clearing_balance',
                    value : value
                })
            }
            if(status2){
                let url = `${baseUrl}/app/site/hosting/scriptlet.nl?script=937&deploy=1&action=listoutstandingar&period=${period}`;
                console.log('STATUS 1', status2)
                let value = `<div><a style="color:black;font-size:18px;" href="${url}" target="_blank">
                    List of Outstanding AR(${status2})
                </a></div>`
                records.setValue({
                    fieldId : 'custpage_btn_outstanding_ar',
                    value : value
                })
            }
            if(status3){
                let url = `${baseUrl}/app/site/hosting/scriptlet.nl?script=937&deploy=1&action=listoutstandingarso&period=${period}`;
                console.log('STATUS 1', status3)
                let value = `<div><a style="color:black;font-size:18px;" href="${url}" target="_blank">
                    List of Outstanding AR SO(${status3})
                </a></div>`
                records.setValue({
                    fieldId : 'custpage_btn_outstanding_ar_so',
                    value : value
                })
            }
            if(status4){
                let url = `${baseUrl}/app/site/hosting/scriptlet.nl?script=937&deploy=1&action=stockinventory&period=${period}`;
                console.log('STATUS 1', status4)
                let value = `<div><a style="color:black;font-size:18px;" href="${url}" target="_blank">
                    Stock Inventory by In Transit Location(${status4})
                </a></div>`
                records.setValue({
                    fieldId : 'custpage_btn_stock_inventory',
                    value : value
                })
            }
            if(status5){
                let url = `${baseUrl}/app/site/hosting/scriptlet.nl?script=937&deploy=1&action=cashreconciliation&period=${period}`;
                console.log('STATUS 5', status5)
                let value = `<div><a style="color:black;font-size:18px;" href="${url}" target="_blank">
                     Cash Reconciliation(${status5})
                </a></div>`
                records.setValue({
                    fieldId : 'custpage_btn_cash_recon',
                    value : value
                })
            }
    
            // showAlert(!status1 && !status2 && !status3, period);
            showAlert(!status1 && !status2 && !status3 && !status4, period);
        }
    
        function taskItemStatusSearch(period){
            let response = [];
            let searchItemStatusTask = search.load({
                id : 'customsearch933'
            });
    
            if(period){
                searchItemStatusTask.filters.push(search.createFilter({
                    name: "period",
                    operator: search.Operator.IS,
                    values: period 
                }))
            }
            // let result = searchItemStatusTask.run().getRange({start : 0, end : 100});
            searchItemStatusTask.run().each(function(result) {
                let id = result.getValue({ name: 'internalid' });
                let index = response.find((res)=>res.id == id);
                console.log(index);
                if(!index){
                    response.push({
                        id: id,
                        type: result.getValue({ name: 'itemtype' })
                    });
                }
                return true;
            });
    
            console.log('response',response)
            return response;
        }
    
        
        function fieldChanged(scriptContext) {
            var vrecord = scriptContext.currentRecord;
            var fieldId = scriptContext.fieldId;
            var sublistName = scriptContext.sublistId;
            var form = scriptContext.form;
            // if(fieldId == 'custpage_period_select'){
            //     let accountPeriod =vrecord.getValue({
            //         fieldId : 'custpage_period_select'
            //     })
            //     console.log('Account Period', accountPeriod)
            //     let dataTaskItemStatus = taskItemStatusSearch(accountPeriod);
            //     console.log('data items task status', dataTaskItemStatus);
    
            //     var periodCloseSelect = vrecord.getField({
            //         fieldId: 'custpage_task_select'
            //     });
    
            //     periodCloseSelect.removeSelectOption({
            //         value: null  // Remove all options
            //     });
                
            //     dataTaskItemStatus.forEach(function(dt) {
            //         // var label = 'Period: ' + period.periodName ;
                    
                    
    
            //         periodCloseSelect.insertSelectOption({
            //             value: dt.id,
            //             text: dt.type
            //         });
            //     });
                
            // }
        }
    
        const validateLine = (context)=>{
            return true;
        }
    
        const buttonPaginateOnClick = (index)=>{
            let suiteletUrl = new URL(window.location.href) ;
            const page = suiteletUrl.searchParams.get('page'); // Ambil parameter 'page'
    
            if (page) {
                console.log('Page Parameter:', page); // Output: 2
                suiteletUrl.searchParams.delete('page'); // Hapus parameter 'page'
                // window.history.replaceState(null, '', suiteletUrl.href); // Perbarui URL
            }
            suiteletUrl.searchParams.set('page', index);
    
            window.location.href = suiteletUrl.href;
        }
        
    
    
        return {
            pageInit: pageInit,
            validateLine : validateLine,
            fieldChanged: fieldChanged,
            buttonPaginateOnClick :buttonPaginateOnClick
        };
        
    });
    