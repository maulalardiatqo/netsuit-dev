/**
    * @NApiVersion 2.1
    * @NScriptType UserEventScript
    * @NModuleScope SameAccount
    */
define(['N/ui/serverWidget', 'N/record', 'N/error', 'N/ui/message', 'N/search', 'N/format', 'N/runtime'],
    function (ui, record, error, message, search, format, runtime) {

        function cekBusdev(list_pending_app, user_id) {
            var sama = false;
            if(list_pending_app.length > 0){
                for (var a = 0; a < list_pending_app.length; a++) {
                    var busdev_approval = list_pending_app[a];
                    if (busdev_approval == user_id) {
                        sama = true;
                    }
                }
            }
            if (sama == true) {
                return true;
            } else {
                return false;
            }
        }

        function cekBusdevSudahApprove(list_busdev_approve, user_id){
            log.debug('list_busdev_approve', list_busdev_approve.length);
            var sama = false;
            if(list_busdev_approve.length == 0){
                
            }else{
                for (var a = 0; a < list_busdev_approve.length; a++) {
                    var busdev_approver = list_busdev_approve[a];
                    if (busdev_approver == user_id) {
                        sama = true;
                    }
                }
            }
            if (sama == true) {
                return true;
            } else {
                return false;
            }
        }

        function showButton(context) {
            var form = context.form;
            var rec = context.newRecord;
            var idRec = rec.id;
            form.addButton({
                id: 'custpage_button_approve',
                label: "Approve",
                functionName: "approve("+idRec+")"
            });
            context.form.clientScriptModulePath = "SuiteScripts/iss_cs_approval_lot_busdev.js "
        }

        function beforeLoad(context) {
            try {
                if (context.type === context.UserEventType.VIEW) {
                    var rec = context.newRecord;
                    var recType = rec.type;
                    var rec_id = rec.getValue('id') || null;
                    //log.debug('rec_id', rec_id);
                    //log.debug('recType', recType);

                    var flag_error = rec.getValue('custbody_abj_ada_error_line') || false;
                    //log.debug('flag_error', flag_error);

                    if (flag_error == true) {
                        var list_pending_approval = rec.getValue('custbody_abj_pendingapprovalsales') || [];
                        //log.debug('list_pending_approval', list_pending_approval);
                        var list_busdev_approve = rec.getValue('custbody_abj_sales_approval') || [];

                        if (list_pending_approval.length > 0 && (list_busdev_approve.length == 0 ||
                            list_busdev_approve.length < list_pending_approval.length)) {

                            var currentUser = runtime.getCurrentUser().id;
                            var user_id = parseInt(currentUser);
                            log.debug('user event', 'user_id : '+user_id);

                            var user_samadengan_busdev_pending = cekBusdev(list_pending_approval, user_id);
                            var user_sudah_approve = cekBusdevSudahApprove(list_busdev_approve, user_id);
                            log.debug('user_samadengan_busdev_pending : '+user_samadengan_busdev_pending, 'user_sudah_approve : '+user_sudah_approve);

                            if (user_samadengan_busdev_pending == true && user_sudah_approve == false) {
                                showButton(context);
                            }
                        }
                    }

                }
            } catch (error) {
                log.error({
                    title: 'custpage_approval_lot_busdev',
                    details: error.message
                });
            }
        }

        return {
            beforeLoad: beforeLoad
        }
    });
