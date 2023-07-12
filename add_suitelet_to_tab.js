          /**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/ui/serverWidget', 'N/url'], function(record, runtime, serverWidget, url) {
    function beforeLoad(scriptContext) {
        var currentUserID = runtime.getCurrentUser().id;
        /* If the record is edited or viewed, a tab called Sample Tab is added.
         * Note that the script execution context is set to userinterface.
         * This ensures that this script is ONLY invoked from a user event
         * occurring through the UI.
         */
        if ((runtime.executionContext === runtime.ContextType.USER_INTERFACE) && (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.VIEW)) {
            //Creates the new tab Sample Tab on the form
            var SampleTab = scriptContext.form.addTab({
                id: 'custpage_sample_tab',
                label: 'Sample Tab'
            });

            //On Sample Tab, create a field of type inlinehtml
            var createNewReqLink = scriptContext.form.addField({
                id: 'custpage_new_req_link',
                type: 'inlinehtml',
                label: ' ',
                container: 'custpage_sample_tab'
            });

            //Define the parameters of the Suitelet that will be executed
            //Replace the scriptId and the deploymentId with the values of your Suitelet
            var linkURL = url.resolveScript({
                scriptId: 'customscriptsuiteletsample_yourfirstsamp',
                deploymentId: 'customdeploysuiteletsample_yourfirstsamp'
            }) + '&recordid=' + scriptContext.newRecord.id;
            
            //Create a link to launch the Suitelet.
            createNewReqLink.defaultValue = '<B>Click <A HREF=\"' + linkURL
                +'\">here</A> to create a new document signature request record.</B>';

            //Add a sublist to Sample Tab
            var signatureRequestSublist = scriptContext.form.addSublist({
                id: 'custpage_sig_req_sublist',
                type: 'list',
                label: 'Document Signature Requests',
                tab: 'custpage_sample_tab'
            });
            signatureRequestSublist.addField({
                id: 'custpage_req_name',
                type: 'text',
                label: 'Name'
            });
            signatureRequestSublist.addField({
                id: 'custpage_req_status',
                type: 'text',
                label: 'Status'
            });
            signatureRequestSublist.addField({
                id: 'custpage_req_created',
                type: 'date',
                label: 'Date Created'
            });
        }
    }

    return {
        beforeLoad: beforeLoad,
    };
}); 

        