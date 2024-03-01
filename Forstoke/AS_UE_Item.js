/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([
    '../usecase/AS_UE_Item_usecase',
    '../../common/ELKLoggerUtility/psg-elasticlogger',
], function (Usecase, loggerUtil) {
    function afterSubmit(context) {
        var usecase = new Usecase({dependencies: {loggerUtil: loggerUtil}});
        usecase.afterSubmit(context);
        return true;
    }
    return {
        afterSubmit: afterSubmit,
    };
});
