// import {
// 	InsightData, InsightResult,
//
// } from "./IInsightFacade";
// import {QueryResults} from "./QueryResults";
// import {
// 	AND,
// 	ASTERISK, EMPTY_STRING,
// 	EQ,
// 	GT,
// 	IS, LT,
// 	NOT,
//
//
// } from "./Constants";
// import {QueryValidator} from "./QueryValidator";
//
// export class Query {
// 	public datasetKind: string;
// 	public queryObject: any;
// 	public qryID: string = "";
// 	public datasetSections: any[] = [];
// 	public orderKey: string;
// 	public orderKeys: string[];
// 	public selectedColumns: string[];
// 	public applyKeys: string[];
// 	public groups: string[];
// 	public orderDir: string;
// 	public options: any;
// 	public transformations: any;
// 	public where: any;
//
// 	constructor(data: InsightData[], query: any) {
// 		this.queryObject = query;
// 		this.datasetKind = EMPTY_STRING;
// 		this.selectedColumns = [];
// 		this.applyKeys = [];
// 		this.orderKeys = [];
// 		this.groups = [];
// 		this.orderKey = EMPTY_STRING;
// 		this.orderDir = EMPTY_STRING;
// 	}
//
// 	public isValidQuery(): boolean {
// 		let queryValidator = new QueryValidator(this);
// 		return queryValidator.isValidQuery();
// 	}
//
// 	public getWhere(): any {
// 		return this.where;
// 	}
//
// 	public getTransformations(): any {
// 		return this.transformations;
// 	}
//
// 	public getOptions(): any {
// 		return this.options;
// 	}
//
// 	public setDataset(id: string): void {
// 		for (const dataset of this.dataset) {
// 			if (dataset.metaData.id === id) {
// 				this.datasetSections = dataset.data; // keep track of all sections being looked at
// 				this.datasetKind = dataset.metaData.kind;
// 				return;
// 			}
// 		}
// 	}
//
// 	public setQueryId(key: string) {
// 		this.qryID = key;
// 	}
//
// 	public getQueryId(): string {
// 		return this.qryID;
// 	}
//
// 	public setColumns(columns: string[]) {
// 		this.selectedColumns = columns;
// 	}
//
// 	public getColumns(): string[] {
// 		return this.selectedColumns;
// 	}
//
// 	public setOrderKeys(keys: string[]) {
// 		this.orderKeys = keys;
// 	}
//
// 	public getOrderKeys(): string[] {
// 		return this.orderKeys;
// 	}
//
// 	public setOrderDir(orderDir: string){
// 		this.orderDir = orderDir;
// 	}
//
// 	public getOrderDir(): string {
// 		return this.orderDir;
// 	}
//
// 	public addApplyKey(applyKey: string): void {
// 		this.applyKeys.push(applyKey);
// 	}
//
// 	public getApplyKeys(): string[] {
// 		return this.applyKeys;
// 	}
//
// 	public setGroups(group: string[]): void {
// 		this.groups = group;
// 	}
//
// 	public getGroups(): string[] {
// 		return this.groups;
// 	}
//
// 	public isDatasetAdded(datasetId: string): boolean {
// 		for (const dataset of this.dataset) {
// 			if (dataset.metaData.id === datasetId) {
// 				this.datasetSections = dataset.data; // keep track of all sections being looked at
// 				this.datasetKind = dataset.metaData.kind;
// 				return true;
// 			}
// 		}
// 		return false;
// 	}
//
// 	public getDatasetKind(): string {
// 		return this.datasetKind;
// 	}
// }
