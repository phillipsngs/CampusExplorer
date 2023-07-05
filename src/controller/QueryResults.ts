import {
	InsightDatasetRoom,
	InsightDatasetSection,
	InsightResult, ResultTooLargeError,
} from "./IInsightFacade";
import {
	APPLY, APPLY_TOKEN_AVG, COUNT, GROUP, MAX,
	MIN, STRING_FIELDS, SUM, TRANSFORMATIONS, DOWN, UNDERSCORE} from "./Constants";
import Decimal from "decimal.js";
import {QueryExecutor} from "./QueryExecutor";
import {Query} from "./Query";

export class QueryResults {
	public wantedColumns: string[];
	public qryID: string;
	public query: Query;
	public filteredSections: InsightDatasetSection[] | InsightDatasetRoom[];
	public orderKeys: string[];
	public orderDir: string;

	constructor(filteredSections: InsightDatasetSection[] | InsightDatasetRoom[], query: Query) {
		this.filteredSections = filteredSections;
		this.query = query;
		this.qryID = query.getQueryId();
		this.wantedColumns = query.getColumns();
		this.orderKeys =  query.getOrderKeys();
		this.orderDir = query.getOrderDir();
	}

	//	filters columns and orders them if required. Returns an insightResult Array.
	public getFormattedResult(): Promise<InsightResult[]> {
		let result: InsightResult[] = this.filteredSections.map((section) => section.prefixJson(this.qryID));

		if (this.query.hasTransformations()) {
			result = this.handleTransformation(result);
		}
		if (result.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Query is too broad and is returning too many results."));
		}

		if (this.orderDir === DOWN) {
			result = this.sortDescending(result);
		} else if(this.orderKeys) {
			result = this.sortAscending(result);
		}

		let newResults = result.map((insightResult: any) => {
			for(let key in insightResult) {
				if(!this.wantedColumns.includes(key)) {
					delete insightResult[key];
				}
			}
			return insightResult;
		});
		return Promise.resolve(newResults);
	}

	public handleTransformation(qryResult: InsightResult[]): InsightResult[] {
		let transformationBlock = this.query.getTransformations();
		let groupKeyList: string[] = transformationBlock[GROUP];
		let currResult: InsightResult[];
		let groups = this.handleGroup(groupKeyList, qryResult);

		let applyBlock = transformationBlock[APPLY];
		currResult = [...groups.values()].map((group) => this.handleApply(group, applyBlock));
		return currResult;

	}

	public handleGroup(keys: string[], result: InsightResult[]): Map<string, InsightResult[]> {
		let keyToGroup = new Map<string, InsightResult[]>();
		for (let section of result) {
			let mapKey = this.createGroupKey(keys, section);
			if(!keyToGroup.has(mapKey)) {
				keyToGroup.set(mapKey, [section]);
			} else {
				keyToGroup.get(mapKey)?.push(section);
			}
		}
		return keyToGroup;
	}


	private createGroupKey(keys: string[], result: InsightResult): string {
		let mapKey: string;
		mapKey = "";
		for(let key of keys) {
			mapKey += result[key];
		}
		return mapKey;
	}

	public handleApply(groups: InsightResult[], applyBlock: any): InsightResult {
		let appliedGroups = groups[0]; // can be any random insight result
		if (applyBlock.length === 0) {
			return groups[0];
		}
		for (let applyOperation of applyBlock) {
			let column = Object.keys(applyOperation)[0];
			appliedGroups[column] = this.apply(groups, applyOperation[column]);
		}
		return appliedGroups;
	}

	public apply(group: InsightResult[], applyBlock: any): string | number {
		let applySubBlock = applyBlock;
		let operation = Object.keys(applySubBlock)[0];
		let col = applySubBlock[operation];

		if (operation === APPLY_TOKEN_AVG) {
			return this.getAvg(group,col);
		} else if (operation === MIN) {
			return this.getMin(group, col) as number;
		} else if (operation === MAX){
			return this.getMax(group, col) as number;
		} else if (operation === SUM) {
			return this.getSum(group, col);
		} else if (operation === COUNT) {
			return this.getCount(group, col);
		}
		return 0;
	}

	public sortAscending(results: InsightResult[]): InsightResult[] {
		results.sort((a, b) => this.insightResultComparator(a, b, 0));
		return results;
	}

	public sortDescending(results: InsightResult[]): InsightResult[] {
		results.sort((a, b) => -1 * this.insightResultComparator(a, b, 0));
		return results;
	}


	public getAvg(sections: InsightResult[], col: string): number {
		let total: Decimal = new Decimal(0);
		let len = sections.length;
		for (let section of sections) {
			total = Decimal.add(new Decimal(section[col]),total);
		}
		return Number((total.toNumber() / len).toFixed(2));
	}

	public getMin(sections: InsightResult[], col: string): number | null {
		let min: number | null = null;
		for (let section of sections) {
			if (min === null || min > (section[col] as number)) {
				min = section[col] as number;
			}
		}
		return min;

	}

	public getMax(sections: InsightResult[], col: string): number | null {
		let max: number | null = null;
		for (let section of sections) {
			if (max === null || max < (section[col] as number)) {
				max = section[col] as number;
			}
		}
		return max;
	}

	public getSum(sections: InsightResult[], col: string): number {
		let total: Decimal = new Decimal(0);
		for (let section of sections) {
			total = Decimal.add(new Decimal(section[col]), total);
		}
		return Number((total.toNumber()).toFixed(2));
	}

	public getCount(sections: InsightResult[], col: string): number {
		let seenField: any[] = [];
		let count = 0;
		for (let section of sections) {
			if (!seenField.includes(section[col])) {
				seenField.push(section[col]);
				count++;
			}
		}
		return count;
	}

	public insightResultComparator(a: InsightResult, b: InsightResult, index: number): number {
		if (index < this.orderKeys.length) {
			if (STRING_FIELDS.includes(this.orderKeys[index].split(UNDERSCORE)[1])) {
				if ((a[this.orderKeys[index]] as string) < (b[this.orderKeys[index]] as string)) {
					return -1;
				} else if ((a[this.orderKeys[index]] as string) > (b[this.orderKeys[index]] as string)) {
					return 1;
				} else {
					return this.insightResultComparator(a, b, index + 1);
				}
			} else {
				if ((a[this.orderKeys[index]] as number) < (b[this.orderKeys[index]] as number)) {
					return -1;
				} else if ((a[this.orderKeys[index]] as number) > (b[this.orderKeys[index]] as number)) {
					return 1;
				} else {
					return this.insightResultComparator(a, b, index + 1);
				}
			}
		}
		return 0;
	}
}