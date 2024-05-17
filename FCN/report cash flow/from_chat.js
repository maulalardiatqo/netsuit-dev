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
    format
) {
    function onRequest(context) {
        try {
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
            periodFromFilter.isMandatory = true;
            var periodToFilter = form.addField({
                id: "custpage_period_to_option",
                label: "To",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "accountingperiod",
            });
            periodToFilter.isMandatory = true;

            var subsFilter = form.addField({
                id: "custpage_subs_option",
                label: "Subsidiary",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "subsidiary",
            });
            subsFilter.isMandatory = true;

            form.addSubmitButton({
                label: "Search",
            });
            if (context.request.method === 'GET') {
                context.response.writePage(form);
            } else {
                var periodFrom = context.request.parameters.custpage_period_from_option;
                var periodTo = context.request.parameters.custpage_period_to_option;
                var subsId = context.request.parameters.custpage_subs_option;

                var currentDate = new Date();
                var lastDateThisYear = new Date(currentDate.getFullYear(), 11, 31);
                var lastYear = '01/01/2015';
                var currentYear = (lastDateThisYear.getDate() < 10 ? '0' : '') + lastDateThisYear.getDate() + '/' + ((lastDateThisYear.getMonth() + 1) < 10 ? '0' : '') + (lastDateThisYear.getMonth() + 1) + '/' + lastDateThisYear.getFullYear();

                function convertCurr(data) {
                    return format.format({
                        value: data,
                        type: format.Type.CURRENCY
                    });
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

                var periodFromName, periodToName;
                
                var accountingperiodSearch = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", [periodFrom, periodTo]]
                    ],
                    columns: [
                        "internalid", "periodname"
                    ]
                });
                
                accountingperiodSearch.run().each(function(result) {
                    var internalid = result.getValue({ name: 'internalid' });
                    var periodname = result.getValue({ name: 'periodname' });
                    if (internalid === periodFrom) {
                        periodFromName = periodname;
                    }
                    if (internalid === periodTo) {
                        periodToName = periodname;
                    }
                    return true;
                });

                var startPeriod = new Date(periodFromName);
                var endPeriod = new Date(periodToName);

                var result = getMonthsCountAndNames(startPeriod, endPeriod);
                var dataAll = [];
                var jumlahPer = result.count;
                var allPeriod = result.periods;
                var allPeriodForLoan = allPeriod;
                var dataToSet = [];
                var allBeginningBalance = [];
                var allOutstanding = [];
                var alloutstandingPayable = [];
                var alloprasionalExp = [];
                var allIdPeriod = [];
                var allEndingBalance = [];

                allPeriod.forEach(function (periodName, index) {
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

                    var idPeriod, idPeriodBef;
                    
                    var postingPeriodData = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "anyof", [periodName, periodBeforeName]]
                        ],
                        columns: ["internalid", "periodname"]
                    });
                    
                    postingPeriodData.run().each(function (result) {
                        if (result.getValue({ name: 'periodname' }) === periodName) {
                            idPeriod = result.getValue({ name: 'internalid' });
                        } else {
                            idPeriodBef = result.getValue({ name: 'internalid' });
                        }
                        return true;
                    });

                    var beginningBalance;
                    var beginningBalanceSearch = search.load({ id: "customsearch775" });
                    if (idPeriodBef) beginningBalanceSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriodBef }));
                    if (subsId) beginningBalanceSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (lastYear) beginningBalanceSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                    if (currentYear) beginningBalanceSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));

                    var beginningBalanceSearchReturn = beginningBalanceSearch.run().getRange({ start: 0, end: 1 });
                    beginningBalance = beginningBalanceSearchReturn[0] ? beginningBalanceSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0 : 0;

                    var periodToset = periodName.toLowerCase().replace(/\s/g, '_');
                    allIdPeriod.push({ idPeriod: idPeriod, periodToset: periodToset });
                    dataToSet.push(periodToset);
                    allBeginningBalance.push({ beginningBalance: convertCurr(beginningBalance), periodToset: periodToset });

                    function executeAndCollectData(searchId, idPeriod, subsId, lastYear, currentYear) {
                        var searchObj = search.load({ id: searchId });
                        if (idPeriod) searchObj.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: idPeriod }));
                        if (subsId) searchObj.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                        if (lastYear) searchObj.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: lastYear }));
                        if (currentYear) searchObj.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: currentYear }));

                        var searchResults = searchObj.run().getRange({ start: 0, end: 1 });
                        return searchResults.length > 0 ? searchResults[0].getValue({ name: "amount", summary: "SUM" }) || 0 : 0;
                    }

                    var outstandingAmount = executeAndCollectData("customsearch776", idPeriod, subsId, lastYear, currentYear);
                    var outstandingPayableAmount = executeAndCollectData("customsearch777", idPeriod, subsId, lastYear, currentYear);
                    var oprasionalExpense = executeAndCollectData("customsearch778", idPeriod, subsId, lastYear, currentYear);

                    allOutstanding.push({ outstanding: convertCurr(outstandingAmount), periodToset: periodToset });
                    alloutstandingPayable.push({ outstandingPayable: convertCurr(outstandingPayableAmount), periodToset: periodToset });
                    alloprasionalExp.push({ oprasionalExpense: convertCurr(oprasionalExpense), periodToset: periodToset });
                });

                function getLoans(accountType, idPeriod, subsId) {
                    var allLoan = [];
                    var searchLoan = search.create({
                        type: "transaction",
                        filters: [
                            ["mainline", "is", "T"],
                            ["accounttype", "anyof", accountType],
                            ["subsidiary", "is", subsId],
                            ["postingperiod", "anyof", idPeriod]
                        ],
                        columns: [
                            "internalid",
                            "amount",
                            "postingperiod",
                            "trandate",
                        ]
                    });
                    
                    var searchLoanPagedData = searchLoan.runPaged({ pageSize: 1000 });
                    searchLoanPagedData.pageRanges.forEach(function(pageRange) {
                        var currentPage = searchLoanPagedData.fetch({ index: pageRange.index });
                        currentPage.data.forEach(function (result) {
                            allLoan.push({
                                loanId: result.id,
                                amount: result.getValue({ name: 'amount' }),
                                periodToset: result.getValue({ name: 'postingperiod' })
                            });
                        });
                    });

                    return allLoan;
                }

                var allLoan = [];
                allIdPeriod.forEach(function (data) {
                    var idPeriod = data.idPeriod;
                    var periodToset = data.periodToset;
                    var loans = getLoans('LongTermLiability', idPeriod, subsId);
                    loans.forEach(function (loan) {
                        loan.periodToset = periodToset;
                    });
                    allLoan.push(loans);
                });

                allLoan = groupByPeriod(allLoan);

                var loanAllData = [];
                for (var property in allLoan) {
                    if (allLoan.hasOwnProperty(property)) {
                        var loan = allLoan[property];
                        var totalLoan = loan.reduce(function (acc, obj) {
                            return acc + parseFloat(obj.amount);
                        }, 0);
                        loanAllData.push({ loanAmount: convertCurr(totalLoan), periodToset: property });
                    }
                }

                allPeriod.forEach(function (periodName) {
                    var periodToset = periodName.toLowerCase().replace(/\s/g, '_');
                    var beginningBalance = parseFloat(allBeginningBalance.find(obj => obj.periodToset === periodToset).beginningBalance.replace(/,/g, ''));
                    var outstanding = parseFloat(allOutstanding.find(obj => obj.periodToset === periodToset).outstanding.replace(/,/g, ''));
                    var outstandingPayable = parseFloat(alloutstandingPayable.find(obj => obj.periodToset === periodToset).outstandingPayable.replace(/,/g, ''));
                    var oprasionalExpense = parseFloat(alloprasionalExp.find(obj => obj.periodToset === periodToset).oprasionalExpense.replace(/,/g, ''));
                    var loan = parseFloat(loanAllData.find(obj => obj.periodToset === periodToset).loanAmount.replace(/,/g, ''));

                    var endingBalance = beginningBalance + outstanding - outstandingPayable - oprasionalExpense - loan;
                    allEndingBalance.push({ endingBalance: convertCurr(endingBalance), periodToset: periodToset });
                });

                var searchResult = [];
                dataToSet.forEach(function (data) {
                    var beginningBalance = allBeginningBalance.find(obj => obj.periodToset === data).beginningBalance;
                    var outstanding = allOutstanding.find(obj => obj.periodToset === data).outstanding;
                    var outstandingPayable = alloutstandingPayable.find(obj => obj.periodToset === data).outstandingPayable;
                    var oprasionalExpense = alloprasionalExp.find(obj => obj.periodToset === data).oprasionalExpense;
                    var loan = loanAllData.find(obj => obj.periodToset === data).loanAmount;
                    var endingBalance = allEndingBalance.find(obj => obj.periodToset === data).endingBalance;

                    searchResult.push({
                        period: data,
                        beginningBalance: beginningBalance,
                        outstanding: outstanding,
                        outstandingPayable: outstandingPayable,
                        oprasionalExpense: oprasionalExpense,
                        loan: loan,
                        endingBalance: endingBalance
                    });
                });

                var sublist = form.addSublist({
                    id: 'custpage_cashflow',
                    type: serverWidget.SublistType.LIST,
                    label: 'Cash Flow Projection'
                });

                sublist.addField({ id: 'custpage_period', type: serverWidget.FieldType.TEXT, label: 'Period' });
                sublist.addField({ id: 'custpage_beginningbalance', type: serverWidget.FieldType.TEXT, label: 'Beginning Balance' });
                sublist.addField({ id: 'custpage_outstanding', type: serverWidget.FieldType.TEXT, label: 'Outstanding' });
                sublist.addField({ id: 'custpage_outstandingpayable', type: serverWidget.FieldType.TEXT, label: 'Outstanding Payable' });
                sublist.addField({ id: 'custpage_oprasionalexp', type: serverWidget.FieldType.TEXT, label: 'Operational Expense' });
                sublist.addField({ id: 'custpage_loan', type: serverWidget.FieldType.TEXT, label: 'Loan' });
                sublist.addField({ id: 'custpage_endingbalance', type: serverWidget.FieldType.TEXT, label: 'Ending Balance' });

                searchResult.forEach(function (result, index) {
                    sublist.setSublistValue({ id: 'custpage_period', line: index, value: result.period });
                    sublist.setSublistValue({ id: 'custpage_beginningbalance', line: index, value: result.beginningBalance });
                    sublist.setSublistValue({ id: 'custpage_outstanding', line: index, value: result.outstanding });
                    sublist.setSublistValue({ id: 'custpage_outstandingpayable', line: index, value: result.outstandingPayable });
                    sublist.setSublistValue({ id: 'custpage_oprasionalexp', line: index, value: result.oprasionalExpense });
                    sublist.setSublistValue({ id: 'custpage_loan', line: index, value: result.loan });
                    sublist.setSublistValue({ id: 'custpage_endingbalance', line: index, value: result.endingBalance });
                });

                context.response.writePage(form);
            }
        } catch (e) {
            log.error({ title: 'Error', details: e });
        }
    }

    return { onRequest: onRequest };
});
