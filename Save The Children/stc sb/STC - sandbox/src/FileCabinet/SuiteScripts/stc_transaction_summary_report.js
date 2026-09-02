/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], (serverWidget, search) => {
    const SEARCH_CONFIG = {
        title: 'Transaction Summary Report',
        sublistId: 'custpage_report_sublist',
        pageSize: 1000,
        postingPeriodInternalId: '60'
    };

    /**
     * Renders the transaction summary report.
     *
     * @param {Object} context - Suitelet context.
     * @param {Object} context.request - Incoming request.
     * @param {Object} context.response - Outgoing response.
     */
    const onRequest = context => {
        const form = serverWidget.createForm({
            title: SEARCH_CONFIG.title
        });

        form.addSubmitButton({
            label: 'Refresh'
        });

        const summaryField = form.addField({
            id: 'custpage_report_summary',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Summary'
        });

        const reportSublist = form.addSublist({
            id: SEARCH_CONFIG.sublistId,
            type: serverWidget.SublistType.LIST,
            label: 'Report Results'
        });

        addSublistFields(reportSublist);

        const results = getReportResults();
        populateSublist(reportSublist, results);

        summaryField.defaultValue = buildSummaryHtml(results.length);

        context.response.writePage(form);
    };

    /**
     * Creates the grouped transaction search used by the report.
     *
     * @returns {search.Search} Configured transaction search.
     */
    const createTransactionSearch = () =>
        search.create({
            type: 'transaction',
            filters: [
                ['posting', 'is', 'T'],
                'AND',
                ['amount', 'greaterthan', '0.00'],
                'AND',
                ['postingperiod', 'abs', SEARCH_CONFIG.postingPeriodInternalId]
            ],
            columns: [
                search.createColumn({
                    name: 'account',
                    summary: search.Summary.GROUP,
                    label: 'Account'
                }),
                search.createColumn({
                    name: 'department',
                    summary: search.Summary.GROUP,
                    label: 'Cost Center'
                }),
                search.createColumn({
                    name: 'class',
                    summary: search.Summary.GROUP,
                    label: 'Project Code'
                }),
                search.createColumn({
                    name: 'amount',
                    summary: search.Summary.SUM,
                    label: 'Amount'
                }),
                search.createColumn({
                    name: 'postingperiod',
                    summary: search.Summary.GROUP,
                    label: 'Period'
                }),
                search.createColumn({
                    name: 'custrecord_stc_account_cam_mapping',
                    join: 'account',
                    summary: search.Summary.GROUP,
                    label: 'CAM Account Mapping'
                })
            ]
        });

    /**
     * Reads all result pages to avoid the 4,000 row .each() limit.
     *
     * @returns {Array<Object>} Normalized report rows.
     */
    const getReportResults = () => {
        const transactionSearch = createTransactionSearch();
        const pagedData = transactionSearch.runPaged({
            pageSize: SEARCH_CONFIG.pageSize
        });
        const results = [];

        pagedData.pageRanges.forEach(pageRange => {
            const page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(result => {
                results.push({
                    account: getResultTextOrValue(result, 'account', search.Summary.GROUP),
                    department: getResultTextOrValue(result, 'department', search.Summary.GROUP),
                    className: getResultTextOrValue(result, 'class', search.Summary.GROUP),
                    amount: result.getValue({
                        name: 'amount',
                        summary: search.Summary.SUM
                    }),
                    postingPeriod: getResultTextOrValue(result, 'postingperiod', search.Summary.GROUP),
                    camAccountMapping: getResultTextOrValue(
                        result,
                        'custrecord_stc_account_cam_mapping',
                        search.Summary.GROUP,
                        'account'
                    )
                });
            });
        });

        return results;
    };

    /**
     * Adds report fields to the Suitelet sublist.
     *
     * @param {serverWidget.Sublist} sublist - Report sublist.
     */
    const addSublistFields = sublist => {
        sublist.addField({
            id: 'custpage_col_account',
            type: serverWidget.FieldType.TEXT,
            label: 'Account'
        });

        sublist.addField({
            id: 'custpage_col_department',
            type: serverWidget.FieldType.TEXT,
            label: 'Cost Center'
        });

        sublist.addField({
            id: 'custpage_col_class',
            type: serverWidget.FieldType.TEXT,
            label: 'Project Code'
        });

        sublist.addField({
            id: 'custpage_col_amount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        });

        sublist.addField({
            id: 'custpage_col_period',
            type: serverWidget.FieldType.TEXT,
            label: 'Period'
        });

        sublist.addField({
            id: 'custpage_col_cam_mapping',
            type: serverWidget.FieldType.TEXT,
            label: 'CAM Account Mapping'
        });
    };

    /**
     * Populates the report sublist.
     *
     * @param {serverWidget.Sublist} sublist - Report sublist.
     * @param {Array<Object>} results - Search results.
     */
    const populateSublist = (sublist, results) => {
        results.forEach((row, line) => {
            setSublistText(sublist, 'custpage_col_account', line, row.account);
            setSublistText(sublist, 'custpage_col_department', line, row.department);
            setSublistText(sublist, 'custpage_col_class', line, row.className);
            setSublistText(sublist, 'custpage_col_amount', line, formatCurrencyValue(row.amount));
            setSublistText(sublist, 'custpage_col_period', line, row.postingPeriod);
            setSublistText(sublist, 'custpage_col_cam_mapping', line, row.camAccountMapping);
        });
    };

    /**
     * Sets sublist value with display-safe fallback.
     *
     * @param {serverWidget.Sublist} sublist - Target sublist.
     * @param {string} fieldId - Field ID.
     * @param {number} line - Line number.
     * @param {string} value - Value to write.
     */
    const setSublistText = (sublist, fieldId, line, value) => {
        sublist.setSublistValue({
            id: fieldId,
            line,
            value: normalizeDisplayValue(value)
        });
    };

    /**
     * Returns search text when available, otherwise raw value.
     *
     * @param {search.Result} result - Search result row.
     * @param {string} name - Column name.
     * @param {string} summary - Summary type.
     * @param {string} [join] - Optional join ID.
     * @returns {string} Displayable value.
     */
    const getResultTextOrValue = (result, name, summary, join) => {
        const textValue = result.getText({
            name,
            join,
            summary
        });

        if (textValue) {
            return textValue;
        }

        const rawValue = result.getValue({
            name,
            join,
            summary
        });

        return normalizeDisplayValue(rawValue);
    };

    /**
     * Formats numeric amount for currency display.
     *
     * @param {string|number|null} value - Raw amount.
     * @returns {string} Formatted amount.
     */
    const formatCurrencyValue = value => {
        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            return '0.00';
        }

        return numericValue.toFixed(2);
    };

    /**
     * Normalizes blank values for Suitelet display.
     *
     * @param {string|number|boolean|null|undefined} value - Raw value.
     * @returns {string} Display-safe value.
     */
    const normalizeDisplayValue = value => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        return String(value);
    };

    /**
     * Builds summary HTML shown above the report.
     *
     * @param {number} rowCount - Result count.
     * @returns {string} Inline HTML.
     */
    const buildSummaryHtml = rowCount => `
        <div style="font-family: Arial, sans-serif; padding: 12px 0 18px; line-height: 1.6;">
            <div style="padding: 16px; background: #f8fafc; border: 1px solid #dbeafe; border-radius: 8px;">
                <h3 style="margin: 0 0 8px; color: #1f2937;">Transaction Summary Report</h3>
                <p style="margin: 0; color: #4b5563;">
                    Report ini menampilkan data grouped berdasarkan Account, Cost Center, Project Code, Period,
                    dan CAM Account Mapping untuk transaksi posting dengan amount > 0 pada posting period internal ID 60.
                </p>
                <p style="margin: 8px 0 0; color: #111827;">
                    <strong>Total baris:</strong> ${rowCount}
                </p>
            </div>
        </div>
    `;

    return {
        onRequest
    };
});