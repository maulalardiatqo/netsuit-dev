    /**
     * @NApiVersion 2.1
     * @NScriptType Suitelet
     */

    define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/ui/message",
    "N/url",
    "N/redirect",
    "N/xml",
    "N/file",
    "N/encode",
    'N/runtime'
    ], function(
    serverWidget,
    search,
    record,
    message,
    url,
    redirect,
    xml,
    file,
    encode,
    runtime
    ) {
    function onRequest(context) {
        var contextRequest = context.request;
        if (contextRequest.method === "GET") {
        var form = serverWidget.createForm({
            title: "Budget Reporting",
        });

        var filterOption = form.addFieldGroup({
            id: "filteroption",
            label: "FILTER",
        });

        var filterOption = form.addFieldGroup({
            id: "periodoption",
            label: "PERIOD RANGE",
        });

        var departmentFilter = form.addField({
            id: 'custpage_department',
            type: serverWidget.FieldType.SELECT,
            label: 'DEPARTMENT',
            source: 'department',
            container: 'filteroption',
        });
        departmentFilter.isMandatory = true;
        let currentUserRoleGet = runtime.getCurrentUser().role;
        log.debug('currentUserRoleGet', currentUserRoleGet);
        if((currentUserRoleGet == 1048 || currentUserRoleGet == 1036 || currentUserRoleGet == 1049 || currentUserRoleGet == 3)){
            var checkBoxDepartement = form.addField({
                id: 'custpage_checkbox_all_departement',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Download All Departement',
                container: 'filteroption',
            });
        }

        var periodFilterStart = form.addField({
            id: 'custpage_accounting_period_from',
            type: serverWidget.FieldType.SELECT,
            label: 'START',
            container: 'periodoption',
            source: 'accountingperiod'
        });

        periodFilterStart.isMandatory = true;

        var periodFilterEnd = form.addField({
            id: 'custpage_accounting_period_to',
            type: serverWidget.FieldType.SELECT,
            label: 'END',
            container: 'periodoption',
            source: 'accountingperiod'
        });

        periodFilterEnd.isMandatory = true;

        var groupFilter = form.addField({
            id: 'custpage_group',
            type: serverWidget.FieldType.SELECT,
            label: 'GROUPED BY',
            container: 'filteroption'
        });

        groupFilter.addSelectOption({
            value: 'ytd',
            text: 'Budget utilization grouped by GL Group'
        });

        // groupFilter.addSelectOption({
        //   value: 'mtd',
        //   text: 'MTD'
        // });

        groupFilter.addSelectOption({
            value: 'acc',
            text: 'Budget utilization grouped by Account Type'
        });

        groupFilter.isMandatory = true;

        
        form.addSubmitButton({
            label: "Generate Excel Report",
        });
        form.clientScriptModulePath = "SuiteScripts/budget_reporting_cs.js";
        context.response.writePage(form);
        } else {
        try {
            var groupFilterSelected = contextRequest.parameters.custpage_group;
            var departmentSelected = contextRequest.parameters.custpage_department;
            var periodFrom = contextRequest.parameters.custpage_accounting_period_from;
            var periodTo = contextRequest.parameters.custpage_accounting_period_to;

            let currentUser = runtime.getCurrentUser().id;
            let currentUserRole = runtime.getCurrentUser().role;
            log.debug("currentUser", runtime.getCurrentUser());
            log.debug('currentUserRole', currentUserRole);
            if(departmentSelected){
                var ccRec = record.load({
                    type: 'department',
                    id: departmentSelected,
                    isDynamic: true
                });
                var budgetViewerEmp = ccRec.getValue("custrecord_sol_dep_bud_view");
                var budgetPreparerEmp = ccRec.getValue("custrecord_sol_dep_bud_prp");
                var budgetHeadApproveEmp = ccRec.getValue("custrecord_sol_dep_app");
                var budgetPreparerEmp_2 = ccRec.getValue("custrecord_sol_budget_bu_2");
                var budgetPreparerEmp_3 = ccRec.getValue("custrecordsol_budget_bu3");
                var departmentText = ccRec.getValue("name");
            }
            
            

            if ((currentUser == budgetPreparerEmp || currentUser == budgetHeadApproveEmp || currentUser == budgetPreparerEmp_2 || currentUser == budgetPreparerEmp_3) ||(currentUserRole == 1048 || currentUserRole == 1036 || currentUserRole == 1049 || currentUserRole == 3)) {
            log.debug("periodFrom", periodFrom);
            log.debug("periodTo", periodTo);

            var recPeriodFrom = record.load({
                type: record.Type.ACCOUNTING_PERIOD,
                id: periodFrom,
            });
            var periodNameFrom = recPeriodFrom.getText({
                fieldId: 'periodname'
            });
            var periodStartDate = recPeriodFrom.getValue({
                fieldId: 'startdate'
            });

            var recPeriodTo = record.load({
                type: record.Type.ACCOUNTING_PERIOD,
                id: periodTo,
            });
            var periodNameTo = recPeriodTo.getText({
                fieldId: 'periodname'
            });
            var periodEndDate = recPeriodTo.getValue({
                fieldId: 'enddate'
            });
            var periodFromSplit = periodNameFrom.split(" ");
            var periodToSplit = periodNameTo.split(" ");
            var yearFrom = periodFromSplit[1];
            var yearTo = periodToSplit[1];
            var dateNow = new Date();
            var yearNow = dateNow.getFullYear();
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            var monthNow = monthNames[dateNow.getMonth()];

            function format_date_for_save_search(vDate) {
                var vDate = new Date(vDate);
                var hari = vDate.getDate();
                var bulan = vDate.getMonth() + 1;
                var tahun = vDate.getFullYear();
                var vDate = hari + "/" + bulan + "/" + tahun;
                return vDate;
            }

            function getColoumnMonth(month, group) {
                switch (month) {
                case 'Jan':
                    var getColoumn = group == 'acc' ? 2 : 3;
                    break;
                case 'Feb':
                    var getColoumn = group == 'acc' ? 3 : 4;
                    break;
                case 'Mar':
                    var getColoumn = group == 'acc' ? 4 : 5;
                    break;
                case 'Apr':
                    var getColoumn = group == 'acc' ? 5 : 6;
                    break;
                case 'May':
                    var getColoumn = group == 'acc' ? 6 : 7;
                    break;
                case 'Jun':
                    var getColoumn = group == 'acc' ? 7 : 8;
                    break;
                case 'Jul':
                    var getColoumn = group == 'acc' ? 8 : 9;
                    break;
                case 'Aug':
                    var getColoumn = group == 'acc' ? 9 : 10;
                    break;
                case 'Sep':
                    var getColoumn = group == 'acc' ? 10 : 11;
                    break;
                case 'Oct':
                    var getColoumn = group == 'acc' ? 11 : 12;
                    break;
                case 'Nov':
                    var getColoumn = group == 'acc' ? 12 : 13;
                    break;
                case 'Dec':
                    var getColoumn = group == 'acc' ? 13 : 14;
                    break;
                default:
                    var getColoumn = 3;
                }
                return getColoumn;
            }

            var listBudget_1 = [];
            var listBudget = [];
            var listUtilized = [];
            var listCommitted = [];

            log.debug("groupFilterSelected", groupFilterSelected);
            log.debug("startdate", format_date_for_save_search(periodStartDate));
            log.debug("enddate", format_date_for_save_search(periodEndDate));
            var monthStart = monthNames[periodStartDate.getMonth()];
            var monthEnd = monthNames[periodEndDate.getMonth()];
            log.debug("monthStart", monthStart);
            log.debug("monthEnd", monthEnd);

            var rangePeriod = [];
            for (var i = periodFrom; i <= periodTo; i++) {
                rangePeriod.push(i);
            }
            // log.debug("rangePeriod", rangePeriod);

            // START GL Utilized Budget
            var dataTransGL = search.load({
                id: "customsearch_sol_gl_trans_utilized",
            });
            // dataTransGL.filters.push(
            //   search.createFilter({
            //     name: "postingperiod",
            //     operator: search.Operator.BETWEEN,
            //     values: periodFrom + " and " + periodTo,
            //   })
            // );
            dataTransGL.filters.push(
                search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORAFTER,
                values: format_date_for_save_search(periodStartDate),
                })
            );
            dataTransGL.filters.push(
                search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORBEFORE,
                values: format_date_for_save_search(periodEndDate),
                })
            );
            if (departmentSelected) {
                dataTransGL.filters.push(
                search.createFilter({
                    name: "department",
                    operator: search.Operator.IS,
                    values: departmentSelected,
                })
                );
            }
            var dataTransSetGL = dataTransGL.run();
            dataTransGL = dataTransSetGL.getRange(0, 999);
            log.debug("dataTransGL", dataTransGL.length);
            // END GL Utilized Budget

            // START GL Committed Budget
            var dataTransCT = search.load({
                id: "customsearch_sol_gl_trans_utilized_2",
            });
            // dataTransCT.filters.push(
            //   search.createFilter({
            //     name: "postingperiod",
            //     operator: search.Operator.BETWEEN,
            //     values: periodFrom + " and " + periodTo,
            //   })
            // );
            dataTransCT.filters.push(
                search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORAFTER,
                values: format_date_for_save_search(periodStartDate),
                })
            );
            dataTransCT.filters.push(
                search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORBEFORE,
                values: format_date_for_save_search(periodEndDate),
                })
            );
            if (departmentSelected) {
                dataTransCT.filters.push(
                search.createFilter({
                    name: "department",
                    operator: search.Operator.IS,
                    values: departmentSelected,
                })
                );
            }
            var dataTransSetCT = dataTransCT.run();
            dataTransCT = dataTransSetCT.getRange(0, 999);
            log.debug("dataTransPO", dataTransCT.length);
            // END GL Committed Budget

            dataTransGL.forEach(function(row) {
                var amount = row.getValue({
                name: dataTransSetGL.columns[0]
                });
                var account = row.getValue({
                name: dataTransSetGL.columns[1]
                });
                var account_number = row.getValue({
                name: dataTransSetGL.columns[4]
                });

                listUtilized.push({
                amount: amount,
                account: account,
                account_number: account_number
                });
            });
            // log.debug("listUtilized", listUtilized);

            dataTransCT.forEach(function(row) {
                var amount = row.getValue({
                name: dataTransSetCT.columns[0]
                });
                var account = row.getValue({
                name: dataTransSetCT.columns[1]
                });
                var account_number = row.getValue({
                name: dataTransSetCT.columns[4]
                });


                listCommitted.push({
                amount: amount,
                account: account,
                account_number: account_number
                });
            });
            // log.debug("listCommitted", listCommitted);

            var yearFrom = new Date(periodStartDate).getFullYear();
            var yearTo = new Date(periodEndDate).getFullYear();
            log.debug("yearFrom", yearFrom);
            log.debug("yearTo", yearTo);
            var yearArr = [];
            yearArr.push(yearFrom);
            yearArr.push(yearTo);
            log.debug("yearArr", yearArr);
            var newYearArr = [...new Set(yearArr)];
            log.debug("newYearArr", newYearArr);

                if (groupFilterSelected == 'ytd') {
                    var dataTrans = search.load({
                    id: "customsearch_budget_utilization_ytd",
                    });
                    dataTrans.filters.push(
                    search.createFilter({
                        name: "custrecord_sol_bud_sub_fy",
                        operator: search.Operator.IS,
                        values: yearTo,
                    })
                    );
                    if (departmentSelected) {
                    let dprtmn = [departmentSelected];
                    dataTrans.filters.push(
                        search.createFilter({
                        name: "custrecord_sol_budsub_dep",
                        operator: search.Operator.ANYOF,
                        values: dprtmn,
                        })
                    );
                    }
                    var dataTransSet = dataTrans.run();
                    dataTrans = dataTransSet.getRange(0, 999);
                    log.debug("dataTrans", dataTrans.length);

                    dataTrans.forEach(function(row) {
                    var groupDescVal = row.getValue({
                        name: dataTransSet.columns[0]
                    });
                    var groupDesc = row.getText({
                        name: dataTransSet.columns[0]
                    });
                    var accType = row.getValue({
                        name: dataTransSet.columns[1]
                    });
                    var accTypeText = row.getText({
                        name: dataTransSet.columns[1]
                    });
                    var glCodeName = row.getValue({
                        name: dataTransSet.columns[16]
                    });
                    var glCodeNumber = row.getValue({
                        name: dataTransSet.columns[17]
                    });
                    var glCode = glCodeNumber + "-" + glCodeName;
                    var revisedBudget = row.getValue({
                        name: dataTransSet.columns[2]
                    }) || 0;
                    var coloumnStart = getColoumnMonth(monthStart, 'ytd');
                    var coloumnEnd = getColoumnMonth(monthEnd, 'ytd');
                    var totalPlanned = 0;
                    for (var i = coloumnEnd; i >= coloumnStart; i--) {
                        totalPlanned += parseFloat(row.getValue({
                        name: dataTransSet.columns[i]
                        }));
                    }
                    var utilizedBudget = 0;
                    var committedBudget = 0;
                    for (var j in listUtilized) {
                        var accountUtilizedNumber = listUtilized[j].account_number;
                        if (accountUtilizedNumber) {
                        if (accountUtilizedNumber == glCodeNumber) {
                            var amountAccountUtilized = listUtilized[j]?.amount || 0;
                            utilizedBudget = parseFloat(amountAccountUtilized);
                        }
                        }
                    }

                    for (var k in listCommitted) {
                        var accountCommittedNumber = listCommitted[k].account_number;
                        if (accountCommittedNumber) {
                        if (accountCommittedNumber == glCodeNumber) {
                            var amountAccountCommitted = listCommitted[k]?.amount || 0;
                            committedBudget = parseFloat(amountAccountCommitted);
                        }
                        }
                    }

                    var totalUtilization = parseFloat(utilizedBudget) + parseFloat(committedBudget);
                    var variance = totalPlanned - totalUtilization;
                    var availableBudget = parseFloat(revisedBudget) - totalUtilization;
                    listBudget.push({
                        groupDesc: groupDesc,
                        groupDescVal: groupDescVal,
                        accType: accTypeText,
                        revisedBudget: revisedBudget,
                        planned: totalPlanned,
                        utilizedBudget: utilizedBudget,
                        committedBudget: committedBudget,
                        totalUtilization: totalUtilization,
                        variance: variance,
                        availableBudget: availableBudget,
                        glCode: glCode
                    });
                    });

                    // var uniquelistBudget = listBudget;
                    log.debug("listBudget", listBudget.length);
                } else {
                    var dataTrans = search.load({
                    id: "customsearch_budget_utilization_ytd_2",
                    });
                    dataTrans.filters.push(
                    search.createFilter({
                        name: "custrecord_sol_bud_sub_fy",
                        operator: search.Operator.IS,
                        values: yearTo,
                    })
                    );
                    if (departmentSelected) {
                    let dprtmn = [departmentSelected];
                    dataTrans.filters.push(
                        search.createFilter({
                        name: "custrecord_sol_budsub_dep",
                        operator: search.Operator.ANYOF,
                        values: dprtmn,
                        })
                    );
                    }
                    var dataTransSet = dataTrans.run();
                    dataTrans = dataTransSet.getRange(0, 999);
                    log.debug("dataTrans", dataTrans.length);
                    dataTrans.forEach(function(row) {
                    var accType = row.getValue({
                        name: dataTransSet.columns[0]
                    });
                    var accTypeText = row.getText({
                        name: dataTransSet.columns[0]
                    });
                    // var glCodeText = row.getText({
                    //   name: dataTransSet.columns[15]
                    // });
                    var revisedBudget = row.getValue({
                        name: dataTransSet.columns[1]
                    }) || 0;
                    var coloumnStart = getColoumnMonth(monthStart, 'acc');
                    var coloumnEnd = getColoumnMonth(monthEnd, 'acc');
                    log.debug("coloumnStart", coloumnStart);
                    log.debug("coloumnEnd", coloumnEnd);
                    var totalPlanned = 0;
                    for (var i = coloumnEnd; i >= coloumnStart; i--) {
                        totalPlanned += parseFloat(row.getValue({
                        name: dataTransSet.columns[i]
                        }));
                    }

                    var accountSearch = search.create({
                        type: 'customrecord_sol_bud_sub',
                        columns: [{
                        name: 'custrecord_sol_budsub_account',
                        summary: search.Summary.GROUP
                        }],
                        filters: [{
                        name: 'type',
                        join: 'custrecord_sol_budsub_account',
                        operator: search.Operator.IS,
                        values: accType
                        }],
                    })
                    var accountSearchSet = accountSearch.run();
                    accountSearch = accountSearchSet.getRange(0, 999);

                    // log.debug("accountSearch", accountSearch);
                    var utilizedBudget = 0;
                    var committedBudget = 0;
                    accountSearch.forEach(function(row0) {
                        var subParentAccount = row0.getValue({
                        name: accountSearchSet.columns[0]
                        });
                        // log.debug("subParentAccount", subParentAccount);
                        for (var j in listUtilized) {
                        var accountUtilized = listUtilized[j].account;
                        if (accountUtilized == subParentAccount) {
                            var amountAccountUtilized = listUtilized[j]?.amount || 0;
                            utilizedBudget += parseFloat(amountAccountUtilized);
                            // log.debug("same utilized", {
                            //   accTypeText: accTypeText,
                            //   amountAccountUtilized: amountAccountUtilized
                            // });
                        }
                        }
                        // log.debug("after", "accountUtilized");
                        for (var k in listCommitted) {
                        var accountCommitted = listCommitted[k].account;
                        if (accountCommitted == subParentAccount) {
                            var amountAccountCommitted = listCommitted[k]?.amount || 0;
                            committedBudget += parseFloat(amountAccountCommitted);
                            // log.debug("same committed", {
                            //   accTypeText: accTypeText,
                            //   amountAccountCommitted: amountAccountCommitted
                            // });
                        }
                        }
                        // log.debug("after", "accountCommitted");
                    });
                    // log.debug("aaaa", {
                    //   accTypeText: accTypeText,
                    //   utilizedBudget: utilizedBudget,
                    //   committedBudget: committedBudget
                    // });
                    var totalUtilization = parseFloat(utilizedBudget) + parseFloat(committedBudget);
                    var variance = totalPlanned - totalUtilization;
                    var availableBudget = parseFloat(revisedBudget) - totalUtilization;
                    listBudget.push({
                        accType: accTypeText,
                        revisedBudget: revisedBudget,
                        planned: totalPlanned,
                        utilizedBudget: utilizedBudget,
                        committedBudget: committedBudget,
                        totalUtilization: totalUtilization,
                        variance: variance,
                        availableBudget: availableBudget,
                        glCode: ''
                    });
                    });
                    // log.debug("listBudget", listBudget);
                }
                if (listBudget.length <= 0) {
                    var html = `<html>
                    <h3>No Data for this selection!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;

                    var form_result = serverWidget.createForm({
                    title: "Result of Budget Report",
                    });
                    form_result.addPageInitMessage({
                    type: message.Type.ERROR,
                    title: "No Data!",
                    message: html,
                    });
                    context.response.writePage(form_result);
                } else {
                    // XML content of the file
                    var xmlStr =
                    '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                    xmlStr +=
                    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                    xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                    xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                    xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                    xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

                    // Styles
                    xmlStr += "<Styles>";
                    xmlStr += "<Style ss:ID='BC'>";
                    xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                    "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='BNC'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                    "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='BNCN'>";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                    "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='NB'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='NBN'>";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "</Style>";
                    xmlStr += "</Styles>";
                    //   End Styles

                    // Sheet Name
                    xmlStr += '<Worksheet ss:Name="Sheet1">';
                    // End Sheet Name

                    if (groupFilterSelected == 'ytd') {
                    // Kolom Excel Header
                    xmlStr +=
                        "<Table>" +
                        "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='200' />" +
                        "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Row ss:Index='1' ss:Height='20'>" +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">GL Account Group Descriptions</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">GL Code</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Account Type</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Revised Budget</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Planned</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Utilized Budget (GL)</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Committed Budget (PO)</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Total Utilization</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Variance</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Available Budget</Data></Cell>' +
                        "</Row>";
                    // End Kolom Excel Header

                    // Body Data
                    listBudget.forEach((data, index) => {
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.groupDesc + '</Data></Cell>' +
                        '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.glCode + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.accType + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.revisedBudget + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.planned + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.utilizedBudget + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.committedBudget + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.totalUtilization + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.variance + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.availableBudget + '</Data></Cell>' +
                        "</Row>";
                    });
                    // End Body Data
                    } else {
                    // Kolom Excel Header
                    xmlStr +=
                        "<Table>" +
                        "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='200' />" +
                        "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Row ss:Index='1' ss:Height='20'>" +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Account Type</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Revised Budget</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Planned</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Utilized Budget (GL)</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Committed Budget (PO)</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Total Utilization</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Variance</Data></Cell>' +
                        '<Cell ss:StyleID="BC"><Data ss:Type="String">Available Budget</Data></Cell>' +
                        "</Row>";
                    // End Kolom Excel Header

                    // Body Data
                    listBudget.forEach((data, index) => {
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.accType + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.revisedBudget + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.planned + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.utilizedBudget + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.committedBudget + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.totalUtilization + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.variance + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.availableBudget + '</Data></Cell>' +
                        "</Row>";
                    });
                    // End Body Data
                    }

                    xmlStr += "</Table></Worksheet></Workbook>";

                    var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                    });

                    var selectedGroup = groupFilterSelected == 'ytd' ? 'by GL Group' : 'by Account Type';
                    var objXlsFile = file.create({
                    name: "Budget Report " + selectedGroup + ".xls",
                    fileType: file.Type.EXCEL,
                    contents: strXmlEncoded,
                    });

                    context.response.writeFile({
                    file: objXlsFile,
                    });
                }
            } else {
            var html = `<html>
            <h3>Your account dont have access for department ${departmentText} </h3>
            <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
            <body></body></html>`;

            var form_result = serverWidget.createForm({
                title: "Result of Budget Report",
            });
            form_result.addPageInitMessage({
                type: message.Type.ERROR,
                title: "Permission Required!",
                message: html,
            });
            context.response.writePage(form_result);
            }
        } catch (e) {
            log.debug("error in get report", e.name + ": " + e.message);
        }
        }
    }

    return {
        onRequest: onRequest,
    };
    });