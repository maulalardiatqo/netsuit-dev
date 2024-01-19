/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function(search, record, email, runtime) {
    
    function execute(context) {
        try{
            var external_id = [
                "SNI20220301-4.",
                "SNI20220302-17.",
                "SNI20220302-30.",
                "SNI20220302-32.",
                "SNI20220302-34.",
                "SNI20220304-51.",
                "SNI20220304-52.",
                "SNI20220305-60.",
                "SNI20220305-62.",
                "SNI20220305-63.",
                "SNI20220307-83.",
                "SNI20220307-92.",
                "SNI20220308-113.",
                "SNI20220308-116.",
                "SNI20220309-188.",
                "SNI20220310-264.",
                "SNI20220310-265.",
                "SNI20220311-295.",
                "SNI20220315-321.",
                "SNI20220315-322.",
                "SNI20220315-326.",
                "SNI20220315-331.",
                "SNI20220315-333.",
                "SNI20220316-363.",
                "SNI20220316-365.",
                "SNI20220316-364.",
                "SNI20220316-367.",
                "SNI20220317-426.",
                "SNI20220318-470.",
                "SNI20220319-516.",
                "SNI20220319-517.",
                "SNI20220321-579.",
                "SNI20220323-727.",
                "SNI20220323-735.",
                "SNI20220323-737.",
                "SNI20220323-739.",
                "SNI20220323-741.",
                "SNI20220323-740.",
                "SNI20220324-818.",
                "SNI20220325-834.",
                "SNI20220325-835."
            ]
            var intIdtoDelete = [];
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                    ["type","anyof","SalesOrd"], 
                    "AND", 
                    ["trandate","within","1/1/2022","31/1/2022"], 
                    "AND", 
                    ["rate","isnotempty",""], 
                    "AND", 
                    ["source","anyof","CSV"], 
                    "AND", 
                    ["createdby","anyof","200281"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "externalid",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "External ID"
                    }),
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "Internal ID"
                    })
                ]
            });
            var searchResultCount = salesorderSearchObj.runPaged().count;
            log.debug("salesorderSearchObj result count",searchResultCount);
            salesorderSearchObj.run().each(function(result){
                var extId = result.getValue({
                    name : "externalid",
                    summary: "GROUP",
                });
                var internalId = result.getValue({
                    name : "internalid",
                    summary: "GROUP",
                })
                if (external_id.indexOf(extId) !== -1) {
                    intIdtoDelete.push(internalId);
                }
            return true;
            });
            log.debug('intIdtoDelete', intIdtoDelete);
            log.debug('intIdtoDelete length', intIdtoDelete.length)
            intIdtoDelete.forEach(function(internal_id){
                var deleteRecord = record.delete({
                    type: 'salesorder',
                    id: internal_id
                });
            })
        }catch(e){
            log.debug('error', e);
        }
    }
    return {
        execute: execute
    };
});