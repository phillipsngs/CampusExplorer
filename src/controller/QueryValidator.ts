import {
	APPLY, APPLY_TOKENS, NUMBER_FIELDS, STRING_FIELDS, COLUMNS, COMPARATOR, GROUP, LOGIC,
	NOT,
	OPTION_KEYS,
	OPTIONS, ORDER,
	ROOMS_FIELD_NAMES,
	SECTION_FIELD_NAMES, TRANSFORMATIONS,
	WHERE, DIR, KEYS, DIRECTIONS, NUMBER, STRING, ASTERISK, EMPTY_STRING, UNDERSCORE
} from "./Constants";
import {QueryExecutor} from "./QueryExecutor";
import {InsightDatasetKind} from "./IInsightFacade";

export class QueryValidator {
	public queryEngine: QueryExecutor;
	public query: any;
	public datasetId: string;
	public hasValidTransformations: boolean;

	constructor(queryEngine: QueryExecutor, query: any) {
		this.queryEngine = queryEngine;
		this.query = query;
		this.datasetId = "";
		this.hasValidTransformations = false;
	}

	public isValidQuery(): boolean {
		let isValidTransformations = true;
		if(TRANSFORMATIONS in this.query) {
			isValidTransformations = this.isValidTransformationsBlock(this.query[TRANSFORMATIONS]);
		}
		if (WHERE in this.query && OPTIONS in this.query) { // WHERE KEY NOT FOUND OR OPTIONS KEY NOT FOUND
			let isWhereEmptyObject = Object.keys(this.query[WHERE]).length === 0 && !Array.isArray(this.query[WHERE]);
			let isValidOptions = this.isValidOptionsBlock(this.query[OPTIONS]); // validate options first
			let isValidWhere = this.isValidWhereBlock(this.query[WHERE]) || isWhereEmptyObject;
			return isValidWhere && isValidOptions && isValidTransformations;
		}
		return false;
	}

	public isValidWhereBlock(filter: any): boolean {
		let isValid = true;
		let keys: string[] = Object.keys(filter);
		let key = keys[0];
		if(keys.length !== 1){
			return false;
		} else if(LOGIC.includes(key) && filter[key].length) { // IS {AND, OR}
			for(const filterObject of filter[key]) {
				isValid = isValid && this.isValidWhereBlock(filterObject);
			}
			return isValid;
		} else if(COMPARATOR.includes(key)){ // IS {LT, GT, EQ, IS}
			return isValid && this.isValidComparatorEntry(filter[key], key);
		} else if(NOT === key) { // IS {NOT}
			return this.isValidWhereBlock(filter[key]);
		} else {
			return false;
		}
	}

	public isValidComparatorEntry(object: any, comparator: string): boolean {
		let key = Object.keys(object)[0];
		let field = key.split(UNDERSCORE)[1];
		let value = object[key];
		if(NUMBER_FIELDS.includes(field) && NUMBER_FIELDS.includes(comparator) && typeof value === NUMBER) {
			return this.isValidKey(key);
		} else if(STRING_FIELDS.includes(field) && STRING_FIELDS.includes(comparator) && typeof value === STRING) {
			return this.isValidWildCard(value) && this.isValidKey(key);
		} else {
			return false;
		}
	}

	public isValidOptionsBlock(optionBlock: any): boolean {
		let optionKeys: string[] = Object.keys(optionBlock);
		let optionsHasValidKeys = this.optionsHasValidKeys(optionBlock); // KEYS ARE IN THE SET COLUMN_KEYS
		let optionsHasColumns = optionKeys.includes(COLUMNS); // HAS COLUMNS
		let isValidColumns = this.isValidColumns(optionBlock[COLUMNS]); // COLUMNS IS AN ARRAY AND EACH ELEMENT IS A STRING, REFERENCES ONE DATASET
		if(optionsHasValidKeys && optionsHasColumns && isValidColumns) {
			this.initializeColumns(optionBlock[COLUMNS]);
			this.datasetId = this.queryEngine.getQueryId();
			let optionsHasOrder = optionKeys.includes(ORDER);
			if(!optionsHasOrder) {
				return true;
			} else if (this.isValidOrder(optionBlock[ORDER])){
				this.initializeOrderKeys(optionBlock[ORDER]);
				return this.isAllOrderKeysInColumns();
			}
		}
		return false;
	}

	public optionsHasValidKeys(optionBlock: any): boolean {
		let optionKeys = Object.keys(optionBlock);
		return optionKeys.every((element: any) => OPTION_KEYS.includes(element));
	}

