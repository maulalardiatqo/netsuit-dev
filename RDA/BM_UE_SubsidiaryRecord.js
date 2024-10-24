/**
 * Copyright (c) 2018 Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "N/query", "N/record", "N/search", "N/runtime", "N/ui/serverWidget", "../../common/constants/Constants", "../../Subsidiary/gateway/SubsidiaryRecordGateway", "../../Subsidiary/useCase/SubsidiaryRecordUsecase"], function (_exports, query, record, search, runtime, _serverWidget, _Constants, _SubsidiaryRecordGateway, _SubsidiaryRecordUsecase) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.beforeLoad = void 0;
  query = _interopRequireWildcard(query);
  record = _interopRequireWildcard(record);
  search = _interopRequireWildcard(search);
  runtime = _interopRequireWildcard(runtime);
  _SubsidiaryRecordGateway = _interopRequireDefault(_SubsidiaryRecordGateway);
  _SubsidiaryRecordUsecase = _interopRequireDefault(_SubsidiaryRecordUsecase);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  var _createGateway = function _createGateway() {
    return new _SubsidiaryRecordGateway["default"]({
      dependencies: {
        'N/record': record,
        'N/search': search,
        'N/query': query,
        'N/runtime': runtime
      },
      constants: _Constants.Constants
    });
  };

  var useCase = new _SubsidiaryRecordUsecase["default"]({
    dependencies: {
      SubsidiaryRecordGateway: _createGateway()
    }
  });

  var beforeLoad = function beforeLoad(context) {
    var form = context.form;
    var _a = _Constants.Constants.CUSTOM_RECORD.SUBSIDIARY,
        STANDARD_BUDGET_CATEGORY = _a.STANDARD_BUDGET_CATEGORY,
        ALLOW_SAVING_BUDGET = _a.ALLOW_SAVING_BUDGET,
        ENABLE_BUDGET = _a.ENABLE_BUDGET;
    var budgetCatFld = form.getField({
      id: STANDARD_BUDGET_CATEGORY
    });
    var allowBudSaving = form.getField({
      id: ALLOW_SAVING_BUDGET
    });
    var enableBudget = form.getField({
      id: ENABLE_BUDGET
    });
    var isMultipleBudgetEnabled = useCase.isMultipleBudgetEnabled();
    var budgetValidationSource = useCase.getBudgetValidationSource();
    var isBudgetEnabled = useCase.getEnableBudgetPreference(); // Hide Budget related fields on subsidiary page when budget is not enabled in preferences

    if (isBudgetEnabled === 'F') {
      allowBudSaving.updateDisplayType({
        displayType: _serverWidget.FieldDisplayType.HIDDEN
      });
      enableBudget.updateDisplayType({
        displayType: _serverWidget.FieldDisplayType.HIDDEN
      });
      budgetCatFld.updateDisplayType({
        displayType: _serverWidget.FieldDisplayType.HIDDEN
      });
    }
    /* Budget category field should be only enable for Standard Budget.
       Budget category should be hidden when multiple budgets feature is disabled.
       2 - custom budget
       1 - standard budget */


    if (!isMultipleBudgetEnabled || budgetValidationSource === 2) {
      budgetCatFld.updateDisplayType({
        displayType: _serverWidget.FieldDisplayType.HIDDEN
      });
    }
  };

  _exports.beforeLoad = beforeLoad;
});