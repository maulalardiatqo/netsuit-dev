/*****************************************************************************
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 ******************************************************************************/
define(['N/ui/serverWidget', 'N/sftp', 'N/runtime','./hrms_sftp_file_process_module.js'], function (ui, sftp, runtime, _SFTP_MOD_) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;
        var scriptObj = runtime.getCurrentScript();
        var connectUsingPwdORKEY = scriptObj.getParameter({
            name: "custscript_hrms_connection_type"
        });

        if (request.method === 'GET') {

            var form = ui.createForm({
                title: 'Enter Password'
            });

            if (connectUsingPwdORKEY == "PASSWORD") {
                var allowScriptIds = scriptObj.getParameter({name:"custscript_hrms_restrict_script_ids"});
                allowScriptIds = allowScriptIds.split(",");
                var restrictToScriptIds = [runtime.getCurrentScript().id];
                if(allowScriptIds.length > 0){
                    restrictToScriptIds = restrictToScriptIds.concat(allowScriptIds);
                }
                log.debug("restrictToScriptIds",restrictToScriptIds);
                //adding the credential field to generate GUID with some restrictions
                var credField = form.addCredentialField({
                    id: 'custfield_password',
                    label: 'Password',
                    restrictToDomains: 'sftp44.sapsf.com',
                    restrictToScriptIds: restrictToScriptIds,
                    restrictToCurrentUser: false //Depends on use case
                });
                // credField.maxLength = 64;
            }


            if (connectUsingPwdORKEY == "KEYID") {
                form.addField({
                    id: 'custpage_hrms_rsa_key',
                    type: ui.FieldType.TEXT,
                    label: 'RSA KEY ID'
                });
            }

            form.addSubmitButton({
                label: connectUsingPwdORKEY == "PASSWORD" ? "Generate GUID && Test Connection" : "Test Connection"
            });
            response.writePage(form);
        } else {
            // Read the request parameter matching the field ID we specified in the form
            var passwordToken = request.parameters.custfield_password;
            var keyid = request.parameters.custpage_hrms_rsa_key;
            var connectionForm = ui.createForm({
                title: 'SFTP Connection Status'
            });
            var field = connectionForm.addField({
                id: 'custpage_ui_inline_statusfield',
                type: ui.FieldType.INLINEHTML,
                label: 'EXAMPLE TEXT'
            })
            try {
                let sftpObj = _SFTP_MOD_.getSFTPTokens();

                if (passwordToken) sftpObj['passwordGuid'] = passwordToken;

                if (keyid) sftpObj['keyId'] = keyid;

                let connection = sftp.createConnection(sftpObj);

                let connectedvia = connectUsingPwdORKEY == "PASSWORD" ? "PASSWORD GUID : " + passwordToken : "RSA KEY : " + keyid;

                log.audit('connection', connection);
                if (connection.MAX_TRANSFER_TIMEOUT == 300) {
                    field.defaultValue = "<span style='font-size: 12pt;color:green'>Connected Successfully</span><br/><span>Connected using " + connectedvia + "</span>"
                    response.writePage(connectionForm);
                }
            } catch (ex) {
                field.defaultValue = "<span style='font-size: 12pt;color:red'>Connected Failed<br/>Error Code: " + ex.name + "<br/></span><span>Error Message: " + ex.message + "</span>";
                response.writePage(connectionForm);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});