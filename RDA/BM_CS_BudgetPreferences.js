/**
 *    Copyright (c) 2018 Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "../../common/constants/Constants", "N/record", "../gateway/BudgetPreferencesGateway", "N/search", "../useCase/BudgetPreferencesUseCase", "N/runtime", "N/translation", "N/query"], function (_exports, _Constants, record, _BudgetPreferencesGateway, search, _BudgetPreferencesUseCase, runtime, translation, query) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.saveRecord = _exports.pageInit = _exports.fieldChanged = void 0;
  record = _interopRequireWildcard(record);
  _BudgetPreferencesGateway = _interopRequireDefault(_BudgetPreferencesGateway);
  search = _interopRequireWildcard(search);
  _BudgetPreferencesUseCase = _interopRequireDefault(_BudgetPreferencesUseCase);
  runtime = _interopRequireWildcard(runtime);
  translation = _interopRequireWildcard(translation);
  query = _interopRequireWildcard(query);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  var multipleBudgets = false;
  var budgetPreferencesGateway = new _BudgetPreferencesGateway["default"]({
    dependencies: {
      'N/search': search,
      'N/record': record,
      'N/runtime': runtime,
      'N/translation': translation,
      'N/query': query
    },
    constants: _Constants.Constants
  });
  var useCase = new _BudgetPreferencesUseCase["default"]({
    dependencies: {
      BudgetPreferencesGateway: budgetPreferencesGateway
    }
  });

  var pageInit = function pageInit(context) {
    multipleBudgets = useCase.isMultipleBudgetsEnabled();

    if (!multipleBudgets) {
      useCase.disableBudgetCategoryField(context.currentRecord, '');
    } else {
      useCase.updateBudgetCategoryField(context.currentRecord);
    } // Hide Budget Source Validation field (+) button


    var budgetValidationSourceAddBtn = document.getElementById(_Constants.Constants.BUDGET_PREFERENCES.DISPLAY.BUDGET_VALIDATION_SOURCE_POPUP_NEW);

    if (document && budgetValidationSourceAddBtn) {
      budgetValidationSourceAddBtn.style.setProperty('display', 'none', 'important');
    }
  };

  _exports.pageInit = pageInit;

  var fieldChanged = function fieldChanged(context) {
    if (context.fieldId === _Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_VALIDATION_SOURCE) {
      multipleBudgets = useCase.isMultipleBudgetsEnabled();

      if (!multipleBudgets) {
        useCase.disableBudgetCategoryField(context.currentRecord, '');
      } else {
        useCase.updateBudgetCategoryField(context.currentRecord);
      }
    }
  };

  _exports.fieldChanged = fieldChanged;

  var saveRecord = function saveRecord(context) {
    multipleBudgets = useCase.isMultipleBudgetsEnabled();
    var currentRecord = context.currentRecord;
    var budgetSearchColumns = currentRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_SEARCH_COLUMNS).toString();
    var enableBudgetValidation = currentRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.PREF_ENABLE_BUDGET);
    var budgetControlInstance = currentRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_CONTROL_INSTANCE);
    var budgetValidationSource = currentRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_VALIDATION_SOURCE);
    var budgetCategory = currentRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_CATEGORY);
    var savedSearchBudgetValidation = currentRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.SAVED_SEARCH_BUDGET_VALIDATION);
    var _a = _Constants.Constants.TRANSLATIONS.TRANSLATION_COLLECTION,
        COLLECTION_ID = _a.ID,
        _b = _a.KEYS,
        ALERT_MSG_BDGT_CAT_ERR = _b.ALERT_MSG_BDGT_CAT_ERR,
        ALERT_MSG_BGT_VALD_SRC_ERROR = _b.ALERT_MSG_BGT_VALD_SRC_ERROR,
        ALERT_MSG_BGT_PREF_CONTROL_INSTANCE = _b.ALERT_MSG_BGT_PREF_CONTROL_INSTANCE,
        ALERT_MSG_BGT_PREF_SAVE_SEARCH = _b.ALERT_MSG_BGT_PREF_SAVE_SEARCH,
        ALERT_MSG_BUDGET_SEARCH_COLUMN_EMPTY = _b.ALERT_MSG_BUDGET_SEARCH_COLUMN_EMPTY,
        BUDGET_SEARCH_REGX = _b.BUDGET_SEARCH_REGX;

    if (enableBudgetValidation && !budgetValidationSource) {
      alert(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_VALD_SRC_ERROR));
      return false;
    }

    if (enableBudgetValidation && multipleBudgets) {
      if (budgetValidationSource === _Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.BUDGET_VALIDATION_SOURCE.STANDARD_BUDGET && !budgetCategory) {
        alert(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BDGT_CAT_ERR));
        return false;
      }
    }

    if (enableBudgetValidation && !budgetControlInstance) {
      alert(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_PREF_CONTROL_INSTANCE));
      return false;
    }

    if (enableBudgetValidation && !savedSearchBudgetValidation) {
      alert(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_PREF_SAVE_SEARCH));
      return false;
    }

    if (enableBudgetValidation && !budgetSearchColumns) {
      alert(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BUDGET_SEARCH_COLUMN_EMPTY));
      return false;
    }

    if (budgetSearchColumns) {
      var regex = new RegExp(_Constants.Constants.UTILS.BUDGET_PREFERENCES.REGEX.BUDGET_SEARCH_COLUMNS);
      var regexResult = regex.exec(budgetSearchColumns);

      if (!regexResult || regexResult[0] !== budgetSearchColumns) {
        alert(useCase.getTranslationString(COLLECTION_ID, BUDGET_SEARCH_REGX));
        return false;
      }
    }

    if (!multipleBudgets) {
      useCase.disableBudgetCategoryField(context.currentRecord, '');
    } else {
      useCase.updateBudgetCategoryField(context.currentRecord);
    }

    if (budgetSearchColumns) {
      if (budgetSearchColumns.indexOf(_Constants.Constants.UTILS.STANDARD_FIELDS.ITEM) >= 0) {
        alert(_Constants.Constants.ERROR_MESSAGES.BUDGET_PREFERENCES.BUDGET_FIELDS_SEGMENTS_VALIDATION);
        return false;
      }

      if (budgetValidationSource === _Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.BUDGET_VALIDATION_SOURCE.STANDARD_BUDGET && budgetSearchColumns.indexOf(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.LINE_CSEG) >= 0) {
        alert(useCase.getTranslationString(COLLECTION_ID, BUDGET_SEARCH_REGX));
        return false;
      } else if (budgetValidationSource === _Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.BUDGET_VALIDATION_SOURCE.CUSTOM_BUDGET && budgetSearchColumns.indexOf(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.CSEG) >= 0) {
        var saveRecordFlag_1 = true;
        var budgetSearchFields = budgetSearchColumns.split(',');
        budgetSearchFields.forEach(function (budgetSearchField) {
          var fieldId = budgetSearchField.split('|')[0];

          if (fieldId.indexOf(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.CSEG) >= 0 && fieldId.indexOf(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.LINE_CSEG) < 0) {
            alert(useCase.getTranslationString(COLLECTION_ID, BUDGET_SEARCH_REGX));
            saveRecordFlag_1 = false;
          }
        });

        if (!saveRecordFlag_1) {
          return saveRecordFlag_1;
        }
      }

      var hasValChanged = useCase.getPreviousValue() && useCase.isSearchColChanged(useCase.getPreviousValue(), budgetSearchColumns);

      if (enableBudgetValidation && hasValChanged) {
        return useCase.confirmChangeMade();
      }
    }

    return true;
  };

  _exports.saveRecord = saveRecord;
});