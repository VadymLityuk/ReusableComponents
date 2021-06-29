import React, { ChangeEvent  } from "react";
import { RouteComponentProps } from "react-router-dom";
import axios from "axios";
import Moment from "moment";
import { connect } from 'react-redux';
import { AppState } from 'types/index';
import momentLocalizer from 'react-widgets-moment';
import { SelectComponent, StringTranslator, translateString, isNullOrUndefined } from 'components/HelperMethods/ReusableComponents';
import 'react-widgets/dist/css/react-widgets.css';
import { Box, Chip, ListItem, ListItemText, Typography, Tooltip, TextField, MenuItem ,Tabs,AppBar,Tab,Paper,Button} from "@material-ui/core";
import MaterialTable, { MTableToolbar, MTableBody } from '@material-table/core';
import ReactTable from 'react-table';
import { icons } from '../../HelperMethods/ReusableComponents';
import { LinkTitle } from 'components/LinkTitle';
import { NewWorkflowModal } from 'components/ProductionForAction/Modals/Modals';
//import uniqBy from 'lodash/uniqBy';
import { DateTimePicker } from 'react-widgets';
import { errorLogMessages, logMessages, errorMessages } from 'components/ProductionForAction/LogMessages';
import uuidv4 from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPencilAlt, faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import _, { uniqBy } from 'lodash';
import { DeleteWorkflowModal } from '../Modals/Modals';
import { BiMessageSquareAdd } from 'react-icons/bi';
import { sizing } from '@material-ui/system';
import { CSSTransition } from 'react-transition-group';
import Grid, { GridSpacing } from '@material-ui/core/Grid';
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import momentPlugin from '@fullcalendar/moment';
import timeGridPlugin from '@fullcalendar/timegrid'
import EventIcon from '@material-ui/icons/Event';
import TocIcon from '@material-ui/icons/Toc';


Moment.locale('en')
momentLocalizer()
interface ReduxState {
    state: AppState
}


const activeTab = {
      
    // backgroundColor: 'var(--primary-color)',
     backgroundColor: 'primary',
     color: 'var(--transparent-black)',
     fontSize: '18px',
     fontWeight: 'bold',
     fontFamily:'sans-serif',
     borderRadius: '2px',
     cursor: 'pointer',
     whiteSpace: 'nowrap',
 }  
 const defaultTab = {
     listStyle: 'none',
     color: 'var(--dark-gray)',
     fontFamily:'sans-serif',
     fontSize: '18px',
     fontWeight: 'bold',
     cursor: 'pointer',
     borderRadius: '3px',
     whiteSpace: 'nowrap',
     background:'white',
 }

 interface TabContainerProps {
    children?: React.ReactNode;
}



function TabContainer(props: TabContainerProps) {
    return (
        <Typography component="div"
        // style={{ padding: 8 * 3 }}
        >
            {props.children}
        </Typography>
    );
}

interface FooterCalendarProps {
    children?: React.ReactNode;
}
function FooterCalendar(props: TabContainerProps) {
    return (
        <div style={{  backgroundColor: '#2C3E50',paddingBottom: '11px',borderRadius: '3px',color: 'white',textAlign: 'center',fontWeight: 'bold'}}> </div>
    );
}






type Props = ReduxState & RouteComponentProps<{}>;

class WorkflowDashboard extends React.Component<
    Props,
    {
        server: any;
        currentUserID: AnalyserNode;
        startDate: Date,
        endDate: Date,
        modalIsOpened: boolean;
        dateFilter: boolean;
        workflowTitle: string;
        workflowStep: string;
        currentColor: string;
        filterAll: string,
        userID: string;
        step: string;
        steps: Array<any>;
        tableData: Array<any>;
        filteredTableData: Array<any>,
        tableColumns: Array<any>;
        openInstructionsModal: boolean;
        fullListArray: Array<any>;
        listArray: Array<any>;
        secondListArray: Array<any>;
        workflows: Array<any>;
        permissionCodes: Array<any>;
        showDeleteWorkflowModal: boolean;
        selectedRowData: Array<any>;
        CustomTransactionKey: Array<any>
        disableClick: boolean
        disableClickSecond: boolean
        tabValue: number;
        EventDate: Array<any>,
        fieldsContent: any;
        eventsTimeline: any;
        isDatePicked: boolean;
    }
