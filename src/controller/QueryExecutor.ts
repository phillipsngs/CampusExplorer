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
		let subResults = new Set<InsightDatasetEntry>();
		for (const operator of query) {
			subResults = this.handleFilter(operator);
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
		let subResults = new Set<InsightDatasetEntry>();
		for (const operator of query) {
			subResults = this.handleFilter(operator);
			for (const entry of subResults) {
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

	private isStringMatched(input: string | number, pattern: string): boolean {
		let strComponentCount = pattern.split(ASTERISK).length;
		let [pre, post] = pattern.split(ASTERISK);
		let str = input as string;

		if(pattern === str || pattern === ASTERISK) {
			return true;
		} else if (strComponentCount === 2) {
			if(pre === EMPTY_STRING && post !== EMPTY_STRING) {
				return post ===  str.substring(str.length - post.length, str.length);
			} else if (pre !== EMPTY_STRING && post === EMPTY_STRING) {
				return pre === str.substring(0, pre.length);
			}
		} else if (strComponentCount === 3) {
			return str.includes(post);
		}
		return false;
	}
}
