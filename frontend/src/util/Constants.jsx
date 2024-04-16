export const FULLNAME = "fullname";
export const SHORTNAME = "shortname";
export const NUMBER = "number";
export const NAME = "name";
export const ADDRESS = "address";
export const LAT = "lat";
export const LON = "lon";
export const SEATS = "seats";
export const TYPE = "type";
export const FURNITURE = "furniture";
export const HREF = "href";
export const UUID = "uuid";
export const ID = "id";
export const TITLE = "title";
export const INSTRUCTOR = "instructor";
export const DEPT = "dept";
export const YEAR = "year";
export const AVG = "avg";
export const PASS = "pass";
export const FAIL = "fail";
export const AUDIT = "audit";
export const NOT = "NOT";
export const AND = "AND";
export const OR = "OR";
export const IS = "IS";
export const LT = "LT";
export const EQ = "EQ";
export const GT = "GT";
export const WHERE_STR = "WHERE";
export const TRANSFORMATIONS = "TRANSFORMATIONS";
export const GROUP = "GROUP";
export const APPLY = "APPLY";
export const MAX = "MAX";
export const MIN = "MIN";
export const APPLY_TOKEN_AVG = "AVG";
export const COUNT = "COUNT";
export const SUM = "SUM";
export const APPLY_TOKENS = [MAX, MIN, APPLY_TOKEN_AVG, COUNT, SUM];

export const OPTIONS = "OPTIONS";
export const COLUMNS_STR = "COLUMNS";
export const ORDER = "ORDER";
export const CLASS_LINK = "views-field-nothing";
export const CLASS_FULLNAME = "views-field-title";
export const CLASS_SHORTNAME = "views-field-field-building-code";
export const CLASS_ROOM_NUMBER = "views-field-field-room-number";
export const CLASS_ADDRESS = "views-field-field-building-address";
export const CLASS_ROOM_CAPACITY = "views-field-field-room-capacity";
export const CLASS_ROOM_FURNITURE = "views-field-field-room-furniture";
export const CLASS_ROOM_TYPE = "views-field-field-room-type";
export const DIR = "dir";
export const KEYS = "keys";
export const UP = "UP";
export const DOWN = "DOWN";
export const DIRECTIONS = [UP, DOWN];
export const TD_VALUES = [CLASS_SHORTNAME, CLASS_ADDRESS, CLASS_ROOM_CAPACITY, CLASS_ROOM_FURNITURE, CLASS_ROOM_TYPE];
export const ANCHOR_VALUES = [CLASS_FULLNAME, CLASS_ROOM_NUMBER, CLASS_LINK];
export const SECTION_FIELD_NAMES = [TITLE, INSTRUCTOR, DEPT, YEAR, AVG, PASS, FAIL, AUDIT];
export const ROOMS_FIELD_NAMES = [FULLNAME, SHORTNAME, NUMBER, NAME, ADDRESS, LAT, LON, SEATS, TYPE, FURNITURE, HREF];
export const LOGIC = [AND, OR];
export const COMPARATOR = [LT, GT, EQ, IS];
export const OPTION_KEYS = [COLUMNS_STR, ORDER];
export const NUMBER_FIELDS = [YEAR, AVG, PASS, FAIL, AUDIT, LT, GT, EQ, LAT, LON, SEATS, MAX,
    MIN, APPLY_TOKEN_AVG, SUM, COUNT];
export const STRING_FIELDS = [UUID, ID, TITLE, INSTRUCTOR, DEPT, IS, FULLNAME, SHORTNAME, NUMBER, NAME, ADDRESS,
    TYPE, FURNITURE, HREF, COUNT];
export const BASE_URL_GEOLOCATION = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team125/";
export const BASE_QUERY = {
    "WHERE": {},
    "OPTIONS": {
        "COLUMNS": [],
        "ORDER": {
            "dir": "DOWN",
            "keys": [
                "sections_avg"
            ]
        }
    }
}

export const ACTIONS = {
    SET_DATASET: 0,
    SET_COLUMNS: 1,
    SET_SORT_OPTIONS: 2,
    SET_WHERE: 3,
    SET_QUERY_RESULT: 4,
    SET_ERROR_MSG: 5,
}


export const DATASET = 0;
export const COLUMNS = 1;
export const SORT_OPTIONS = 2;
export const WHERE = 3;
export const QUERY_RESULT = 4;
export const ERROR_MSG = 5 ;


export const BASE_STATE = {
    0: "sections",
    1: [],
    2: {},
    3: {},
    4: [],
    5: "",
}
