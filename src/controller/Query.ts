import {InsightData} from "./IInsightFacade";
import {
	EMPTY_STRING,
	OPTIONS,
	TRANSFORMATIONS,
	WHERE
} from "./Constants";
import {QueryValidator} from "./QueryValidator";
import {QueryExecutor} from "./QueryExecutor";
import {QueryResults} from "./QueryResults";

export class Query {
	public datasets: InsightData[];
	public dataset: any[];
	public datasetKind: string;
	public queryObject: any;
	public queryId: string;
	public where: any;
	public options: any;
	public selectedColumns: string[];
	public orderKeys: string[];
	public orderDir: string;
	public transformations: any;
	public applyKeys: string[];
	public groups: string[];

	constructor(data: InsightData[], query: any) {
		this.datasets = data;
		this.dataset = [];
		this.datasetKind = EMPTY_STRING;
		this.queryObject = query;
		this.queryId = EMPTY_STRING;
		this.where = WHERE in query ? query[WHERE] : null;
		this.options = OPTIONS in query ? query[OPTIONS] : null;
		this.selectedColumns = [];
		this.orderKeys = [];
		this.orderDir = EMPTY_STRING;
		this.transformations = TRANSFORMATIONS in query ? query[TRANSFORMATIONS] : null;
		this.applyKeys = [];
		this.groups = [];
	}

	public isValidQuery(): Promise<boolean> {
		return new QueryValidator(this).isValidQuery();
	}

	public executeQuery(): Promise<any[]> {
		return new QueryExecutor(this).doQuery();
	}

	public transformQueryResults(results: any[]): Promise<any[]> {
		return new QueryResults(results, this).getFormattedResult();
	}

	public hasWhere(): boolean {
		return this.where != null;
	}

	public getWhere(): any {
		return this.where;
	}

	public hasTransformations(): boolean {
		return this.transformations != null;
	}

	public getTransformations(): any {
		return this.transformations;
	}

	public hasOptions(): boolean {
		return this.options != null;
	}

	public getOptions(): any {
		return this.options;
	}

	public setDataset(id: string): void {
		for (const dataset of this.datasets) {
			if (dataset.metaData.id === id) {
				this.dataset = dataset.data; // keep track of all sections being looked at
				this.datasetKind = dataset.metaData.kind;
				return;
			}
		}
	}

	public setQueryId(key: string) {
		this.queryId = key;
	}

	public getQueryId(): string {
		return this.queryId;
	}

	public setColumns(columns: string[]) {
		this.selectedColumns = columns;
	}

	public getColumns(): string[] {
		return this.selectedColumns;
	}

	public setOrderKeys(keys: string[]) {
		this.orderKeys = keys;
	}

	public getOrderKeys(): string[] {
		return this.orderKeys;
	}

	public setOrderDir(orderDir: string){
		this.orderDir = orderDir;
	}

	public getOrderDir(): string {
		return this.orderDir;
	}

	public addApplyKey(applyKey: string): void {
		this.applyKeys.push(applyKey);
	}

	public getApplyKeys(): string[] {
		return this.applyKeys;
	}

	public setGroups(group: string[]): void {
		this.groups = group;
	}

	public getGroups(): string[] {
		return this.groups;
	}

	public isDatasetAdded(datasetId: string): boolean {
		return this.datasets.some((dataset) => dataset.metaData.id === datasetId);
	}

	public getDatasetKind(): string {
		return this.datasetKind;
	}

	public getDataset(): any[] {
		return this.dataset;
	}
}
