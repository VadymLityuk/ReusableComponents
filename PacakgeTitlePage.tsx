import React, { ChangeEvent, createRef } from "react";
import { RouteComponentProps, withRouter } from 'react-router-dom';

import axios from 'axios';
import { SelectComponent } from 'components/HelperMethods/ReusableComponents';
import { errorLogMessages } from './ProductionForAction/LogMessages';
import { ErrorMessage } from './HelperMethods/ErrorMessage';

import { translateString, StringTranslator, isNullOrUndefined,AutocompleteComponent } from './HelperMethods/ReusableComponents';
import FullWidthTabs from "./PackageTab";
import { Grid, Switch, OutlinedInput, FormControlLabel, Button,TextField,MenuItem } from "@material-ui/core";
import {ImBarcode} from "react-icons/im"

type Props = RouteComponentProps<{}>;

export class PackageLanding extends React.Component<Props,{
   packageTypes: Array<any>
   userId: string
   server: any
   packageNO: any
   barcode: string
   manualScan : string;
   autoScan: string;
   selectedType: number
   typeMap: Map<any, any>
   typeName: Array<any>
   tabIdx: number
   isEntryMode: boolean;
   selectedInsertType: string;
   insertPackageTypes: Array<any>;
   selectedBarcode: any;
   listOperationNo:Array<any>;
   selectedOperation: any;
   dropdsdata: Array<any>;
   getDropdownList: string;
   SelectedPOtype: any;
}>{
    private scan = createRef<HTMLInputElement>();
    setFocusToScan: any;
    constructor(props) {
        super(props);
        this.setFocusToScan = React.createRef<HTMLInputElement>();
        this.handleCreateButton = this.handleCreateButton.bind(this);
        this.handleTabChange = this.handleTabChange.bind(this);
        this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
        let server = !isNullOrUndefined(localStorage.getItem('servername')) ? localStorage.getItem('servername') : ""
        let userKey = !isNullOrUndefined(localStorage.getItem('userID')) ? localStorage.userID : "";
        // let userKey = !isNullOrUndefined(localStorage.getItem('userID')) ? localStorage.userID : "";
        this.state = { 
            packageTypes: new Array(),
            userId: userKey,
            server: server,
            packageNO: 0,
            barcode: "",
            manualScan : "",
            autoScan : "",
            selectedType: 0,
            typeMap: new Map(),
            typeName: [],
            tabIdx: 0,
            isEntryMode: true,
            selectedInsertType: '',
            insertPackageTypes: new Array(),
            selectedBarcode: {},
            listOperationNo: [],
            selectedOperation : {},
            dropdsdata : [],
            getDropdownList: '',
            SelectedPOtype: {}
        }
    }

    componentDidMount() {
        let selfThis = this;
        let { server, insertPackageTypes,dropdsdata ,selectedType,} = selfThis.state;
        let data = [`${server}/api/getPackageType`, `${server}/api/getInsertPackageType`,]
        // let data = [`${server}/api/createPackage/${type}/${userId}`]
        let typeMap = new Map()
        axios.all(data.map(l => axios.get(l)))
            .then(
                axios.spread(function (...res) {
                    let packagesTypes = selfThis.state.packageTypes.slice();
                    packagesTypes = res[0].data
                    insertPackageTypes = res[1].data;
                    let mySelectedPo =  insertPackageTypes[0].ID
                    let currType = packagesTypes[0].ID
                    packagesTypes.forEach(e => {typeMap.set(e['DESCRIP'], e['ID'])})
                    selfThis.setState({ 
                        packageTypes: packagesTypes,
                        selectedType: currType,
                        typeMap: typeMap,
                        insertPackageTypes,
                        selectedInsertType: insertPackageTypes[1].ID,
                        SelectedPOtype: mySelectedPo
                    }, () => {
                     selfThis.getDropdDownList()
                    });
                })).catch(err => {
                    errorLogMessages(err);
                });
    }

    getDropdDownList  = () => {
        let self = this;
     let { server,dropdsdata } = self.state;
     let {selectedInsertType,insertPackageTypes,SelectedPOtype} = self.state
     console.log('test get dropdwon list ' , selectedInsertType)
     let data = new Array()
     let invent = new Array()
     let selectedOperation={}
     let listOperationNo=Array()
     data=[ `${server}/api/getcreatedropdown?doctype=${selectedInsertType}`, ] 
     axios.all(data.map(l => axios.get(l)))
     .then(
         axios.spread(function (...res) {
             invent=res[0].data[0]
             let dropdowndata = invent
             dropdowndata.map((v: any) => {
                     if(dropdsdata === v.KEY_VALUE ){
                         selectedOperation ={
                             label :v.descrip,
                             value: v.KEY_VALUE
                           }
                     }
                     listOperationNo.push({
                        label :v.KEY_VALUE + "    , " +  v.descrip,
                        value: v.KEY_VALUE
                     })
                 })
             console.log( 'TEST OPTIONS LIST',listOperationNo,data)
             self.setState ({ selectedOperation,listOperationNo})
             }) )
 }
    

    handleScan(data) {
        this.setState({barcode:data})
    }

    handleError(err){
        console.error(err)
      }

    handleChange = (event: any) => {
        const { name, value } = event.currentTarget;
        // this.setState({ ...this.state, [name]: value }, () => {
        switch (name) {
            case 'productType':
                let id: number = parseInt(value);
                this.setState({ selectedType: id }, () => {
                    // this.refreshData();
                })
                break;
            default:
                this.setState({ ...this.state, [name]: value }, () => {
                    
                 this.getDropdDownList()
                    // this.refreshData();
                })
                break;
        }
        console.log('TEST TO HANDLE VELUE',value)
    } 

    handleCreateButton() {
        let selfThis = this
        const {
            selectedType, userId, server
        } = this.state
        let type = selectedType
        let data = [`${server}/api/createPackage/${type}/${userId}`]

        axios.all(data.map(l => axios.get(l)))
            .then(
                axios.spread(function (...res) {
                    let packageNO = Object.assign({}, selfThis.state.packageNO);
                    packageNO = res[0].data.output.PACKAGING_NO
                    selfThis.setState({ 
                        packageNO: packageNO,
                    }, () => {
                        selfThis.redirectHandler()
                    });
                })).catch(err => {
                    errorLogMessages(err);
                });
    }

    handleTabChange = (event, newValue) => {
        this.setState({tabIdx: newValue})
    };

    handleTextFieldChange = (event,s) => {
        console.log("test event",s)
        const { name,value } = event.target;
    this.setState({ selectedBarcode: s })
    }
    onKeyPress = (ev) =>{
        if(ev.key === 'Enter') {
            this.fetchPackageNo()
            ev.preventDefault()
        }
    }
    handleChangeScan = (e: any) => {
        const node = this.scan.current
        node && node.blur()
        const { name, value } = e.currentTarget;
        console.log("name---"+name)
        console.log("value---"+value)
        this.setState({ ...this.state, [name]: value }, () => {
            this.fetchPackageNo()
        })
    }
    fetchPackageNo() {
        let selfThis = this;
        let {server, userId, isEntryMode, selectedInsertType,selectedBarcode,barcode} = this.state;

        //barcode = selectedBarcode.value

        if(!isEntryMode && selectedInsertType !== 'INV'){
           // barcode = selectedInsertType + selectedBarcode.value;barcode
           barcode = selectedInsertType + selectedBarcode.value;

        }
        else if ( !isEntryMode){
            barcode = selectedBarcode.value
        }
        let data = [`${server}/api/openPackageFromBarcode/${barcode}/${userId}`]
        axios.all(data.map(l => axios.get(l)))
            .then(
                axios.spread( (...res) => {
                    let packageNO = Object.assign({}, selfThis.state.packageNO);
                    packageNO = res[0].data.output.PACKAGING_NO
                    console.log(packageNO)
                    selfThis.setState({ 
                        packageNO: packageNO,
                        barcode
                    }, () => {
                        if( packageNO !== null //&& 
                            //packageNO !== 0
                            ){
                            selfThis.redirectHandler()
                        }
                    });
                })).catch(err => {
                    errorLogMessages(err);
                });
    }
    redirectHandler = () => {
        this.props.history.push('/P4A/packagelanding/'+this.state.packageNO)
    }
    render() {
        const {
            selectedType, packageTypes, barcode, isEntryMode, insertPackageTypes, selectedInsertType,selectedBarcode,dropdsdata,selectedOperation,listOperationNo
        } = this.state
  
        return (
            <div>
                <div className="d-flex flex-row flex-nowrap justify-content-center align-items-center pt-4 pb-2" id="pageTitle" style={{ fontSize: '1em' }}>
                    <div className="font-weight-bold">
                        <h2 id="pageFontStyle">{translateString("Packaging Module")}</h2>
                    </div>
                </div>
                <div  id="packagelandingcard">           
                    <Grid  container direction="column" alignItems="center">
                        <div >
                            <Grid  className="box"  container direction="column" alignItems="center" spacing={2}>
                                <Grid id="packagescantitle"  item>
                                <p style={{ color:'var(--backed-up2)',fontWeight: "bolder",fontSize: '1.9em', marginTop: "4%"}}>
                                        {isEntryMode ? <StringTranslator>Scan your Package here</StringTranslator> : <StringTranslator>Enter your Package here</StringTranslator>}
                                </p>
                                <hr></hr>
                               {/** 
                               <ul>
                                    {dropdsdata.map(inv => <li style={{color:'black'}} key={inv.ID}>{inv.KEY_VALUE}, {inv.descrip}</li>)}
                                </ul> 
                               */} 
                                </Grid>
                            <Grid item  style={{paddingTop: '12px'}}>
                                        <FormControlLabel
                                            control={  
                                                <Switch
                                                    checked={isEntryMode}
                                                    onChange={(event) => {
                                                        this.setState({ isEntryMode: event.target.checked, barcode: ''});    
                                                    //   this.setFocusToScan.current.focus()                                    
                                                    }}
                                                    color="primary"
                                                    value={isEntryMode}
                                                    size="medium"/> }
                                            label={isEntryMode ? translateString("AUTOMATIC SCAN") : translateString("MANUAL SCAN")}/>
                            </Grid>  
                           {/**<TextField style={{width: '200px'}}
                                              // id="outlined-basic"  
                                               variant="outlined"
                                               select
                                               label={translateString("test")} 
                                               onChange={this.handleChange}>    
                                             {dropdsdata.map((e,i) =>(
                                           <option key={i}>{e.KEY_VALUE}{e.descrip}</option> ))}
                                    </TextField> */} 
                            {isEntryMode && <Grid item>
                             <OutlinedInput
                                        inputRef={this.setFocusToScan}
                                        name="barcode"
                                        id="standard-basic"
                                        placeholder="Scan"
                                        value={barcode}
                                        fullWidth
                                        style={{ height: '3rem', fontSize: '2rem',width: '300px',
                                        boxShadow:'rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px'}}  
                                        autoFocus = { true}
                                        onChange={(e) => this.handleChange(e)}
                                        onKeyPress={this.onKeyPress}/>
                            </Grid>}   
                                {!isEntryMode &&
                                <div>
                            <Grid item style={{width: '300px'}}>
                                 <AutocompleteComponent
                                      id='combo'
                                      label="Enter"
                                      menuLimit={3}
                                     options={listOperationNo}
                                     selectedElement={selectedBarcode}
                                      handleChange={ this.handleTextFieldChange}
                                     />
                            </Grid>
                            <Grid item style={{width: '300px',paddingTop: '12px'}}>
                                    <SelectComponent 
                                        name="selectedInsertType"
                                        options={insertPackageTypes}
                                        value={selectedInsertType}
                                        handleChange={this.handleChange}/>
                            </Grid>
                                </div>}
                            <Grid container item direction="column" alignItems="center"  style={{ marginTop: '10px' }}>
                            <Grid item >
                                        <Button 
                                         variant="contained"
                                         size="medium"
                                         packNo={this.state.packageNO}
                                        style={{backgroundColor: 'var(--backed-up2)',color:'white', opacity: isEntryMode ? 0.5 : 1 }}
                                            onClick={() =>{ 
                                                this.fetchPackageNo()
                                                if( isEntryMode){
                                                //    this.setFocusToScan.current.focus()
                                                }
                                            }
                                            } 
                                            disabled={isEntryMode}>
                                        <StringTranslator>VALIDATE</StringTranslator></Button>
                            </Grid>
                            </Grid>
                            <Grid id="barcode"  container direction="column" alignItems="center">
                                <Grid item >
                                        <span className="text-secondary" style={{ fontSize: '1.4em'}}>
                                            <strong>Create a Barcode</strong>
                                        </span>
                                        <hr></hr>
                            </Grid>
                                    <div className="col-10 col-sm-10 col-md-10 col-lg-10 col-xl-10" style={{marginTop:'10px', padding:'0px'}}>
                            <Grid item style={{width: '100%'}}> 
                                            <SelectComponent 
                                                name="productType"
                                                className="selector"
                                                options={packageTypes}
                                                value={selectedType}
                                                handleChange={this.handleChange} />
                                            <ErrorMessage value={selectedType} />
                            </Grid>
                                    </div>
                                    {/* <div className="col-12 col-sm-6 col-md-4 col-lg-2 col-xl-12" style={{marginTop:'20px'}}> */}
                                    <Grid item style={{marginTop:'23px',paddingBottom: '1rem'}}>
                                        <div className="col-12 col-sm-6 col-md-4 col-lg-2 col-xl-12">
                                            <Button 
                                            variant="outlined"
                                             color="default"
                                             size="medium"
                                                onClick={this.handleCreateButton}
                                                >
                                                <strong><StringTranslator>CREATE</StringTranslator></strong>
                                            </Button>
                                        </div>
                                    </Grid>
                                    {/* </div> */}
                                </Grid>
                            </Grid>
                            <div className="col" style={{marginTop:'90px'}}>                 
                            </div>
                            {/* <div className="form-group col-12 col-sm-6 col-md-4 col-lg-2 col-xl-2 offset-0 offset-sm-0 offset-md-0 offset-lg-1 offset-xl-1" style={{marginTop:'20px'}}>
                                <SelectComponent 
                                    name="productType"
                                    options={packageTypes}
                                    value={selectedType}
                                    handleChange={this.handleChange} />
                                <ErrorMessage value={selectedType} />
                            </div>
                            <div className="form-group col-12 col-sm-6 col-md-4 col-lg-2 col-xl-2 offset-0 offset-sm-0 offset-md-0 offset-lg-1 offset-xl-1"style={{marginTop:'20px'}}>
                                <button style={{ color: 'white' ,backgroundColor: '#09b3ac'}}
                                    onClick={this.handleCreateButton}
                                    >
                                    <StringTranslator>CREATE</StringTranslator>
                                </button>
                            </div> */}
                        </div>          
                    </Grid>
                </div>
            </div>
        )
    }
}



export default (PackageLanding)
