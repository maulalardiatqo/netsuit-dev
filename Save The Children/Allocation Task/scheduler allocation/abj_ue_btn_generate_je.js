/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search'], (search) => {
    const beforeLoad = (context) => {
        if (context.type !== context.UserEventType.VIEW) return;

        const rec = context.newRecord;
        const recordId = rec.id; 
        let cekLine = 0;
        
        if (recordId) {
            const childSearchObj = search.create({
                type: "customrecord_allocation_premise_per_sof_", 
                filters: [
                    ["custrecord_stc_allocation_premise_cam", "anyof", recordId]
                ],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });
            
            cekLine = childSearchObj.runPaged().count;
        }
        
        log.debug('cekLine Result from Search', cekLine);
        if (cekLine > 0) {
            context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_generate_je.js'; 
            context.form.addButton({
                id: 'custpage_btn_generate_journal',
                label: 'Generate SOF Journal',
                functionName: 'triggerMapReduce()' 
            });
        }
    };

    return { beforeLoad };
});