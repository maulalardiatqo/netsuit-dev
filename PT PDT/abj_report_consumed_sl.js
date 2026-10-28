/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define([
    'N/ui/serverWidget',
    'N/format',
    'N/search',
    'N/runtime',
    'N/query',
], function (
    serverWidget,
    format,
    search,
    runtime,
    query
) {

    function getPeriod() {
        var periodSearch = search.create({
            type: 'accountingperiod',
            filters: [],
            columns: ['internalid', 'periodname']
        });

        var allPeriod = {}
        periodSearch.run().each(function (result) {
            var periodName = result.getValue('periodname')
            allPeriod[periodName] = result.id
            return true
        })

        return allPeriod
    }

    function convertDateToPeriod(stringDate) {
        var monthsArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        var date = Number(stringDate.split('/')[0])
        var month = Number(stringDate.split('/')[1])
        var year = Number(stringDate.split('/')[2])

        return monthsArr[month - 1] + ' ' + year
    }

    function onRequest(context) {

        var form = serverWidget.createForm({
            title: 'PDT - Consumed Amount'
        });

        var sContent = "";

        // ==========================
        // FILTER FORM
        // ==========================

        var filterOption = form.addFieldGroup({
            id: "filteroption",
            label: "FILTERS",
        });
        var filterOption = form.addFieldGroup({
            id: "dataresult",
            label: "Data Result",
        });

        var subsFilter = form.addField({
            id: 'custpage_subsidiary',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiary',
            source: 'subsidiary',
            container: "filteroption",
        })
        var accountFilter = form.addField({
            id: 'custpage_account',
            type: serverWidget.FieldType.SELECT,
            label: 'Account',
            source: 'account',
            container: "filteroption",
        })

        var dateFromFilter = form.addField({
            id: 'custpage_datefrom',
            type: serverWidget.FieldType.DATE,
            label: 'Date From',
            container: "filteroption",
        });

        var dateToFilter = form.addField({
            id: 'custpage_dateto',
            type: serverWidget.FieldType.DATE,
            label: 'Date To',
            container: "filteroption",
        });

        var departmentFilter = form.addField({
            id: 'custpage_costcenter',
            type: serverWidget.FieldType.SELECT,
            label: 'Department',
            source: 'department',
            container: "filteroption",
        });

        var classFilter = form.addField({
            id: 'custpage_class',
            type: serverWidget.FieldType.SELECT,
            label: 'Class',
            source: 'classification',
            container: 'filteroption'
        });
        var budgetIncludeZeroFilter = form.addField({
            id: 'custpage_budget_include_zero',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Budget Include 0',
            container: 'filteroption'
        });

        var fldTable = form.addField({
            id: "custpage_htmlfield",
            type: serverWidget.FieldType.INLINEHTML,
            label: "HTML Image",
            container: "dataresult",
        });

        form.addSubmitButton({ label: 'Submit' });


        // ==========================
        // GET MODE
        // ==========================

        // if (context.request.method === 'GET') {
        //     context.response.writePage(form);
        //     // form.clientScriptModulePath = "SuiteScripts/abj_exprep_sl_cs.js";
        //     return;
        // }

        // ==========================
        // POST MODE
        // ==========================

        try {
            var isFromUE = context.request.parameters.is_from_userevent;

            var subs = context.request.parameters.custpage_subsidiary;
            var account = context.request.parameters.custpage_account;
            var dateFrom = context.request.parameters.custpage_datefrom;
            var dateTo = context.request.parameters.custpage_dateto;
            var departmentOpt = context.request.parameters.custpage_costcenter;
            var classOpt = context.request.parameters.custpage_class;
            var budgetIncludeZero = context.request.parameters.custpage_budget_include_zero;

            subsFilter.defaultValue = subs
            accountFilter.defaultValue = account
            dateFromFilter.defaultValue = dateFrom
            dateToFilter.defaultValue = dateTo
            departmentFilter.defaultValue = departmentOpt
            classFilter.defaultValue = classOpt
            budgetIncludeZeroFilter.defaultValue = budgetIncludeZero

            var allData = {}

            //selain PO yg pending approval, closed, cancelled, fully billed, PR yg pending approval, closed, rejected, approved
            var searchFilters = [
                ["status", "noneof", "PurchOrd:A", "PurchReq:A", "PurchOrd:C", "PurchReq:C", "PurchReq:E", "PurchOrd:H", "PurchOrd:P", "PurchReq:H", "PurchReq:R"],
                "AND",
                ["mainline", "is", "F"]
            ]

            if (subs) {
                searchFilters.push(
                    "AND",
                    ["subsidiary", "is", subs]
                )
            }
            if (account) {
                searchFilters.push(
                    "AND",
                    ["account", "is", account]
                )
            }
            if (dateFrom) {
                searchFilters.push(
                    "AND",
                    ["trandate", "onorafter", dateFrom]
                )
            }
            if (dateTo) {
                searchFilters.push(
                    "AND",
                    ["trandate", "onorbefore", dateTo]
                )
            }
            if (departmentOpt) {
                searchFilters.push(
                    "AND",
                    ["department", "is", departmentOpt]
                )
            }
            if (classOpt) {
                searchFilters.push(
                    "AND",
                    ["class", "is", classOpt]
                )
            }

            const transactionSearchObj = search.create({
                type: "transaction",
                filters: searchFilters,
                columns:
                    [
                        search.createColumn({
                            name: "postingperiod",
                            summary: "GROUP",
                            label: "Period"
                        }),
                        search.createColumn({
                            name: "account",
                            summary: "GROUP",
                            label: "Account"
                        }),
                        search.createColumn({
                            name: "department",
                            summary: "GROUP",
                            label: "Department"
                        }),
                        search.createColumn({
                            name: "class",
                            summary: "GROUP",
                            label: "Class"
                        }),

                        // search.createColumn({
                        //     name: "custcol_stc_budget_amount",
                        //     summary: "MAX",
                        //     label: "STC - Budget Amount"
                        // }),

                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN {recordType}='purchaseorder' THEN {amount} ELSE 0 END",
                            label: "Formula (Currency)"
                        }),

                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN {posting} = 'T' THEN {amount} ELSE 0 END",
                            label: "Formula (Currency)"
                        }),

                        search.createColumn({
                            name: "subsidiary",
                            summary: "GROUP",
                            label: "Subsidiary"
                        }),
                    ]
            });

            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count", searchResultCount);

            var pagedDataTrx = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            pagedDataTrx.pageRanges.forEach(function (pageRange) {
                var myPage = pagedDataTrx.fetch({
                    index: pageRange.index
                });

                myPage.data.forEach(function (result) {
                    var period = result.getValue(transactionSearchObj.columns[0])
                    var account = result.getValue(transactionSearchObj.columns[1])
                    var department = result.getValue(transactionSearchObj.columns[2])
                    var clasS = result.getValue(transactionSearchObj.columns[3])
                    var amtPO = result.getValue(transactionSearchObj.columns[4]) || 0
                    var amtActual = result.getValue(transactionSearchObj.columns[5]) || 0
                    var subs = result.getValue(transactionSearchObj.columns[6]) || 0

                    var periodText = result.getText(transactionSearchObj.columns[0])
                    var accountText = result.getText(transactionSearchObj.columns[1])
                    var departmentText = result.getText(transactionSearchObj.columns[2])
                    var classText = result.getText(transactionSearchObj.columns[3])
                    var subsText = result.getText(transactionSearchObj.columns[6])

                    var key = [
                        period,
                        account,
                        department,
                        clasS,
                        subs
                    ].join('-');

                    // log.debug('amt', {
                    //     amtPO, amtActual 
                    // })
                    // if(amtPO && amtActual){
                    //     log.debug('key', key)
                    // }

                    if (!allData[key]) {
                        allData[key] = {
                            account: account,
                            accountText: accountText,
                            period: period,
                            periodText: periodText,
                            department: department,
                            departmentText: departmentText == '- None -' ? '' : departmentText,
                            clasS: clasS,
                            classText: classText == '- None -' ? '' : classText,
                            subs: subs,
                            subsText: subsText,
                            budgetAmount: 0,
                            amtPO: parseFloat(amtPO),
                            amtPR: 0,
                            amtActual: parseFloat(amtActual)
                        };
                    } else {
                        //kalau sama
                        // allData[key].budgetAmount += parseFloat(budgetAmount)
                        allData[key].amtPO += parseFloat(amtPO)
                        allData[key].amtActual += parseFloat(amtActual)
                    }

                    return true
                })
            })

            log.debug('allData', allData)

            var allPeriod = getPeriod()
            log.debug('allPeriod', allPeriod)

            var fyOnly = {};
            for (var key in allPeriod) {
                if (key.includes('FY')) {
                    fyOnly[key] = allPeriod[key];
                }
            }
            log.debug('fyOnly', fyOnly)


            //PR selain pending, closed, rejected, approved, rejected
            var prSearchFilters = [
                ["status", "noneof", "PurchReq:A", "PurchReq:C", "PurchReq:E", "PurchReq:H", "PurchReq:R"],
                "AND",
                ["mainline", "is", "F"]
            ]

            if (account) {
                prSearchFilters.push(
                    "AND",
                    ["account", "is", account]
                )
            }
            if (dateFrom) {
                prSearchFilters.push(
                    "AND",
                    ["trandate", "onorafter", dateFrom]
                )
            }
            if (dateTo) {
                prSearchFilters.push(
                    "AND",
                    ["trandate", "onorbefore", dateTo]
                )
            }
            //kayanya ga perlu ditambhain, karena ngikut yang report pertama key nya

            const prObj = search.create({
                type: "purchaserequisition",
                filters: prSearchFilters,
                columns:
                    [
                        search.createColumn({
                            name: "postingperiod",
                            summary: "GROUP",
                            label: "Period"
                        }),
                        search.createColumn({
                            name: "account",
                            summary: "GROUP",
                            label: "Account"
                        }),
                        search.createColumn({
                            name: "department",
                            summary: "GROUP",
                            label: "Department"
                        }),
                        search.createColumn({
                            name: "class",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "amount",
                            join: "applyingTransaction",
                            summary: "SUM",
                            label: "PO TOTAL"
                        }),
                        search.createColumn({
                            name: "estimatedamount",
                            summary: "MAX",
                            label: "Estimated Amount"
                        }),
                        search.createColumn({
                            name: "subsidiary",
                            summary: "GROUP",
                            label: "Subsidiary"
                        }),

                    ]
            });

            var pagedData = prObj.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                // Ambil data untuk halaman saat ini
                var myPage = pagedData.fetch({
                    index: pageRange.index
                });

                myPage.data.forEach(function (result) {
                    // Ambil kolom dari result secara dinamis
                    var cols = result.columns;

                    var period = result.getValue(cols[0]);
                    var account = result.getValue(cols[1]);
                    var department = result.getValue(cols[2]);
                    var clasS = result.getValue(cols[3]);
                    var amtPOinPR = parseFloat(result.getValue(cols[4])) || 0;
                    var estAmt = parseFloat(result.getValue(cols[5])) || 0;
                    var subs = parseFloat(result.getValue(cols[6]));

                    log.debug('estAmt', estAmt)
                    log.debug('amtPOinPR', amtPOinPR)

                    var key = [
                        period,
                        account,
                        department,
                        clasS,
                        subs
                    ].join('-');

                    if (allData[key]) {
                        var setAmtPr = estAmt - amtPOinPR;
                        allData[key].amtPR += parseFloat(setAmtPr);
                    }
                });
            });

            //pake suiteql
            const sql = `
                                SELECT 
                                    *
                                FROM 
                                    budgetimport
                            `;

            const queryResults = query.runSuiteQL({ query: sql }).asMappedResults();
            log.debug('queryresult', queryResults)


            // ==========================
            // HTML TABLE BUILDER (NO CHANGES)
            // ==========================

            sContent += "    <table width=\"205%\"  style=\"table-layout:fixed;\"'>";

            sContent += '        <tr class="uir-list-headerrow">'
            sContent += '<td style="width:8%"></td>'
            sContent += '<td style="width:16%"></td>'
            sContent += '<td style="width:16%"></td>'
            sContent += '<td style="width:10%"></td>'
            sContent += '<td style="width:10%"></td>'
            sContent += '<td style="width:19%"></td>'
            sContent += '<td style="width:19%"></td>'
            sContent += '<td style="width:19%"></td>'
            sContent += '<td style="width:19%"></td>'
            sContent += '<td style="width:19%"></td>'
            sContent += '        </tr>';

            sContent += '        <tr class="uir-list-headerrow">'
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Period</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Account</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Subsidiary</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Department</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Class</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Max Budget Amount</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Requisition</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Purchase Order</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Actual Amount</td>';
            sContent += '<td class="uir-list-header-td" style="padding: 10px; font-size: 12px; text-align: center;font-weight: bold; background: #c9daf8 !important; position: sticky; top: 0; z-index: 10;">Remaining Amount</td>';
            sContent += '        </tr>';

            // LOOP UI TABLE
            var totalMaxBudget = 0
            var totalPR = 0
            var totalPO = 0
            var totalActual = 0
            var totalRemain = 0
            if (Object.keys(allData).length > 0) {
                Object.keys(allData).forEach(function (result) {
                    var row = allData[result]

                    // log.debug('row.budgetAmount', row.budgetAmount)

                    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

                    var monthPeriod = row.periodText.split(' ')[0]
                    var monthIdx = month.indexOf(monthPeriod) + 1
                    var yearPeriod = row.periodText.split(' ')[1]
                    var yearIdx = fyOnly["FY " + yearPeriod]

                    // log.debug('row.account', row.account)
                    // log.debug('row.department', row.department)
                    // log.debug('row.clasS', row.clasS)
                    // log.debug('yearIdx', yearIdx)
                    var budgAmount = 0
                    var findDepartment = null
                    var findClass = null
                    if (row.department) {
                        findDepartment = row.department
                    }
                    if (row.clasS) {
                        findClass = row.clasS
                    }
                    const budgetRow = queryResults.find(item =>
                        item.account == row.account &&
                        item.department == findDepartment &&
                        item.class == findClass &&
                        item.year == yearIdx &&
                        item.subsidiary == row.subs
                    );
                    // log.debug('budgetRow', budgetRow)

                    if (budgetRow) {
                        var periodAmtIdx = "periodamount" + monthIdx
                        budgAmount = budgetRow[periodAmtIdx]
                    }
                    // log.debug('budgAmount', budgAmount)

                    if (budgAmount == 0 && budgetIncludeZero !== 'T') {
                        return;
                    }

                    sContent += '<tr style="font-size:10px; background-color:white;" onmouseover="this.style.backgroundColor=\'#fbfaea\'" onmouseout="this.style.backgroundColor=\'white\'">';

                    var subsTextSplit = (row.subsText).split(' : ')
                    var setSubsText = subsTextSplit[subsTextSplit.length - 1]
                    sContent += '<td style="text-align:center"><p>' + row.periodText + '</p></td>'
                    sContent += '<td style="text-align: center;"><p>' + row.accountText + '</p></td>'
                    sContent += '<td style="text-align: center;"><p>' + setSubsText + '</p></td>'
                    sContent += '<td style="text-align: center;"><p>' + row.departmentText + '</p></td>'
                    sContent += '<td style="text-align: center;"><p>' + row.classText + '</p></td>'

                    var budgetText = format.format({ value: parseFloat(budgAmount), type: format.Type.CURRENCY })
                    sContent += '<td style="text-align: center;"><p>' + budgetText + '</p></td>'
                    var amtPRText = format.format({ value: row.amtPR, type: format.Type.CURRENCY })
                    sContent += '<td style="text-align: center;"><p>' + amtPRText + '</p></td>'
                    var amtPOText = format.format({ value: row.amtPO, type: format.Type.CURRENCY })
                    sContent += '<td style="text-align: center;"><p>' + amtPOText + '</p></td>'

                    var actualText = format.format({ value: row.amtActual, type: format.Type.CURRENCY })
                    sContent += '<td style="text-align: center;"><p>' + actualText + '</p></td>'

                    // var remainAmt = row.budgetAmount - (row.amtPR + row.amtPO + row.amtActual)
                    var remainAmt = budgAmount - (row.amtPR + row.amtPO + row.amtActual)
                    var remainText = format.format({ value: remainAmt, type: format.Type.CURRENCY })
                    sContent += '<td style="text-align: center;"><p>' + remainText + '</p></td>'
                    sContent += '</tr>';

                    //PR, PO, TAR, TER
                    totalMaxBudget += parseFloat(budgAmount)
                    totalPR += parseFloat(row.amtPR)
                    totalPO += parseFloat(row.amtPO)
                    totalActual += parseFloat(row.amtActual)
                    totalRemain += parseFloat(remainAmt)

                })
            } else {
                sContent += '<tr style="font-size:10px;">';
                sContent += '<td colspan=10 style="text-align:center; font-size:14px;"><p>No Data</p></td>'
                sContent += '</tr>';
            }

            var totalMaxBudgetText = format.format({ value: totalMaxBudget, type: format.Type.CURRENCY })
            var totalPRText = format.format({ value: totalPR, type: format.Type.CURRENCY })
            var totalPOText = format.format({ value: totalPO, type: format.Type.CURRENCY })
            var totalActualText = format.format({ value: totalActual, type: format.Type.CURRENCY })
            var totalRemainText = format.format({ value: totalRemain, type: format.Type.CURRENCY })

            sContent += '<tr style="font-size:12px; font-weight:bold; background: #c9daf8 !important;">';
            sContent += '<td colspan=4 style="text-align: center;"></td>'
            sContent += '<td style="text-align: center;">Total</td>'
            sContent += '<td style="text-align: center;"><p>' + totalMaxBudgetText + '</p></td>'
            sContent += '<td style="text-align: center;"><p>' + totalPRText + '</p></td>'
            sContent += '<td style="text-align: center;"><p>' + totalPOText + '</p></td>'
            sContent += '<td style="text-align: center;"><p>' + totalActualText + '</p></td>'
            sContent += '<td style="text-align: center;"><p>' + totalRemainText + '</p></td>'
            sContent += '</tr>';



            sContent += "</table>";

            fldTable.defaultValue = sContent;

            //

            var userId = runtime.getCurrentUser().id
            log.debug('userId', userId)

            if (userId == 425) {
                //untuk testing
            }

            log.debug('isFromUE', isFromUE)
            if (isFromUE == 'T') {
                context.response.writePage(JSON.stringify(allData));
            } else {
                context.response.writePage(form);
            }


        } catch (error) {

            log.error('ERROR', error);
            context.response.write('Error: ' + error.message);

        }
        // form.clientScriptModulePath = "SuiteScripts/abj_exprep_sl_cs.js";

    }

    return {
        onRequest: onRequest
    };

});