	public isValidColumns(columns: any): boolean {
		let isArray = Array.isArray(columns); // is an array
		let isValidArray = false;
		if(isArray) {
			let isStringArray = columns.every((element: any) => typeof element === STRING); // everything is a string
			let isNonEmptyArray = columns.length > 0;
			isValidArray = isStringArray && isNonEmptyArray;
		}
		if(isValidArray) {
			let applyKeys = this.queryEngine.getApplyKeys();
			let groups = this.queryEngine.getGroups();
			let columnApplyKeys = columns.filter((element: string) => !element.includes(UNDERSCORE));
			let groupKeys = columns.filter((element: string) => element.includes(UNDERSCORE));
			let isValidApplyKeys = columnApplyKeys.every((key: any) => {
				return applyKeys.length === 0 || applyKeys.includes(key);
			});
			this.initializeDatasetId(groupKeys.length > 0 ? groupKeys[0].split(UNDERSCORE)[0] : EMPTY_STRING);
			let isValidNonApplyKeys = groupKeys.every((key: any) => {
				return key.split(UNDERSCORE)[0] === this.datasetId && (groups.length > 0 ? groups.includes(key) : true);
			});
			let isColumnsFieldsMatchInsightKind = this.isKeyArrayForInsightKind(groupKeys); // FIELDS REFERENCED ARE ONES THAT ARE SUPPORTED
			let isDatasetAdded = this.queryEngine.isDatasetAdded(this.datasetId);
			return isValidApplyKeys && isValidNonApplyKeys && isDatasetAdded && isColumnsFieldsMatchInsightKind;
		}
		return false;
	}

	public isValidKey(key: any): boolean {
		let arr = key.split(UNDERSCORE);
		let idString = arr[0];
		let field = arr[1];
		let isKeyString = typeof key === STRING;
		let isValidField = SECTION_FIELD_NAMES.includes(field) || ROOMS_FIELD_NAMES.includes(field);
		let isKeyMatchingDatasetId = this.datasetId === idString;
		let isKeyValidForDataset = this.isKeyForInsightKind(key);
		return isKeyString && isValidField && isKeyMatchingDatasetId && isKeyValidForDataset && arr.length === 2;
	}

	public isValidWildCard(pattern: string): boolean { // we are considering no pattern to be a valid wildcard pattern
		if(pattern.includes(ASTERISK)) {
			let wildArr = pattern.split(ASTERISK);
			if(pattern[0] === ASTERISK && pattern[pattern.length - 1] === ASTERISK && wildArr.length === 3) { // *string*
				return true;
			} else if(wildArr.length > 2) { // more than one * should fail
				return false;
			} else if(wildArr[0] !== EMPTY_STRING && wildArr[1] !== EMPTY_STRING) { // st*ring
				return false;
			}
		}
		return true;
	}

	private isValidTransformationsBlock(transformationsBlock: any) {
		if(APPLY in transformationsBlock && GROUP in transformationsBlock) {
			let isValidGroup = this.isValidGroup(transformationsBlock[GROUP]); // do group after and set group and check that keys in columns are in apply keys or group
			let isValidApply = this.isValidApply(transformationsBlock[APPLY]); // do apply first to set apply keys
			return isValidGroup && isValidApply;
		}
		return false;
	}

	private isValidGroup(groupBlock: any) {
		let isValidArray = Array.isArray(groupBlock) && groupBlock.every((element) => typeof element === STRING);
		let isNonEmpty = groupBlock.length > 0;
		if(isValidArray && isNonEmpty) {
			this.initializeDatasetId(groupBlock[0].split(UNDERSCORE)[0]);
			let isValidGroup = (groupBlock as string[]).every((key: string) => this.isValidKey(key));
			if(isValidGroup) {
				this.queryEngine.setGroups(groupBlock);
			}
			return isValidGroup;
		}
		return false;
	}

	private isValidApply(applyBlock: any) {
		let isValidApply: boolean = true;
		let isArray = Array.isArray(applyBlock);
		if(isArray && applyBlock.length === 0) {
			return true;
		} else if(isArray && applyBlock.length > 0) {
			for(const applyRule of applyBlock) {
				isValidApply = isValidApply && this.isValidApplyRule(applyRule);
			}
			return isValidApply;
		}
		return false;
	}

