import React, {useState} from 'react'
import {ButtonGroup, ToggleButton} from "react-bootstrap";
import styled from "styled-components";
import Form from "react-bootstrap/Form";
import {ACTIONS, ROOMS_FIELD_NAMES, SECTION_FIELD_NAMES} from "../util/Constants";

const StyledButtonGroup = styled(ButtonGroup)`
	width: 100%;
	margin: 0em 0em 2em 0;
`

const FirstRowWrapper = styled.div`
	width: 100%;
	padding-top: 1em;
`

const SelectorComponent = ({dispatch, state}) => {
	const [radioValue, setRadioValue] = useState('0');
	const radios = [
		{ name: 'Sections', value: '0', fields: SECTION_FIELD_NAMES},
		{ name: 'Rooms', value: '1', fields: ROOMS_FIELD_NAMES},
	];


	return (
		<FirstRowWrapper>
			<Form.Label htmlFor="disabledSelect">Choose a dataset:</Form.Label>
			<StyledButtonGroup>
				{radios.map((radio, idx) => (
					<ToggleButton
						key={idx}
						id={`radio-${idx}`}
						type="radio"
						variant={idx % 2 ? 'outline-primary' : 'outline-primary'}
						name="radio"
						value={radio.value}
						checked={radioValue === radio.value}
						onChange={(e) => {
							setRadioValue(e.currentTarget.value);
							dispatch({type: ACTIONS.SET_COLUMNS, payload: []});
							dispatch({type: ACTIONS.SET_DATASET, payload: radios[e.currentTarget.value].name.toLowerCase()});
							console.log(JSON.stringify(state));
						}}
					>
						{radio.name}
					</ToggleButton>
				))}
			</StyledButtonGroup>
		</FirstRowWrapper>
	)
}
export default SelectorComponent
