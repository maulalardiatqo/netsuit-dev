/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
){
    function afterSubmit(context) {
    try {
    if (context.type == context.UserEventType.CREATE || 
        context.type == context.UserEventType.EDIT) {
        var rec = context.newRecord;
        var recid = rec.id;
        log.debug('recid', recid);
        var locationid = rec.getValue("custrecord_abj_cust_ref_loc");
        var customer = rec.getValue("custrecord_abj_cust_ref_customer");
        var ar_account = rec.getValue("custrecord_abj_cust_ref_acc");
        var bank_account = rec.getValue("custrecord_abj_cust_ref_bank_acc");
        var credit_app = rec.getValue("custrecord_abj_cust_ref_cre_app");
        var depo_app = rec.getValue("custrecord_abj_cust_ref_deposit_app");
        var subsidiary = rec.getValue("custrecord_abj_cust_ref_sub");
        log.debug('subsidiary', subsidiary);
        if(locationid){
            var FindLocation = search.create({
                type: 'location',
                columns: ['internalid'],
                filters: [{name: 'externalid', operator: 'is',values: locationid},]}).run().getRange(0, 1);	
                log.debug('findLocation', FindLocation);

                var location_internalid= 0;	

                if(FindLocation.length>0){
                    location_internalid = FindLocation[0].getValue({name: 'internalid'});
                }
        }
        		
        if(customer){
            var Findcustomer = search.create({
                type: 'customer',
                columns: ['internalid'],
                filters: [{name: 'entityId', operator: 'is',values: customer},]}).run().getRange(0, 1);
                log.debug('findcustomer', Findcustomer);

                var customerId = 0;	
                if(Findcustomer.length>0){
                    customerId = Findcustomer[0].getValue({name: 'internalid'});
                }
        }
        
        if(ar_account){
            var Find_araccount = search.create({
                type: 'account',
                columns: ['internalid'],
                filters: [{name: 'number', operator: 'is', values: ar_account},]}).run().getRange(0, 1);
                log.debug('find_aracount', Find_araccount);

                var ar_accountId = 0;
                if(Find_araccount.length>0){
                    ar_accountId = Find_araccount[0].getValue({name: 'internalid'});
                }
        }
        if(bank_account){
            var find_bank_acc = search.create({
                type: 'account',
                columns: ['internalid'],
                filters: [{name: 'number', operator: 'is', values: bank_account},]}).run().getRange(0, 1);
                log.debug('find_bank_acc', find_bank_acc);

                var bank_accountId = 0;

                if(find_bank_acc.length>0){
                    bank_accountId = find_bank_acc[0].getValue({name: 'internalid'});
                }
        }
        
        if(subsidiary){
            var find_subsidiary = search.create({
                type: 'subsidiary',
                columns: ['internalid'],
                filters: [{name:'externalid', operator:'is', values: subsidiary},]}).run().getRange(0, 1);

                var susbsiaryId = 0;
                if(find_subsidiary.length>0){
                    susbsiaryId = find_subsidiary[0].getValue({name: 'internalid'});
                }
        }
        log.debug('find_subsidiary',find_subsidiary)
        if(credit_app || credit_app !=''){
            log.debug('masuk if credit_app')
            var Findcreditapp = search.create({
                type: 'transaction',
                columns: ['internalid'],
                filters: [{name: 'tranid', operator: 'is',values: credit_app},]}).run().getRange(0, 1);
                var credit_appid=0;
            if(Findcreditapp.length>0){
                credit_appid = Findcreditapp[0].getValue({name: 'internalid'});
            }
            
        }
        if(depo_app){
            var Finddepoapp = search.create({
                type: 'transaction',
                columns: ['internalid'],
                filters: [{name: 'tranid', operator: 'is',values: depo_app},]}).run().getRange(0, 1);
                var depo_appid = 0;
            if(Finddepoapp.length>0){
                depo_appid = Finddepoapp[0].getValue({name: 'internalid'});
            }	
        }
		log.debug('subsidiaryid', susbsiaryId);
    
        recCustomerRefund = record.load({
                            type : 'customrecord_abj_cut_ref_upload',
                            id : recid,         
                            isDynamic : true
                        });
        if(customerId){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_cr_id_customer_script',
                value: customerId,
                });
                recCustomerRefund.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                    }); 
        }
        if(ar_accountId){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_aracct_id_scripted',
                value: ar_accountId,
            });
            recCustomerRefund.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
                }); 
        }
        if(bank_accountId){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_bankacct_id_scripted',
                value: bank_accountId,
            });
            recCustomerRefund.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
                }); 
        }
        if(location_internalid){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_loc_list_scripted',
                value: location_internalid,
            });
            recCustomerRefund.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
                }); 
        }
        if(susbsiaryId){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_sub_id_scripted',
                value: susbsiaryId,
            });

            recCustomerRefund.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
                }); 
        }
        if(credit_appid){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_cre_apply_doc_no_list_scrpt',
                value: credit_appid,
            });
            recCustomerRefund.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
                }); 
        }

        if(depo_appid){
            recCustomerRefund.setValue({
                fieldId: 'custrecord_dep_apply_doct_no_scripted',
                value: depo_appid,
            });

            recCustomerRefund.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
                }); 
        }
        
        recCustomerRefund.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
        });  
    }
    } catch (e) {
        err_messages = 'error in after submit ' + e.name + ': ' + e.message;
        log.debug(err_messages);
    }
    }
    return {
    afterSubmit: afterSubmit,
    };
});