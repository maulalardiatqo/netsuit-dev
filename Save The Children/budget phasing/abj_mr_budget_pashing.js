/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/file', 'N/log', 'N/runtime', 'N/search', 'N/record'], function(file, log, runtime, search, record) {
    function getChildText(text) {
        const lastIndex = text.lastIndexOf(':');
        if (lastIndex !== -1) {
            return text.slice(lastIndex + 1).trim();
        }
        return text.trim();
    }
    function getInputData() {
        log.debug('Start getInputData');
        try {
            const currentScript = runtime.getCurrentScript();
            const recId = currentScript.getParameter({ name: 'custscript_budget_pash_rec_id' });

            if (!recId) {
                log.error('MISSING_PARAMETER', 'Parameter wajib (recId) tidak ditemukan.');
                return [];
            }
            
            var loadRec = record.load({
                type: 'customrecord_stc_draft_project_budget_he',
                id: recId
            });
            const SOFset = loadRec.getText('cseg_stc_sof')
            const grandModul = loadRec.getValue('custrecord_stc_grant_module_prj_budg');
            const startPeriod = loadRec.getValue('custrecord_stc_start_date_prj_budg');     
            const endPeriod = loadRec.getValue('custrecord_stc_end_date_prj_budg');     

            if (!grandModul) {
                log.error('MISSING_GRANT_MODULE', 'Grant Module (Project) tidak ditemukan pada record.');
                return [];
            }
            
            // PERBAIKAN: Ubah menjadi Map / Object agar mudah dicari berdasarkan Project Task ID
            var cashflowMap = {}; 

            const customrecord_stc_prj_budg_lineSearchObj = search.create({
                type: "customrecord_stc_prj_budg_line",
                filters: [
                    ["custrecord_stc_prj_budg_link", "anyof", recId]
                ],
                columns: [
                    search.createColumn({ name: "cseg_stc_cashflow", label: "Cash Flows" }),
                    search.createColumn({ name: "custrecord_stc_prj_budg_line_task", label: "Project Task" })
                ]
            });

            const searchResultCount = customrecord_stc_prj_budg_lineSearchObj.runPaged().count;
            log.debug("customrecord_stc_prj_budg_lineSearchObj result count", searchResultCount);

            customrecord_stc_prj_budg_lineSearchObj.run().each(function(result) {
                var cFlow = result.getValue({ name: "cseg_stc_cashflow" });
                var pTask = result.getValue({ name: "custrecord_stc_prj_budg_line_task" });
                
                // Masukkan ke dalam map dengan key = Project Task ID
                if (pTask) {
                    cashflowMap[pTask.toString()] = cFlow;
                }
                return true;
            });

            var allProjectTask = [];
            var projectTaskDataMap = {};

            const projecttaskSearchObj = search.create({
                type: "projecttask",
                filters: [
                    ["project", "anyof", grandModul],
                    "AND",
                    ["custevent5","is","T"],
                    "AND", 
                    ["cseg_stc_segmentdea","noneof","@NONE@"]
                ],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "title", label: "Name"}),
                    search.createColumn({name: "cseg_paactivitycode", label: "Activity Code"}),
                    search.createColumn({name: "cseg_stc_drc_segmen", label: "DRC Segment"}),
                    search.createColumn({name: "cseg_stc_segmentdea", label: "DEA Segment"}),
                    search.createColumn({name: "company", label: "Award Management"}) 
                ]
            });

            projecttaskSearchObj.run().each(function(result) {
                var id = result.getValue({ name: "internalid" });
                
                projectTaskDataMap[id] = {
                    title: result.getValue({ name: "title" }) || '',
                    activityCode: result.getText({ name: "cseg_paactivitycode" }) || result.getValue({ name: "cseg_paactivitycode" }) || '',
                    drcSegment: result.getText({ name: "cseg_stc_drc_segmen" }) || result.getValue({ name: "cseg_stc_drc_segmen" }) || '',
                    deaSegment: result.getText({ name: "cseg_stc_segmentdea" }) || result.getValue({ name: "cseg_stc_segmentdea" }) || '',
                    awardManagement: result.getText({ name: "company" }) || result.getValue({ name: "company"}) || '',
                    projectCode: result.getText({ name: "company" }) || ''
                };
                
                allProjectTask.push(id);
                return true;
            });

            log.debug('projectTaskDataMap Terperbaiki', projectTaskDataMap);

            if (allProjectTask.length === 0) {
                log.audit('No Project Tasks Found', 'Tidak ada data project task untuk diproses.');
                return [];
            }

            var filterStartDate = '';
            var filterEndDate = '';
            var periodNamesOrdered = [];

            if (startPeriod || endPeriod) {
                var periodFilters = [];
                if (startPeriod && endPeriod) {
                    periodFilters.push(["internalid", "anyof", [startPeriod, endPeriod]]);
                } else if (startPeriod) {
                    periodFilters.push(["internalid", "anyof", startPeriod]);
                } else {
                    periodFilters.push(["internalid", "anyof", endPeriod]);
                }

                const accountingperiodSearchObj = search.create({
                    type: "accountingperiod",
                    filters: periodFilters,
                    columns: [
                        search.createColumn({name: "internalid"}),
                        search.createColumn({name: "startdate"}),
                        search.createColumn({name: "enddate"})
                    ]
                });

                accountingperiodSearchObj.run().each(function(result) {
                    var pId = result.getValue({name: "internalid"});
                    if (pId == startPeriod) {
                        filterStartDate = result.getValue({name: "startdate"});
                    }
                    if (pId == endPeriod) {
                        filterEndDate = result.getValue({name: "enddate"});
                    }
                    return true;
                });
                
                if (startPeriod && startPeriod === endPeriod) {
                    filterEndDate = filterStartDate;
                }
                
                log.debug("Period Dates Resolved", "Start Date: " + filterStartDate + " | End Date: " + filterEndDate);

                if (filterStartDate && filterEndDate) {
                    search.create({
                        type: "accountingperiod",
                        filters: [
                            ["isquarter", "is", "F"], "AND",
                            ["isyear", "is", "F"], "AND",
                            ["startdate", "onorafter", filterStartDate], "AND",
                            ["enddate", "onorbefore", filterEndDate]
                        ],
                        columns: [
                            search.createColumn({name: "startdate", sort: search.Sort.ASC}),
                            search.createColumn({name: "periodname"})
                        ]
                    }).run().each(function(res) {
                        periodNamesOrdered.push(res.getValue("periodname"));
                        return true;
                    });
                }
            }

            var expenseMap = {};
            var transactionFilters = [
                ["posting", "is", "T"],
                "AND",
                ["projecttask", "anyof", allProjectTask]
            ];
            
            if (filterStartDate && filterEndDate) {
                transactionFilters.push("AND", ["trandate", "within", filterStartDate, filterEndDate]);
            } else if (filterStartDate) {
                transactionFilters.push("AND", ["trandate", "onorafter", filterStartDate]);
            } else if (filterEndDate) {
                transactionFilters.push("AND", ["trandate", "onorbefore", filterEndDate]);
            }

            const transactionSearchObj = search.create({
                type: "transaction",
                filters: transactionFilters,
                columns: [
                    search.createColumn({ name: "projecttask", summary: "GROUP", label: "Project Task" }),
                    search.createColumn({ name: "line.cseg_stc_sof", summary: "GROUP", label: "Award Management" }),
                    search.createColumn({ name: "line.cseg_stc_segmentdea", summary: "GROUP", label: "DEA Segment" }),
                    search.createColumn({ name: "line.cseg_stc_drc_segmen", summary: "GROUP", label: "DRC Segment" }),
                    search.createColumn({ name: "postingperiod", summary: "GROUP", label: "Period" }),
                    search.createColumn({
                        name: "custcol_stc_amount_donor_curr",
                        summary: "SUM",
                        label: "STC - Amount Donor Currency"
                    }),
                ]
            });

            const transCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count dengan filter tanggal", transCount);

            transactionSearchObj.run().each(function(result) {
                var cols = result.columns;
                var pTask = result.getValue(cols[0]);
                var amountVal = Number(result.getValue(cols[5])) || 0;
                
                if (pTask) {
                    var keyStr = pTask.toString();
                    if (!expenseMap[keyStr]) {
                        expenseMap[keyStr] = 0;
                    }
                    expenseMap[keyStr] += amountVal;
                }
                return true;
            });

            var budgetMap = {};
            var budgetFilters = [
                ["projecttask", "anyof", allProjectTask],
            ];

            const projectbudgetSearchObj = search.create({
                type: "projectbudget",
                filters: budgetFilters,
                columns: [
                    search.createColumn({name: "id", label: "ID"}),
                    search.createColumn({name: "project", label: "Grant Module"}),
                    search.createColumn({name: "description", label: "Description"}),
                    search.createColumn({name: "name", label: "Lines - Name"}),
                    search.createColumn({name: "projecttask", label: "Lines - Project Task"}),
                    search.createColumn({name: "totalcost", label: "Total Cost"}),
                    search.createColumn({name: "totalrevenue", label: "Total Revenue"}),
                    search.createColumn({name: "baseline", label: " Baseline"}),
                    search.createColumn({name: "estimateatcompletion", label: "EAC"})
                ]
            });

            const budgetCount = projectbudgetSearchObj.runPaged().count;
            log.debug("projectbudgetSearchObj result count", budgetCount);

            projectbudgetSearchObj.run().each(function(result) {
                var pTask = result.getValue({name: "projecttask"});
                var totalCostVal = Number(result.getValue({name: "totalcost"})) || 0;
                if (pTask) {
                    budgetMap[pTask.toString()] = totalCostVal;
                }
                return true;
            });

            var coaResults = [];
            const accountSearchObj = search.create({
                type: "account",
                filters:
                [
                    ["type","noneof","Bank","AcctRec","OthCurrAsset","FixedAsset","OthAsset","AcctPay","CredCard","OthCurrLiab","LongTermLiab","Equity","NonPosting","Stat","UnbilledRec"], 
                    "AND", 
                    ["number","isnotempty",""]
                ],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "number", label: "Number"}),
                    search.createColumn({name: "name", label: "Name"}),
                    search.createColumn({name: "displayname", label: "Display Name"}),
                    search.createColumn({name: "type", label: "Account Type"}),
                    search.createColumn({name: "description", label: "Description"})
                ]
            });

            accountSearchObj.run().each(function(result) {
                coaResults.push({
                    "Internal ID": result.getValue({name: "internalid"}) || '',
                    "Number": result.getValue({name: "number"}) || '',
                    "Name": result.getValue({name: "name"}) || '',
                    "Display Name": result.getValue({name: "displayname"}) || '',
                    "Account Type": result.getText({name: "type"}) || result.getValue({name: "type"}) || '',
                    "Description": result.getValue({name: "description"}) || ''
                });
                return true;
            });
            
            var searchResults = [];
            
            var periodHeaderRow = {
                "dataType": "PERIOD_HEADER_ROW",
                "External ID": ""
            };
            for (var p = 1; p <= 60; p++) {
                periodHeaderRow["Period " + p] = "";
            }

            var startColIndex = 1; 
            if (periodNamesOrdered.length > 0) {
                var firstPeriodName = periodNamesOrdered[0].toLowerCase();
                
                if (firstPeriodName.indexOf('jan') !== -1) startColIndex = 1;
                else if (firstPeriodName.indexOf('feb') !== -1) startColIndex = 2;
                else if (firstPeriodName.indexOf('mar') !== -1) startColIndex = 3;
                else if (firstPeriodName.indexOf('apr') !== -1) startColIndex = 4;
                else if (firstPeriodName.indexOf('may') !== -1 || firstPeriodName.indexOf('mei') !== -1) startColIndex = 5;
                else if (firstPeriodName.indexOf('jun') !== -1) startColIndex = 6;
                else if (firstPeriodName.indexOf('jul') !== -1) startColIndex = 7;
                else if (firstPeriodName.indexOf('aug') !== -1) startColIndex = 8;
                else if (firstPeriodName.indexOf('sep') !== -1) startColIndex = 9;
                else if (firstPeriodName.indexOf('oct') !== -1) startColIndex = 10;
                else if (firstPeriodName.indexOf('nov') !== -1) startColIndex = 11;
                else if (firstPeriodName.indexOf('dec') !== -1) startColIndex = 12;
            }

            for (var i = 0; i < periodNamesOrdered.length; i++) {
                var currentPeriodCol = startColIndex + i;
                if (currentPeriodCol <= 60) {
                    periodHeaderRow["Period " + currentPeriodCol] = periodNamesOrdered[i];
                }
            }
            searchResults.push(periodHeaderRow);
            
            log.debug('allProjectTask', allProjectTask);

            allProjectTask.forEach(function(taskId, index) {
                var keyStr = taskId.toString();
                var taskDetails = projectTaskDataMap[keyStr] || {};
                
                var counter = (index + 1).toString().padStart(5, '0');
                var extId = recId + '-' + counter; 

                var actualAmount = expenseMap[keyStr] || 0;
                var baselineBudget = budgetMap[keyStr] || 0;
                var remainingBudget = baselineBudget - actualAmount;

                // PERBAIKAN: Ambil Cash Flow dari map yang telah dibuat
                var mappedCashFlow = cashflowMap[keyStr] || "";

                var rowData = {
                    "dataType": "BUDGET_REPORT",
                    "External ID": extId,
                    "Internal ID": Number(taskId),
                    "Bugdet Phasing Link Header Internal ID": recId,
                    "Project Task": taskDetails.deaSegment || '',
                    "DEA Segment": taskDetails.deaSegment || '',
                    "DRC Segment": taskDetails.drcSegment || '',
                    "Activity Code": taskDetails.activityCode || '',
                    "Award Management": SOFset || '',
                    "Project Code": '',
                    "Baseline Budget": baselineBudget,
                    "Actual Usage Budget YTD": actualAmount,
                    "Remaining Budget": remainingBudget,
                    "Cost Center": "", 
                    "Account Budget": "", 
                    "Category": "", 
                    "Cost Category": "", 
                    "Requested Amount": 0, 
                    "SOF % - Non Project": "", 
                    "SOF % - Project": "", 
                    "Total Funded By CAM/ICR/IG": 0, 
                    "Quantity": 0, 
                    "Unit Cost": 0, 
                    "Unit Value": 0, 
                    "Component": "", 
                    "Remarks": "", 
                    "Cash Flow": mappedCashFlow // Syntax di sini sudah diperbaiki
                };

                for (var p = 1; p <= 60; p++) {
                    rowData["Period " + p] = 0;
                }
                searchResults.push(rowData);
            });

            coaResults.forEach(function(coaRow) {
                coaRow["dataType"] = "COA_REPORT";
                searchResults.push(coaRow);
            });

            return searchResults;

        } catch (error) {
            log.error('Error in getInputData Master Flow', error);
            return [];
        }
    }

    function map(context) {
        var rowValue = JSON.parse(context.value);
        context.write({
            key: rowValue.dataType, 
            value: rowValue
        });
    }

    function reduce(context) {
        var rows = context.values;
        for (var i = 0; i < rows.length; i++) {
            context.write({
                key: context.key,
                value: rows[i]
            });
        }
    }

    function summarize(summary) {
        log.audit('Summarize Stage Started');
        try {
            var budgetRows = [];
            var coaRows = [];
            var periodHeaderRowObj = null;

            summary.output.iterator().each(function (key, value) {
                var parsedData = JSON.parse(value);
                if (key === "BUDGET_REPORT") {
                    budgetRows.push(parsedData);
                } else if (key === "COA_REPORT") {
                    coaRows.push(parsedData);
                } else if (key === "PERIOD_HEADER_ROW") {
                    periodHeaderRowObj = parsedData;
                }
                return true;
            });
            log.debug('periodHeaderRowObj', periodHeaderRowObj)
            budgetRows.sort(function(a, b) {
                return a["Internal ID"] - b["Internal ID"];
            });

            coaRows.sort(function(a, b) {
                return a["Number"].localeCompare(b["Number"]);
            });

            var budgetHeaders = [
                "External ID", "Bugdet Phasing Link Header Internal ID", "Project Task", "DEA Segment", 
                "DRC Segment", "Cost Center", "Activity Code", "Award Management", "Account Budget", 
                "Project Code", "Baseline Budget", "Actual Usage Budget YTD", "Remaining Budget", "Category", "Cost Category", 
                "Requested Amount", "SOF % - Non Project", "SOF % - Project", "Total Funded By CAM/ICR/IG", 
                "Quantity", "Unit Cost", "Unit Value", "Component", "Remarks", "Total Budget will Allocated", "Cash Flow"
            ];
            
            var periodHeaders = [];
            for (var p = 1; p <= 60; p++) { periodHeaders.push("Period " + p); }
            budgetHeaders = budgetHeaders.concat(periodHeaders);

            var coaHeaders = ["Internal ID","Number", "Name", "Display Name", "Account Type", "Description"];

            var xml = [];
            xml.push('<?xml version="1.0"?>');
            xml.push('<?mso-application progid="Excel.Sheet"?>');
            xml.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ');
            xml.push('xmlns:o="urn:schemas-microsoft-com:office:excel" '); 
            xml.push('xmlns:x="urn:schemas-microsoft-com:office:excel" '); 
            xml.push('xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" '); 
            xml.push('xmlns:html="http://www.w3.org/TR/REC-html40">');
            
            xml.push('<Styles>');
            xml.push('  <Style ss:ID="HeaderStyle">');
            xml.push('    <Font ss:Bold="1" ss:Color="#000000"/>');
            xml.push('    <Interior ss:Color="#EFEFEF" ss:Pattern="Solid"/>'); 
            xml.push('    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>');
            xml.push('  </Style>');
            xml.push('</Styles>');

            xml.push('<Worksheet ss:Name="Budget Report"><Table> ');
            xml.push('<Row ss:Height="22">');
            for (var h = 0; h < budgetHeaders.length; h++) {
                xml.push('<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">' + escapeXml(budgetHeaders[h]) + '</Data></Cell>');
            }
            xml.push('</Row>');
            log.debug('periodHeaderRowObj', periodHeaderRowObj)
            if (periodHeaderRowObj) {
                xml.push('<Row>');
                for (var m = 0; m < budgetHeaders.length; m++) {
                    var pVal = periodHeaderRowObj[budgetHeaders[m]];
                    log.debug('pVal', pVal)
                    if (pVal === null || pVal === undefined) { pVal = ''; }
                    xml.push('<Cell><Data ss:Type="String">' + escapeXml(pVal.toString()) + '</Data></Cell>');
                }
                xml.push('</Row>');
            }

            budgetRows.forEach(function(rowData) {
                xml.push('<Row>');
                for (var j = 0; j < budgetHeaders.length; j++) {
                    var val = rowData[budgetHeaders[j]];
                    if (val === null || val === undefined) { val = ''; }
                    var type = (typeof val === 'number') ? 'Number' : 'String';
                    xml.push('<Cell><Data ss:Type="' + type + '">' + escapeXml(val.toString()) + '</Data></Cell>');
                }
                xml.push('</Row>');
            });
            xml.push('</Table></Worksheet>');

            xml.push('<Worksheet ss:Name="Chart of Accounts"><Table>');
            xml.push('<Row ss:Height="22">');
            for (var c = 0; c < coaHeaders.length; c++) {
                xml.push('<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">' + escapeXml(coaHeaders[c]) + '</Data></Cell>');
            }
            xml.push('</Row>');

            coaRows.forEach(function(rowData) {
                xml.push('<Row>');
                for (var k = 0; k < coaHeaders.length; k++) {
                    var val = rowData[coaHeaders[k]];
                    if (val === null || val === undefined) { val = ''; }
                    xml.push('<Cell><Data ss:Type="String">' + escapeXml(val.toString()) + '</Data></Cell>');
                }
                xml.push('</Row>');
            });
            xml.push('</Table></Worksheet>');

            xml.push('</Workbook>');
            var finalContent = xml.join('\n');

            var currentScript = runtime.getCurrentScript();
            var recordId = currentScript.getParameter({ name: 'custscript_budget_pash_rec_id' }) || '1'; 
            
            var uniqueId = Date.now(); 
            var fileName = 'Budget_Report_' + recordId + '_' + uniqueId + '.xls';
            
            log.debug('Membuat Multi-Sheet Excel via PLAINTEXT', fileName);

            var excelFile = file.create({
                name: fileName,
                fileType: file.Type.PLAINTEXT, 
                contents: finalContent,
                folder: 862 
            });

            var fileId = excelFile.save();
            log.audit('Excel Generated Successfully', 'File ID: ' + fileId + ' dengan nama: ' + fileName);

        } catch (e) {
            log.error('ERROR PADA TAHAP SUMMARIZE MULTI SHEET', e);
        }
    }

    function escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});