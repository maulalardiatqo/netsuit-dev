/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,
) {
    
    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Cash Flow Projection",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            
            
            var periodFromFilter = form.addField({
                id: "custpage_period_from_option",
                label: "From",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "accountingperiod",
            });
            periodFromFilter.isMandatory = true
            var periodToFilter = form.addField({
                id: "custpage_period_to_option",
                label: "To",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "accountingperiod",
            });
            periodToFilter.isMandatory = true
            
            var subsFilter = form.addField({
                id: "custpage_subs_option",
                label: "Subsidiary",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "subsidiary",
            });
            subsFilter.isMandatory = true

            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var periodFrom = context.request.parameters.custpage_period_from_option;
                var periodTo = context.request.parameters.custpage_period_to_option;
                var subsId = context.request.parameters.custpage_subs_option;

                var currentDate = new Date();

                var lastDateThisYear = new Date(currentDate.getFullYear(), 11, 31);
                var lastYear = '01/01/2015'
                var currentYear = (lastDateThisYear.getDate() < 10 ? '0' : '') + lastDateThisYear.getDate() + '/' + ((lastDateThisYear.getMonth() + 1) < 10 ? '0' : '') + (lastDateThisYear.getMonth() + 1) + '/' + lastDateThisYear.getFullYear();
                function convertCurr(data){
                    data = format.format({
                        value: data,
                        type: format.Type.CURRENCY
                    });

                    return data
                }
                function groupByPeriod(allLoan) {
                    const groupedLoans = {};
                  
                    allLoan.forEach(loanList => {
                      loanList.forEach(loan => {
                        const period = loan.periodToset;
                        if (!groupedLoans[period]) {
                          groupedLoans[period] = [];
                        }
                        groupedLoans[period].push(loan);
                      });
                    });
                  
                    return groupedLoans;
                  }
                function getMonthsCountAndNames(startDate, endDate) {
                    var startMonth = startDate.getMonth();
                    var endMonth = endDate.getMonth();
                    var startYear = startDate.getFullYear();
                    var endYear = endDate.getFullYear();
                    
                    var monthCount = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
                    var allPeriod = [];
                
                    for (var i = startYear; i <= endYear; i++) {
                        var start = (i === startYear) ? startMonth : 0;
                        var end = (i === endYear) ? endMonth : 11;
                
                        for (var j = start; j <= end; j++) {
                            var monthName = getMonthName(j) + " " + i;
                            allPeriod.push(monthName);
                        }
                    }
                
                    return { count: monthCount, periods: allPeriod };
                }
                
                function getMonthName(monthIndex) {
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return monthNames[monthIndex];
                }

                var accountingperiodFromSearchObj = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", periodFrom]
                    ],
                    columns: [
                        search.createColumn({ name: "periodname", sort: search.Sort.DESC })
                    ]
                });
                var periodFromName
                accountingperiodFromSearchObj.run().each(function(result) {
                    periodFromName = result.getValue({ name: 'periodname' });

                    return true;
                });

                var accountingperiodToSearchObj = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", periodTo]
                    ],
                    columns: [
                        search.createColumn({ name: "periodname", sort: search.Sort.DESC })
                    ]
                });
                var periodToName
                accountingperiodToSearchObj.run().each(function(result) {
                    periodToName = result.getValue({ name: 'periodname' });

                    return true;
                });
                
                var startPeriod = new Date(periodFromName);
                var endPeriod = new Date(periodToName);

                var result = getMonthsCountAndNames(startPeriod, endPeriod);
                var dataAll = []
                var jumlahPer = result.count;
                var allPeriod = result.periods;
                var allPeriodForLoan = allPeriod
                var dataToSet = []
                var allBeginningBalance = []
                var allOutstanding = []
                var alloutstandingPayable = []
                var alloprasionalExp = []
                var allIdPeriod = []
                var allEndingBalance = []

                var prevEndingBalance = 0
                allPeriod.forEach(function(periodName, index) {
                    function getPreviousMonth(month) {
                        const months = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ];
                        const index = months.indexOf(month);
                        if (index === 0) {
                            return 'Dec';
                        } else {
                            return months[index - 1];
                        }
                    }
                    
                    function getPeriodBeforeName(periodName) {
                        const parts = periodName.split(' ');
                        let month = parts[0];
                        let year = parseInt(parts[1]);
                    
                        if (month === 'Jan') {
                            month = 'Dec';
                            year--;
                        } else {
                            month = getPreviousMonth(month);
                        }
                    
                        return `${month} ${year}`;
                    }

                    const periodBeforeName = getPeriodBeforeName(periodName);

                    var postingPeriodData = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "is", periodName]
                        ],
                        columns: ["internalid"]
                    });
                    var idPeriod;
                    postingPeriodData.run().each(function(result) {
                        idPeriod = result.getValue({ name: 'internalid' });
                        return true;
                    });

                    var postingPeriodBefSearch = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "is", periodBeforeName]
                        ],
                        columns: ["internalid"]
                    });
                    var idPeriodBef;
                    postingPeriodBefSearch.run().each(function(result) {
                        idPeriodBef = result.getValue({ name: 'internalid' });
                        return true;
                    });
                    
                    var beginningBalance;
                    
                    var beginningBalanceSearch = search.load({id: "customsearch775"});
                    if (idPeriodBef) beginningBalanceSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriodBef }));
                    if (subsId) beginningBalanceSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (lastYear) beginningBalanceSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                    if (currentYear) beginningBalanceSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));
                
                    var beginningBalanceSearchReturn = beginningBalanceSearch.run().getRange({ start: 0, end: 1 });
                    beginningBalance = beginningBalanceSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                   
                    var beginningBalancetoCOunt = beginningBalance;
                    if (beginningBalance) {
                        beginningBalance = convertCurr(beginningBalance);
                    }
                    var periodToset = periodName.toLowerCase().replace(/\s/g, '_');
                    allIdPeriod.push({ idPeriod: idPeriod, periodToset: periodToset });
                    dataToSet.push(periodToset);
                    allBeginningBalance.push({ beginningBalance: beginningBalance, periodToset: periodToset });
                
                    var outstandingSearch = search.load({ id: "customsearch_monthly_review_2_2_2_2" });
                    if (idPeriod) outstandingSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriod }));
                    if (subsId) outstandingSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (lastYear) outstandingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                    if (currentYear) outstandingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));
                    var outstandingSearchReturn = outstandingSearch.run().getRange({ start: 0, end: 1 });
                    var outstanding = outstandingSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    var outstandingToCount = outstanding;
                    if (outstanding) {
                        outstanding = convertCurr(outstanding);
                    }
                    allOutstanding.push({ outstanding: outstanding, periodToset: periodToset });
                
                    var outstandingPayableSearch = search.load({ id: "customsearch_monthly_review_2_2_2_2_2" });
                    if (idPeriod) outstandingPayableSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriod }));
                    if (subsId) outstandingPayableSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (lastYear) outstandingPayableSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                    if (currentYear) outstandingPayableSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));
                    var outstandingPayableSearchReturn = outstandingPayableSearch.run().getRange({ start: 0, end: 1 });
                    var outstandingPayable = outstandingPayableSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    var outstandingPayableToCount = outstandingPayable;
                    if (outstandingPayable) {
                        outstandingPayable = convertCurr(outstandingPayable);
                    }
                    alloutstandingPayable.push({ outstandingPayable: outstandingPayable, periodToset: periodToset });
                
                    var oprasionalExpense = search.load({ id: "customsearch_monthly_review_2_2_3" });
                    if (idPeriod) oprasionalExpense.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriod }));
                    if (subsId) oprasionalExpense.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (lastYear) oprasionalExpense.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                    if (currentYear) oprasionalExpense.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));
                    var oprasionalExpenseReturn = oprasionalExpense.run().getRange({ start: 0, end: 1 });
                    var oprasionalExp = oprasionalExpenseReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    var oprasionalExpToCount = oprasionalExp;
                    if (oprasionalExp) {
                        oprasionalExp = convertCurr(oprasionalExp);
                    }
                    alloprasionalExp.push({ oprasionalExp: oprasionalExp, periodToset: periodToset });
                
                    var endingBalanceSearch = search.load({ id: "customsearch775" });
                    if (idPeriod) endingBalanceSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriod }));
                    if (subsId) endingBalanceSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (lastYear) endingBalanceSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                    if (currentYear) endingBalanceSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));
                    var endingBalanceSearchReturn = endingBalanceSearch.run().getRange({ start: 0, end: 1 });
                    var endingBalance = endingBalanceSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    if (endingBalance) {
                        endingBalance = convertCurr(endingBalance);
                    }
                    allEndingBalance.push({endingBalance : endingBalance, periodToset : periodToset})


                    // var endingBalance = Number(beginningBalancetoCOunt) + Number(outstandingToCount) + Number(outstandingPayableToCount) + Number(oprasionalExpToCount)
                    // allEndingBalance.push({endingBalance : endingBalance, periodToset : periodToset})
                    // prevEndingBalance = endingBalance
                });
                var setList = createList("custpage_sublist_item", form, dataToSet)
                // set beginning
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Beginning balance cash and bank ',
                    line: 0
                });
                allBeginningBalance.forEach(function(data) {
                    var beginningBalance = data.beginningBalance;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: beginningBalance,
                        line: 0
                    });
                
                });

                 // set outstanding receivable
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Total outstanding Account Receivable',
                    line: 1
                });
                allOutstanding.forEach(function(data) {
                    var outstanding = data.outstanding;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: outstanding,
                        line: 1
                    });
                
                });
                // set outstanding payable
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Total outstanding Account Payable',
                    line: 2
                });
                alloutstandingPayable.forEach(function(data) {
                    var outstandingPayable = data.outstandingPayable;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: outstandingPayable,
                        line: 2
                    });
                
                });

                 // set oprasional expense
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Total operational expenses per month',
                    line: 3
                });
                alloprasionalExp.forEach(function(data) {
                    var oprasionalExp = data.oprasionalExp;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: oprasionalExp,
                        line: 3
                    });
                
                });
                var lineIndex = 4
                var allLoan = [];
                var maxLoanCount = 0;
                allIdPeriod.forEach(function (data) {
                    var idPeriod = data.idPeriod;
                    log.debug('idPeriod', idPeriod)
                    log.debug('subsId', subsId)
                    var customrecord641SearchObj = search.create({
                        type: "customrecord641",
                        filters: [["custrecord_mitcf_period", "anyof", idPeriod],"AND", 
                        ["custrecord_mitcf_subsidiary","anyof",subsId]],
                        columns: [
                            search.createColumn({ name: "custrecord_dmitcf_amount", join: "CUSTRECORD_DMITCF_ID", label: "Amount" })
                        ]
                    });

                    var searchResultCount = customrecord641SearchObj.runPaged().count;
                    log.debug('searchResultCount', searchResultCount)
                    if (searchResultCount > maxLoanCount) {
                        maxLoanCount = searchResultCount;
                    }
                });
                log.debug('maxLoanCount', maxLoanCount)
                allIdPeriod.forEach(function (data) {
                    var idPeriod = data.idPeriod;
                    var periodToset = data.periodToset;
                    var dataLoan = [];

                    var customrecord641SearchObj = search.create({
                        type: "customrecord641",
                        filters: [["custrecord_mitcf_period", "anyof", idPeriod]],
                        columns: [
                            search.createColumn({ name: "custrecord_dmitcf_amount", join: "CUSTRECORD_DMITCF_ID", label: "Amount" })
                        ]
                    });

                    customrecord641SearchObj.run().each(function (result) {
                        var loanAmount = result.getValue({
                            name: "custrecord_dmitcf_amount",
                            join: "CUSTRECORD_DMITCF_ID",
                        }) || 0;
                        dataLoan.push({ loanAmount: loanAmount, periodToset: periodToset });
                        return true;
                    });
                    while (dataLoan.length < maxLoanCount) {
                        dataLoan.push({ loanAmount: 0, periodToset: periodToset });
                    }
                    allLoan.push(dataLoan);
                });
                var groupedData = [];
                log.debug('allLoan', allLoan)
                log.debug('allLoan[0].length;', allLoan[0].length)
                for (var i = 0; i < allLoan[0].length; i++) {
                    var group = [];
                    
                    allLoan.forEach(function(loan) {
                        var data = loan[i] || 0;
                        group.push(data);
                    });
                    log.debug('group', group)
                    groupedData.push(group);
                }
                log.debug('groupedData', groupedData)
                groupedData.forEach(function(group) {
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_sum",
                        value: 'Loan',
                        line: lineIndex
                    });
                    group.forEach(function(data) {
                        var loanAmount = data.loanAmount;
                        var periodToset = data.periodToset;
                        if(loanAmount){
                            loanAmount = convertCurr(loanAmount)
                        }
                        setList.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_"+periodToset,
                            value: loanAmount || 0,
                            line: lineIndex
                        });
                    });
                    lineIndex++
                });
                let totalLoanByPeriod = {};
                allLoan.forEach(loanArr => {
                    loanArr.forEach(loan => {
                        const periodToset = loan.periodToset;
                        const loanAmount = parseFloat(loan.loanAmount);
                        if (totalLoanByPeriod[periodToset]) {
                            totalLoanByPeriod[periodToset] += loanAmount;
                        } else {
                            totalLoanByPeriod[periodToset] = loanAmount;
                        }
                    });
                });
                // allEndingBalance.forEach(balance => {
                //     const periodToset = balance.periodToset;
                //     if (totalLoanByPeriod[periodToset]) {
                //         balance.endingBalance += totalLoanByPeriod[periodToset];
                //     }
                // });
                
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Ending Balance',
                    line: lineIndex
                });
                allEndingBalance.forEach(function(data) {
                    var endingBalance = data.endingBalance;
                    var periodToset = data.periodToset;
                    if(endingBalance){
                        endingBalance = convertCurr(endingBalance)
                    }
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: endingBalance,
                        line: lineIndex
                    });
                
                });
                dataAll.push({
                    allBeginningBalance : allBeginningBalance,
                    allOutstanding : allOutstanding,
                    alloutstandingPayable : alloutstandingPayable,
                    alloprasionalExp : alloprasionalExp,
                    allLoan : groupedData,
                    allEndingBalance : allEndingBalance
                })
                var idSub = subsId
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Download",
                    functionName: "downloadCachFlow(" + JSON.stringify(dataAll) + ", '" + idSub + "')"
                });
                form.clientScriptModulePath = "SuiteScripts/abj_cs_download_cash_flow.js";
                context.response.writePage(form);
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    function createList(sublistname, form, dataToSet){
        var sublist_item = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Cash Flow Projection",
        });
        sublist_item.addField({
            id: "custpage_sublist_sum",
            label: "Summary",
            type: serverWidget.FieldType.TEXT,
        });
        dataToSet.forEach(function(dataItem, index){
            sublist_item.addField({
                id: "custpage_sublist_"+dataItem,
                label: dataItem,
                type: serverWidget.FieldType.TEXT,
            });
        });
        
        return sublist_item
    }
    return{
        onRequest : onRequest
    }
});