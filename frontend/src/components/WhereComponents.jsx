import React, {useEffect, useState} from 'react';
import Form from 'react-bootstrap/Form';
import {Col, Row} from "react-bootstrap";
import {
	ACTIONS,
	COLUMNS,
	DATASET,
	IS,
	LT,
	NUMBER_FIELDS,
	STRING_FIELDS
} from "../util/Constants";
import styled from "styled-components";
import {capitalize, getMatchingFilters, getMatchingInputType} from "../util/Functions";

export const RowWrapper = styled(Row)`
	width: 100%;
	margin-top: 1em;
	margin-bottom: 2em;
	padding-right: 0;
	padding-left: 0;
	margin-left: 0.05em;
`
export const ColWrapper = styled(Col)`

`

const WhereComponents = ({dispatch, state}) => {
	const [selectedField, setSelectedField] = useState("");
	const [selectedFilter, setSelectedFilter] = useState("");
	const [selectedValue, setSelectedValue] = useState("");

	useEffect(() => {
		let filter = selectedFilter;
		let dataset = state[DATASET].toLowerCase();
		let key = dataset + "_" + selectedField
		let value = selectedValue;
		(NUMBER_FIELDS.includes(selectedField) && filter === IS)?setSelectedFilter(LT): filter = selectedFilter;
		let where = {};
		where[filter] = {};
		where[filter][key] = NUMBER_FIELDS.includes(selectedField)? Number(value) : value;
		dispatch({type: ACTIONS.SET_WHERE, payload: where});
	}, [selectedField, selectedFilter, selectedValue]);

	useEffect(() => {
		const x = setSelectedField(state[COLUMNS][0]? state[COLUMNS][0]: "");
		setSelectedFilter(NUMBER_FIELDS.includes(selectedField)? LT : IS);
		setSelectedValue("");
	}, [state[COLUMNS]])

	return (
			<RowWrapper>
				<ColWrapper md={4}>
					<Form.Label htmlFor="disabledSelect">Field:</Form.Label>
					<Form.Select value={selectedField} size="md" onChange={(e) => {
						STRING_FIELDS.includes(e.target.value)? setSelectedFilter(IS): setSelectedFilter(LT);
						setSelectedField(e.target.value);
					}}>
						{state[COLUMNS].map(fieldName => {
							return <option value={fieldName}> {capitalize(fieldName)} </option>
						})}
					</Form.Select>
				</ColWrapper>

				<ColWrapper md={3}>
					<Form.Label htmlFor="disabledSelect">Filter:</Form.Label>
					<Form.Select value={selectedFilter} size="md" onChange={(e) => {
						setSelectedFilter(e.target.value);
					}}>
						{getMatchingFilters(selectedField).map(comparator => {
							return <option value={comparator}> {comparator} </option>
						})}
					</Form.Select>
				</ColWrapper>

				<ColWrapper md={5}>
					<Form.Label>Enter a Value:</Form.Label>
					<Form.Control value={selectedValue} type={getMatchingInputType(selectedField)} onChange={(e) => {
						setSelectedValue(e.target.value);
					}} required/>
				</ColWrapper>
			</RowWrapper>
	);
};

export default WhereComponents;
