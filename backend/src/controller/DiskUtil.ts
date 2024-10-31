/**
 * Reads from disk a json file of InsightData objects
 * REQUIRES: memory to have persisted data
 * MODIFIES: this
 * EFFECTS: returns a Promise that rejects with an error if an error is encountered, otherwise returns a resolved
 * promise.
 **/
import * as fs from "fs-extra";
import {InsightData, InsightDatasetKind, InsightDatasetRoom, InsightDatasetSection} from "./IInsightFacade";
import {
	ADDRESS,
	AUDIT,
	AVG,
	DEPT,
	FAIL, FULLNAME, FURNITURE, HREF,
	ID,
	INSTRUCTOR, LAT, LON, NUMBER,
	PASS,
	ROOMS_FIELD_NAMES, SEATS,
	SECTION_FIELD_NAMES, SHORTNAME,
	TITLE, TYPE,
	UUID,
	YEAR
} from "./Constants";

export function readLocal(path: string, insightDataList: InsightData[]) {
	try {
		let fileContent = fs.readJSONSync(path);
		for (const insightData of fileContent) {
			if(insightData.metaData.kind === InsightDatasetKind.Sections) {
				readSections(insightData, insightDataList);
			} else if(insightData.metaData.kind === InsightDatasetKind.Rooms) {
				readRooms(insightData, insightDataList);
			}
		}
	} catch(Exception) {
		return ("There was an error reading from disk");
	}
}

function readSections(insightData: any, insightDataList: InsightData[]) {
	let insightDataSections: InsightDatasetSection[] = [];
	if (!isDuplicatedDataset(insightDataList, insightData.metaData.id)) {
		for (const persistedSection of insightData.data) {
			if (isValidDatasetSection(persistedSection)) {
				insightDataSections.push(new InsightDatasetSection(
					persistedSection[UUID],
					persistedSection[ID],
					persistedSection[TITLE],
					persistedSection[INSTRUCTOR],
					persistedSection[DEPT],
					persistedSection[YEAR],
					persistedSection[AVG],
					persistedSection[PASS],
					persistedSection[FAIL],
					persistedSection[AUDIT]
				));
			}
		}
		insightDataList.push(new InsightData(
			insightData.metaData.id,
			insightData.metaData.kind,
			insightData.metaData.numRows,
			insightDataSections
		));
	}
}

function readRooms(insightData: any, insightDataList: InsightData[]) {
	let insightDataRooms: InsightDatasetRoom[] = [];
	if (!isDuplicatedDataset(insightDataList, insightData.metaData.id)) {
		for (const persistedRoom of insightData.data) {
			if (isValidRoom(persistedRoom)) {
				insightDataRooms.push(new InsightDatasetRoom(
					persistedRoom[FULLNAME],
					persistedRoom[SHORTNAME],
					persistedRoom[ADDRESS],
					persistedRoom[LAT],
					persistedRoom[LON],
					persistedRoom[NUMBER],
					persistedRoom[SEATS],
					persistedRoom[TYPE],
					persistedRoom[FURNITURE],
					persistedRoom[HREF],
				));
			}
		}
		insightDataList.push(new InsightData(
			insightData.metaData.id,
			insightData.metaData.kind,
			insightData.metaData.numRows,
			insightDataRooms
		));
	}
}

export function writeLocal(path: string, insightDataList: InsightData[]): boolean {
	try {
		fs.outputJsonSync(path, insightDataList);
		return true;
	} catch(Exception) {
		return false;
	}
}

function isDuplicatedDataset(insightDataList: InsightData[], id: string): boolean {
	return insightDataList.some((dataset) => dataset.metaData.id === id);
}

function isValidDatasetSection(section: any): boolean {
	return SECTION_FIELD_NAMES.every((requiredKey) => requiredKey in section);
}

function isValidRoom(room: any): boolean {
	return ROOMS_FIELD_NAMES.every((requiredKey) => requiredKey in room);
}
