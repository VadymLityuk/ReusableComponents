import * as React from "react";
import { RouteComponentProps } from 'react-router-dom';
import axios from 'axios';
import Moment from "moment";
import momentLocalizer from 'react-widgets-moment';
import { InstructionsModal, ClockInOutModal, ClockInConfirmModal, ClockOutConfirmModal } from 'components/ProductionForAction/Modals/Modals';
import "react-table/react-table.css";
import { connect } from 'react-redux';
import { AppState } from 'types/index'; 
import { Tooltip, Button, CircularProgress, Grid, Box ,FormControlLabel, Checkbox,Paper,makeStyles,IconButton, AppBar
    , Tabs,Tab, Typography,TextareaAutosize,FormControl,FormLabel,RadioGroup,Radio } from "@material-ui/core";
import SearchIcon from '@material-ui/icons/Search';
import { SelectComponent, translateString, StringTranslator, isNullOrUndefined, ThreeDotMenu } from "components/HelperMethods/ReusableComponents";
import { ErrorMessage } from "components/HelperMethods/ErrorMessage";
import { ChangeEvent, createRef } from "react";
import { GeolocatedProps, geoPropTypes, geolocated } from "react-geolocated";
import qs from 'qs';
import { logMessages, errorLogMessages } from 'components/ProductionForAction/LogMessages';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
//import { EventInput } from '@fullcalendar/core'
import { Calendar } from '@fullcalendar/core';
import momentPlugin from '@fullcalendar/moment';
import timeGridPlugin from '@fullcalendar/timegrid'
import frLocale from '@fullcalendar/core/locales/fr';
import { EditEventModal }  from "../Modals/PunchClockModal"
import { CreateEventModal }  from "../Modals/PunchClockModal"
import { TimePunchPieChart } from "../Widgets/PieCharts";
import { green,red ,grey } from '@material-ui/core/colors';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
import FitnessCenterIcon from '@material-ui/icons/FitnessCenter';
import EventIcon from '@material-ui/icons/Event';
import _, { isBuffer } from "lodash";
//import interactionPlugin from '@fullcalendar/interaction' // needed for dayClick
Moment.locale('en')
momentLocalizer()
let curWidth: any;
const delay = 2000;
let timeout: any;
/*const StyledGrid = withStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: 2,
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  }))(Paper);*/
  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),  
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
    buttonBar: {
        [theme.breakpoints.down("xs")]: {
          display: "none"
        }
    }
  }));
  const activeTab = {
    backgroundColor: '#212529',
    color: 'white',
    fontWeight: 700,
    //fontSize: '1rem',
    width:'25px'
}  

