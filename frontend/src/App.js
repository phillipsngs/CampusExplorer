import './App.css';
import {Button, Col, Row} from "react-bootstrap";
import styled from 'styled-components'
import OptionComponent from "./components/OptionComponent";
import SelectorComponent from "./components/SelectorComponent";
import TableComponent from "./components/TableComponent";
import WhereComponents from "./components/WhereComponents";
import SortComponent from "./components/SortComponent";
import ErrorComponent from "./components/ErrorComponent";
import {useEffect, useReducer, useState} from "react";
import {
    ACTIONS,
    BASE_QUERY,
    BASE_STATE,
    COLUMNS,
    COLUMNS_STR,
    DATASET,
    OPTIONS,
    ORDER,
    SORT_OPTIONS,
    WHERE,
    WHERE_STR
} from "./util/Constants";


export const Wrapper = styled(Col)`
    margin: 2em 3em 2em 3em;
`
export const QueryBuilderDiv = styled(Row)`
    display: block;
`
const ButtonWrapper = styled(Row)`
    width: 100%;
    margin: 2em 0em 2em 0em;
`

const reducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_DATASET:
            return {...state, 0: action.payload};
        case ACTIONS.SET_COLUMNS:
            return {...state, 1: action.payload};
        case ACTIONS.SET_SORT_OPTIONS:
            return {...state, 2: action.payload};
        case ACTIONS.SET_WHERE:
            return {...state, 3: action.payload};
        case ACTIONS.SET_QUERY_RESULT:
            return {...state, 4: action.payload};
        case ACTIONS.SET_ERROR_MSG:
            return {...state, 5: action.payload};
        default:
            return state;
    }
}

function App() {
    const [query, setQuery] = useState(BASE_QUERY) // the giant ass query
    const [queryResult, setQueryResult] = useState([]); // a list of InsightResult
    const [errorMsg, setErrorMsg] = useState("");
    const [state, dispatch] = useReducer(reducer, BASE_STATE)

    useEffect(() => {
        buildQuery();
    }, [state[DATASET], state[COLUMNS], state[SORT_OPTIONS], state[WHERE]]);

    useEffect(() => {
    }, [queryResult]);

    function buildQuery() {
        let userQuery = BASE_QUERY;
        userQuery[WHERE_STR] = state[WHERE];
        userQuery[OPTIONS][COLUMNS_STR] = state[COLUMNS].map((column) => state[DATASET] + "_" + column);
        userQuery[OPTIONS][ORDER] = state[SORT_OPTIONS];
        setQuery(userQuery);
    }


    function submitQuery() {
        setErrorMsg("");
        fetch('http://localhost:4321/query', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(query)
        }).then((response) => {
            return Promise.resolve(response.json());
        }).then((data) => {
            if (data.error) {
                return Promise.reject(data.error);
            }
            dispatch({type: ACTIONS.SET_QUERY_RESULT, payload: data?.result});
        }).catch((error) => {
            setErrorMsg(error);
        });
    }

    return (

        <Wrapper>
            <QueryBuilderDiv md={5} className="square border border-4 rounded-start">
                <SelectorComponent dispatch={dispatch} state={state}></SelectorComponent>
                <OptionComponent dispatch={dispatch} state={state}></OptionComponent>
                <WhereComponents dispatch={dispatch} state={state}></WhereComponents>
                <SortComponent dispatch={dispatch} state={state}></SortComponent>
                <ButtonWrapper setQueryResult={setQueryResult}>
                    <Button onClick={submitQuery} variant="primary"> Submit </Button>
                </ButtonWrapper>
            </QueryBuilderDiv>
            <QueryBuilderDiv md={7}>
                {
                    (errorMsg !== "") ? <ErrorComponent errorType={errorMsg}/> :
                        <TableComponent state={state}></TableComponent>
                }
            </QueryBuilderDiv>
        </Wrapper>
    );
}

export default App;


