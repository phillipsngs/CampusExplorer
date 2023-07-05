import {
	InsightDatasetEntry,
	InsightError
} from "./IInsightFacade";
import {
	AND,
	ASTERISK,
	EMPTY_STRING,
	EQ,
	GT,
	IS, LT,
	NOT,
	OR,
	UNDERSCORE,
} from "./Constants";
import {Query} from "./Query";

export class QueryExecutor {
	private query: Query;
	private dataset: InsightDatasetEntry[] = [];

	constructor(query: Query) {
		this.query = query;
		this.dataset = query.getDataset();
	}

	public doQuery(): Promise<InsightDatasetEntry[]> {
		let queryResults = this.handleFilter(this.query.getWhere());
		if(queryResults.size >= 0) {
			return Promise.resolve([...queryResults]);
		} else {
			return Promise.reject(new InsightError("Query returned no results"));
		}
	}

	private handleFilter(query: any): Set<InsightDatasetEntry> {
		if(AND in query) {
			return this.handleAnd(query[AND]);
		} else if (OR in query) {
			return this.handleOr(query[OR]);
		} else if (NOT in query) {
			return this.handleNot(query[NOT]);
		} else if (LT in query) {
			return this.handleMComparator(LT, query);
		} else if (GT in query) {
			return this.handleMComparator(GT, query);
		} else if (IS in query) {
			return this.handleMComparator(IS, query);
		} else if (EQ in query) {
			return this.handleMComparator(EQ, query);
		}
		return new Set(this.query.getDataset());
	}

	private handleAnd(query: any): Set<InsightDatasetEntry> {
		let results = new Set<InsightDatasetEntry>();
		for (const operator of query) {
			let subResults = this.handleFilter(operator);
			if (subResults.size === 0) {
				return subResults;
			} else if (results.size === 0) {
				results = subResults;
			} else {
				results = new Set([...subResults].filter((entry) => results.has(entry)));
			}
		}
		return results;
	}

	private handleOr(query: any): Set<InsightDatasetEntry> {
		let results = new Set<InsightDatasetEntry>();
		let subResult = new Set<InsightDatasetEntry>();
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			for (const entry of subResult) {
				results.add(entry);
			}
		}
		return results;
	}

	private handleNot(query: any): Set<InsightDatasetEntry>  {
		let subResult: Set<InsightDatasetEntry> = this.handleFilter(query);
		return new Set(this.dataset.filter((entry) => !subResult.has(entry)));
	}

	private handleMComparator(comparator: string, query: any): Set<InsightDatasetEntry> {
		let keyValueObject = query[comparator];
		let key = Object.keys(keyValueObject)[0];
		let value = keyValueObject[key];
		let field = key.split(UNDERSCORE)[1];

		if (comparator === GT) {
			return new Set(this.dataset.filter((entry) => entry.get(field) > value));
		} else if (comparator === LT) {
			return new Set(this.dataset.filter((entry) => entry.get(field) < value));
		} else if (comparator === EQ) {
			return new Set(this.dataset.filter((entry) => entry.get(field) === value));
		} else if (comparator === IS) {
			return new Set(this.dataset.filter((entry) => this.isStringMatched(entry.get(field), value)));
		}
		return new Set();
	}

	private isStringMatched(inputString: string | number, pattern: string): boolean {
		let wildArr = pattern.split(ASTERISK);
		let value = inputString as string;

		if(pattern === value) {
			return true;
		} else if (wildArr.length === 2) {
			if (pattern === ASTERISK) {
				return true;
			} else if(wildArr[0] === EMPTY_STRING && wildArr[1] !== EMPTY_STRING) {
				let substring = wildArr[1];
				let stringToMatch = value.substring(value.length - substring.length, value.length);
				return substring === stringToMatch;
			} else if (wildArr[0] !== EMPTY_STRING && wildArr[1] === EMPTY_STRING) {
				let substring = wildArr[0];
				let stringToMatch = value.substring(0, substring.length);
				return substring === stringToMatch;
			}
		} else if (value.includes(wildArr[1])) {
			return true;
		}
		return false;
	}
}