	private isValidApplyRule(applyRule: any) {
		let hasOneKey = Object.keys(applyRule).length === 1;
		let applyKey = Object.keys(applyRule)[0];
		let isKeyString = typeof applyKey === STRING;
		let applyKeyHasNoUnderscore = !applyKey.includes(UNDERSCORE);
		let isValidKeyLength = applyKey.length > 0;
		let isKeyUnique = !this.queryEngine.getApplyKeys().includes(applyKey);
		let isValidApplyKey = hasOneKey && isKeyString && applyKeyHasNoUnderscore && isValidKeyLength && isKeyUnique;

		let applyRuleEntry = applyRule[applyKey];
		let applyRuleEntryHasOneKey = Object.keys(applyRuleEntry).length === 1;
		let applyRuleEntryKey = Object.keys(applyRuleEntry)[0];
		let isValidApplyRuleEntryKey = APPLY_TOKENS.includes(applyRuleEntryKey);
		let applyRuleEntryValue = applyRuleEntry[applyRuleEntryKey];
		let isValidApplyRuleEntryValue = this.isValidKey(applyRuleEntryValue);
		let isValidApplyRuleEntry = isValidApplyRuleEntryKey && isValidApplyRuleEntryValue && applyRuleEntryHasOneKey;
		let field = applyRuleEntryValue.split(UNDERSCORE)[1];
		let isValidField = (NUMBER_FIELDS.includes(field) && NUMBER_FIELDS.includes(applyRuleEntryKey)) ||
			(STRING_FIELDS.includes(field) && STRING_FIELDS.includes(applyRuleEntryKey));
		let isValidApplyRule = isValidApplyKey && isValidApplyRuleEntry && isValidField;
		if (isValidApplyRule) {
			this.queryEngine.addApplyKey(applyKey);
			return true;
		}
		return false;
	}

	private isValidOrder(orderValue: any) {
		if(typeof orderValue === STRING) {
			return this.isValidKey(orderValue) || this.queryEngine.getColumns().includes(orderValue);
		} else {
			let hasTwoKeys = Object.keys(orderValue).length === 2;
			let isKeysStrings = Object.keys(orderValue).every((key: any) => typeof key === STRING);
			let isKeyDir = Object.keys(orderValue)[0] === DIR;
			let isKeyKeys = Object.keys(orderValue)[1] === KEYS;
			let hasValidKeys = hasTwoKeys && isKeysStrings && isKeyDir && isKeyKeys;
			let isKeysAnArray = Array.isArray(orderValue[KEYS]);
			if(hasValidKeys && isKeysAnArray) {
				let hasKeys = orderValue[KEYS].length > 0;
				let isValidDirection = DIRECTIONS.includes(orderValue[DIR]);
				let isKeysAnArrayOfStrings = orderValue[KEYS].every((key: any) => typeof key === STRING);
				let isKeyAColumnKey = orderValue[KEYS].every((key: any) => this.isValidOrderKeyListEntry(key));
				this.queryEngine.setOrderDir(orderValue[DIR]);
				return hasKeys && isValidDirection && isKeysAnArray && isKeysAnArrayOfStrings && isKeyAColumnKey;
			}
		}
		return false;
	}

	private isValidOrderKeyListEntry(key: string) {
		let isValidKey = this.isValidKey(key);
		return isValidKey ||
			(this.queryEngine.getApplyKeys().includes(key) || this.queryEngine.getColumns().includes(key));
	}

	public initializeOrderKeys(orderKeys: any): void {
		if(typeof orderKeys === STRING){
			this.queryEngine.setOrderKeys([orderKeys]);
		} else if(Object.keys(orderKeys).includes(KEYS)) {
			this.queryEngine.setOrderKeys(orderKeys[KEYS]);
		}
	}

	private isAllOrderKeysInColumns(): boolean {
		let columns: string[] = this.queryEngine.getColumns();
		let orderKeys: string[] = this.queryEngine.getOrderKeys();
		return orderKeys.every((orderKey) => columns.includes(orderKey));
	}

	private isKeyForInsightKind(key: string): boolean {
		let field = key.split(UNDERSCORE)[1];
		if(this.queryEngine.getDatasetKind() === InsightDatasetKind.Rooms) {
			return ROOMS_FIELD_NAMES.includes(field);
		} else if (this.queryEngine.getDatasetKind() === InsightDatasetKind.Sections) {
			return SECTION_FIELD_NAMES.includes(field);
		}
		return false;
	}

	private isKeyArrayForInsightKind(keys: string[]): boolean {
		return keys.every((key) => this.isKeyForInsightKind(key));
	}

	private initializeDatasetId(datasetId: string): void {
		if(datasetId !== EMPTY_STRING) {
			this.datasetId = datasetId;
			this.queryEngine.setQueryId(datasetId);
			this.queryEngine.setDataset(datasetId); // maybe move this somewhere
		}
	}

	private initializeColumns(columns: string[]): void {
		this.queryEngine.setColumns(columns);
	}
}
