/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/ui/serverWidget', 'N/record'], (runtime, serverWidget, record) => {
    
    const beforeLoad = (context) => {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY){
                const form = context.form;
                // form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_buttonplus.js';
                // log.debug('loaded')
                var styleField = form.addField({
                    id: 'custpage_hide_button_css',
                    type: 'inlinehtml',
                    label: 'Hide Button'
                });
                styleField.defaultValue = '<style>#custrecord_tar_link_to_tor_popup_new { display: none !important; }</style>';
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        beforeLoad : beforeLoad
    }
});