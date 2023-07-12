/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
  record,
  search,
) {
  function afterSubmit(context) {
    try {
	if (context.type == context.UserEventType.CREATE || 
	    context.type == context.UserEventType.EDIT) {
		var rec = context.newRecord;
		var recid = rec.id;
		var locationid = rec.getValue("custrecord_abj_if_location");
		var departement = rec.getValue("custrecord_abj_if_department");
		var classexid = rec.getValue("custrecord_abj_if_class");
		var soNumb = rec.getValue('custrecord_abj_if_so');
        log.debug("locationid", locationid);
		log.debug("departement", departement);
		log.debug('classexid', classexid);
		log.debug('soNumb', soNumb);
		if(locationid){
			var FindLocation = search.create({
				type: 'location',
				columns: ['internalid'],
				filters: [{name: 'externalid', operator: 'is',values: locationid},]}).run().getRange(0, 1);
			log.debug('FindLocation', FindLocation);
		var location_internalid=0;	
		if (FindLocation.length>0) {
			location_internalid = FindLocation[0].getValue({name: 'internalid'});
		}				
		log.debug('location_internalid',location_internalid);
		}
		if(departement){
			var FindDepartement = search.create({
				type: 'department',
				columns: ['internalid'],
				filters: [{name: 'externalid', operator: 'is',values: departement},]}).run().getRange(0, 1);
			log.debug('findDepartement', FindDepartement)
			var departement_internalid = 0;
			if(FindDepartement.length>0){
				departement_internalid = FindDepartement[0].getValue({name: 'internalid'});
			}
			log.debug('departement_internalid', departement_internalid);
		}
		if(classexid){
			var FindClassexid = search.create({
				type: 'classification',
				columns: ['internalid'],
				filters: [{name: 'externalid', operator: 'is', values: classexid},]
			}).run().getRange(0, 1);
			log.debug('findClass', FindClassexid);
			var classinternalid = 0;
			if(FindClassexid.length>0){
				classinternalid = FindClassexid[0].getValue({name: 'internalid'});
				
			}
			log.debug('classinternalid', classinternalid);
		}
		if(soNumb){
			var findSOid = search.create({
			type: 'salesorder',
			columns: ['internalid'],
			filters: [{
			  name: 'tranid',
			  operator: 'is',
			  values: soNumb
			}, ]
		  }).run().getRange(0, 1);
		  var so_internal_id = 0
		  if(findSOid.length > 0){
			so_internal_id = findSOid[0].getValue({
				name:'internalid'
			})
		  }
		}
		log.debug('so_internal_id', so_internal_id);
		log.debug('findSOid', findSOid);
		recItmFulfillment = record.load({
								type : 'customrecord_abj_if_bulk',
								id : recid,         
								isDynamic : true
							});
		recItmFulfillment.setValue({
            fieldId: 'custrecord_sol_tfp_loc_list',
            value: location_internalid,
          });
		  if(departement_internalid){
			recItmFulfillment.setValue({
				fieldId : 'custrecord_abj_tfp_if_dept',
				value : departement_internalid,
			  });
		  }
		  if(classinternalid){
			recItmFulfillment.setValue({
				fieldId: 'custrecord_abj_tfp_if_class',
				value: classinternalid
			  });
		  }
		  recItmFulfillment.setValue({
			fieldId: 'custrecord_abj_so_id',
			value: so_internal_id
		  });
		recItmFulfillment.save({
		enableSourcing: true,
		ignoreMandatoryFields: true});  
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