> {

    constructor(props) {
        super(props);
        let server = !isNullOrUndefined(localStorage.getItem('servername')) ? localStorage.getItem('servername') : "";
        const userId = !isNullOrUndefined(localStorage.getItem('userID')) ? localStorage.userID : "";
        // this.handleCreatedDate = this.handleCreatedDate.bind(this);
        // this.handleDueDate = this.handleDueDate.bind(this);
        this.state = {
            server: server,
            showDeleteWorkflowModal: false,
            currentUserID: userId,
            startDate: new Date(),
            endDate: new Date(),
            modalIsOpened: false,
            openInstructionsModal: false,
            dateFilter: false,
            userID: '',
            workflowTitle: '',
            workflowStep: '',
            currentColor: 'rgba(52, 152, 219, 0.7)',
            filterAll: '',
            step: translateString('Assigned'),
            steps: [
                
                { value: translateString('Assigned') },
                { value: translateString('Completed') },
                { value: translateString('Pending') },
                { value: translateString('Unclaimed') }
            ],
            tableData: new Array(),
            filteredTableData: new Array(),
            tableColumns: new Array(),
            fullListArray: new Array(),
            listArray: new Array(),
            secondListArray: new Array(),
            workflows: new Array(),
            permissionCodes: new Array(),
            selectedRowData: new Array(),
            CustomTransactionKey: new Array(),
            disableClick: false,
            disableClickSecond: false,
            tabValue: 0,
            EventDate: new Array(),
            fieldsContent: {},
            eventsTimeline: {},
            isDatePicked: false,
        }

    }

    componentDidMount() {
        let { workflows } = this.state;
        axios.get(`${this.state.server}/api/getWorkflows/${0}/${0}`)
            .then(res => {
                if (res.status === 200) {
                    workflows = res.data;
                    this.setState({ workflows, startDate: new Date(new Date().setDate(new Date().getDate() - 30)) }, this.fetchPermissions);
                }
            })
            .catch(err => {
                errorLogMessages(err);
            })
            console.log( 'KEY: ' , this.state.CustomTransactionKey)
           // this.fetchWorkFlows
            // this.handleCreatedDate()
            // this.handleDueDate()
    }

    fetchPermissions = () => {
        let userID = localStorage.userID;
        let pathName = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];
        let optionCodes: any = [];
        if (userID) {
            axios.get(`${this.state.server}/api/authorizedoptions/${userID}/${pathName}`).then((res) => {
                let data = res.data;
                if (data.length > 0) {
                    data.forEach((value: any) => {
                        optionCodes.push(value.OptionCode);
                    })
                }
                this.setState({ permissionCodes: optionCodes ,step: "Assigned", }, () => {
                    this.fetchWorkFlows()
                   // this.getResourceTimeline()
                })
            })
        }
    }
    // getResourceTimeline = ()=>{
    //     let fieldsContent = new Array();
    //     let userID = localStorage.userID;
    //     let dataList = new Array();
    //     axios.get(`${this.state.server}/api/getAssigned?workflowKey=${null}&userKey=${userID}&beginDate=${null}&endDate=${null}`)
    //     .then(res => {
    //         dataList = res.data;
    //         let mydata = new Array();
    //         dataList.forEach((v: any) => {
    //             // [
    //             //     {
    //             //       field: 'branch',
    //             //       headerContent: 'Branch  '
    //             //     },
    //             //     {
    //             //       field: 'id', 
    //             //       headerContent: 'Id'
    //             //     },
    //             //     {
    //             //      field: 'task',
    //             //      headerContent: 'Task'
    //             //     }
    //             //   ]
           
    //        mydata.push( {
    //               field: 'branch',
    //               headerContent: v.DisplayInfo1_Title
    //             },
    //             {
    //               field: 'id', 
    //               headerContent: v.CustomTransactionNumber
    //             },
    //             {
    //              field: 'task',
    //              headerContent: v.DisplayInfo3_Title
    //             })
            
    //         // mydata.push({ daysOfWeek: [elem.DOW - 1],
    //         //     startTime:  elem.dp2,
    //         //     endTime: elem.FP2})
    //     })
    //     fieldsContent = mydata
    //     this.setState({fieldsContent})
    //     console.log( "testArray  list" ,  fieldsContent)

    //     });
        

    // }
   handleCreatedDate =() => {
       
    const self = this;
    self.setState({isDatePicked: true}, () => {
        this.fetchWorkFlows();});
    console.log('date created button')
  }
    
   handleDueDate =() => {
    const self = this;
    self.setState({isDatePicked: false}, () => {
        this.fetchWorkFlows();});
    
    console.log('date due button')
  }

    fetchWorkFlows () {
        let fieldsContent = new Array();
        let eventsTimeline = new Array();
        let userID = localStorage.userID;
        let fullListArray = new Array();
        let listArray = new Array();
        let CalleArray = new Array();
        let DataCalle = new Array();
        let DateChoise = this.state.isDatePicked
        axios.get(`${this.state.server}/api/getAssigned?workflowKey=${null}&userKey=${userID}&beginDate=${null}&endDate=${null}`)
        .then(res => {
            if (res.status === 200) {
                fullListArray = res.data;

                fullListArray.forEach((d, i) => {
                    d.ID = uuidv4();
                    d.IsSelected = false;
                });

                CalleArray = uniqBy(fullListArray,'DueDate');

                CalleArray.forEach((v,s)=> {
                    v.Count = 0;
                    fullListArray.forEach((e, j) => {
                        if (v.DueDate === e.DueDate) {
                            v.Count++;
                        }
                    });
                });

                listArray = uniqBy(fullListArray, 'WorkflowKey');

                listArray.forEach((d, i) => {
                    d.Count = 0;
                    fullListArray.forEach((e, j) => {
                        if (d.WorkflowKey === e.WorkflowKey) {
                            d.Count++;
                        }
                    });
                });
                //TimeLine Params
                let mydata = new Array();
                let events = new Array();
                fullListArray.forEach((elem: any) => {
                    // [
                    //     {
                    //       field: 'branch',
                    //       headerContent: 'Branch  '
                    //     },
                    //     {
                    //       field: 'id', 
                    //       headerContent: 'Id'
                    //     },
                    //     {
                    //      field: 'task',
                    //      headerContent: 'Task'
                    //     }
                    //   ]
               mydata.push( {
                branch: elem.DisplayInfo1_Title,
                id: elem.CustomTransactionNumber,
                task: elem.WorkflowStepDescription,
                businessHours: true
               // eventColor: '#e3dac9'
                   })
                   if (DateChoise === false) {
                    events.push(
                        { id: '', 
                        resourceId: elem.CustomTransactionNumber, 
                        start: Moment(elem.DueDate).utc().format("YYYY-MM-DD HH:mm:ss"),
                        end:  Moment(elem.DueDate).utc().format("YYYY-MM-DD HH:mm:ss"), 
                        title: elem.WorkflowStepDescription }
                         )} 
                   else { 
                    events.push(
                        { id: '', 
                        resourceId: elem.CustomTransactionNumber, 
                        start: Moment(elem.DateCreated).utc().format("YYYY-MM-DD HH:mm:ss"),
                        end:  Moment(elem.DateCreated).utc().format("YYYY-MM-DD HH:mm:ss"), 
                        title: elem.WorkflowStepDescription }
                         )}
                 })
            fieldsContent = mydata
            eventsTimeline = events
                this.setState({
                    dateFilter: false,
                    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                    endDate: new Date(),
                    currentColor: 'rgba(52, 152, 219, 0.7)',
                    listArray,
                    fullListArray,
                    workflowTitle: '',
                    workflowStep: '',
                    tableData: new Array(),
                    tableColumns: new Array(),
                    secondListArray: new Array(),
                    fieldsContent,
                    eventsTimeline,
                }, () => [
                    this.fetchWorkflowList(this.state.step)
                ]);
            }
        })
        .catch(err => {
            errorLogMessages(err);
        })
        
        console.log('Boolean value',DateChoise)
    }

    getWorkflowsTypes = (workflowKey: string, title: string) => {
        let { fullListArray, listArray } = this.state;
        let workflowTitle = title;
        let secondListArray = new Array();
        let filteredSecondListArray = new Array();

        for (let i = 0; i < listArray.length; i++) {
            listArray[i].IsSelected = false;

            if (listArray[i].WorkflowKey === workflowKey) {
                listArray[i].IsSelected = true;
            }
        }

        //Finding all instances of the same workflow
        fullListArray.forEach((d, i) => {
            if (d.WorkflowKey === workflowKey) {
                secondListArray.push(d);
            }
        });

        //Divide them by their step (Start, End, Ongoing, etc).
        filteredSecondListArray = uniqBy(secondListArray, 'WorkflowStepKey');

        filteredSecondListArray.forEach((d, i) => {
            d.StepCount = 0;
            d.IsStepSelected = false;
            d.CustomTransactionKeys = new Array();
            secondListArray.forEach((e, j) => {
                if (d.WorkflowStepKey === e.WorkflowStepKey) {
                    d.CustomTransactionKeys.push(e.CustomTransactionKey);
                    d.StepCount++;
                }
            })
        });
        this.setState({ secondListArray: filteredSecondListArray, listArray, workflowTitle, tableData: new Array(), tableColumns: new Array() , disableClick : false }, () => {
            if (this.state.secondListArray.length > 0)
                this.getTableInfo(this.state.secondListArray[0].CustomTransactionKeys, this.state.secondListArray[0].ModelID, this.state.secondListArray[0].WorkflowStepDescription, this.state.secondListArray[0].ID)
        });
    }

    getTableInfo = (customKeys: Array<any>, modelID: string, step: string, ID: string) => {
        let { startDate, endDate, secondListArray } = this.state;
        let tableColumns = new Array();
        let tableData = new Array();
        let startDateString = Moment.utc(startDate).format("MM-DD-YYYY");
        let endDateString = Moment.utc(endDate).format("MM-DD-YYYY");
        let keysString = customKeys.toString();
        let workflowStep = "";
        for (let i = 0; i < secondListArray.length; i++) {
            secondListArray[i].IsStepSelected = false;

            if (secondListArray[i].ID === ID) {
                secondListArray[i].IsStepSelected = true;
            }
        }

        workflowStep = step;

        if (this.state.step === 'Completed') {
            let PivotTransactionParams = {
                modelID: modelID,
                startDateString: startDateString,
                endDateString: endDateString,
                keysString: keysString
            };
            axios.post(`${this.state.server}/api/pivotTransaction`, PivotTransactionParams)
                .then(res => {
                    if (res.status === 200) {
                        //Dynamic Material Table Data
                        for (let i = 0; i < res.data.length; i++) {
                            tableData.push(res.data[i]);
                        }

                        tableColumns.push({
                            minResizeWidth: 150,
                            Header: translateString("View/Edit"),
                            Cell: this.renderEditDelete
                        });

                        //Dynamic Material Table Columns
                        for (let i = 0; i < Object.keys(res.data[0]).length; i++) {
                            tableColumns.push({
                                minResizeWidth: 150,
                                Header: Object.keys(res.data[0])[i],
                                accessor: Object.keys(res.data[0])[i],
                            });
                        }

                        tableColumns.push({
                            Header: "",
                            id: 'all',
                            width: 0,
                            resizable: false,
                            sortable: false,
                            Filter: () => { },
                            getProps: () => {
                                return {
                                }
                            },
                            filterMethod: (filter: any, rows: any) => {
                                const result = _.filter(rows, function (item) {
                                    let values = Object.values(item);
                                    return (values.includes(filter.value));
                                })
                                return result;
                            },
                            filterAll: true,
                        });

                        this.setState({ tableData, tableColumns, workflowStep, secondListArray, disableClick : false , disableClickSecond : false });
                        // test: 1 of 4  repeat clicking
                        // this.setState({ tableData, tableColumns, workflowStep, secondListArray, disableClick : true , disableClickSecond : true });
                    }
                    else {
                        this.setState({
                            disableClick : false , disableClickSecond : false
                        })
                    }
                }).catch(error => {
                    errorLogMessages(error);
                })
        }
        else {
            let PivotTransactionParams = {
                modelID: modelID,
                startDateString: startDateString,
                endDateString: endDateString,
                keysString: keysString
            };
            axios.post(`${this.state.server}/api/pivotTransaction`, PivotTransactionParams)
                .then(res => {
                    if (res.status === 200) {
                        //Dynamic Material Table Data
                        for (let i = 0; i < res.data.length; i++) {
                            tableData.push(res.data[i]);
                        }

                        tableColumns.push({
                            minResizeWidth: 150,
                            Header: translateString("View/Edit"),
                            Cell: this.renderEditDelete
                        });

                        //Dynamic Material Table Columns
                        for (let i = 0; i < Object.keys(res.data[0]).length; i++) {
                            tableColumns.push({
                                minResizeWidth: 150,
                                Header: Object.keys(res.data[0])[i],
                                accessor: Object.keys(res.data[0])[i],
                            });
                        }

                        tableColumns.push({
                            Header: "",
                            id: 'all',
                            width: 0,
                            resizable: false,
                            sortable: false,
                            Filter: () => { },
                            getProps: () => {
                                return {
                                }
                            },
                            filterAll: true,
                        });
                        this.setState({ tableData, tableColumns, workflowStep, secondListArray , disableClick : false , disableClickSecond : false },
                            ()=>{
                            });
                        // test: 2 of 4 repeat clicking
                        // this.setState({ tableData, tableColumns, workflowStep, secondListArray ,disableClick : true , disableClickSecond : true });
                    }
                    else{
                        this.setState({
                            disableClick : false , disableClickSecond : false
                        })
                    }
                }).catch(error => {
                    errorLogMessages(error);
                })
        }
    }

    handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.currentTarget;
        this.fetchWorkflowList(value)
    }

    fetchWorkflowList(value) {
        let { startDate, endDate } = this.state;
        let listArray = new Array();
        let fullListArray = new Array();
        let startDateString = Moment.utc(startDate).format("MM-DD-YYYY");
        let endDateString = Moment.utc(endDate).format("MM-DD-YYYY");
        let UserKey = localStorage.getItem('userID')

        if (value === "Assigned") {
            axios.get(`${this.state.server}/api/getAssigned?workflowKey=${null}&userKey=${UserKey}&beginDate=${null}&endDate=${null}`)
                .then(res => {
                    if (res.status === 200) {
                        fullListArray = res.data;

                        fullListArray.forEach((d, i) => {
                            d.ID = uuidv4();
                            d.IsSelected = false;
                        });

                        listArray = uniqBy(fullListArray, 'WorkflowKey');

                        listArray.forEach((d, i) => {
                            d.Count = 0;
                            fullListArray.forEach((e, j) => {
                                if (d.WorkflowKey === e.WorkflowKey) {
                                    d.Count++;
                                }
                            });
                        });

                        this.setState({
                            step: value,
                            dateFilter: false,
                            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                            endDate: new Date(),
                            currentColor: 'rgba(52, 152, 219, 0.7)',
                            listArray,
                            fullListArray,
                            workflowTitle: '',
                            workflowStep: '',
                            tableData: new Array(),
                            tableColumns: new Array(),
                            secondListArray: new Array()
                        }, () => {
                            if (listArray.length > 0)
                                this.getWorkflowsTypes(listArray[0].WorkflowKey, listArray[0].WorkflowDescription)
                        });
                    }
                })
                .catch(err => {
                    errorLogMessages(err);
                })
        }
        else if (value === "Completed") {
            axios.get(`${this.state.server}/api/getCompleted?workflowKey=${null}&userKey=${null}&beginDate=${startDateString}&endDate=${endDateString}`)
                .then(res => {
                    if (res.status === 200) {
                        fullListArray = res.data;
                        fullListArray.forEach((d, i) => {
                            d.ID = uuidv4();
                            d.IsSelected = false;
                        });

                        listArray = uniqBy(fullListArray, 'WorkflowKey');

                        listArray.forEach((d, i) => {
                            d.Count = 0;
                            fullListArray.forEach((e, j) => {
                                if (d.WorkflowKey === e.WorkflowKey) {
                                    d.Count++;
                                }
                            });

                        });

                        this.setState({
                            step: value,
                            dateFilter: true,
                            currentColor: 'rgba(0, 177, 106, 0.7)',
                            listArray,
                            fullListArray,
                            workflowTitle: '',
                            workflowStep: '',
                            tableData: new Array(),
                            tableColumns: new Array(),
                            secondListArray: new Array()
                        }, () => {
                            if (listArray.length > 0)
                                this.getWorkflowsTypes(listArray[0].WorkflowKey, listArray[0].WorkflowDescription)
                        });
                    }
                })
                .catch(err => {
                    errorLogMessages(err);
                })
        }
        else if (value === "Pending") {
            axios.get(`${this.state.server}/api/getPending?workflowKey=${null}&userKey=${null}&beginDate=${null}&endDate=${null}`)
                .then(res => {
                    if (res.status === 200) {
                        fullListArray = res.data;

                        fullListArray.forEach((d, i) => {
                            d.ID = uuidv4();
                            d.IsSelected = false;
                        });
                        listArray = uniqBy(fullListArray, 'WorkflowKey');
                        listArray.forEach((d, i) => {
                            d.Count = 0;
                            fullListArray.forEach((e, j) => {
                                if (d.WorkflowKey === e.WorkflowKey) {
                                    d.Count++;
                                }
                            });
                        });

                        this.setState({
                            step: value,
                            dateFilter: false,
                            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                            endDate: new Date(),
                            currentColor: 'rgba(248, 148, 6, 0.7)',
                            listArray,
                            fullListArray,
                            workflowTitle: '',
                            workflowStep: '',
                            tableData: new Array(),
                            tableColumns: new Array(),
                            secondListArray: new Array()
                        }, () => {
                            if (listArray.length > 0)
                                this.getWorkflowsTypes(listArray[0].WorkflowKey, listArray[0].WorkflowDescription)
                        });
                    }
                })
                .catch(err => {
                    errorLogMessages(err);
                })
        }
        else if (value === "Unclaimed") {
            axios.get(`${this.state.server}/api/getUnclaimed?workflowKey=${null}&userKey=${null}&beginDate=${null}&endDate=${null}`)
                .then(res => {
                    if (res.status === 200) {
                        fullListArray = res.data;

                        fullListArray.forEach((d, i) => {
                            d.ID = uuidv4();
                            d.IsSelected = false;
                        });

                        listArray = uniqBy(fullListArray, 'WorkflowKey');

                        listArray.forEach((d, i) => {
                            d.Count = 0;
                            fullListArray.forEach((e, j) => {
                                if (d.WorkflowKey === e.WorkflowKey) {
                                    d.Count++;
                                }
                            });
                        });

                        this.setState({
                            step: value,
                            dateFilter: false,
                            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                            endDate: new Date(),
                            currentColor: 'rgba(240, 52, 52, 0.7)',
                            listArray,
                            fullListArray,
                            workflowTitle: '',
                            workflowStep: '',
                            tableData: new Array(),
                            tableColumns: new Array(),
                            secondListArray: new Array()
                        }, () => {
                            if (listArray.length > 0)
                                this.getWorkflowsTypes(listArray[0].WorkflowKey, listArray[0].WorkflowDescription)
                        });
                    }
                })
                .catch(err => {
                    errorLogMessages(err);
                })
        }
    }


    completedWorkflowDateFilter = () => {
        let { startDate, endDate } = this.state;
        let startDateString = Moment.utc(startDate).format("MM-DD-YYYY");
        let endDateString = Moment.utc(endDate).format("MM-DD-YYYY");
        let listArray = new Array();
        let fullListArray = new Array();

        axios.get(`${this.state.server}/api/getCompleted?workflowKey=${null}&userKey=${null}&beginDate=${startDateString}&endDate=${endDateString}`)
            .then(res => {
                if (res.status === 200) {
                    fullListArray = res.data;

                    fullListArray.forEach((d, i) => {
                        d.ID = uuidv4();
                    });

                    listArray = uniqBy(fullListArray, 'WorkflowKey');

                    listArray.forEach((d, i) => {
                        d.Count = 0;
                        fullListArray.forEach((e, j) => {
                            if (d.WorkflowKey === e.WorkflowKey) {
                                d.Count++;
                            }
                        });
                    });

                    this.setState({ listArray, fullListArray, workflowTitle: '', workflowStep: '', tableData: new Array(), tableColumns: new Array() });
                }
            })
            .catch(err => {
                errorLogMessages(err);
            })
    }

    handleStartDateChange = (value: any) => {
        let date: Date = !isNaN(value) ? new Date(value) : new Date();

        this.setState({ startDate: date }, this.completedWorkflowDateFilter);
    }

    handleEndDateChange = (value: any) => {
        let date: Date = !isNaN(value) ? new Date(value) : new Date();

        this.setState({ endDate: date }, this.completedWorkflowDateFilter);
    }

    openModal = () => {
        this.setState({ modalIsOpened: true });
    }

    closeModal = () => {
        this.setState({ modalIsOpened: false });
    }

    createWorkflow = (workflow) => {
        this.props.history.push({
            pathname: `/P4A/workflow/${workflow}/0`,
            state: {
                from: this.props.location.pathname,
            }
        });
    }

    editWorkflow = (rowData: any) => {
        let { secondListArray, fullListArray } = this.state;
        let statusKey = "";

        fullListArray.forEach((d, i) => {
            if (d.CustomTransactionKey === rowData.CustomTransactionKey) {
                statusKey = d.WorkflowStatusKey;
            }
        });

        axios.get(`${this.state.server}/api/workflowCheckAccess?workflowStatusKey=${statusKey}&userKey=${localStorage.userID}`)
            .then(res => {
                if (res.status === 200) {
                    if (res.data[0].AccessLevel === 1) {
                        this.props.history.push({
                            pathname: `/P4A/workflow/${secondListArray[0].WorkflowKey}/${statusKey}`,
                            state: {
                                from: this.props.location.pathname,
                                customTransactionKey: rowData.CustomTransactionKey,
                                isReadOnly: 1
                            }
                        });
                    }
                    else if (res.data[0].AccessLevel === 2) {
                        this.props.history.push({
                            pathname: `/P4A/workflow/${secondListArray[0].WorkflowKey}/${statusKey}`,
                            state: {
                                from: this.props.location.pathname,
                                customTransactionKey: rowData.CustomTransactionKey,
                                isReadOnly: 0
                            }
                        });
                    }
                    else {
                        errorMessages("You do not have the access to modify a workflow");
                    }
                }
            })
            .catch(err => {
                errorLogMessages(err);
            })
    }

    deleteWorkflow = (rowData: any) => {
        let { secondListArray, selectedRowData , tableData } = this.state;
        let UserKey = localStorage.getItem('userID');
        let apiEndpointDetails = `${this.state.server}/api/deleteWorkflowTransaction`;
        let reqBodyDetails = {
            customTransactionKey: selectedRowData.CustomTransactionKey,
            UserKey: UserKey
        };
        // console.log(secondListArray, selectedRowData ,tableData, "---------secondListArray, selectedRowData ,tableData,---------------")
        axios.put(apiEndpointDetails, reqBodyDetails)
            .then((res) => {
                if (res.status === 200) {
                    logMessages("Success!", "200", "Deleted Workflow Succesfully!", 3000, "success");
                    // [AL 03-29-2021] - filter out deleted item on existing data to check condition on which function to call next
                    //                   whether to refresh the whole list or to just refresh table data
                    tableData = tableData.filter( data => data !== selectedRowData)
                    secondListArray.map((data: any)=>{
                        let filteredSecondKey = new Array()
                        data.CustomTransactionKeys.map(( key : any )=>{
                            if(key !== selectedRowData.CustomTransactionKey ){
                                filteredSecondKey.push(key)
                            }
                        })
                        data.CustomTransactionKeys = filteredSecondKey
                        data.StepCount = data.StepCount - 1
                        data.Count = data.Count - 1
                    })
                    this.setState({ showDeleteWorkflowModal: false , tableData , secondListArray },()=>{
                        if(tableData.length === 0 && secondListArray.length === 1 ){
                            this.fetchWorkFlows()
                        }
                        else{
                            this.getTableInfo(secondListArray[0].CustomTransactionKeys, secondListArray[0].ModelID, secondListArray[0].WorkflowStepDescription, secondListArray[0].ID);
                        }
                    });
                }
            }).catch(error => {
                errorLogMessages(error);
                this.setState({ showDeleteWorkflowModal: false });
            });
    }

    filterContent = (e: ChangeEvent<any>) => {
        const { tableData, tableColumns } = this.state;
        let filterAll = e.target.value;
        let filteredTableData = tableData.filter(value => {
            for (let i = 1; i < tableColumns.length; i++) {
                if (value[tableColumns[i].accessor] !== null && value[tableColumns[i].accessor] !== undefined) {
                    if (value[tableColumns[i].accessor].toString().toLowerCase().includes(filterAll.toLowerCase())) {
                        return value;
                    }
                }
            }
        });
        this.setState({ filteredTableData, filterAll });
    }

    renderEditDelete = (cellInfo: any) => {


      

        let { tableData, permissionCodes, filterAll, filteredTableData } = this.state;
        let rowData = tableData[cellInfo.index]
        if (filterAll.length > 0)
            rowData = filteredTableData[cellInfo.index]
        return (

            <div>
                <Tooltip title={translateString("Edit Workflow")}>
                    <button
                        className="formButton"
                        style={{ backgroundColor: 'var(--primary-color)', borderColor: '#84888a', color: 'white' }}
                        onClick={() => this.editWorkflow(rowData)}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                </Tooltip>
                &nbsp;
                <Tooltip title={translateString("Delete Workflow")}>
                    <button
                        className="formButton"
                        style={{ backgroundColor: 'var(--primary-color)', borderColor: '#84888a', color: 'white' }}
                        onClick={() => this.openDeleteWorkflowModal(rowData)}>
                        <FontAwesomeIcon icon={faTrash} />
                    </button>

                </Tooltip>

            </div>
        )
    }

    openDeleteWorkflowModal = (rowData: any) => {
        this.setState({ showDeleteWorkflowModal: true, selectedRowData: rowData })
    }

    closeDeleteWorkflowModal = () => {
        this.setState({ showDeleteWorkflowModal: false, }, () => {
        });
    }

    handleDateClick = (dateClickInfo: any) => {
    <Tooltip>{dateClickInfo.dateStr}</Tooltip>
        console.log(dateClickInfo.dateStr);
    }


    render() {

    //   const handleDateClick = (dateClickInfo: any)=> {
        
    //     console.log(dateClickInfo.dateStr);
    // }
    
        const { step,
            steps,
            tableColumns,
            tableData,
            filteredTableData,
            listArray,
            currentColor,
            startDate,
            endDate,
            dateFilter,
            workflowTitle, 
            workflowStep,
            secondListArray,
            workflows,
            modalIsOpened,
            filterAll,
            disableClick,
            disableClickSecond,
            tabValue ,
            EventDate,
            fullListArray,
            fieldsContent,
            eventsTimeline,
            isDatePicked,
            } = this.state;
            
            let DateButton;
            let DueButton;

            DueButton = <Button variant="outlined"  onClick={this.handleDueDate} style={{fontWeight: 'bold'}} >{translateString('Due Date')}</Button>;
            DateButton = <Button  variant="contained" style={{backgroundColor: 'var(--primary-color)',fontWeight: 'bold',color: 'white'}} onClick={this.handleCreatedDate} >{translateString('created date')}</Button>;

            console.log( 'list array' , fullListArray,fieldsContent, " events" , eventsTimeline)
        return (
            <div>
                <div className='container-fluid' id="workflowDashboard" >
                    <LinkTitle />
                    <Grid container direction="row" spacing={2}>
                        <Grid item xs={12} md={3}> 
                            <div className="WorkflowStep" ><p>WORKFLOW STEPS</p> </div>
                            <SelectComponent
                                name="step"
                                value={step}
                                options={steps}
                                enableAll={false}
                                handleChange={this.handleChange} />
                            <Box display="flex" justifyContent="center" style={{ backgroundColor: "var(--primary-color)", color: "white" }}>
                                <Typography variant="h6"><StringTranslator>Workflows</StringTranslator></Typography>
                            </Box>
                            <div className="" >
                                <Box style={{ backgroundColor: 'var(  --dark-gray)', borderRadius: '6px', overflow: 'auto' }} > {/* , boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' */}
                                    <Box className="landSize2" style={{ height: '20vh' }}>
                                        <div className="workflow-scroll-primary">
                                            <div className="listitem" >
                                                {listArray.map((value) => {
                                                    return (
                                                        <ListItem
                                                            button
                                                            selected={value.IsSelected}
                                                            disabled = {value.IsSelected ? disableClick : false }
                                                            onClick={() => {
                                                                this.setState({disableClick : true},()=>{
                                                                    if (!disableClick) {
                                                                         //test 3 of 4 repeat 
                                                                         //console.log("---it is clicking first list----")
                                                                     this.getWorkflowsTypes(value.WorkflowKey, value.WorkflowDescription)
                                                                    }
                                                                })
                                                            }}
                                                            key={value.ID} >
                                                            <ListItemText primary={value.WorkflowDescription} style={{ color: 'white', fontStyle: 'italic' }} />
                                                            <Chip style={{ backgroundColor: currentColor, color: 'white' }} label={value.Count > 99 ? 99 + '+' : value.Count} />
                                                        </ListItem>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </Box>
                                    <Box style={{ maxHeight: '40vh', paddingBottom: '2vh' }} >                                        
                                        {
                                            secondListArray.length > 0 &&
                                            <div className="workflow-scroll-secondary iPadMargin" style={{ maxHeight: '20vh'}}>
                                                <Box display="flex" justifyContent="center" style={{ backgroundColor: "var(--secondary-color)", color: "white", minHeight: '5vh' }}>
                                                    <Typography variant="h6">{workflowTitle}</Typography>
                                                </Box>
                                                {secondListArray.map((value) => {
                                                     return (
                                                        <ListItem style={{ fontStyle: 'italic' }}
                                                            selected={value.IsStepSelected}
                                                            disabled = {value.IsStepSelected ? disableClickSecond : false }
                                                            onClick={() => {
                                                                this.setState({ disableClickSecond: true }, () => {
                                                                     if (!disableClickSecond) {
                                                                         //test 4 of 4 repeat 
                                                                         //console.log("---it is clicking second list----")
                                                                         this.getTableInfo(
                                                                            value.CustomTransactionKeys,
                                                                            value.ModelID,
                                                                            value.WorkflowStepDescription,
                                                                            value.ID
                                                                        )
                                                                    }
                                                                })
                                                            }
                                                            }
                                                            key={value.ID}>
                                                            <ListItemText primary={value.WorkflowStepDescription} />
                                                            <Box marginLeft={2} />
                                                            <Chip style={{ backgroundColor: currentColor, color: 'white' }} label={value.StepCount > 99 ? 99 + '+' : value.StepCount} />
                                                        </ListItem>
                                                    )

                                                })}
                                            </div>
                                        }
                                        {
                                            dateFilter &&
                                            <Box style={{ backgroundColor: 'lightgray', height: '25vh', paddingBottom: '1vh' }}>
                                                <Box m={1}>
                                                    <label htmlFor="startDate"><StringTranslator>Start Date</StringTranslator></label>
                                                    <DateTimePicker
                                                        name="startDate"
                                                        value={startDate}
                                                        // disabled ={disableClickSecond }
                                                        onChange={this.handleStartDateChange}
                                                        parse={(str: string) => new Date(str)}
                                                        max={endDate}
                                                        id='startDate'
                                                        time={false} />
                                                </Box>
                                                <Box m={1}>
                                                    <label htmlFor="endDate"><StringTranslator>End Date</StringTranslator></label>
                                                    <DateTimePicker
                                                        name="endDate"
                                                        value={endDate}
                                                        // disabled ={disableClickSecond }
                                                        onChange={this.handleEndDateChange}
                                                        parse={(str: string) => new Date(str)}
                                                        min={startDate}
                                                        id='endDate'
                                                        time={false} />
                                                </Box>
                                            </Box>
                                        }
                                        
                                    </Box>
                                </Box>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={9} >
                            <div className="WorkflowDashGrid phoneMargin">   {/* style={dateFilter ? { marginTop: '25em' } : { marginTop: '15em' }} */}
                            <div  style={{paddingBottom: '8px'}}>
                            <AppBar position="static" color="default" >
                                <Tabs
                                    value={tabValue}
                                    onChange={(e, newValue) => this.setState({ tabValue: newValue })}
                                    indicatorColor="primary"
                                    textColor="primary"
                                    variant="fullWidth"
                                    scrollButtons="auto"
                                    className="font-weight-bold">
                                    <Tab  label={translateString("TABLE VIEW")} style={tabValue === 0 ? activeTab : defaultTab} icon={<TocIcon/>} />
                                    <Tab label={translateString("CALENDAR VIEW")} style={tabValue === 1 ? activeTab : defaultTab} icon={<EventIcon/>} />
                                </Tabs>
                            </AppBar>
                            </div>
                            {tabValue === 0 && 
                            <TabContainer>
                            <Grid container justify="space-between">
                                    <Grid item>
                                        <Typography align='justify' style={{ paddingTop: '2rem', paddingLeft: '2rem', fontSize: '19px', textTransform: 'uppercase' }}
                                            variant="inherit">{workflowTitle !== '' && workflowTitle !== null && workflowTitle !== undefined ? workflowTitle : translateString("Workflows")} - {workflowStep}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <Grid container justify="flex-end">
                                            <Grid item style={{ marginRight: '5px' }}>
                                                <TextField variant="outlined"
                                                    value={filterAll}
                                                    onChange={this.filterContent} placeholder={translateString("Search Table Contents")} />
                                            </Grid>
                                            <Grid item >
                                                <Tooltip title={translateString("New Workflow")}>
                                                    <div className="addicon">
                                                        <BiMessageSquareAdd size={'32px'} onClick={() => this.openModal()}></BiMessageSquareAdd>
                                                    </div>
                                                </Tooltip>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <ReactTable
                                    data={filterAll.length ? filteredTableData : tableData}
                                    columns={tableColumns}
                                    minRows={0}
                                    defaultPageSize={10}
                                    showPagination={true}
                                    showPageSizeOptions={true}
                                    className="WorkflowTable"
                                    rowsText={translateString("rows")}
                                    pageText={translateString("Page")}
                                    nextText={translateString("Next")}
                                    previousText={translateString("Previous")}
                                    loadingText={translateString('Loading...')}
                                    noDataText={translateString('No rows found')}
                                    ofText={translateString('of')} />
                               </TabContainer>}
                            {tabValue === 1 && 
                            <TabContainer >
                                <Grid container >
                                <Grid  style={{padding: '2px',width: '100%',backgroundColor: 'rgb(238, 238, 238)'}} >
                                    <Grid  xs={10} style={{marginLeft: '22px',textAlign: 'right',fontWeight: 'bold'}}> Show By: </Grid>
                                    <Grid container>   
                                        <Grid item xs={6} style={{textAlign: 'left'}} > <h4 style={{fontWeight: 'bold'}}>Workflow Timeline</h4>  
                                        {/* <Typography style={{fontWeight: 'bold',fontSize: '12px'}}>Workflow Title</Typography> */}
                                        </Grid>
                                        <Grid item xs={6} style={{textAlign: 'right',paddingBottom: '6px'}}>{DateButton} {DueButton}</Grid>
                                    </Grid>
                                    <div style={{ backgroundColor: 'white'}}>
                                <FullCalendar 
                                 schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
                                plugins ={[dayGridPlugin,interactionPlugin,listPlugin,momentPlugin,timeGridPlugin,resourceTimelinePlugin //timelinePlugin
                                ]}
                                initialView="resourceTimelineDay"
                                dateClick={this.handleDateClick}
                               // slotLabelFormat = 'HH:mm'
                                dayHeaderFormat={{ weekday: 'short', day: '2-digit' }}
                                eventTimeFormat = {{hour:'2-digit',minute: '2-digit',second: '2-digit', meridiem: false}}
                                selectable={true}
                                scrollTime ='08:00'
                                aspectRatio= {1.5}
                                headerToolbar={{ 
                                    left: 'today,prev,next',
                                    center: 'title',
                                    right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth,resourceTimelineYear'
                                }}
                                resourceGroupField='group'
                                resourceAreaColumns={[
                                    {
                                      field: 'branch',
                                      headerContent: ' Title'
                                    },
                                    {
                                      field: 'id', 
                                      headerContent: 'Id'
                                    },
                                    {
                                     field: 'task',
                                     headerContent: 'Task'
                                    }
                                  ]}
                                resources= {fieldsContent}
                                events={eventsTimeline}
                                 />
                                 </div>
                                </Grid>
                                  </Grid>
                        <FooterCalendar/>
                            </TabContainer>
                            }
                            </div>
                        </Grid>
                    </Grid>
                    <NewWorkflowModal
                        workflows={workflows}
                        createWorkflow={(workflow) => this.createWorkflow(workflow)}
                        openModal={modalIsOpened}
                        closeModal={this.closeModal} />
                    <DeleteWorkflowModal
                        showDeleteWorkflowModal={this.state.showDeleteWorkflowModal}
                        closeDeleteWorkflowModal={() => { this.closeDeleteWorkflowModal() }}
                        deletework={this.deleteWorkflow}
                    />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state
    };
}

export default connect(mapStateToProps, null)(WorkflowDashboard)