const defaultTab = {
    backgroundColor: 'white',
    color: '#212529',
    //fontWeight: 700,
    //fontSize: '1rem',
    width:'25%'
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
let cancelTokenSource = axios.CancelToken.source();
// type EventLogProps = RouteComponentProps<{}> & Props
type Props = AppState & RouteComponentProps<{}> & GeolocatedProps;

class EmployeeCalendar extends React.Component<Props | any, {
    data: Array<Response>,
    server: any;
    pathArray : Array<any>;
    compEmployeeNo : string;
    punchOperaCard : Array<any>;
    punchTimeCard : Array<any>;
    adjustedPunchTimeCard : Array<any>
    openEditEventModal: boolean;
    closeEditEventModal: boolean;
    openCreateEventModal: boolean;
    //closeEditEventModal: boolean;
    listJobNo : Array<any>;
    selectedJobNo: any;
    listOperationNo:Array<any>;
    selectedOperation: any;
    selectedTimeCard: any;
    eventDataType:string;
    rowsData: Array<any>;
    columnsData: Array<any>;
    eventToEdit: any;
    addEvent : boolean;
    currentView : any;
    journeyEmployee:any;
    shiftEmployee : Array<any>;
    listOpenedPunch : Array<any>;
    openInstructionsModal : boolean;
    infoEmployee : any;
    tabValue: number;
    openMenuThreeDot:boolean;
    anchorEl: any;
    firstLoad : boolean;
    dayWeekYear : any;
    eventToUpdateInCal : any;
    usingOption : string;
    statusEmployee : any;
    mydata : any;
    businessHours: any;
    testingHours: any;
    startTime: any;
    endTime: any;
    dow: any;
    selectedSequence : any;
    listSequences : Array<any>;
    selectedOperaCard : any;
    
}> {
    divWidth: any;
    _isMounted = false;
    private chkOC = createRef<HTMLInputElement>();
    private chkTC = createRef<HTMLInputElement>();
    private radioCleanPunch = createRef<HTMLInputElement>();
    private pieChart: React.RefObject<HTMLCanvasElement>;
    calendarRef : any
    static propTypes: any;

    constructor(props: any) {
        super(props);
        let server = !isNullOrUndefined(localStorage.getItem('servername')) ? localStorage.getItem('servername') : ""
        let userid = !isNullOrUndefined(localStorage.getItem('userID')) ? localStorage.getItem('userID') : ""
        this.pieChart = React.createRef();
        this.calendarRef = createRef<HTMLDivElement>();
        this.chkOC=createRef<HTMLInputElement>();
        this.chkTC=createRef<HTMLInputElement>();
        this.radioCleanPunch=createRef<HTMLInputElement>();

        this.state = {
            data: [],
            server: server,
            pathArray: window.location.pathname.split('/'),
            compEmployeeNo: this.props.match.params['compEmpNo'] ? this.props.match.params['compEmpNo']  : '',
            punchOperaCard: [],
            punchTimeCard: [],
            adjustedPunchTimeCard:[],
            openEditEventModal: false,
            openCreateEventModal : false,
            closeEditEventModal: false,
            listJobNo: [],
            selectedJobNo:{},
            listOperationNo: [],
            selectedOperation:{},
            selectedTimeCard:{},
            eventDataType : '',
            rowsData: [],
            columnsData: [],
            eventToEdit:{},
            addEvent:true,
            currentView : {},
            journeyEmployee:{},
            shiftEmployee : [],
            listOpenedPunch : [],
            openInstructionsModal: false,
            infoEmployee : {},
            tabValue: 0,
            openMenuThreeDot:false,
            anchorEl : null,
            firstLoad : true,
            dayWeekYear : {},
            eventToUpdateInCal:{},
            usingOption: '',//cal or mnu
            statusEmployee : {},
            mydata : {},
            businessHours: {},
            testingHours : {},
            startTime: {},
            endTime: {},
            dow:{},
            selectedSequence : {} ,
            listSequences : [],
            selectedOperaCard : {}

        }
        this.divWidth = React.createRef();
        //this.getShiftEmployee(this.props.match.params['compEmpNo'])
        
    }
    openInstructions = () => {
        this.setState({ openInstructionsModal: true });
    }
    
    closeModal = () => {
        this.setState({ openInstructionsModal: false });
    }
    gotoPunchClock = () => {
        this.props.history.push('/P4A/punchclock')
    }
    gotoPunchJob = (e? : string) => {
        if(e) this.props.history.push('/P4A/punchjob/'+e)
        else this.props.history.push('/P4A/punchjob')
    }
    addElementToHeader = () => {
        var lstCard=[
            {value:1,label:'TC'},{value:2,label:'OC'},
        ]
        const addedComponent= <div><FormControlLabel
            inputRef = {this.chkOC}
            value="oc"
            control={<Checkbox color="primary" defaultChecked
            onChange={(event) => {
                let {punchOperaCard,compEmployeeNo}=this.state
                const {activeStart,activeEnd} = this.state.currentView
                if(compEmployeeNo){
                    let events = this.calendarRef?.current.getApi().getEvents();
                    let calendarEv= this.calendarRef?.current.getApi()
                    //this.calendarRef?.current.getApi().refetchEvents()
                    if(event.currentTarget.checked){
                        //this.getAllPunchForEmployee(compEmployeeNo,Moment(activeStart).format("YYYY-MM-DD HH:mm:ss"),Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss"),'OPERA_CARD')
                        punchOperaCard.map((ev: any) => {
                            calendarEv.addEvent(ev)
                        })
                    }else{
                       //remove opera card
                       events.map((ev: any) => {
                        if(ev.extendedProps['dataType']==='OPERA_CARD'){
                            ev.remove()
                        }
                       })
                    }
                    //eventSources[1].remove()
                   // eventSources[1].refetch()
                    //this.setState({punchOperaCard})
               }
            }}/>}
            label={translateString("OPERA CARD")}
            labelPlacement="end"
        />
        <FormControlLabel
            inputRef = {this.chkTC}
            value="tc"
            control={<Checkbox color="primary" defaultChecked
            onChange={(event) => {
                let {punchTimeCard,compEmployeeNo}=this.state
                const {activeStart,activeEnd} = this.state.currentView
                if(compEmployeeNo){
                    let events = this.calendarRef?.current.getApi().getEvents();
                    let calendarEv= this.calendarRef?.current.getApi()
                    if(event.currentTarget.checked){
                        //this.getAllPunchForEmployee(compEmployeeNo,Moment(activeStart).format("YYYY-MM-DD HH:mm:ss"),Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss"),'TIME_CARD')
                        punchTimeCard.map((ev: any) => {
                            calendarEv.addEvent(ev)
                        })
                    }else{
                        events.map((ev: any) => {
                            if(ev.extendedProps['dataType']==='TIME_CARD'){
                                ev.remove()
                            }
                           })
                    }
                   // eventSources[0].remove()
                    //eventSources[0].refetch()
                   // this.setState({punchTimeCard})
               } 
            }}/>}
            label={translateString("TIME CARD")}
            labelPlacement="end"
        />
       {/*  <Select
                name="lstCard"
                //value={secondaryPackage}
                //onChange={this.handleChangePackage}
                options={lstCard}
                isMulti={true}
                closeMenuOnSelect={true}
                isSearchable
               // className={secondaryPackage.length === 0 ? "reactSelectError" : ""}
            // placeholder="Select Secondary Package(s).........."
            /> */}
        </div>
        /*const addedComponent= <div style={{width:'200px'}}>
            <Select
                name="lstCard"
                //value={secondaryPackage}
                //onChange={this.handleChangePackage}
                options={lstCard}
                isMulti={true}
                closeMenuOnSelect={true}
                isSearchable
               // className={secondaryPackage.length === 0 ? "reactSelectError" : ""}
            // placeholder="Select Secondary Package(s).........."
            />
        </div>*/
        return  addedComponent
    }
    getCardChecked = () => {
      let tcChecked= this.chkTC.current?.checked
      let ocChecked= this.chkOC.current?.checked
      let res='NONE'
      if(tcChecked && ocChecked) 
          res = 'ALL'
     else if(tcChecked) 
         res = 'TIME_CARD'
     else if (ocChecked)
       res= 'OPERA_CARD'
     else 
      res= 'NONE'
    return res
    }
    showMenuThreeDot =(event) => {
        this.setState({ anchorEl: event.currentTarget });
    }
    
    cancelAction=()=>{
        const {eventToEdit} = this.state
        clearTimeout(timeout)
        this.addOrRemoveInCalendar(eventToEdit,true)
    }
    cancelCreate = () => {
        const {server,eventToUpdateInCal,listOpenedPunch,usingOption} = this.state
        let punchTimeCard  = this.state.punchTimeCard
        const self = this
        const isopen=listOpenedPunch[0].is_open
        let keyPunchIn = 0 
        let keyPunchOut = 0 
        /*const keyPunchIn=eventToUpdateInCal.extendedProps['idPunchIn']
        const keyPunchOut=eventToUpdateInCal.extendedProps['idPunchOut'] ?  eventToUpdateInCal.extendedProps['idPunchOut'] : 0*/
        if(usingOption === 'mnu'){
            keyPunchIn = isopen ? eventToUpdateInCal.extendedProps['idPunchIn'] : 0
            keyPunchOut = isopen ? 0 : eventToUpdateInCal.extendedProps['idPunchOut']
        }else{

        }
         
         
        const dataType=eventToUpdateInCal.extendedProps['dataType']
        const dataPunch=`${server}/api/deletePunch/${dataType}/${keyPunchIn}/${keyPunchOut}`
        axios.get(dataPunch)
                .then(res => {
                   /* punchTimeCard = punchTimeCard.filter((p => p.id !==  eventToUpdateInCal.id))
                    let eventsToDelete = this.calendarRef?.current.getApi().getEvents();
                    //remove event
                    if(usingOption === 'mnu' && keyPunchIn === 0){}
                    eventsToDelete.map((ev: any) => {
                        if(ev.id === eventToUpdateInCal.id)
                                ev.remove()
                    })
                    self.setState({punchTimeCard},()=>this.getOpenedPunch(Moment().format('YYYY-MM-DD HH:mm:ss')))*/
                    self.getAllTimeCard()
                    self.getOpenedPunch(Moment(eventToUpdateInCal.start).format('YYYY-MM-DD HH:mm:ss'))
                })
    }
    cancelUpdate = () => {
        clearTimeout(timeout)
        this.updateEventInCalendar(this.state.eventToUpdateInCal,false)
        //this.state.eventToEdit.revert()
    }
    punchInOut = (emp : string , isopen : boolean) => {
        let {punchTimeCard,server,compEmployeeNo,infoEmployee} =this.state
        let requestOTime : boolean = false;
        let addedTimeCard={}
        let keyPunch = Moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let latitude = this.props.coords && this.props.coords.latitude
        let longitude = this.props.coords && this.props.coords.longitude
        const url = `${server}/api/punchinout`;
        const self = this
        let calendarApi = this.calendarRef?.current.getApi();
        //var event = calendarApi.getEventById(eventToEdit.event.id)
        let data: any = []
        data = {
            comp_employee_no: emp,
            keyPunch: keyPunch,
            requestOTime: requestOTime,
            longitude: longitude ? Number(longitude.toFixed(3)) : 0,
            latitude: latitude ? Number(latitude.toFixed(3)) : 0 ,
            notePunch: '', 
            dayNo : isopen ? infoEmployee.DAY_NO: null,
            weekNo : isopen ? infoEmployee.WEEK_NO: null,
            yearNo : isopen ? infoEmployee.YEAR_OF_PUNCH: null
        }
        const options: any = {
            method: 'PUT',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: qs.stringify(data),
            url
        };
        //const result=  this.getNestedPunchToday(punchTimeCard,dayNo,weekNo,yearNo,Moment(eventInfo.event.start).format("YYYY-MM-DD HH:mm:ss"),keyPunch)
        axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${keyPunch}`)  
             .then(res => {
                if(res.data){
                  const result= self.getNestedPunchToday(punchTimeCard.filter(p => p.end ),res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,keyPunch,keyPunch,res.data[0].shift_begin,res.data[0].shift_end)
                    if(result === ''){
                    const msg = isopen ? 'out' : 'in'
                       axios(options)
                        .then(res => {
                            const idp=res.data[0].PME_IN_ID
                                const dow=res.data[0].DOW
                                const wk=res.data[0].WK
                                const yr=res.data[0].YR
                            if(isopen){ //update event
                               let _curOpenPunch= punchTimeCard.filter(p => p.end === '' 
                                                                       && dow=== Number(p.extendedProps['dayNo'])
                                                                       && wk === Number(p.extendedProps['weekNo']) 
                                                                       && yr === Number(p.extendedProps['yearNo'])
                                                                       )
                                var event = calendarApi.getEventById(_curOpenPunch[0]['id'])//eventToEdit.event.id
                                    event.setProp('borderColor','#696969')
                                    event.setEnd(keyPunch)
                                    event.setExtendedProp('idPunchOut',res.data[0].PME_OUT_ID.toString())
                                    punchTimeCard.forEach((d) => {
                                        if(d.id === _curOpenPunch[0]['id']){
                                            d.end=keyPunch
                                            d.borderColor='#696969'
                                            d.extendedProps['idPunchOut']=res.data[0].PME_OUT_ID.toString(),
                                            d.extendedProps['rawPunchOut']=keyPunch
                                            return
                                        }
                                    })   
                            }else{//create new event in calendar
                                addedTimeCard ={
                                    id :idp.toString(),
                                    start: keyPunch,
                                    end:  '' ,
                                    editable:true,
                                    allDay:false,
                                    borderColor: '#FF0000',
                                    backgroundColor:'#696969',
                                    extendedProps:{dataType : 'TIME_CARD', noteBookIn: '', noteBookOut: '',idPunchIn:idp.toString()
                                                    , idPunchOut:'',rawPunchIn:keyPunch ,rawPunchOut:'', dayNo:dow, weekNo : wk, yearNo : yr}
                                }
                                calendarApi.addEvent(addedTimeCard)
                                calendarApi.refetchEvents()
                                punchTimeCard.push(addedTimeCard)
                            }
                            self.setState({punchTimeCard,eventToUpdateInCal:calendarApi.getEventById(idp.toString())},() => this.getInfosEmployee())
                            /*self.getAllTimeCard()
                            self.getOpenedPunch(keyPunch)*/
                            // displayMessages(translateString("Success!"), 200, translateString(`Punch  ${msg} successfully created!`) , 5000, "success",translateString('Cancel'),self.cancelCreate)
                        })
                        .catch(err => {
                            logMessages(translateString("Oops!"), 500, err , 5000, "error");
                        });
                    }else{
                        logMessages(translateString("Oops!"), 500, result , 5000, "error");
                    }
                }  
             })
             .catch(err => {
                errorLogMessages(err);
                //return '00'
            });
        
    }
    handleCloseMenu =(event) => {
        const {infoEmployee,compEmployeeNo} = this.state
        switch (event.currentTarget.id){ 
            case 'time':
                //this.gotoCalandarEmploye()
                break
            case 'inout':
                let isOpen : boolean = false
                if(infoEmployee){ 
                    isOpen = Boolean(infoEmployee.IS_PRESENT);
                }
                   this.setState({usingOption:'mnu'},() => this.punchInOut(compEmployeeNo,isOpen)) 
                break 
            case 'punch':
                    this.gotoPunchClock()
                break
            case 'jobs':
                this.gotoPunchJob(compEmployeeNo)
            break
          }
        this.setState({ anchorEl: null });
    }
    componentWillUnmount() {
        
    }
    componentDidMount() {
        //const comp_employee_no=''12
        const { server,currentView,compEmployeeNo,testingHours,startTime,endTime,dow} = this.state;
        let calendarApi = this.calendarRef?.current;
        let centerHeader=document.getElementsByClassName('fc-toolbar-chunk')[1] as HTMLDivElement
        const divAddedElement = document.createElement('div')
        centerHeader.append(divAddedElement)
        this.getAllPunchForEmployee(compEmployeeNo,Moment().weekday(0).format("YYYY-MM-DD 00:00:01"),Moment().weekday(6).format("YYYY-MM-DD 23:59:59"),'ALL','','')
        this.getHours(testingHours,startTime,endTime,dow);
    }
    manageErrorPunch =(found :string)=>{
       let msg : string = ''
        switch (found) {
            case '00' : 
            case '10' : 
                 msg = translateString("This punch cannot be created because there is one or more subsequent open/closed operation(s).")
            break
            case '01':
            case '11':
                msg = translateString("You can't open two times punch  in the same day.")
            break
            case '02':
                msg = translateString("Please close the previous operation before continuing.")
            break
            case '03':
            case '13':
                msg = translateString("You can't create a punch whose start date and/or end date is nested in another.")
            break
            case '04':
                msg = translateString("You can't create a start punch whose date is later than the current date. ")
            break
            case '05':
                 msg = translateString('A punch in the past must have an end date.') 
            break
            case '99':
            case '88':
                msg =''
            break
            default :
               msg = ''
        }
        return msg
    }
    updateTimeCard = (dataPunch : any,info :any) => {
       axios.get(dataPunch)
                .then(res => {
                    if (res.data) {

                    } else {
                        alert('echec!!!')
                        info.revert()
                    }
                    console.log('result final',res)
                })
                .catch(err => {
                    alert('echec!!!')
                    info.revert()
                    errorLogMessages(err);
                });
    }
    getNestedPunchToday = (punchs :Array<any>,dayNo : number,weekNo : number, yearNo : number, dateStart : string,dateEnd : string,shiftStart? : string,shiftEnd? :string,jobNo? : string, OperNo? :string) : string => {
        let foundA : string = '99'
        let foundB : string = '88'
        const punchsDate=punchs.filter(p => Number(p.extendedProps['dayNo']) === dayNo &&  Number(p.extendedProps['weekNo']) === weekNo &&  Number(p.extendedProps['yearNo']) === yearNo );
        const closedTC = punchsDate.filter(p => p.end );
        const openedTC = punchsDate.filter(p => p.end === '' );
        const pp = Moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        if(dateEnd === '' ){
            //foundA = '04'
            if(Moment(dateStart).isAfter(Moment(new Date()).format("YYYY-MM-DD HH:mm:ss"))) return this.manageErrorPunch('04')
            if(Moment(dateStart).isBefore(Moment(this.state.dayWeekYear.shiftBegin).format("YYYY-MM-DD HH:mm:ss"))) return this.manageErrorPunch('05')
        }
        if(openedTC.length>0){//processing if existing open tc
            if(dateEnd !== '' ){
                if(Moment(dateStart).isAfter(Moment(openedTC[0].start))){
                    foundA = '00'
                }else if(Moment(openedTC[0].start).isBetween(Moment(dateStart),Moment(dateEnd))){
                    foundA = '03'
                }
            }else {
                foundA = '01' 
            }
            
        }
        if(closedTC.length > 0){//processing if existing closed tc
            closedTC.every( ctc => {
                if(Moment(dateStart).isBetween(Moment(ctc.start),Moment(ctc.end)) || (dateEnd && (Moment(dateEnd).isBetween(Moment(ctc.start),Moment(ctc.end))))){
                    foundB = '13';
                    return foundB;
                }
                if(dateEnd === '' && Moment(dateStart).isBefore(Moment(ctc.start))){
                    foundB = '10'
                    return foundB;
                }
                return foundB
            })
        }
        if(foundA !== '99') return this.manageErrorPunch(foundA)
        else if(foundB !== '88') return this.manageErrorPunch(foundB)
        else return ''
    }
    /*
    0... pour open tc
    1... pour closed tc
    */
    checkNestedPunchOrOpera = (compEmployeeNo :string, dateStart : string,punchs :Array<any>,dateEnd : string,eventInfo? : any)  => {
        const { server } = this.state;
        let found : string='99'
        let byPass : string = '88'
        const self=this
        axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${dateStart}`)
             .then(res => {
                if(res.data){
                  const result= self.getNestedPunchToday(punchs,res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,dateStart,dateEnd)
                    if(result === ''){
                        let dataPunch=`${server}/api/updateTimeCard/${compEmployeeNo}/${eventInfo.event.extendedProps['idPunchIn']}/${dateStart}`
                        if(eventInfo.event.extendedProps['idPunchOut']){
                        const endDate=Moment(eventInfo.event.end).format("YYYY-MM-DD HH:mm:ss")
                            dataPunch += `/${eventInfo.event.extendedProps['idPunchOut']}/${endDate}`
                            
                        }else{
                            dataPunch += `/${0}/${null}`
                        }
                            self.updateTimeCard(dataPunch,eventInfo)
                    }else{
                    /* if(found === '99') found = byPass
                        alert(this.manageErrorPunch(found))*/
                        eventInfo.revert()
                        logMessages(translateString("Oops!"), 500, result , 5000, "error");//translateString("Failed to update punch!")
                    }
                }  
             })
             .catch(err => {
                errorLogMessages(err);
                //return '00'
            });
    }
    getPunchOpercard = () =>{
        
    }
    getPunchTimeCard = (compEmployeeNo :string, dateBegin : string,dateEnd? :string,dayNo? : number,weekNo? : number,yearNo? : number) => {
        const { server } = this.state;
        let punchTimeCard=Array()
        axios.get(`${server}/api/getallpunchstimecard/${compEmployeeNo}/${dateBegin}/${dateEnd}/${dayNo}/${weekNo}/${yearNo}`)
            .then(res => {
                punchTimeCard= res.data[0];
            })
            .catch(err => {
                errorLogMessages(err);
            });
        return punchTimeCard
    }
    getShiftEmployee = (comp_employee_no : string ) =>{
      const self=this
      axios.get(`${this.state.server}/api/getshiftemployee/${comp_employee_no}`)
      .then(res => {
        let shiftEmployee= new Array(); 
        shiftEmployee= res.data; 
         
        self.setState({shiftEmployee })
        
      }).catch(err => {
                errorLogMessages(err);
               
      });
    }
  

//Vadym Lityuk [03/15/2021] Get hours and week days for the full Calendar
    getHours =(testingHours,startTime,endTime,dow) =>{
        const self=this
        axios.get(`${this.state.server}/api/getshiftemployee/${this.state.compEmployeeNo}`)
        .then(res => {
            let letstartTime= new Array(); 
            letstartTime= res.data;
            //let firstStartTime = startTime[0]['DP1'];   
           // let firstendTime = startTime[0]['FP1'];   
           // let firstdow = startTime[0]['DOW' - 1];   
           /* var startTime = [];
            workinghours.forEach((elem) => {
                let a = elem.DP1;
                startTime.push(a);
            }); */
                 
          
                let mydata = new Array();
            letstartTime.forEach((elem: any) => {
                /*mydata.push({
                         daysOfWeek: [elem.DOW],
                         startTime: elem.DP1,
                         endTime: elem.FP1
                });
                mydata.push({
                         daysOfWeek: [elem.DOW],
                         startTime: elem.dp2,
                         endTime: elem.FP2
               });
               mydata.push({
                daysOfWeek: [elem.DOW],
                startTime: elem.DP1,
                endTime: elem.FP1
               });
              mydata.push({
                daysOfWeek: [elem.DOW],
                startTime: elem.dp2,
                endTime: elem.FP2
               });
            mydata.push({
           daysOfWeek: [elem.DOW],
           startTime: elem.dp2,
           endTime: elem.FP2
           });*/
           
           mydata.push({ daysOfWeek: [elem.DOW - 1],
            startTime: elem.DP1,
            endTime: elem.FP1})
            
            mydata.push({ daysOfWeek: [elem.DOW - 1],
                startTime:  elem.dp2,
                endTime: elem.FP2})
        })
          startTime = mydata
          self.setState({startTime})
           //workinghours.forEach(e => {typeMap.set(e['DP1'], e['FP1'])});
          // let data = res[0].data[0] ? res[0].data[0] : []
           // businessHours =  workinghours.length > 0 && workinghours.forEach((s: any) => { sites[s.DP1] = s.FP1 });
             //businessHours= workinghours.forEach(function (hour,index){console.log(hour.DP1)});
            //workinghours.forEach(e => console.log(e.FP1,'12 h'));
           // workinghours.forEach(e => console.log(e.dp2,'13 h'));
           // workinghours.forEach(e => console.log(e.FP2,'17 h'));
            //console.log(startTime,'Test for result')
          
        });
       
    }
    refreshCalendar = (events : any ,dataType : string) => {
       
        let eventsToDelete = this.calendarRef?.current.getApi().getEvents();
        let calendarEv= this.calendarRef?.current.getApi()
        //remove events  
        eventsToDelete.map((ev: any) => {
            if(ev.extendedProps['dataType'] === dataType) ev.remove()
        })
        //add events
        events.map((ev: any) => {
                calendarEv.addEvent(ev)
        })
        //this.setState({punchTimeCard :  events})
    }
    getAllTimeCard = () => { 
        const { server,compEmployeeNo } = this.state;
        const {activeStart,activeEnd} = this.state.currentView
        let punchTimeCard = new Array();
        let punchOperaCard = new Array();
        let adjustedPunchTimeCard = new Array();
        const checkCP = this.radioCleanPunch.current?.checked
        const self=this 
        //
        const dataPunch = [`${server}/api/getallpunchstimecard/${compEmployeeNo}/${Moment(activeStart).format("YYYY-MM-DD HH:mm:ss")}/${Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss")}/${0}/${0}/${0}`,
                           `${server}/api/getallpunchsoperacard/${compEmployeeNo}/${Moment(activeStart).format("YYYY-MM-DD HH:mm:ss")}/${Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss")}/${null}/${null}`]
        axios.all(dataPunch.map(l => axios.get(l)))
            .then(
                axios.spread(function (...res) {
         /*axios.get(`${server}/api/getallpunchstimecard/${compEmployeeNo}/${Moment(activeStart).format("YYYY-MM-DD HH:mm:ss")}/${Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss")}/${0}/${0}/${0}`)
             .then(res => {*/
                   if(res[0].data){
                        let _punchTimeCard = res[0].data;
                        _punchTimeCard.map((tc: any) => 
                        {
                            punchTimeCard.push({
                            id :tc.ID_IN_PMESYM_PUNCH,//tc.TIME_CARD_ID,
                            start: Moment(tc.DATEH_BEGIN_PUNCH).utc().format("YYYY-MM-DD HH:mm:ss"),
                            end: tc.DATEH_END_PUNCH !== null ? Moment(tc.DATEH_END_PUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                            allDay:false,
                            borderColor:tc.DATEH_END_PUNCH === null ? '#FF0000' : '#696969',
                            editable:true,
                            backgroundColor:'#696969',//color time card
                            extendedProps:{dataType : 'TIME_CARD', noteBookIn: tc.NOTE_BOOK_PUNCH_IN, noteBookOut: tc.NOTE_BOOK_PUNCH_OUT,idPunchIn:tc.ID_IN_PMESYM_PUNCH
                                            , idPunchOut:tc.ID_OUT_PMESYM_PUNCH, dayNo:tc.DAY_NO, weekNo : tc.WEEK_NO, yearNo : tc.YEAR_OF_PUNCH
                                            ,rawPunchIn:Moment(tc.DATEH_BEGIN_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss")
                                            ,rawPunchOut:tc.DATEH_END_OPUNCH !== null ? Moment(tc.DATEH_END_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : ''}
                            })
                            /*if((tc.DATEH_BEGIN_PUNCH !== tc.DATEH_BEGIN_OPUNCH) || (tc.DATEH_END_PUNCH !== tc.DATEH_END_OPUNCH)){
                                adjustedPunchTimeCard.push({
                                    id :'adj_'+tc.ID_IN_PMESYM_PUNCH,//tc.TIME_CARD_ID,
                                    start: Moment(tc.DATEH_BEGIN_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss"),
                                    end: tc.DATEH_END_OPUNCH !== null ? Moment(tc.DATEH_END_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                                    allDay:false,
                                    editable:false,
                                    borderColor:tc.DATEH_END_PUNCH === null ? '#FF0000' : '#696969',
                                    backgroundColor:'#696969',//color time card
                                    extendedProps:{dataType : 'ADJ_TIME_CARD', noteBookIn: tc.NOTE_BOOK_PUNCH_IN, noteBookOut: tc.NOTE_BOOK_PUNCH_OUT,idPunchIn:tc.ID_IN_PMESYM_PUNCH
                                                    , idPunchOut:tc.ID_OUT_PMESYM_PUNCH, dayNo:tc.DAY_NO, weekNo : tc.WEEK_NO, yearNo : tc.YEAR_OF_PUNCH}
                            
                                }) 
                            }*/
                        }
                    )
                    self.refreshCalendar(punchTimeCard,'TIME_CARD')
                    }
                    if(res[1].data){
                        res[1].data.map((oc: any) => (
                            punchOperaCard.push({
                               id :oc.ID_IN_PMESYM_OPERA,
                               start: Moment(oc.DATEH_BEGIN).utc().format("YYYY-MM-DD HH:mm:ss"),
                               end: oc.DATEH_END !== null ? (oc.DATEH_BEGIN === oc.DATEH_END) ? Moment(oc.DATEH_END).utc().add(1,'s').format("YYYY-MM-DD HH:mm:ss") : Moment(oc.DATEH_END).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                               allDay:false,
                               title:oc.OPERATION_ID,
                               borderColor:oc.DATEH_END === null ? '#FF0000' : '',
                               backgroundColor:'#3A87AD',//color operacard #3A87AD
                               extendedProps:{dataType : 'OPERA_CARD',operationNo: oc.OPERATION_ID,jobNo: oc.JOB_NO,idPunchIn:oc.ID_IN_PMESYM_OPERA,idPunchOut :oc.ID_OUT_PMESYM_OPERA
                                             , noteBookIn: oc.NOTE_BOOK_PUNCH_IN, noteBookOut: oc.NOTE_BOOK_PUNCH_OUT,sequence: oc.SEQUENCE,dayNo:oc.DAY_NO, weekNo : oc.WEEK_NO, yearNo : oc.YEAR_OF_PUNCH}
                            })
                        ))
                        self.refreshCalendar(punchOperaCard,'OPERA_CARD')
                    }
                }))
            .catch(err => {
                errorLogMessages(err);
            });
    }
    getTimeCard = () =>{
        const { server,compEmployeeNo } = this.state;
        const {activeStart,activeEnd} = this.state.currentView
        const self = this
        let punchTimeCard = new Array();
        axios.get(`${server}/api/getallpunchstimecard/${compEmployeeNo}/${Moment(activeStart).format("YYYY-MM-DD HH:mm:ss")}/${Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss")}/${0}/${0}/${0}`)
        .then(res => {
            if(res.data){
                res.data.map((tc: any) => 
                        {
                            punchTimeCard.push({
                            id :tc.ID_IN_PMESYM_PUNCH,//tc.TIME_CARD_ID,
                            start: Moment(tc.DATEH_BEGIN_PUNCH).utc().format("YYYY-MM-DD HH:mm:ss"),
                            end: tc.DATEH_END_PUNCH !== null ? Moment(tc.DATEH_END_PUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                            allDay:false,
                            borderColor:tc.DATEH_END_PUNCH === null ? '#FF0000' : '#696969',
                            editable:true,
                            backgroundColor:'#696969',//color time card
                            extendedProps:{dataType : 'TIME_CARD', noteBookIn: tc.NOTE_BOOK_PUNCH_IN, noteBookOut: tc.NOTE_BOOK_PUNCH_OUT,idPunchIn:tc.ID_IN_PMESYM_PUNCH
                                            , idPunchOut:tc.ID_OUT_PMESYM_PUNCH, dayNo:tc.DAY_NO, weekNo : tc.WEEK_NO, yearNo : tc.YEAR_OF_PUNCH
                                            ,rawPunchIn:Moment(tc.DATEH_BEGIN_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss")
                                            ,rawPunchOut:tc.DATEH_END_OPUNCH !== null ? Moment(tc.DATEH_END_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : ''}
                            })
                            
                        }
                    )
               self.refreshCalendar(punchTimeCard,'TIME_CARD')  
            }
        }).catch(err => {
            errorLogMessages(err);
        });
    }
    getOperaCard = () =>{
        const { server,compEmployeeNo } = this.state;
        const {activeStart,activeEnd} = this.state.currentView
        const self = this
        let punchOperaCard = new Array();
        axios.get(`${server}/api/getallpunchsoperacard/${compEmployeeNo}/${Moment(activeStart).format("YYYY-MM-DD HH:mm:ss")}/${Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss")}/${null}/${null}`)
        .then(res => {
            if(res.data){
                res.data.map((oc: any) => (
                    punchOperaCard.push({
                       id :oc.ID_IN_PMESYM_OPERA,
                       start: Moment(oc.DATEH_BEGIN).utc().format("YYYY-MM-DD HH:mm:ss"),
                       end: oc.DATEH_END !== null ? (oc.DATEH_BEGIN === oc.DATEH_END) ? Moment(oc.DATEH_END).utc().add(1,'s').format("YYYY-MM-DD HH:mm:ss") : Moment(oc.DATEH_END).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                       allDay:false,
                       title:oc.OPERATION_ID,
                       borderColor:oc.DATEH_END === null ? '#FF0000' : '',
                       backgroundColor:'#3A87AD',//color operacard #3A87AD
                       extendedProps:{dataType : 'OPERA_CARD',operationNo: oc.OPERATION_ID,jobNo: oc.JOB_NO,idPunchIn:oc.ID_IN_PMESYM_OPERA,idPunchOut :oc.ID_OUT_PMESYM_OPERA
                                     , noteBookIn: oc.NOTE_BOOK_PUNCH_IN, noteBookOut: oc.NOTE_BOOK_PUNCH_OUT,sequence: oc.SEQUENCE,dayNo:oc.DAY_NO, weekNo : oc.WEEK_NO, yearNo : oc.YEAR_OF_PUNCH}
                    })
                ))
                self.refreshCalendar(punchOperaCard,'OPERA_CARD')
            }
        }).catch(err => {
            errorLogMessages(err);
        });
    }
    getInfosEmployee = () => {
        const { server,compEmployeeNo } = this.state
        axios.get(`${server}/api/getinfosemployee/${compEmployeeNo}`)
        .then(res => {
            if(res.data){
                this.setState({infoEmployee:res.data[0]})  
            }
        }).catch(err => {
            errorLogMessages(err);
        });
    }
    getOpenedPunch = (keyPunch: string ) =>{
        const self=this
        axios.get(`${this.state.server}/api/getopenedpunch/${this.state.compEmployeeNo}/${keyPunch}/${'TIME_CARD'}/${null}/${null}`)
        .then(res => {
            if(res.data){
                self.setState({listOpenedPunch:res.data})  
            }
        }).catch(err => {
            errorLogMessages(err);
        });
    }
    getAllPunchForEmployee = (comp_employee_no : string , dateBegin : string , dateEnd: string,dataTypePunch :string ,jobNo : string='',operNo : string='') => {
        const { server } = this.state;
        const self=this
        let punchTimeCard=Array()
        let punchOperaCard=Array()
        let adjustedPunchTimeCard=Array()
        let dataPunch= new Array()
        let listOpenedPunch= new Array(); 
        let infoEmployee= new Array()
        let keyPunch = Moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let dayWeekYear={}
        let statusEmployee ={
            is_open : false,
            in_progress : false
        }
        if(dataTypePunch === 'ALL'){
         dataPunch = [
            `${server}/api/getallpunchstimecard/${comp_employee_no}/${dateBegin}/${dateEnd}/${0}/${0}/${0}`,
            `${server}/api/getallpunchsoperacard/${comp_employee_no}/${dateBegin}/${dateEnd}/${null}/${null}`,
            `${server}/api/getDayWeekYear/${comp_employee_no}/${keyPunch}`,
            `${server}/api/getinfosemployee/${comp_employee_no}`
            ];
        }else if(dataTypePunch === 'OPERA_CARD'){
            dataPunch = [
                `${server}/api/getallpunchsoperacard/${comp_employee_no}/${dateBegin}/${dateEnd}/${null}/${null}`
                ];
        }else{//datatypepunch=time_card
            dataPunch = [
                `${server}/api/getallpunchstimecard/${comp_employee_no}/${dateBegin}/${dateEnd}/${0}/${0}/${0}`
                ];
        }
        axios.all(dataPunch.map(l => axios.get(l)))
            .then(
                axios.spread(function (...res) {
                    let _punchTimeCard = new Array();
                    let _punchOperaCard= new Array(); 
                    if(dataTypePunch === 'ALL'){
                        _punchTimeCard = res[0].data;
                        _punchOperaCard= res[1].data; 
                       // listOpenedPunch= res[2].data;
                           infoEmployee= res[3].data[0];
                    }else if(dataTypePunch === 'OPERA_CARD'){
                        _punchOperaCard= res[0].data; 
                    }else{
                        _punchTimeCard= res[0].data; 
                    }
                    _punchTimeCard.map((tc: any) => 
                        {
                            punchTimeCard.push({
                            id :tc.ID_IN_PMESYM_PUNCH,//tc.TIME_CARD_ID,
                            start: Moment(tc.DATEH_BEGIN_PUNCH).utc().format("YYYY-MM-DD HH:mm:ss"),
                            end: tc.DATEH_END_PUNCH !== null ? Moment(tc.DATEH_END_PUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                            allDay:false,
                            borderColor:tc.DATEH_END_PUNCH === null ? '#FF0000' : '#696969',
                            editable:true,
                            backgroundColor:'#696969',//color time card
                            extendedProps:{dataType : 'TIME_CARD', noteBookIn: tc.NOTE_BOOK_PUNCH_IN, noteBookOut: tc.NOTE_BOOK_PUNCH_OUT,idPunchIn:tc.ID_IN_PMESYM_PUNCH
                                            , idPunchOut:tc.ID_OUT_PMESYM_PUNCH, dayNo:tc.DAY_NO, weekNo : tc.WEEK_NO, yearNo : tc.YEAR_OF_PUNCH
                                            ,rawPunchIn:Moment(tc.DATEH_BEGIN_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss")
                                            ,rawPunchOut:tc.DATEH_END_OPUNCH !== null ? Moment(tc.DATEH_END_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : ''}
                            })
                            
                            if((tc.DATEH_BEGIN_PUNCH !== tc.DATEH_BEGIN_OPUNCH) || (tc.DATEH_END_PUNCH !== tc.DATEH_END_OPUNCH)){
                                adjustedPunchTimeCard.push({
                                    id :'adj_'+tc.ID_IN_PMESYM_PUNCH,//tc.TIME_CARD_ID,
                                    start: Moment(tc.DATEH_BEGIN_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss"),
                                    end: tc.DATEH_END_OPUNCH !== null ? Moment(tc.DATEH_END_OPUNCH).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                                    allDay:false,
                                    editable:false,
                                    borderColor:tc.DATEH_END_PUNCH === null ? '#FF0000' : '#696969',
                                    backgroundColor:'#696969',//color time card
                                    extendedProps:{dataType : 'ADJ_TIME_CARD', noteBookIn: tc.NOTE_BOOK_PUNCH_IN, noteBookOut: tc.NOTE_BOOK_PUNCH_OUT,idPunchIn:tc.ID_IN_PMESYM_PUNCH
                                                    , idPunchOut:tc.ID_OUT_PMESYM_PUNCH, dayNo:tc.DAY_NO, weekNo : tc.WEEK_NO, yearNo : tc.YEAR_OF_PUNCH}
                            
                                }) 
                            }
                           

                        }
                    ) 
                    _punchOperaCard.map((oc: any) => (
                        punchOperaCard.push({
                           id :oc.ID_IN_PMESYM_OPERA,
                           start: Moment(oc.DATEH_BEGIN).utc().format("YYYY-MM-DD HH:mm:ss"),
                           end: oc.DATEH_END !== null ? (oc.DATEH_BEGIN === oc.DATEH_END) ? Moment(oc.DATEH_END).utc().add(1,'s').format("YYYY-MM-DD HH:mm:ss") : Moment(oc.DATEH_END).utc().format("YYYY-MM-DD HH:mm:ss") : '',
                           allDay:false,
                           title:oc.OPERATION_ID,
                           borderColor:oc.DATEH_END === null ? '#FF0000' : '',
                           backgroundColor:'#3A87AD',//color operacard #3A87AD
                           extendedProps:{dataType : 'OPERA_CARD',operationNo: oc.OPERATION_ID,jobNo: oc.JOB_NO,idPunchIn:oc.ID_IN_PMESYM_OPERA,idPunchOut :oc.ID_OUT_PMESYM_OPERA
                                         , noteBookIn: oc.NOTE_BOOK_PUNCH_IN, noteBookOut: oc.NOTE_BOOK_PUNCH_OUT,sequence: oc.SEQUENCE,dayNo:oc.DAY_NO, weekNo : oc.WEEK_NO, yearNo : oc.YEAR_OF_PUNCH}
                        })
                    ))
                  
                    dayWeekYear = {
                        dayNo : res[2].data[0].day_no,
                        weekNo : res[2].data[0].week_no,
                        yearNo : res[2].data[0].year_no,
                        shiftBegin : res[2].data[0].shift_begin,
                        shiftEnd : res[2].data[0].shift_end
                    }
                    
                    self.setState({
                        punchTimeCard,punchOperaCard,listOpenedPunch,infoEmployee,adjustedPunchTimeCard,dayWeekYear,firstLoad:false
                    });
                })
            )
            .catch(err => {
                errorLogMessages(err);
            });
    }
    
    handleSelectClick = (event) => { 
        const selectedTimeCard ={
            startDate: Moment(event.start).format("YYYY-MM-DD HH:mm:ss"),
            endDate: Moment(event.end).format("YYYY-MM-DD HH:mm:ss"),
            idPunchIn: 0,
            idPunchOut: 0,
            notePunchIn:'',
            notePunchOut:''
        }
        const selectedOperaCard ={
            startDate: Moment(event.start).format("YYYY-MM-DD HH:mm:ss"),
            endDate: Moment(event.end).format("YYYY-MM-DD HH:mm:ss"),
            idPunchIn: 0,
            idPunchOut: 0,
            notePunchIn:'',
            notePunchOut:'',
            taskNo : '',
            operNo : '',
            sequence : -1,
            progress : 0,
            qtyRejected : 0,
            qtyFab : 0,
            progressType : 0
        }

      const eventDataType = this.state.eventDataType
      
       let listJobNo = Array()
        axios.get(`${this.state.server}/api/getprojlist`)
              .then(res =>{
                    if(res.data){
                        res.data.map((j: any) => {
                            listJobNo.push({
                                label :j.JOB_NO,
                                value: j.JOB_NO,
                                prodNo : j.DRAWING_NO,
                                descrip : j.DESCRIP
                            })
                        })   
                    }
              })
          this.setState({openCreateEventModal:true,selectedTimeCard,eventDataType: eventDataType ? eventDataType : 'TIME_CARD',eventToEdit:event,addEvent:true,usingOption:'cal',selectedOperaCard,listJobNo})
    }
    getListJobNoAndOpera = (info : any) => {
        const { server,compEmployeeNo } = this.state;
        const {operationNo,jobNo,sequence} = info.event.extendedProps
        const dataList = [`${server}/api/getprojlist` /*`${server}/api/getprojlistforemporkeyword/${compEmployeeNo}/${null}`*/
                         ,`${server}/api/gettasklistforjobseq/${jobNo}/${sequence}`
                         ,`${server}/api/getoperlistdtlforjob/${compEmployeeNo}/${jobNo}`];
        const self=this
        let listOperationNo=Array()
        let listJobNo=Array()
        let listSequences=Array()
        let selectedOperation={}
        let selectedJobNo={}
        let selectedSequence={}
        //let progressType : number = 0
        axios.all(dataList.map(l => axios.get(l)))
             .then(
                axios.spread(function (...res) {
                    const lstjob =  res[0].data
                    const lstoper = res[1].data
                    const lstseq =  res[2].data
                    const jobInfoQty= lstseq.find((i: { SEQUENCE: number; }) => i.SEQUENCE !== -1)
                    //operation
                    lstoper.map((op: any) => {
                        if(operationNo === op.TASK_NO ){
                            selectedOperation ={
                                label :op.TASK_NO,
                                value: op.TASK_NO
                            }
                        }
                        listOperationNo.push({
                           label :op.TASK_NO,
                           value: op.TASK_NO
                        })
                    })
                    //job 
                    lstjob.map((j: any) => {
                        if(jobNo === j.JOB_NO ){
                            selectedJobNo ={
                                label :j.JOB_NO,
                                value: j.JOB_NO,
                                prodNo : j.DRAWING_NO,
                                sequence: sequence,
                                descrip : j.DESCRIP,
                                startDate: info.event.start,
                                endDate:info.event.end
                            }
                        }
                        listJobNo.push({
                            label :j.JOB_NO,
                            value: j.JOB_NO,
                            prodNo : j.DRAWING_NO,
                            descrip : j.DESCRIP
                        })
                    })
                    //sequence
                    lstseq.map((s: any) => {
                        if(sequence === s.SEQUENCE ){
                           selectedSequence = {
                                label : s.SEQUENCE === -1 ? translateString('Unplanned') : s.SEQUENCE.toString(),
                                value : s.SEQUENCE
                            }
                        }
                        listSequences.push({
                            label : s.SEQUENCE === -1 ? translateString('Unplanned') : s.SEQUENCE.toString(),
                            value: s.SEQUENCE
                        })
                        //if(s.SEQUENCE !== -1) progressType = s.PROGRESS_TYPE
                    }) 

                    const selectedOperaCard ={
                        startDate: Moment(info.event.start).format("YYYY-MM-DD HH:mm:ss"),
                        endDate: info.event.end ? Moment(info.event.end).format("YYYY-MM-DD HH:mm:ss") : '',
                        idPunchIn: info.event.extendedProps['idPunchIn'],
                        idPunchOut: info.event.extendedProps['idPunchOut'],
                        notePunchIn: info.event.extendedProps['noteBookIn'],
                        notePunchOut: info.event.extendedProps['noteBookOut'],
                        taskNo : jobNo,
                        operNo : operationNo,
                        sequence : sequence,
                        progress : jobInfoQty ? jobInfoQty.PROGRESS === null || jobInfoQty.PROGRESS === '' ? 0 : jobInfoQty.PROGRESS : 0,
                        qtyRejected : jobInfoQty ? jobInfoQty.TOT_QTY_REJECTED === null || jobInfoQty.TOT_QTY_REJECTED === '' ? 0 : jobInfoQty.TOT_QTY_REJECTED  : 0,
                        qtyFab : jobInfoQty ? jobInfoQty.TOT_QTY_FAB === null || jobInfoQty.TOT_QTY_FAB === '' ? 0 : jobInfoQty.TOT_QTY_FAB  : 0,
                        progressType : jobInfoQty ? jobInfoQty.PROGRESS_TYPE === null || jobInfoQty.PROGRESS_TYPE === '' ? 0 : jobInfoQty.PROGRESS_TYPE  : 1
                    }
                    
                    
                    self.setState({openEditEventModal:true,listOperationNo,selectedOperation,listJobNo,selectedJobNo,addEvent:false
                                  ,eventToEdit:info,eventDataType:'OPERA_CARD',selectedOperaCard,selectedSequence,listSequences
                    });
            })).catch(err => {
                errorLogMessages(err);
            });
        /*
        const { server } = this.state;
            const self=this
            let listOperationNo=Array()
            let listJobNo=Array()
            let selectedOperation={}
            let selectedJobNo={}
            const dataList = [`${server}/api/getListOperationNo`,`${server}/api/getListJobNo`];
            axios.all(dataList.map(l => axios.get(l)))
                 .then(
                    axios.spread(function (...res) {
                        const _listOperationNo = res[0].data;
                        const _listJobNo= res[1].data; 
                        _listOperationNo.map((op: any) => {
                            if(info.event.extendedProps["operationNo"]===op.OPERATION_ID ){
                                selectedOperation ={
                                    label :op.OPERATION_ID,
                                    value: op.OPERATION_ID
                                }
                            }
                            listOperationNo.push({
                               label :op.OPERATION_ID,
                               value: op.OPERATION_ID
                            })
                        }) 
                        _listJobNo.map((j: any) => {
                            if(info.event.extendedProps["jobNo"]===j.JOB_NO ){
                                selectedJobNo ={
                                    label :j.JOB_NO,
                                    value: j.JOB_NO,
                                    prodNo : j.PROD_NO,
                                    sequence: j.SEQUENCE,
                                    startDate: info.event.start,
                                    endDate:info.event.end
                                }
                            }
                            listJobNo.push({
                                label :j.JOB_NO,
                                value: j.JOB_NO,
                                prodNo : j.PROD_NO
                            })
                        }) 
                        self.setState({
                            openEditEventModal:true,listOperationNo,selectedOperation,listJobNo,selectedJobNo,addEvent:false,eventDataType:'OPERA_CARD'
                        });
                    })
                )
                .catch(err => {
                    errorLogMessages(err);
                }); */
    }
    handleClickEvent = (info:any) => {
        const {infoEmployee,compEmployeeNo} = this.state
        if(info.event.extendedProps['dataType']==='OPERA_CARD') {
            this.getListJobNoAndOpera(info)
        } else {//time_card    
            const selectedTimeCard ={
                startDate: Moment(info.event.start).format("YYYY-MM-DD HH:mm:ss"),
                endDate: info.event.end ? Moment(info.event.end).format("YYYY-MM-DD HH:mm:ss"): '',
                idPunchIn: info.event.extendedProps['idPunchIn'],
                idPunchOut: info.event.extendedProps['idPunchOut'],
                notePunchIn: info.event.extendedProps['noteBookIn'],
                notePunchOut:info.event.extendedProps['noteBookOut'],
                fullName : compEmployeeNo + ' : ' + infoEmployee.LAST_NAME + ' ' + infoEmployee.FIRST_NAME,
                rawPunchIn : info.event.extendedProps['rawPunchIn'],
                rawPunchOut : info.event.extendedProps['rawPunchOut']
            }
            const eventDataType = info.event.id.substring(0,3) === 'adj' ? 'ADJ_CARD' : 'TIME_CARD'
            this.setState({
                openEditEventModal:true,selectedTimeCard,eventDataType,eventToEdit:info,eventToUpdateInCal:info,addEvent:false,usingOption:'cal'
            });
        }
    }
    handleChangeOperation = (event, selectedOpera) => {
        let selectedOperaCard= this.state.selectedOperaCard
        selectedOperaCard.operNo = selectedOpera.value
        this.setState({selectedOperaCard})
    }
    handleChangeDataType = (eventDataType : number) => {
      this.setState({eventDataType : eventDataType === 1 ? 'OPERA_CARD' : 'TIME_CARD'})
    }
    handleChangeSequence = (event, selectedSeq) => {
        if(selectedSeq){
            let  {selectedJobNo,selectedOperaCard }= this.state
            let listOperationNo = Array()
            let selectedOperation = {}
            const selectedSequence = selectedSeq
            axios.get(`${this.state.server}/api/gettasklistforjobseq/${selectedJobNo.value}/${selectedSeq.value}`)
                    .then(res =>{
                        if(res.data.length>0){
                            res.data.map((s: any) => {
                                listOperationNo.push({
                                    label :s.TASK_NO,
                                    value: s.TASK_NO
                                })
                            })
                            selectedOperation = listOperationNo[0]
                        }
                        selectedOperaCard.sequence = selectedSeq.value  
                        this.setState({listOperationNo,selectedSequence,selectedOperation,selectedOperaCard})
                    })
        }
    }
    handleChangeTask = (event, selectedTask) => {
        if(selectedTask){
        const {server,compEmployeeNo} = this.state
        let listSequences = Array()
        let listOperationNo = Array()
        let selectedSequence = {}
        let selectedOperation = {}
        const selectedJobNo = selectedTask
        const self = this
        const dataList =[`${server}/api/getoperlistdtlforjob/${compEmployeeNo}/${selectedTask.value}`
                        ,`${server}/api/gettasklistforjobseq/${selectedTask.value}/${-1}`]
        axios.all(dataList.map(l => axios.get(l)))
        .then(
           axios.spread(function (...res) {
            if(res[0].data.length>0){
                const lst=  _.orderBy(res[0].data, ['SEQUENCE']);
                lst.map((s: any) => {
                    listSequences.push({
                        label :s.SEQUENCE === -1 ? translateString('Unplanned') : s.SEQUENCE.toString(),
                        value: s.SEQUENCE
                    })
                }) 
                selectedSequence = listSequences[0]
             }
            if(res[1].data.length>0){
                res[1].data.map((op: any) => {
                    listOperationNo.push({
                       label :op.TASK_NO,
                       value: op.TASK_NO
                    })
                })
                selectedOperation = listOperationNo[0]
            }
             self.setState({listSequences,selectedSequence,listOperationNo,selectedOperation,selectedJobNo})
           }
           )
        ).catch(err => {
            errorLogMessages(err);
        })
    }
    }
    handleCreatePunch = () => {
        let {punchTimeCard,selectedOperaCard,server,selectedTimeCard,compEmployeeNo,eventDataType,infoEmployee,selectedSequence,selectedJobNo,selectedOperation,punchOperaCard}=this.state
        let addedTimeCard = {}
        let idPunchIn=0
        let idPunchOut=0
       // eventToEdit.view.
        const self=this
        if(!Moment(selectedTimeCard.startDate).isSameOrAfter(Moment(selectedTimeCard.endDate))){
        axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${selectedTimeCard.startDate}`)//startDate
             .then(res => {
                    if(res.data){
                        const result = this.getNestedPunchToday(punchTimeCard,res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,selectedTimeCard.startDate,selectedTimeCard.endDate,res.data[0].shift_begin,res.data[0].shift_end)
                        if(result === ''){
                            //this.updateEventInCalendar(eventToUpdateInCal,true,res.data[0].day_no,res.data[0].week_no,res.data[0].year_no)
                                // ********************************** TIME CARD (start) ******************
                                if(eventDataType === 'TIME_CARD'){
                                let keyPunchIn=Moment(selectedTimeCard.startDate).format("YYYY-MM-DD HH:mm:ss")
                                let url = `${server}/api/punchinout`;
                                let data: any = []
                                    data = {
                                        comp_employee_no: compEmployeeNo,
                                        keyPunch: keyPunchIn,
                                        requestOTime: false,
                                        longitude:  0,
                                        latitude: 0 ,
                                        notePunch: selectedTimeCard.notePunchIn
                                    }
                                    let options: any = {
                                        method: 'PUT',
                                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                        data: qs.stringify(data),
                                        url,
                                    };
                                    axios(options)
                                    .then(res => {
                                        if(res.data[0].PME_IN_ID > 0){
                                                const dow=res.data[0].DOW
                                                const wk=res.data[0].WK
                                                const yr=res.data[0].YR
                                                let calendarApi = this.calendarRef?.current.getApi();
                                                idPunchIn=res.data[0].PME_IN_ID 
                                                if(selectedTimeCard.endDate){
                                                    let keyPunchOut=Moment(selectedTimeCard.endDate).format("YYYY-MM-DD HH:mm:ss")
                                                     url = `${server}/api/punchinout`;
                                                        data = {
                                                            comp_employee_no: compEmployeeNo,
                                                            keyPunch: keyPunchOut,
                                                            requestOTime: false,
                                                            longitude:  0,
                                                            latitude: 0 ,
                                                            notePunch: selectedTimeCard.notePunchOut
                                                        }
                                                     options = {
                                                            method: 'PUT',
                                                            headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                                            data: qs.stringify(data),
                                                            url,
                                                        };
                                                        axios(options)
                                                        .then(res => {
                                                            if(res.data[0].PME_OUT_ID > 0){
                                                                addedTimeCard ={
                                                                    id :idPunchIn.toString(),
                                                                    start: Moment(keyPunchIn).format("YYYY-MM-DD HH:mm:ss"),
                                                                    end:  Moment(keyPunchOut).format("YYYY-MM-DD HH:mm:ss") ,
                                                                    editable : true,
                                                                    allDay:false,
                                                                    borderColor: '#696969',
                                                                    backgroundColor:'#696969',//color time card #FF0000
                                                                    extendedProps:{dataType : 'TIME_CARD', noteBookIn: '', noteBookOut: '',idPunchIn:idPunchIn.toString()
                                                                                    , idPunchOut:res.data[0].PME_OUT_ID, dayNo:dow, weekNo : wk, yearNo : yr
                                                                                    ,rawPunchIn:Moment(keyPunchIn).format("YYYY-MM-DD HH:mm:ss"),rawPunchOut:Moment(keyPunchOut).format("YYYY-MM-DD HH:mm:ss")
                                                                                  }
                                                                }
                                                                calendarApi.addEvent(addedTimeCard)
                                                                calendarApi.refetchEvents()
                                                                punchTimeCard.push(addedTimeCard)
                                                                self.setState({openCreateEventModal:false,punchTimeCard,eventToUpdateInCal:calendarApi.getEventById(idPunchIn)})
                                                                // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully created!`) , 5000, "success",'Cancel',this.cancelCreate)
                                                            }
                                                        }).catch(err => {
                                                            errorLogMessages(err);
                                                        });
                                                }else{
                                                    addedTimeCard ={
                                                                    id :idPunchIn.toString(),//tc.TIME_CARD_ID,
                                                                    start: Moment(keyPunchIn).format("YYYY-MM-DD HH:mm:ss"),
                                                                    end:  '' ,
                                                                    editable:true,
                                                                    allDay:false,
                                                                    borderColor: ' #FF0000',
                                                                    backgroundColor:'#696969',
                                                                    extendedProps:{dataType : 'TIME_CARD', noteBookIn: '', noteBookOut: '',idPunchIn:idPunchIn.toString()
                                                                                    , idPunchOut:0, dayNo:dow, weekNo : wk, yearNo : yr
                                                                                    ,rawPunchIn:Moment(keyPunchIn).format("YYYY-MM-DD HH:mm:ss"),rawPunchOut:''
                                                                                  }
                                                                }
                                                                calendarApi.addEvent(addedTimeCard)
                                                                calendarApi.refetchEvents()
                                                                punchTimeCard.push(addedTimeCard)
                                                                self.setState({openCreateEventModal:false,punchTimeCard,eventToUpdateInCal:calendarApi.getEventById(idPunchIn)},() => this.getInfosEmployee())
                                                                // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully created!`) , 5000, "success",'Cancel',this.cancelCreate)
                                                }
                                        }else {
                                            logMessages(translateString("Oops!"), res.status, translateString("Failed to insert punch!"), 5000, "error");
                                        }
                                    })
                                    .catch(err => {
                                        errorLogMessages(err);
                                    });
                                } // ********************************** TIME CARD (end) ******************
                                else{// ********************************** OPERA CARD (start) ******************
                                    if(Object.keys(selectedJobNo).length <= 0 || Object.keys(selectedOperation).length <=0 ) {
                                        logMessages(translateString("Oops!"), 500, translateString(`Please select task and operation`) , 5000, "info")
                                    }else{
                                            let keyPunchIn=Moment(selectedOperaCard.startDate).format("YYYY-MM-DD HH:mm:ss")
                                            let url = `${server}/api/createoperation`;
                                            let data: any = []
                                            data = {
                                                comp_employee_no: infoEmployee.COMP_EMPLOYEE_NO,
                                                keyPunch : keyPunchIn,
                                                longitude: 0,
                                                latitude: 0,
                                                notePunch: selectedOperaCard.notePunchIn,
                                                task_no: selectedJobNo.value,
                                                oper_no : selectedOperation.value,
                                                sequence : selectedSequence.value,
                                                qty_progress: 0,
                                                qty_manufactured: 0,
                                                qty_rejected: 0,
                                                isOpen : Boolean(infoEmployee.IS_PRESENT),
                                                timesheet_autopunch : 0,
                                                calendar_mode : 1,
                                                api_rest : 0,
                                                forced_dayno : null,
                                                forced_weekno : null,
                                                forced_yearno :null
                                            }
                                            let options: any = {
                                                method: 'PUT',
                                                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                                data: qs.stringify(data),
                                                url
                                            };
                                            axios(options)
                                            .then(res => {
                                                if(res.data[0].PME_IN_ID > 0){
                                                        const dow=res.data[0].DAY_NO
                                                        const wk=res.data[0].WEEK_NO
                                                        const yr=res.data[0].YEAR_OF_PUNCH
                                                        let calendarApi = this.calendarRef?.current.getApi();
                                                        idPunchIn=res.data[0].PME_IN_ID 
                                                        if(selectedOperaCard.endDate){
                                                            let keyPunchOut=Moment(selectedOperaCard.endDate).format("YYYY-MM-DD HH:mm:ss")
                                                            url = `${server}/api/createoperation`;
                                                            data = {
                                                                comp_employee_no: infoEmployee.COMP_EMPLOYEE_NO,
                                                                keyPunch : keyPunchOut,
                                                                longitude: 0,
                                                                latitude: 0,
                                                                notePunch: selectedOperaCard.notePunchOut,
                                                                task_no: selectedJobNo.value,
                                                                oper_no : selectedOperation.value,
                                                                sequence : selectedSequence.value,
                                                                qty_progress: 0,
                                                                qty_manufactured: 0,
                                                                qty_rejected: 0,
                                                                isOpen : Boolean(infoEmployee.IS_PRESENT),
                                                                timesheet_autopunch : 0,
                                                                calendar_mode : 1,
                                                                api_rest : 0,
                                                                forced_dayno : dow,
                                                                forced_weekno : wk,
                                                                forced_yearno :yr
                                                            }
                                                            options = {
                                                                    method: 'PUT',
                                                                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                                                    data: qs.stringify(data),
                                                                    url,
                                                                };
                                                                axios(options)
                                                                .then(res => {
                                                                    if(res.data[0].PME_IN_ID > 0){
                                                                        addedTimeCard ={
                                                                            id :idPunchIn.toString(),
                                                                            start: Moment(keyPunchIn).format("YYYY-MM-DD HH:mm:ss"),
                                                                            end:  Moment(keyPunchOut).format("YYYY-MM-DD HH:mm:ss") ,
                                                                            editable : true,
                                                                            allDay:false,
                                                                            title:selectedOperation.value,
                                                                            borderColor: '',  
                                                                            backgroundColor:'#3A87AD',
                                                                            extendedProps:{dataType : 'OPERA_CARD', noteBookIn: '', noteBookOut: '',idPunchIn:idPunchIn.toString()
                                                                                            , idPunchOut:res.data[0].PME_IN_ID.toString(), dayNo:dow, weekNo : wk, yearNo : yr
                                                                                            , operationNo:selectedOperation.value ,jobNo: selectedJobNo.value,sequence :selectedSequence.value 
                                                                                        }
                                                                        }
                                                                        calendarApi.addEvent(addedTimeCard)
                                                                        calendarApi.refetchEvents()
                                                                        punchTimeCard.push(addedTimeCard)
                                                                        self.setState({openCreateEventModal:false,punchTimeCard,eventToUpdateInCal:calendarApi.getEventById(idPunchIn),eventDataType:'OPERA_CARD' ,selectedJobNo:{},selectedSequence:{},selectedOperation:{}})
                                                                        // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully created!`) , 5000, "success",'Cancel',this.cancelCreate)
                                                                    }
                                                                }).catch(err => {
                                                                    errorLogMessages(err);
                                                                });
                                                        }else{
                                                            addedTimeCard ={
                                                                            id :idPunchIn.toString(),
                                                                            start: Moment(keyPunchIn).format("YYYY-MM-DD HH:mm:ss"),
                                                                            end:  '' ,
                                                                            editable:true,
                                                                            allDay:false,
                                                                            title:selectedOperation.value,
                                                                            borderColor: ' #FF0000',
                                                                            backgroundColor:'#3A87AD',
                                                                            extendedProps:{dataType : 'OPERA_CARD', noteBookIn: '', noteBookOut: '',idPunchIn:idPunchIn.toString()
                                                                                            , idPunchOut:0, dayNo:dow, weekNo : wk, yearNo : yr
                                                                                            , operationNo:selectedOperation.value ,jobNo: selectedJobNo.value,sequence :selectedSequence.value 
                                                                                        }
                                                                        }
                                                                        calendarApi.addEvent(addedTimeCard)
                                                                        calendarApi.refetchEvents()
                                                                        punchOperaCard.push(addedTimeCard)
                                                                        self.setState({openCreateEventModal:false,punchTimeCard,eventToUpdateInCal:calendarApi.getEventById(idPunchIn),eventDataType:'OPERA_CARD',selectedJobNo:{},selectedSequence:{},selectedOperation:{}},() => this.getInfosEmployee())
                                                                        // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully created!`) , 5000, "success",'Cancel',this.cancelCreate)
                                                        }
                                                    
                                        }else {
                                            logMessages(translateString("Oops!"), res.status, translateString("Failed to insert punch!"), 5000, "error");
                                        }
                                    })
                                    .catch(err => {
                                        errorLogMessages(err);
                                    });
                                }// ********************************** OPERA CARD (end) ******************
                            }
                        }else{
                            logMessages(translateString("Oops!"), 500, result , 5000, "error");
                        }
                    }
                })
             .catch(err => {
                 errorLogMessages(err);
              })

        }else{
            logMessages(translateString("Oops!"), 500, 'The start date must not be less than or equal to the end date.' , 5000, "error");
        }
    }
    handleUpdatePunch = (allQty : any) => {
        let {punchTimeCard,eventToEdit,infoEmployee,punchOperaCard}=this.state
        const {selectedTimeCard, server,compEmployeeNo,selectedOperaCard,selectedJobNo,selectedOperation,selectedSequence}=this.state
        const self=this
        let insertNewPunch : boolean=false
        let idPunchOut : number = 0
        switch (this.state.eventDataType) {
        case 'TIME_CARD' :
            if((eventToEdit.event.end && selectedTimeCard.endDate === '') || (eventToEdit.event.start &&  selectedTimeCard.startDate === '' )){
                logMessages(translateString("Oops!"), 500, translateString("A punch can't be deleted") , 5000, "error");
            }else{
                axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${selectedTimeCard.startDate}`)//startDate
                    .then(res => {
                        if(res.data){
                            const result = this.getNestedPunchToday(punchTimeCard.filter(p => p.id !== selectedTimeCard.idPunchIn),res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,selectedTimeCard.startDate,selectedTimeCard.endDate,Moment(res.data[0].shift_begin).utc().format("YYYY-MM-DD HH:mm:ss"),res.data[0].shift_end)
                            if(result === '' ){
                                let calendarApi = this.calendarRef?.current.getApi();
                                 var event = calendarApi.getEventById(eventToEdit.event.id)
                                 if(!eventToEdit.event.end && selectedTimeCard.endDate){ // insert new time card
                                        const keyPunch= selectedTimeCard.endDate ? Moment(selectedTimeCard.endDate).format("YYYY-MM-DD HH:mm:ss") : ''
                                        const url = `${server}/api/punchinout`;
                                        let data: any = []
                                            data = {
                                                comp_employee_no: compEmployeeNo,
                                                keyPunch: keyPunch,
                                                requestOTime: false,
                                                longitude:  0,
                                                latitude: 0 ,
                                                notePunch: selectedTimeCard.notePunchOut
                                            }
                                            const options: any = {
                                                method: 'PUT',
                                                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                                data: qs.stringify(data),
                                                url,
                                            };
                                            axios(options)
                                            .then(res => {
                                                if(res.data[0].PME_OUT_ID > 0){
                                                        event.setEnd(keyPunch)
                                                        event.setProp('borderColor','#696969')
                                                        event.setExtendedProp('idPunchOut',res.data[0].PME_OUT_ID)
                                                        event.setExtendedProp('rawPunchOut',keyPunch)
                                                        event.setExtendedProp('noteBookIn',selectedTimeCard.notePunchIn)
                                                        event.setExtendedProp('noteBookOut',selectedTimeCard.notePunchOut)
                                                        insertNewPunch =true
                                                        idPunchOut = res.data[0].PME_OUT_ID
                                                        self.setState({openEditEventModal : false,selectedJobNo:{},selectedSequence:{},selectedOperation:{}},() => this.getInfosEmployee())
                                                }else {
                                                    logMessages(translateString("Oops!"), res.status, translateString("Failed to insert punch!"), 5000, "error");
                                                }
                                            })
                                            .catch(err => {
                                                errorLogMessages(err);
                                            });

                                 } 
                                 // a revoir
                                 //if(eventToEdit.event.start !== selectedTimeCard.startDate){
                                    let dataPunch=`${server}/api/updateTimeCard/${compEmployeeNo}/${eventToEdit.event.extendedProps['idPunchIn']}/${selectedTimeCard.startDate}`
                                        if(insertNewPunch ) 
                                            dataPunch += `/${idPunchOut}/${selectedTimeCard.endDate}`
                                        else if(selectedTimeCard.idPunchOut > 0)
                                            dataPunch += `/${selectedTimeCard.idPunchOut}/${selectedTimeCard.endDate}`
                                        else dataPunch += `/${0}/${null}`

                                        selectedTimeCard.notePunchIn ? dataPunch +=`/${selectedTimeCard.notePunchIn}/${0}` : dataPunch +=`/${null}/0`
                                        selectedTimeCard.notePunchOut ? dataPunch +=`/${selectedTimeCard.notePunchOut}/${0}` : dataPunch +=`/${null}/0`
                                       // dataPunch +=`/${selectedTimeCard.notePunchIn ? selectedTimeCard.notePunchIn : null}/${0}/${selectedTimeCard.notePunchOut ? selectedTimeCard.notePunchOut : null}/${0}` 
                                            axios.get(dataPunch)
                                                .then(res => {
                                                    if (res.data) {
                                                        event.setStart(new Date(selectedTimeCard.startDate),{maintainDuration : true})
                                                        if(selectedTimeCard.endDate){ 
                                                            event.setEnd(new Date(selectedTimeCard.endDate),{maintainDuration : true}) 
                                                            event.setProp('borderColor','#696969')
                                                        }
                                                        event.setExtendedProp('noteBookIn',selectedTimeCard.notePunchIn)
                                                        event.setExtendedProp('noteBookOut',selectedTimeCard.notePunchOut)
                                                        res.status === 200 && logMessages(translateString("Success!"), "200", translateString("You have updated the punch!"), 3000, "success");
                                                        self.setState({openEditEventModal : false,selectedJobNo:{},selectedSequence:{},selectedOperation:{}},() => this.getInfosEmployee())
                                                    } else {
                                                        logMessages(translateString("Oops!"), 500, 'ERROR' , 5000, "error");
                                                    }
                                                })
                                                .catch(err => {
                                                    errorLogMessages(err);
                                                });
                                //}
                            }else{
                                logMessages(translateString("Oops!"), 500, result , 5000, "error");
                            }
                        }
                    })
            }
        break;
        
        case 'OPERA_CARD' : 
        if((eventToEdit.event.end && selectedOperaCard.endDate === '') || (eventToEdit.event.start &&  selectedOperaCard.startDate === '' )){
            logMessages(translateString("Oops!"), 500, translateString("A punch can't be deleted") , 5000, "error");
        }else{
            const idPmeIn = eventToEdit.event.extendedProps['idPunchIn']
            const idPmeOut = eventToEdit.event.extendedProps['idPunchOut'] 
            const {startDate,endDate,notePunchIn,notePunchOut} = selectedOperaCard
            const {progress,qtyRejected,qtyFab} =allQty
            const taskNo= selectedJobNo.value
            const operNo= selectedOperation.value
            const sequence= selectedSequence.value
            axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${startDate}`)//startDate
                    .then(res => {
                        if(res.data){
                            const result = this.getNestedPunchToday(punchOperaCard.filter(p => p.id !== selectedOperaCard.idPunchIn),res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,startDate,endDate,Moment(res.data[0].shift_begin).utc().format("YYYY-MM-DD HH:mm:ss"),res.data[0].shift_end)
                            if(result === '' ){
                                 if(eventToEdit.event.end === null && endDate){ // insert
                                    //eventToEdit.event.end = endDate
                                    /* insert by update */
                                 var eventToUpdate = this.getEventCalById(eventToEdit.event.id)
                                    let data: any = []
                                    let isOpen = Boolean(infoEmployee.IS_PRESENT)
                                    
                                    data = {
                                        comp_employee_no: infoEmployee.COMP_EMPLOYEE_NO,
                                        keyPunch : endDate,
                                        longitude: 0,//longitude ? Number(longitude.toFixed(3)) : 0,
                                        latitude: 0,//latitude ? Number(latitude.toFixed(3)) : 0 ,
                                        notePunch: notePunchOut,
                                        task_no: taskNo, 
                                        oper_no : operNo,
                                        sequence : sequence,
                                        qty_progress: progress,
                                        qty_manufactured: qtyFab,
                                        qty_rejected: qtyRejected,
                                        isOpen,
                                        timesheet_autopunch : 0,
                                        calendar_mode : 1,
                                        api_rest : 0,
                                        forced_dayno : res.data[0].day_no,
                                        forced_weekno : res.data[0].week_no,
                                        forced_yearno :res.data[0].year_no
                                    }
                                    const options: any = {
                                        method: 'PUT',
                                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                        data: qs.stringify(data),
                                        url : `${server}/api/createoperation`
                                    };
                                    axios(options)
                                        .then(res => {
                                             this.getInfosEmployee()
                                              eventToUpdate.setProp('borderColor','#3A87AD')
                                              eventToUpdate.setEnd(new Date(endDate),{maintainDuration : true})
                                              res.data[0].PME_OUT_ID > 0 ? eventToUpdate.setExtendedProp('idPunchOut',res.data[0].PME_OUT_ID.toString()) : eventToUpdate.setExtendedProp('idPunchOut',res.data[0].PME_IN_ID.toString())
                                              logMessages(translateString("Success!"), "200", translateString("The punch have been successfully updated!"), 3000, "success");
                                        })
                                    /* insert by update */
                                    //this.openCloseOperation(eventToEdit)
                                 }else{//update
                                    let dataUpdate = `${server}/api/updateOperaCard/${idPmeIn}/${idPmeOut}/${taskNo}/${operNo}/${infoEmployee.COMP_EMPLOYEE_NO}/${startDate}/${endDate}/${sequence}/${null}`
                                    notePunchIn ? dataUpdate += `/${notePunchIn}/${null}`  : dataUpdate += `/${null}/${null}` 
                                    notePunchOut ? dataUpdate += `/${notePunchOut}/${null}`  : dataUpdate += `/${null}/${null}` 
                                    dataUpdate += '/'+ progress
                                    var event = this.getEventCalById(eventToEdit.event.id)
                                    axios.get(dataUpdate)
                                    .then(res => {
                                        if(res.data.length > 0){
                                            //console.log('success update' ,res.data)
                                            const {DAY_NO,WEEK_NO,YEAR_OF_PUNCH} = res.data[0]
                                            event.setStart(new Date(startDate),{maintainDuration : true})
                                            if(endDate) {
                                                event.setEnd(new Date(endDate),{maintainDuration : true})
                                                event.setProp('borderColor','#3A87AD')
                                            }
                                            event.setExtendedProp('noteBookIn',notePunchIn)
                                            event.setExtendedProp('noteBookOut',notePunchOut)
                                            event.setExtendedProp('dayNo',DAY_NO)
                                            event.setExtendedProp('weekNo',WEEK_NO)
                                            event.setExtendedProp('yearNo',YEAR_OF_PUNCH)
                                            event.setExtendedProp('operationNo',operNo)
                                            event.setExtendedProp('jobNo',taskNo)
                                            event.setExtendedProp('sequence',sequence)
                                            event.setProp('title',operNo + '</br>' + taskNo)
                                            this.calendarRef?.current.getApi().refetchEvents()   
                                            logMessages(translateString("Success!"), "200", translateString("The punch have been successfully updated!"), 3000, "success");
                                           
                                        }else{
                                            logMessages(translateString("Oops!"), "500", translateString("An error was occured!"), 3000, "error");
                                        }
                                    }).catch(err => {
                                       // eventToEdit.revert()
                                        errorLogMessages(err);
                                    });
                                 }
                            }else{
                                logMessages(translateString("Oops!"), "500", result, 3000, "error");
                                eventToEdit.revert()
                            }
                        }
                    })
        }
        self.setState({openEditEventModal : false,selectedJobNo:{},selectedSequence:{},selectedOperation:{}},() => this.getInfosEmployee())
        break; 
        
       }
       
    }
    handleChangeDateBegin =(e : any)=>{
        //const eventDataType = this.state.eventDataType
        switch (this.state.eventDataType) {
            case 'TIME_CARD' : 
                let selectedTimeCard = this.state.selectedTimeCard
                selectedTimeCard.startDate = !isNaN(e) ? Moment(e).format("YYYY-MM-DD HH:mm:ss") : ''
                this.setState({selectedTimeCard})
            break
            case 'OPERA_CARD':
                let selectedOperaCard = this.state.selectedOperaCard
                selectedOperaCard.startDate = !isNaN(e) ? Moment(e).format("YYYY-MM-DD HH:mm:ss") : ''
                this.setState({selectedOperaCard})
            break
        }
            
    }
    handleChangeDateEnd =(e)=>{
        switch (this.state.eventDataType) {
            case 'TIME_CARD' : 
                let selectedTimeCard = this.state.selectedTimeCard
                selectedTimeCard.endDate = !isNaN(e) && e ? Moment(e).format("YYYY-MM-DD HH:mm:ss") : ''
                this.setState({selectedTimeCard})
            break
            case 'OPERA_CARD':
                let selectedOperaCard = this.state.selectedOperaCard
                selectedOperaCard.endDate = !isNaN(e) && e ? Moment(e).format("YYYY-MM-DD HH:mm:ss") : ''
                this.setState({selectedOperaCard})
            break
        }
    }
    handleNotePunchIn =(e:any)=>{
            e.preventDefault()
            e.persist()
            switch (this.state.eventDataType) {
            case 'TIME_CARD' : 
                let selectedTimeCard = this.state.selectedTimeCard
                selectedTimeCard.notePunchIn = e.currentTarget.value//
                this.setState({selectedTimeCard})
            break
            case 'OPERA_CARD':
                let selectedOperaCard = this.state.selectedOperaCard
                selectedOperaCard.notePunchIn = e.currentTarget.value
                this.setState({selectedOperaCard})
            break
            }
    }
    handleNotePunchOut =(e:any)=>{
        e.preventDefault()
        e.persist()
        switch (this.state.eventDataType) {
        case 'TIME_CARD' : 
            let selectedTimeCard = this.state.selectedTimeCard
            selectedTimeCard.notePunchOut = e.currentTarget.value//
            this.setState({selectedTimeCard})
        break
        case 'OPERA_CARD':
            let selectedOperaCard = this.state.selectedOperaCard
            selectedOperaCard.notePunchOut = e.currentTarget.value
            this.setState({selectedOperaCard})
        break
        }
    }
   
    handleDelete = (clickInfo : any) => {
        const { server ,eventToEdit} = this.state;
        //if (confirm(`Are you sure you want to delete the event `)) {
        const keyPunchIn=eventToEdit.event.extendedProps['idPunchIn']
        const keyPunchOut=eventToEdit.event.extendedProps['idPunchOut'] ?  eventToEdit.event.extendedProps['idPunchOut'] : 0
        const dataType=eventToEdit.event.extendedProps['dataType']
        const dataPunch=`${server}/api/deletePunch/${dataType}/${keyPunchIn}/${keyPunchOut}`
        this.setState({openEditEventModal:false},() => this.addOrRemoveInCalendar(eventToEdit,false))
        //displayMessages(translateString("Success!"), 200, translateString(`Punch successfully deleted!`) , 5000, "success",'Cancel',this.cancelAction)
        //timeout = setTimeout(() => {
                   axios.get(dataPunch,{cancelToken: cancelTokenSource.token})
                        .then(res => {
                            if (res.status===200) { 
                               this.setState({selectedJobNo:{},selectedSequence:{},selectedOperation:{}} , () => this.getInfosEmployee())  
                               logMessages(translateString("Success!"), 200, translateString(`Punch successfully deleted!`) , 5000, "success");
                            } else {
                                logMessages(translateString("Oops!"), res.status, translateString("Failed to delete punch!"), 5000, "error");
                            }
                        })
                        .catch(err => {
                            if(axios.isCancel(err)){
                                cancelTokenSource = axios.CancelToken.source()
                                //this.addOrRemoveEvent(punchTimeCard.find(p => p.id === eventToEdit.event.id),true)
                            }else{
                            errorLogMessages(err);}
                        });
            //    },5000)
       // }
    }
    updateEventInCalendar = (eventToUpdate : any,newUpdate: boolean,dayn? : number,weekn? : number,yearn? : number) => {
        let punchTimeCard = this.state.punchTimeCard
        if(newUpdate){
            let newEvent= this.getEventCalById(eventToUpdate.event.id)
            newEvent.setExtendedProp('dayNo',dayn)
            newEvent.setExtendedProp('weekNo',weekn)
            newEvent.setExtendedProp('yearNo',yearn)
            eventToUpdate.event.end ? newEvent.setProp('borderColor','#696969') : newEvent.setProp('borderColor','#FF0000')
            //eventToUpdate.setProp('start',eventToUpdate.event.start)
            //eventToUpdate.setEnd(eventToUpdate.event.end)
            punchTimeCard.forEach((d) => {
                if(d.id === eventToUpdate.event.id){
                    d.start=Moment(eventToUpdate.event.start).format('YYYY-MM-DD HH:mm:ss')
                    d.end= eventToUpdate.event.end ? Moment(eventToUpdate.event.end).format('YYYY-MM-DD HH:mm:ss') : ''
                    d.extendedProps['dayNo']=dayn
                    d.extendedProps['weekNo']=weekn
                    d.extendedProps['yearNo']=yearn
                }
                return
            })
        }else{
            let oldEvent = eventToUpdate.oldEvent
            punchTimeCard.forEach((d) => {
                if(d.id === eventToUpdate.event.id){
                    d.start=Moment(oldEvent.start).format('YYYY-MM-DD HH:mm:ss')
                    d.end=oldEvent.end ? Moment(oldEvent.end).format('YYYY-MM-DD HH:mm:ss') : ''
                    d.extendedProps['dayNo']=oldEvent.extendedProps['dayNo']
                    d.extendedProps['weekNo']=oldEvent.extendedProps['weekNo']
                    d.extendedProps['yearNo']=oldEvent.extendedProps['yearNo']
                }
                return
            })
            eventToUpdate.revert()
        }
        //const findEvent = .filter(p => p.id !== eventToEdit.event.id)
        this.setState({punchTimeCard})//,() => this.getInfosEmployee()
    }
    addOrRemoveInCalendar = (eventToEdit : any,add : boolean) =>{
        let {punchTimeCard,punchOperaCard} = this.state;
        const {dayNo,weekNo,yearNo,dataType}=eventToEdit.event.extendedProps
        if(add){ // add event
            let calendarEv= this.calendarRef?.current.getApi()
            const addedTimeCard={
                id : eventToEdit.event.id,
                start: eventToEdit.event.start,
                end:  eventToEdit.event.end ,
                editable:true,
                allDay:false,
                borderColor: eventToEdit.event.borderColor,
                backgroundColor:eventToEdit.event.backgroundColor,
                extendedProps:{dataType : 'TIME_CARD', noteBookIn: eventToEdit.event.noteBookIn, noteBookOut: eventToEdit.event.noteBookOut
                              ,idPunchIn:eventToEdit.event.idPunchIn, idPunchOut:eventToEdit.event.idPunchOut
                              , dayNo:eventToEdit.event.dayNo, weekNo : eventToEdit.event.weekNo, yearNo : eventToEdit.event.yearNo}
            }
            calendarEv.addEvent(addedTimeCard)
            calendarEv.refetchEvents()
            punchTimeCard.push(addedTimeCard)
        }else{ // remove event
            eventToEdit.event.remove()
            if(dataType === 'TIME_CARD')
                punchTimeCard = punchTimeCard.filter(p => p.id !== eventToEdit.event.id)
            else
                punchOperaCard = punchOperaCard.filter(p => p.id !== eventToEdit.event.id)
        }
       
        this.setState({punchTimeCard,punchOperaCard})

    }
    openEditEventModal = (p) => {
        this.setState({openEditEventModal:true})
    }
    closeEditEventModal = (p) => {
        this.setState({openEditEventModal:false,selectedJobNo:{},selectedSequence:{},selectedOperation:{}})//,listJobNo:[],listOperationNo:[],listSequences:[]
    }
    openCreateEventModal = (p) => {
        this.setState({openCreateEventModal:true})
    }
    closeCreateEventModal = (p) => {
        this.setState({openCreateEventModal:false,selectedJobNo:{},selectedSequence:{},selectedOperation:{}})//,listJobNo:[],listOperationNo:[],listSequences:[]
    }
    getEventCalById = (id) => {
        let calendarApi = this.calendarRef?.current.getApi();
        return calendarApi.getEventById(id)
    }
    getEVentsCal = () =>{
       return  this.calendarRef?.current.getApi().getEvents();
    }
    openCloseOperation = (infosOperToPunch : any) =>{
        let {server,infoEmployee} =this.state
        const url = `${server}/api/createoperation`;
        const self = this
        const latitude = this.props.coords && this.props.coords.latitude
        const longitude = this.props.coords && this.props.coords.longitude
        let keyPunch = Moment(infosOperToPunch.event.end).format("YYYY-MM-DD HH:mm:ss")
        let data: any = []
        let isOpen = Boolean(infoEmployee.IS_PRESENT)
        
        data = {
            comp_employee_no: infoEmployee.COMP_EMPLOYEE_NO,
            keyPunch,
            longitude: longitude ? Number(longitude.toFixed(3)) : 0,
            latitude: latitude ? Number(latitude.toFixed(3)) : 0 ,
            notePunch: '',
            task_no: infosOperToPunch.event.extendedProps['jobNo'],
            oper_no : infosOperToPunch.event.extendedProps['operationNo'],
            sequence : infosOperToPunch.event.extendedProps['sequence'],
            qty_progress: 0,
            qty_manufactured: 0,
            qty_rejected: 0,
            isOpen,
            timesheet_autopunch : 0,
            calendar_mode : 1,
            api_rest : 0,
            forced_dayno : null,
            forced_weekno : null,
            forced_yearno :null
        }
        const options: any = {
            method: 'PUT',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: qs.stringify(data),
            url
        };
        axios(options)
            .then(res => {
                 this.getInfosEmployee()
                  var eventToUpdate= this.getEventCalById(infosOperToPunch.event.id)
                  eventToUpdate.setProp('borderColor','#3A87AD')
                  res.data[0].PME_OUT_ID > 0 ? eventToUpdate.setExtendedProp('idPunchOut',res.data[0].PME_OUT_ID) : eventToUpdate.setExtendedProp('idPunchOut',res.data[0].PME_IN_ID)
                  if(   res.data[0].DAY_NO !== infosOperToPunch.event.extendedProps['dayNo'] 
                     || res.data[0].WEEK_NO !== infosOperToPunch.event.extendedProps['weekNo']
                     || res.data[0].YEAR_OF_PUNCH !== infosOperToPunch.event.extendedProps['yearNo'] ){
                        const idPmeIn = infosOperToPunch.event.extendedProps['idPunchIn']
                        const idPmeOut = infosOperToPunch.event.extendedProps['idPunchOut'] 
                        const jobNo = infosOperToPunch.event.extendedProps['jobNo']
                        const operNo = infosOperToPunch.event.extendedProps['operationNo']
                        const sequence = infosOperToPunch.event.extendedProps['sequence']
                        const keyStart = Moment(infosOperToPunch.event.start).format("YYYY-MM-DD HH:mm:ss")
                        const dataUpdate = `${server}/api/updateOperaCard/${idPmeIn}/${idPmeOut}/${jobNo}/${operNo}/${infoEmployee.COMP_EMPLOYEE_NO}/${keyStart}/${keyPunch}/${sequence}/${null}/${null}/${null}/${null}/${null}/${0} `
                        axios.get(dataUpdate)
                        .then(res => {
                            console.log('success update' ,res)
                         }).catch(err => {
                            infosOperToPunch.revert()
                            errorLogMessages(err);
                        });
                     }
            })
        /**/
     }
    resizeOperaCard = (eventInfo : any) => {
        let { server,compEmployeeNo ,punchOperaCard} = this.state;
       
        const {dayNo,weekNo,yearNo}=eventInfo.event.extendedProps 
        const keyPunch = Moment(eventInfo.event.start).format("YYYY-MM-DD HH:mm:ss")
                 if(eventInfo.oldEvent.end){ //update event
                    const dateEnd = eventInfo.event.end ? Moment(eventInfo.event.end).format("YYYY-MM-DD HH:mm:ss") : ''
                    const punchs = punchOperaCard.filter(p => p.id !== eventInfo.event.extendedProps['idPunchIn']
                                                             && p.extendedProps['operationNo'] === eventInfo.event.extendedProps['operationNo'] 
                                                             && p.extendedProps['jobNo'] === eventInfo.event.extendedProps['jobNo'] );
                    const result=  this.getNestedPunchToday(punchs,dayNo,weekNo,yearNo,keyPunch,dateEnd)
                   if(result === ''){
                        this.setState({eventToUpdateInCal:eventInfo},() => this.updateEventInCalendar(eventInfo,true,dayNo,weekNo,yearNo))
                        // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully resized!`) , 5000, "success",'Cancel',this.cancelUpdate)
                        if(result === ''){
                            const idPmeIn = eventInfo.event.extendedProps['idPunchIn']
                            const idPmeOut = eventInfo.event.extendedProps['idPunchOut'] ? eventInfo.event.extendedProps['idPunchOut'] : 0
                            const jobNo = eventInfo.event.extendedProps['jobNo']
                            const operNo = eventInfo.event.extendedProps['operationNo']
                            const sequence = eventInfo.event.extendedProps['sequence']
                            let dataUpdate = `${server}/api/updateOperaCard/${idPmeIn}/${idPmeOut}/${jobNo}/${operNo}/${compEmployeeNo}/${keyPunch}/${dateEnd}/${sequence}/${null}/${null}/${null}/${null}/${null}/${0} `
                              axios.get(dataUpdate)
                              .then(res => {
                                  console.log('success update' ,res)
                               }).catch(err => {
                                  eventInfo.revert()
                                  errorLogMessages(err);
                              });
                          }else{
                              eventInfo.revert()
                              logMessages(translateString("Oops!"), 500, result , 5000, "error");//translateString("Failed to update punch!")
                          }
                    }else{
                        eventInfo.revert()
                        logMessages(translateString("Oops!"), 500, result , 5000, "error");//translateString("Failed to update punch!")
                    }
                    
                 }else{//create event
                    this.openCloseOperation(eventInfo)
                 }
    }
    resizeTimeCard = () =>{

    }
    handleResizeEvent = (eventInfo) => {
        let { server,compEmployeeNo ,punchTimeCard} = this.state;
        let keyPunch: string =''
        const self=this
        //console.log('eventInfo============',eventInfo.oldEvent.end)
        switch (eventInfo.event.extendedProps['dataType']) {
            case 'TIME_CARD' : 
            var eventToUpdate= this.getEventCalById(eventInfo.event.id)
            const {dayNo,weekNo,yearNo}=eventInfo.event.extendedProps
                 if(eventInfo.oldEvent.end){ //update event
                    keyPunch = Moment(eventInfo.event.end).format("YYYY-MM-DD HH:mm:ss")
                    let punchs = punchTimeCard.filter(p => p.id !== eventInfo.event.extendedProps['idPunchIn'] );
                    const result=  this.getNestedPunchToday(punchs,dayNo,weekNo,yearNo,Moment(eventInfo.event.start).format("YYYY-MM-DD HH:mm:ss"),keyPunch)
                    let dataPunch=`${server}/api/updateOneTimeCard/${compEmployeeNo}/${eventInfo.event.extendedProps['idPunchOut']}/${keyPunch}`
                    if(result === ''){
                        this.setState({eventToUpdateInCal:eventInfo},() => this.updateEventInCalendar(eventInfo,true,dayNo,weekNo,yearNo))
                        // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully resized!`) , 5000, "success",'Cancel',this.cancelUpdate)
                        timeout= setTimeout(() => {
                                axios.get(dataPunch,{cancelToken: cancelTokenSource.token})
                                .then(res => {
                                    if (res.data) {
                                        this.getInfosEmployee()
                                    } else {
                                        logMessages(translateString("Oops!"), res.status, translateString("Failed to update punch!"), 3000, "error");
                                        eventInfo.revert()
                                    }
                                })
                                .catch(err => {
                                    if(axios.isCancel(err)){
                                        eventInfo.revert()
                                        cancelTokenSource = axios.CancelToken.source()
                                    }else{
                                    eventInfo.revert()
                                    errorLogMessages(err);}
                                });
                        }, 5000); 
                    }else{
                        eventInfo.revert()
                        logMessages(translateString("Oops!"), 500, result , 5000, "error");//translateString("Failed to update punch!")
                    }
                    
                 }else{//create event
                    keyPunch=Moment(eventInfo.event.end).format("YYYY-MM-DD HH:mm:ss")
                    const url = `${server}/api/punchinout`;
                    let data: any = []
                        data = {
                            comp_employee_no: compEmployeeNo,
                            keyPunch: keyPunch,
                            requestOTime: false,
                            longitude:  0,
                            latitude: 0 ,
                            notePunch: ''
                        }
                        const options: any = {
                            method: 'PUT',
                            headers: { 'content-type': 'application/x-www-form-urlencoded' },
                            data: qs.stringify(data),
                            url,
                        };
                        this.setState({eventToUpdateInCal:eventInfo},() => this.updateEventInCalendar(eventInfo,true,dayNo,weekNo,yearNo))
                        // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully resized!`) , 5000, "success",'Cancel',this.cancelUpdate)
                        timeout= setTimeout(() => { axios(options)
                        .then(res => {
                            if(res.data[0].PME_OUT_ID > 0){
                                //eventToUpdate.setProp('borderColor','#696969')
                                eventToUpdate.setExtendedProp('idPunchOut',res.data[0].PME_OUT_ID)
                                this.getInfosEmployee()
                                //eventToUpdate.setEnd(keyPunch)
                            }else {
                                logMessages(translateString("Oops!"), res.status, translateString("Failed to update punch!"), 5000, "error");
                                eventInfo.revert()
                            }
                        })
                        .catch(err => {
                            //console.log('err',err.response)
                            errorLogMessages(err);
                        });
                    }, 5000); 
                 }
            break
            case 'OPERA_CARD' :
                 this.resizeOperaCard(eventInfo)
            break 
        }
    }
    handleDropEvent = (info : any) => {
        const { server,compEmployeeNo } = this.state;
        let punchTimeCard = this.state.punchTimeCard
        const startDate=Moment(info.event.start).format("YYYY-MM-DD HH:mm:ss")
        const endDate = info.event.extendedProps['idPunchOut'] ? Moment(info.event.end).format("YYYY-MM-DD HH:mm:ss") : ''
        //const curDate = Moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let dataPunch=`${server}/api/updateTimeCard/${compEmployeeNo}/${info.event.extendedProps['idPunchIn']}/${startDate}`
        if(info.event.extendedProps['dataType'] === 'TIME_CARD') { //time card
            if(info.event.extendedProps['idPunchOut']){
                dataPunch += `/${info.event.extendedProps['idPunchOut']}/${endDate}`
                
            }else{
                dataPunch += `/${0}/${null}`
            }
            dataPunch += `/${'0'}/${0}/${'0'}/${0}`
            let punchs =this.state.punchTimeCard.filter(p => p.id !== info.event.id );
            axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${startDate}`)//startDate
             .then(res => {
                if(res.data){
                    const result = this.getNestedPunchToday(punchs,res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,startDate,endDate,Moment(res.data[0].shift_begin).utc().format("YYYY-MM-DD HH:mm:ss"),Moment(res.data[0].shift_end).utc().format("YYYY-MM-DD HH:mm:ss"))
                    if(result === ''){
                        this.setState({eventToUpdateInCal:info},() => this.updateEventInCalendar(info,true,res.data[0].day_no,res.data[0].week_no,res.data[0].year_no))
                        // displayMessages(translateString("Success!"), 200, translateString(`Punch successfully dropped!`) , 5000, "success",'Cancel',this.cancelUpdate)
                        //this.setState({eventToEdit:info})
                       timeout=setTimeout(() => { axios.get(dataPunch)
                            .then(res => {
                                if (res.data) {
                                    this.getInfosEmployee()
                                     /*var eventToUpdate= this.getEventCalById(info.event.id)
                                     eventToUpdate.setExtendedProp('dayNo',res.data[0].DAY_NO)
                                     eventToUpdate.setExtendedProp('weekNo',res.data[0].WEEK_NO)
                                     eventToUpdate.setExtendedProp('yearNo',res.data[0].YEAR_OF_PUNCH)
                                     eventToUpdate.setProp('start',info.event.start)
                                     eventToUpdate.setEnd(info.event.end)
                                     punchTimeCard.forEach((d) => {
                                        if(d.id === info.event.id){
                                            d.start=info.event.start
                                            d.end=info.event.end
                                            d.extendedProps['dayNo']=res.data[0].DAY_NO
                                            d.extendedProps['weekNo']=res.data[0].WEEK_NO
                                            d.extendedProps['yearNo']=res.data[0].YEAR_OF_PUNCH
                                        }
                                        return
                                    })
                                    logMessages(translateString("Success!"), "200", translateString("Punch successfully dropped!"), 3000, "success");*/
                                } else {
                                    logMessages(translateString("Oops!"), 500, res.statusText , 5000, "error")
                                    info.revert()
                                }
                            })
                            .catch(err => {
                                info.revert()
                                errorLogMessages(err);
                            });
                        },5000)
                    }else{
                        info.revert()
                        logMessages(translateString("Oops!"), 500, result , 5000, "error");//translateString("Failed to update punch!")
                    }
                }
            })
            .catch(err => {
                errorLogMessages(err);
            });     
                
        }else{ //opera card
            let punchs =this.state.punchOperaCard.filter(p => p.id !== info.event.id
                                                            && p.extendedProps['operationNo'] === info.event.extendedProps['operationNo'] 
                                                            && p.extendedProps['jobNo'] === info.event.extendedProps['jobNo']);
            axios.get(`${server}/api/getDayWeekYear/${compEmployeeNo}/${startDate}`)//startDate
             .then(res => {
                if(res.data){
                    const result = this.getNestedPunchToday(punchs,res.data[0].day_no,res.data[0].week_no,res.data[0].year_no,startDate,endDate,Moment(res.data[0].shift_begin).utc().format("YYYY-MM-DD HH:mm:ss"),Moment(res.data[0].shift_end).utc().format("YYYY-MM-DD HH:mm:ss"))
                    if(result === ''){
                      const idPmeIn = info.event.extendedProps['idPunchIn']
                      const idPmeOut = info.event.extendedProps['idPunchOut'] ? info.event.extendedProps['idPunchOut'] : 0
                      const dateEnd = info.event.end ? Moment(info.event.end).format("YYYY-MM-DD HH:mm:ss") : ''
                      const jobNo = info.event.extendedProps['jobNo']
                      const operNo = info.event.extendedProps['operationNo']
                      const sequence = info.event.extendedProps['sequence']
                      let dataUpdate = `${server}/api/updateOperaCard/${idPmeIn}/${idPmeOut}/${jobNo}/${operNo}/${compEmployeeNo}/${startDate}/${dateEnd}/${sequence}/${null}/${null}/${null}/${null}/${null}/${0} `
                        axios.get(dataUpdate)
                        .then(res => {
                            console.log('success update' ,res)
                         }).catch(err => {
                            info.revert()
                            errorLogMessages(err);
                        });
                    }else{
                        info.revert()
                        logMessages(translateString("Oops!"), 500, result , 5000, "error");//translateString("Failed to update punch!")
                    }
                }
             }).catch(err => {
                errorLogMessages(err);
            });  
        }
    }
    updateOperaOrTimeCard = (info : any) => {
        const { server,compEmployeeNo } = this.state;
        const startDate=Moment(info.event.start).format("YYYY-MM-DD HH:mm:ss")
        let dataPunch=`${server}/api/updateTimeCard/${compEmployeeNo}/${info.event.extendedProps['idPunchIn']}/${startDate}`
        if(info.event.extendedProps['dataType']==='TIME_CARD') { //time card
            if(info.event.extendedProps['idPunchOut']){
                const endDate=Moment(info.event.end).format("YYYY-MM-DD HH:mm:ss")
                dataPunch += `/${info.event.extendedProps['idPunchOut']}/${endDate}`
                
            }else{
                dataPunch += `/${0}/${null}`
            }
            
           // const found =this.checkIfExistPunchOrOpera(compEmployeeNo,startDate,'TIME_CARD',info.event.extendedProps['idPunchIn'],Moment(info.event.end).format("YYYY-MM-DD HH:mm:ss"))
                /*axios.get(dataPunch)
                .then(res => {
                    if (res.data) {

                    } else {
                        alert('echec!!!')
                        info.revert()
                    }
                    console.log('result final',res)
                })
                .catch(err => {
                    alert('echec!!!')
                    info.revert()
                    errorLogMessages(err);
                });*/
        }else{ //opera card
            
        }
    }
    handleSelectEmployee = (RowParams) => {
       // console.log('ChangeParams===',RowParams)
       const currentView=this.state.currentView
       let calendarApi = this.calendarRef?.current;
       //console.log('uuuuuuuuuuuuuuu===========',calendarApi.getView())
        this.setState({compEmployeeNo:RowParams.data.id},()=>{
            const tocheck = this.getCardChecked()
             if(tocheck && tocheck !== 'NONE'){
              this.getAllPunchForEmployee(RowParams.data.id,Moment(currentView.activeStart).format("YYYY-MM-DD HH:mm:ss"),Moment(currentView.activeEnd).format("YYYY-MM-DD HH:mm:ss"),tocheck)
             }
            })
    }
    createOrDelete = (keyPunch : string,toCreate : boolean) =>{ // if true : create : delete
        const {server,compEmployeeNo} = this.state
        const dataUrl=`${server}/api/punchinout`
        const data = {
            comp_employee_no : compEmployeeNo,
            keyPunch,
            requestOTime: true,
            longitude:  0,
            latitude:  0 ,
            notePunch: ''
        }
        const options: any = {
            method: 'PUT',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: qs.stringify(data),
            dataUrl
        };
        if(toCreate){
            axios(options)
            .then(res => {

            })
        }else{

        }
    }
    updateEvent = () =>{
        
    }
    removeTooltip = () =>{
        let barTooltip=document.querySelectorAll('.stackedPunch_tooltip') 
        if(barTooltip.length > 0) { 
            barTooltip.forEach(b => b.remove())
        }
    }
    render() {
        let { punchTimeCard,punchOperaCard,infoEmployee,tabValue,statusEmployee,anchorEl,compEmployeeNo,shiftEmployee,businessHours,startTime,endTime} = this.state
        //console.log(startTime,endTime"Time ii")
        let currentDateTime = new Date() as any
        currentDateTime = Moment(currentDateTime).format("YYYY-MM-DD HH:mm")
        let imageBackground = ''
        //let present : boolean=false
        let fullName : string = ''
        let roleName : string = ''
        let shiftName : string = ''
        let present : boolean=false
        let active : boolean=false
        if(infoEmployee){
        fullName= infoEmployee.LAST_NAME + ' ' + infoEmployee.FIRST_NAME
        roleName=infoEmployee.TITLE
        shiftName = infoEmployee.SHIFT_GRP_ABREV
        present = Boolean(infoEmployee.IS_PRESENT)
        active =  Boolean(infoEmployee.IS_ACTIVE)
        }

        //console.log('--------',infoEmployee[0][0])
        return (
            <div id="employeeClockInOu">
                <div className="d-flex flex-row flex-nowrap justify-content-between align-items-center pt-2 pb-2" id="pageTitle" style={{ fontSize: '1em' }}>
                        <div className="font-weight-bold">
                            <Tooltip title={translateString("Help?")} placement="right">
                                <Button id="pageFontStyle" onClick={this.openInstructions}>
                                    <StringTranslator>Employee Calendar</StringTranslator>
                                </Button>
                            </Tooltip>
                        </div>
                </div>
               <div id="employeeClockInOut" className="mt-0 row justify-content-between pageContent" style={{ margin:'0px'}}>
                     <div className="barTooltips"></div> {/**/}
                
                <div className="col-sm-12 col-md-5 col-lg-5 col-xl-3 pr-0 pl-0" style={{ flex: 1 }}>
                     <div className="card mb-1">
                        <div className="card-body mt-2 p-2 ">
                             <div style={{flexGrow: 1}}>
                            <Grid container spacing={1} >
                                <Grid item xs={4} sm={4} md={4} lg={4} xl={4} style={{textAlign:'center'}}>
                                {imageBackground ?
                                            <img style={{ width: "8em", height: "9em" }} className="card-img-top" src={imageBackground} /> :
                                            <AccountBoxIcon style={{ width: "5em", height: "5em" }} />
                                        }
                                        <br/><label htmlFor="lblName" style={{ fontSize: '0.9rem',fontWeight:'bold' }}>ID : </label><label htmlFor="lblNameVal" className="font-weight-bold" style={{ fontSize: '0.9rem' }}> &nbsp; {compEmployeeNo ? compEmployeeNo : ''}</label>
                                    
                                </Grid> 
                                <Grid item xs={7} sm={7}  md={7} lg={7} xl={7}  style={{textAlign:'center'}}>
                    <div className="card-tittle text-left" style={{ fontSize: "1.5rem",lineHeight:1,width:'105%'}}>
                        <label htmlFor="lblNameVal" className="font-weight-bold" style={{ fontSize: '0.9rem' }}>{ fullName }</label>
                        <br/><label htmlFor="lblNameVal" className="font-weight-bold" style={{ fontSize: '0.9rem' }}>{roleName} </label>
                        <br/><input style={{borderRadius: '1px',marginRight: '2px'}} className={`form-control text-center ${active && present ? 'active' : present ? 'present' : 'missing'} font-weight-bold`} disabled value={active && present ? 'Active' : present  ? 'Present' : 'Absent'}  />
                        <label htmlFor="lblShift" style={{ fontSize: '0.9rem', fontWeight: 'bold',color: 'rgb(73, 73, 75)'}}>  Shift :</label><label htmlFor="lblNameVal" className="font-weight-bold" style={{ fontSize: '0.9rem' }}> &nbsp; {shiftName} </label>
                       {/*  <br/><label htmlFor="lblpresenceTime" style={{ fontSize: '0.9rem' }}>Presence Time : </label><label htmlFor="lblNameVal" className="font-weight-bold" style={{ fontSize: '0.9rem' }}>  </label>
                        <br/><label htmlFor="lblWorkTime" style={{ fontSize: '0.9rem' }}>Work Time : </label><label htmlFor="lblNameVal" className="font-weight-bold" style={{ fontSize: '0.9rem' }}>  </label>*/}
                         </div>       
                   </Grid>  <Grid item xs={1} sm={1}  md={1} lg={1} xl={1} >
                                <IconButton key={'ic'} aria-label="settings" style={{padding:'10px 0px'}} onClick={this.showMenuThreeDot} >
                                    <MoreVertIcon titleAccess={'More options'}  />
                                </IconButton>
                                </Grid>
                                  <Menu
                                    id={'menu' }
                                    anchorEl={anchorEl}
                                    keepMounted
                                    open={Boolean(anchorEl)}
                                    onClose={this.handleCloseMenu}
                                    key={'menu'}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                >
                                    <MenuItem key={'mi1'} onClick={this.handleCloseMenu} id='inout'><AccessAlarmIcon/>&nbsp;{present ? translateString('Clock  out') : translateString('Clock  in')}</MenuItem>
                                    <MenuItem key={'mi2'} onClick={this.handleCloseMenu} id='punch'><EventIcon/>&nbsp;{translateString('Punch  time')}</MenuItem>
                                    <MenuItem key={'mi3'} onClick={this.handleCloseMenu} id='jobs' ><FitnessCenterIcon/>&nbsp;{translateString('Punch jobs')}</MenuItem>
                                </Menu>  
                            </Grid>
                          </div>
                        </div>
                    </div>
                    <div className="card mb-1" >
                     <div className="card-body mt-2 pt-2 pb-2" >
                        <Grid container spacing={1} >
                            <Grid item xs={12} sm={12} md={12} lg={12} xl={12} style={{textAlign:'center'}}>
                                    <AppBar position="static" color="default" >
                                        <Tabs
                                            value={tabValue}
                                            onChange={(e, newValue) => this.setState({ tabValue: newValue })}
                                            indicatorColor="primary"
                                            textColor="primary"
                                            variant="fullWidth"
                                            scrollButtons="auto"
                                            className="font-weight-bold ">
                                            <Tab label={translateString("Time Chart")}  disabled style={tabValue === 0 ? activeTab : defaultTab} />
                                            <Tab label={translateString("Job Chart")} disabled style={tabValue === 1 ? activeTab : defaultTab} />
                                        </Tabs>
                                    </AppBar>
                                    {tabValue === 0 && <TabContainer>
                                       <h5 style={{paddingTop: '20px',color: 'gray'}}> Development in progress</h5>
                                </TabContainer>}
                                   {/*  {tabValue === 0 && <TabContainer>
                                    <div className="pt-2 pb-2">
                                    <div className="timePunchPieChart">
                                            <TimePunchPieChart
                                                ref={(cd2: any) => this.pieChart = cd2}
                                                state={this.state}
                                                label = {['Day','Night','Over','Vacation']}
                                            />
                                        </div>
                                    </div>
                                </TabContainer>}
                                {tabValue === 1 && <TabContainer>
                                    job chart
                                </TabContainer>}
                      
                                */}
                            </Grid>
                        </Grid>
                        </div>
                    </div>
                     {/*    <div className="card mb-1" >
                            <div className="card-body mt-2 pt-2 pb-0">
                                <div style={{flexGrow: 1,lineHeight:0 }}>
                                   
                                            <FormControl component="fieldset" style={{width:'100%',color:'inherit'}}>
                                                <FormLabel component="legend" className="font-weight-bold">Presence</FormLabel>
                                                <RadioGroup row aria-label="position" name="position" defaultValue="pt">
                                                <Grid container spacing={1} >
                                                    <Grid item xs={6} sm={6} md={6} lg={6} xl={6}>
                                                        <FormControlLabel 
                                                            value="pt" 
                                                            style={{marginBottom:0}}
                                                            inputRef = {this.radioCleanPunch}
                                                            control={<Radio color="primary" size="small" 
                                                            onChange={(event) => {
                                                                if(compEmployeeNo){
                                                                    self.getAllTimeCard()
                                                                } 
                                                            }}/>} 
                                                            label={translateString("Punch time")}
                                                            
                                                            />
                                                    </Grid>   
                                                    <Grid item xs={6} sm={6} md={6} lg={6} xl={6}>
                                                        <FormControlLabel value="at" 
                                                           control={<Radio color="primary" size="small" 
                                                           onChange={(event) => {
                                                                 self.getAllTimeCard()
                                                            }
                                                        }/>}
                                                           
                                                           label={translateString("Adjusted time")} 
                                                        />
                                                    </Grid>
                                                </Grid>
                                                </RadioGroup>
                                            </FormControl>
                                        
                                    
                                </div>
                            </div>
                        </div> */}
                        <div className="card mb-1" >
                            <div className="card-body mt-2 pt-2 pb-0">
                                <div style={{flexGrow: 1,lineHeight:0 }}>
                                <Grid >
                                   {/*<label className="font-weight-bold">Job</label>   Vadym 18/03/2021*/}
                                </Grid> 
                                <Grid container spacing={1} >
                                         <Grid item xs={6} sm={6} md={6} lg={6} xl={6} >
                                         <FormControlLabel
                                            //inputRef = {this.chkOC}
                                            value="oc"
                                            control={<Checkbox color="primary" size="small" defaultChecked
                                            style={{marginBottom:0}}
                                            onChange={(event) => {
                                                let {punchOperaCard,compEmployeeNo}=this.state
                                                if(compEmployeeNo){
                                                    let events = this.calendarRef?.current.getApi().getEvents();
                                                    let calendarEv= this.calendarRef?.current.getApi()
                                                    if(event.currentTarget.checked){
                                                            //punchOperaCard.map((ev: any) => {
                                                            //calendarEv.addEvent(ev)
                                                        //})
                                                            this.getOperaCard()
                                                    }else{ //remove opera card
                                                    events.map((ev: any) => {
                                                        if(ev.extendedProps['dataType']==='OPERA_CARD'){
                                                            ev.remove()
                                                        }
                                                    })
                                                    }
                                            }
                                            }}/>}
                                            label={translateString("Operation")}
                                            labelPlacement="end"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={6} md={6} lg={6} xl={6} >
                                        <FormControlLabel
                                                    //inputRef = {this.chkOC}
                                                    value="manTime"
                                                    control={<Checkbox color="primary" size="small" defaultChecked
                                                    onChange={(event) => {
                                                        let {punchTimeCard,compEmployeeNo}=this.state
                                                        if(compEmployeeNo){
                                                            let events = this.calendarRef?.current.getApi().getEvents();
                                                            if(event.currentTarget.checked){
                                                                this.getTimeCard()
                                                            }else{
                                                                events.map((ev: any) => {
                                                                    if(ev.extendedProps['dataType']==='TIME_CARD'){
                                                                        ev.remove()
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    }}/>}
                                                    label={translateString("Card Time")}
                                                    labelPlacement="end"
                                                    />
                                        </Grid>
                                    </Grid>

                                </div>
                                
                            </div>
                        </div>
                </div>
                <div className="col-sm-12 col-md-7 col-lg-7 col-xl-9 pl-1 pr-0" style={{ flex: 1}}>      
                    <div className="card">
                        <div className="card-body"> 
                           <div className="fullcalendar" id="fullcalendar" >
                                    <FullCalendar 
                                    //timeZone = 'local' UTC
                                    initialView="timeGridWeek" 
                                    headerToolbar={{
                                        left: 'today prev,next',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek,timeGridDay'//,listWeek
                                    }}
                                    //firstDay={1}
                                    datesSet = {
                                        (e) =>{
                                            if(!this.state.firstLoad){
                                           /**/ this.setState({currentView:e.view},
                                              () =>  { 
                                                const tocheck = this.getCardChecked()
                                                  /*if(tocheck && tocheck !== 'NONE'){
                                                        if(this.state.compEmployeeNo){
                                                            let events = this.calendarRef?.current.getApi().getEvents();
                                                            events.map((ev: any) => ( ev.remove() ))
                                                             this.getAllPunchForEmployee(this.state.compEmployeeNo,Moment(e.start).format("YYYY-MM-DD HH:mm:ss"),Moment(e.end).format("YYYY-MM-DD HH:mm:ss"),tocheck)
                                                        }
                                                  }*/
                                                  this.getAllTimeCard()
                                                }
                                            ) 
                                        }
                                        } 
                                    }
                                   viewDidMount={(e)=> {
                                        if(this.state.firstLoad){
                                            this.setState({currentView:e.view})
                                         /* if(this.state.compEmployeeNo ){
                                        const {activeStart,activeEnd} = e.view  
                                        this.setState({currentView:e.view},
                                                      () => self.getAllTimeCard()//this.getAllPunchForEmployee(this.state.compEmployeeNo,Moment(activeStart).format("YYYY-MM-DD HH:mm:ss"),Moment(activeEnd).format("YYYY-MM-DD HH:mm:ss"),'ALL')
                                                      )
                                        }*/
                                    }
                                     }
                                    }
                                    select={(info) => this.handleSelectClick(info)} 
                                    editable={true}
                                    selectable={true}
                                    allDaySlot={false}
                                    locale = 'en' // fr
                                    //displayEventTime={false}
                                    //navLinks ={true}
                                    //nextDayThreshold = "09:00:00"
                                    slotLabelFormat = 'HH:mm'
                                    dayHeaderFormat={{ weekday: 'short', day: '2-digit' }}
                                    eventTimeFormat = {{hour:'2-digit',minute: '2-digit',second: '2-digit', hour12: false}}
                                    plugins={[ dayGridPlugin, timeGridPlugin,momentPlugin, interactionPlugin ]} 
                                    eventSources={[ punchOperaCard ,punchTimeCard ]}
                                    /*events ={
                                        [
                                                { title: 'event 1', allDay: false, start: '2020-11-01 08:00:00', end: '2020-11-01 10:00:00',backgroundColor: 'green', textColor: 'red' },
                                                { title: "Event in bold 1",extendedProps:{tutor: 'Tutor 2',place: 'Place 2'}, allDay: false, start: '2020-11-02 09:00:00', end: '',borderColor: 'yellow', textColor: 'black' }
                                            ]
                                    }*/
                                    eventDrop ={ (eventDropInfo) => this.handleDropEvent(eventDropInfo)
                                    }
                                    eventResize ={ (eventResizeInfo) => this.handleResizeEvent(eventResizeInfo)}
                                    eventMouseEnter= {
                                        (e) => {
                                            this.removeTooltip() 
                                        let longText=''
                                        if(e.event.extendedProps["dataType"]==='OPERA_CARD'){
                                             longText = `<div>
                                                            <span style="text-align:left;">${translateString('Operation')} : ${e.event.extendedProps["operationNo"]} </span>
                                                            <br/><span style="text-align:left;">${translateString('Task')} : ${e.event.extendedProps["jobNo"]}</span>
                                                            <br/><span style="text-align:left;">${translateString('Sequence')} : ${e.event.extendedProps["sequence"]}</span>
                                                            <br/><span style="text-align:left;">${translateString('Start')} : ${Moment(String(e.event.start)).format('YYYY-MM-DD HH:mm:ss')}</span>
                                                            <br/><span style="text-align:left;">${translateString('End')} : ${e.event.end ? Moment(String(e.event.end)).format('YYYY-MM-DD HH:mm:ss') : ''}</span>
                                                        </div>`
                                        }else{
                                             longText = `<div>
                                                            <span style="text-align:left;">${translateString('start')} : ${Moment(String(e.event.start)).format('YYYY-MM-DD HH:mm:ss')} </span>
                                                            <br/><span style="text-align:left;">${translateString('end')} : ${e.event.end ? Moment(String(e.event.end)).format('YYYY-MM-DD HH:mm:ss') : ''}</span>
                                                        </div>`
                                        }
                                           
                                          // const eveTooltip=document.getElementsByClassName('barTooltips')[0]
                                       const eventToolTip = document.querySelector('.barTooltips') as HTMLDivElement
                                       const contentDiv=document.createElement('div')
                                       contentDiv.style.left= e.jsEvent.pageX -30 +'px'
                                       contentDiv.style.top= e.jsEvent.pageY -50 +'px'
                                       contentDiv.style.textAlign='left'
                                       contentDiv.style.padding='10px 5px'
                                       contentDiv.innerHTML=longText
                                       contentDiv?.setAttribute("class", "stackedPunch_tooltip")
                                       eventToolTip?.append(contentDiv)
                                        }
                                    }
                                    eventMouseLeave= {
                                        (e) => {
                                           this.removeTooltip()
                                    }//alert()
                                    } 
                                    //Vadym comment 03/17/2021
                                    /*dayHeaderDidMount={
                                        (e) => {
                                            const self=this
                                            axios.get(`${this.state.server}/api/getshiftemployee/${this.state.compEmployeeNo}`)
                                            .then(res => {
                                                let shiftEmployee= new Array(); 
                                                shiftEmployee= res.data;  
                                            let a = e.el.getElementsByClassName('fc-scrollgrid-sync-inner')[0]
                                            var currentShift =_.find(shiftEmployee, ['DOW' , e.dow + 1] );
                                            var endshift =_.find(shiftEmployee, ['DOW' , e.dow + 1] );
                                            var lnkSihift = document.createElement("a");   
                                            if(currentShift) { 
                                                lnkSihift.innerHTML= currentShift.SHIFT_ABREV
                                                lnkSihift.style.backgroundColor= grey[500]
                                                lnkSihift.className='fc-col-header-cell-cushion'
                                                lnkSihift.setAttribute('title','shift employee')
                                            }
                                            a.append(lnkSihift)
                                            
                                            }).catch(err => {
                                                        errorLogMessages(err);
                                            });
                                            
                                        }
                                    } 
                                    */                                        
                                    
                                    eventDidMount = { function(info) {
                                        switch (info.view.type) {
                                            case 'timeGridWeek':
                                            case 'timeGridDay':
                                                 {
                                                if(Object.keys(info.event.extendedProps).length >0){
                                                    let title = info.el.getElementsByClassName("fc-sticky")[0];
                                                    if(info.event.extendedProps["dataType"]==='OPERA_CARD'){
                                                        var str = info.event.extendedProps["operationNo"] + "<br>" +  info.event.extendedProps["jobNo"]
                                                        if(info.event.extendedProps["descrip"]) str += "<br>" + info.event.extendedProps["descrip"]
                                                        str += "<br>Séquence: " + info.event.extendedProps["sequence"]
                                                        if(title)  title.innerHTML = str ;
                                                    }else{

                                                    }
                                                }
                                                break;
                                            }
                                            /*case 'timeGridMonth': {
                                                if(Object.keys(info.event.extendedProps).length >0){
                                                    let title = info.el.getElementsByClassName("fc-sticky")[0];
                                                    if(info.event.extendedProps["dataType"]==='OPERA_CARD'){
                                                        var str = info.event.extendedProps["operationNo"] + "<br>" +  info.event.extendedProps["jobNo"]
                                                        if(info.event.extendedProps["descrip"]) str += "<br>" + info.event.extendedProps["descrip"]
                                                        str += "<br>Séquence: " + info.event.extendedProps["sequence"]
                                                        if(title)  title.innerHTML = str ;
                                                    }else{

                                                    }
                                                }
                                                break;
                                            }*/
                                        }
                                        /*var tooltip = new Tooltip(info.el, {
                                            title: info.event.extendedProps.description,
                                            placement: 'top',
                                            trigger: 'hover',
                                            container: 'body'
                                          });*/
                                    } 
                                    }
                                    businessHours = {startTime}
                                    eventResizableFromStart={true}
                                    eventClick= { (info) => {this.handleClickEvent(info) }
                                    } 
                                    ref={this.calendarRef}
                                    
                                    />
                            </div>
                        </div>
                     </div>
                </div>
</div >
                <EditEventModal 
                    openEditEventModal={this.state.openEditEventModal}
                    closeEditEventModal={this.closeEditEventModal}
                    selectedOperation={this.state.selectedOperation}
                    listOperations ={this.state.listOperationNo}
                    selectedJobNo={this.state.selectedJobNo}
                    listJobNo ={this.state.listJobNo}
                    eventDataType = {this.state.eventDataType}
                    selectedTimeCard= {this.state.selectedTimeCard}
                    selectedOperaCard= {this.state.selectedOperaCard}
                    onHandleChangeOperation = {this.handleChangeOperation}
                    onHandleChangeTask = {this.handleChangeTask}
                    onHandleDelete = {this.handleDelete}
                    onHandleSubmit = {this.state.addEvent ? this.handleCreatePunch : this.handleUpdatePunch}
                    onHandleChangeDateBegin={this.handleChangeDateBegin}
                    onHandleChangeDateEnd={this.handleChangeDateEnd}
                    onHandleNotePunchIn = {this.handleNotePunchIn}
                    onHandleNotePunchOut = {this.handleNotePunchOut}
                    listSequences ={this.state.listSequences}
                    selectedSequence ={this.state.selectedSequence}
                    onHandleChangeSequence = {this.handleChangeSequence}
                    addOrEdit = {this.state.addEvent}  //addOrEdit (true/false) true=add , false=edit 
                />
                <CreateEventModal 
                    openCreateEventModal={this.state.openCreateEventModal}
                    closeCreateEventModal={this.closeCreateEventModal}
                    selectedOperation={this.state.selectedOperation}
                    listOperations ={this.state.listOperationNo}
                    selectedJobNo={this.state.selectedJobNo}
                    listJobNo ={this.state.listJobNo}
                    eventDataType = {this.state.eventDataType}
                    selectedTimeCard= {this.state.selectedTimeCard}
                    selectedOperaCard= {this.state.selectedOperaCard}
                    onHandleChangeOperation = {this.handleChangeOperation}
                    onHandleChangeTask = {this.handleChangeTask}
                    onHandleDelete = {this.handleDelete}
                    onHandleSubmit = {this.state.addEvent ? this.handleCreatePunch : this.handleUpdatePunch}
                    onHandleChangeDateBegin={this.handleChangeDateBegin}
                    onHandleChangeDateEnd={this.handleChangeDateEnd}
                    onHandleNotePunchIn = {this.handleNotePunchIn}
                    onHandleNotePunchOut = {this.handleNotePunchOut}
                    listSequences ={this.state.listSequences}
                    selectedSequence ={this.state.selectedSequence}
                    onHandleChangeSequence = {this.handleChangeSequence}
                    addOrEdit = {this.state.addEvent} //addOrEdit (true/false) true=add , false=edit 
                    onHandleChangeDataType = {this.handleChangeDataType}

                />   {/**/}
                <InstructionsModal
                    showInstructionsModal={this.state.openInstructionsModal}
                    closeInstructionsModal={() => { this.closeModal() }}
                    curWebRoute={this.state.pathArray[this.state.pathArray.length - 2]} 
                />
                
            </div >
        )
    }
}

function mapStateToProps(state: AppState) {
    return {
        state
    };
}
// Using Object.assign
EmployeeCalendar.propTypes = Object.assign({}, EmployeeCalendar.propTypes, geoPropTypes);
// Using ES6 object spread syntax
EmployeeCalendar.propTypes = { ...EmployeeCalendar.propTypes, ...geoPropTypes };

export default (connect(mapStateToProps, null), geolocated())(EmployeeCalendar)
