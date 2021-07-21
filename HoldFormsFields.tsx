import React, { ChangeEvent } from "react"
import axios from "axios"
import Moment from "moment";
import uuidv4 from 'uuid';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import { Typography, Tabs, Tab, Paper, Button, Tooltip, Box, Checkbox, 
    FormControlLabel, Divider, Grid, IconButton, InputAdornment, FormControl, InputLabel, 
    Input, ListItem, ListItemAvatar, Avatar, ListItemText, List, Fab } from "@material-ui/core";
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import { translateString, StringTranslator, DateComponent, SelectComponent, isNullOrUndefined, round } from "components/HelperMethods/ReusableComponents";
import { errorLogMessages, logMessages } from "components/ProductionForAction/LogMessages";
import { MoreHoriz, Add, Close, Done } from "@material-ui/icons";
import { grey } from "@material-ui/core/colors";
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit'
import { LinkTitle } from 'components/LinkTitle';
import { InstructionsModal } from "components/ProductionForAction/Modals/Modals";
import { AttachmentsModal, defineLoadingFileTime, fileSizeCalculator, readUploadedFiles,
    renderComponents } from "components/Lab4Action/FormBuilder/DynamicFormComponents";
import { filter } from "lodash";

const activeTab = {
    backgroundColor: '#212529',
    color: 'white',
    fontWeight: 700,
    fontSize: '1em',
    borderRadius: "0px 0px 15px 15px"
}

const defaultTab = {
    backgroundColor: 'white',
    color: '#212529',
    fontWeight: 700,
    fontSize: '1em',
    borderRadius: "15px"
}

const disabledTab = {
    backgroundColor: "#e9ecef",
    color: '#212529',
    fontWeight: 700,
    fontSize: '1em',
    borderRadius: "0px 0px 15px 15px"
}

const tabBoxDefault = {
    backgroundColor: 'white',
    color: '#212529',
    border: "3px solid var(--primary-color)",
    borderRadius: "5px"
}



      

let loadingProcessTimer: any = null
let isSubmiting: boolean = false
let isCanceling: boolean = false

class QualityHoldEntry extends React.Component <any, any>{
    isUpdatingState: boolean = false
    afterStateUpdate: any
    isUpdatingDB: boolean = false
    afterDBUpdate: any
    constructor(props) {
        super(props)
        this.isUpdatingState = false
        const tServer = !isNullOrUndefined(localStorage.getItem('servername')) ? localStorage.getItem('servername') : "";
        this.state = {
            itemType: 1,
            holdType: "",
            holdKey: "",
            IssueType: "",
            holdNum: "",
            isPrecautionaryHold: false,
            holdDate: new Date(),
            line: 1,
            shift: 1,
            operatorInit: "",
            technicianInit: "",
            item: 0,
            secondaryPackage: 0,
            holdDescription: "",
            LMode: "",
            supplier: "",
            productId: 0,
            materialType: "",
            dateCode: "",
            STONum: "",
            itemNum: 0,
            supplierLocation: "",
            lotCode: "",
            mfgDate: new Date(),
            problemDesc: "",
            casesCost: 0,
            holdTag: "",
            quantityHeld: 0,
            quantityReleased: 0,
            quantityDestroyed: 0,
            quantityReturned: 0,
            quantityReworked: 0,
            quantityRemaining: 0,
            downTime: 0,
            hourRate: 0,
            downtimeCost: 0,
            materialLoss: 0,
            materialUnitCost: 0,
            materialCost: 0,
            productLoss: 0,
            productUnitCost: 0,
            productCost: 0,
            destroyReworkCost: 0,
            totalCost: 0,
            InvoiceToFollow: false,

            investigationHold: "",
            dispositionTestResult: "",
            possibleCauses: "",
            preventativeAction: "",

            returnAuthorization: "",
            invoiceDate: new Date(),
            invoiceNumber: "",
            estimatedCost: 0,

            incidentLogs: [],
            incidentLogDateTime: new Date(),
            lineIncident: 1,
            incidentTechInitials: "",
            isEditIncidentLog: false,
            isConfirmDeleteLog: false,
            selectedIncidentLogKey: "",
            incidentEntryText: "",

            dateCompleted: null,
            completedByTech: "",
            completedByManager: "",
            finalReworkBy: "",
            isIssueComplete: false,

            ItemTypeDesc: "",
            holdAttachments: [],
            savedHoldAttachments: [],
            toDeleteHoldAttachments: [],
            openAttachmentsModal: false,
            openFilePreviewModal: false,
            showLoadingFileProgress: false,
            selectedPreviewFileInfo: {},
            totalPagesOfPdfFile: [],
            searchFileTerm: "",
            supportFormats: ['docx', 'xlsx', 'xls', 'pdf', 'txt', 'csv', 'mp4', 'webm', 'ogg', 'mp3', 'ogg', 'wav'],
            fileLoadingProgress: 0,

            validHoldDate: new Date(),
            validMfgDate: new Date(),
            validInvoiceDate: new Date(),

            data: [],
            lines: [],
            users: [],
            shifts: [],
            lineModes: [],
            issueTypes: [],
            holdDescriptions: [],
            secondaryPackages: [],
            materialTypes: [],
            suppliers: [],
            products: [],
            selectedIncidentLog: null,
            userId: "",
            selectedTab: 0,
            isEdit: false,
            isNewHold: false,
            //isComplete: false,
            isMobileWidth: false,
            isTabletWidth: false,
            permissionCodes: [],
            addPermission: false,
            investigationPermission: false,
            completePermission: false,
            editPermission: false,
            deletePermission: false,
            server : tServer,
            openInstructionsModal: false,
            pathArray: window.location.pathname.split('/'),
        }
    }

/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                     // Livecycle Methods //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    componentDidMount() {
        window.addEventListener("resize", this.resize)
        this.resize()

        isSubmiting = false
        isCanceling = false

        const { pathArray } = this.state
        let itemTypeId : number = 1
        let holdKey = ""

        //New hold
        if (pathArray.length === 4){
            itemTypeId = pathArray[pathArray.length - 1]
            this.createNewHold(itemTypeId)
        }

        //Edit hold
        if(pathArray.length === 5) {
            itemTypeId = parseInt(pathArray[pathArray.length - 2])
            holdKey = decodeURIComponent(pathArray[pathArray.length - 1])
            if(holdKey === '' || holdKey === null){
                this.props.history.goBack()
            }
        }

        if(this.isUpdatingDB)
        {
            this.afterDBUpdate = () => (this.loadHoldData(holdKey))
        } else {
            this.loadHoldData(holdKey)
        }

        this.setState({
            pathArray: window.location.pathname.split('/'),
            itemType: itemTypeId,
            holdKey,
            userId: localStorage.userID,
        },this.fetchSelectData)
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resize)
        if(!isSubmiting && !isCanceling) {
            this.CancelEdit(false)
        }
    }

/*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                      // Class Methods //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    createNewHold = (itemTypeId: number) => {
        const { server } = this.state
        const userId = !isNullOrUndefined(localStorage.getItem('userID')) ? localStorage.userID : ""
        axios.post(`${server}/api/createHold`, {
            userKey: userId,
            itemTypeId,
        })
        .then(res => {
            logMessages( translateString("Success!"), res.status, 
                translateString("The Hold has been successfully inserted!"), 3000, "success" )
            this.setState({
                holdKey: res.data[0][0].QAHoldKey
            }, () => {
                this.props.history.replace(`/P4A/qualityHoldEntry/${itemTypeId}/${this.state.holdKey}`)
            })
        })
        .catch(error => {
            errorLogMessages(error)
        })
    }

    resize = () =>  {
        this.setState({
            isMobileWidth: (window.innerWidth < 600),
            isTabletWidth: (window.innerWidth < 768),
        })
    }

    /*///////////////
    // FETCH DATA //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    fetchSelectData = () => {
        const { server, itemType} = this.state
        const callArray = [`${server}/api/lines/${0}`, `${server}/api/getLineModes/${0}`, `${server}/api/shifts`,
            `${server}/api/getIssueType/${itemType}/${0}`, `${server}/api/getSecondaryPackages/${0}/${1}`, 
            `${server}/api/getHoldTypes?itemTypeID=${itemType}&fetchInactive=${0}`, `${server}/api/fetchusers/${0}/${null}`, 
            `${server}/api/getSuppliers`, `${server}/api/getFinishedProducts/0/0`, `${server}/api/getMaterialTypes`]

        axios.all(callArray.map(l => axios.get(l)))
        .then(
            axios.spread((...res) => {
                let lines = new Array(), lineModes = new Array(), shifts = new Array(), holdDescriptions = new Array()
                let secondaryPackages = new Array(), materialTypes = new Array(), suppliers = new Array()
                let users = new Array(), products = new Array(), issueTypes = new Array()
                if (res[0].data.length > 0) { lines = res[0].data }
                if (res[1].data.length > 0) {
                    res[1].data.map((d) => {
                    lineModes.push({
                        lineModeKey: d.QAHold_LineModeKey,
                        lineModedesc: d.QAHold_LineModeDesc,
                    })
                })}
                if(res[2].data.length > 0) { shifts = res[2].data }
                if(res[3].data.length > 0){
                res[3].data.map((d) => {
                    issueTypes.push({
                        IssueTypeKey: d.QAHold_IssueTypeKey,
                        IssueDesc: d.QAHold_IssueTypeDesc,
                    })
                })}
                if(res[4].data.length > 0){ secondaryPackages = res[4].data }
                if(res[5].data.length > 0){
                res[5].data.map((d) => {
                    holdDescriptions.push({
                        holdTypeKey: d.QAHold_HoldTypeKey,
                        holdTypeDesc: d.QAHold_HoldTypeDesc,
                    })
                })}
                if(res[6].data.length > 0){
                res[6].data.map((d) => {
                    users.push({
                        UserId: d.UserId,
                        FirstName: d.FirstName == null ? d.CompanyUserId : d.FirstName,
                        LastName: d.LastName == null ? `(${d.RoleName} - ${d.Department})` : d.LastName,
                    })
                })}
                if(res[7].data.length > 0){ suppliers = res[7].data }
                if(res[8].data.length > 0){
                res[8].data.map((d) => {
                    products.push({
                        productId: d.ProductID,
                        productKey: d.ProductKey,
                        productDesc: d.Prod_descr,
                        productCost: d.UnitCost,
                    })
                })}
                if(res[9].data.length > 0){
                res[9].data.map((d) => {
                    materialTypes.push({
                        materialKey:  d.MaterialTypeKey,
                        materialDesc: d.MaterialTypeDesc,
                    })
                })}

                this.loadIncidentLogEntries()
                this.loadAttachments()
                this.fetchPermissions()

                this.setState({ 
                    lines,
                    users,
                    lineModes,
                    shifts, 
                    suppliers,
                    products,
                    holdDescriptions,
                    issueTypes,
                    secondaryPackages, 
                    materialTypes,
                }, this.costChange)
            }))
            .catch(err => {
                errorLogMessages(err)
                console.log(err)
            })
    }

    
    fetchPermissions() {
        let userID = localStorage.userID;
        let pathName = this.state.pathArray[window.location.pathname.split('/').length - 3];
        let optionCodes: any = [];
        if (userID) {
            axios.get(`${this.state.server}/api/authorizedoptions/${userID}/${pathName}`).then((res) => {
                let data = res.data;
                if (data.length > 0) {
                    data.forEach((value: any) => {
                        optionCodes.push(value.OptionCode);
                    })
                }
                this.setState({
                    permissionCodes: optionCodes,
                    addPermission: optionCodes.includes("L4A0003-A1"),
                    investigationPermission: optionCodes.includes("L4A0003-A2"),
                    completePermission: optionCodes.includes("L4A0003-A3"),
                    editPermission: optionCodes.includes("L4A0003-A4"),
                    deletePermission: optionCodes.includes('L4A0003-A5'),
                },() => console.log(optionCodes))
            })
        }
    }

    loadIncidentLogEntries = () => {
        axios.get(`${this.state.server}/api/getIncidentLog?holdKey=${this.state.holdKey}`)
        .then( res => {
            let incidentLogs = new Array()

            res.data.map((d) => {
                incidentLogs.push({
                    logKey: d.QAHold_IncidentLogKey,
                    holdKey: d.QAHoldKey,
                    entryDateTime: d.EntryDateTime,
                    enteredByUserKey: d.EnteredBy_UserKey,
                    enteredByName: d.EnteredBy_UserName,
                    logEntry: d.IncidentLogEntry
                })
            })
            
            this.setState({
                incidentLogs,
            })
        })
    }

    loadHoldData = (holdKey: string) => {
        axios.get(`${this.state.server}/api/getQAHoldData?holdKey=${holdKey}&incompleteOnly=${0}`)
        .then(res => {
            if(res.data.length < 1) {
                this.props.history.goBack()
                return
            }
            let d = res.data[0]
            if(res.status === 200) {
                this.setState({
                    isNewHold: d.IsNewHold === null ? this.state.isNewHold : d.IsNewHold,
                    holdNum: d.QAHoldNum,
                    holdDate: d.HoldDate === null || d.IsNewHold ? this.state.holdDate : d.HoldDate,
                    validHoldDate: d.HoldDate === null || d.IsNewHold ? this.state.holdDate : d.HoldDate,
                    line: d.LineID === null ? this.state.line : d.LineID,
                    shift: d.ShiftID === null ? this.state.shift : d.ShiftID,
                    operatorInit: d.Operator_Initials === null ? this.state.operatorInit : d.Operator_Initials,
                    technicianInit: d.Technician_Initials === null ? this.state.technicianInit : d.Technician_Initials,
                    isPrecautionaryHold: d.IsPrecautionaryHold === null ? 
                        this.state.isPrecautionaryHold : d.IsPrecautionaryHold,
                    itemType: d.QAHold_ItemTypeID === null ? this.state.itemType : d.QAHold_ItemTypeID,
                    holdType: d.QAHold_HoldTypeKey === null ? this.state.holdType : d.QAHold_HoldTypeKey,
                    IssueType: d.QAHold_IssueTypeKey === null ? this.state.IssueType : d.QAHold_IssueTypeKey, 
                    secondaryPackage: d.SecondaryPackageID === null ? this.state.secondaryPackage : d.SecondaryPackageID,
                    holdDescription: d.IssueDescription === null ? this.state.holdDescription : d.IssueDescription,
                    LMode: d.QAHold_LineModeKey === null ? this.state.LMode : d.QAHold_LineModeKey,
                    dateCode: d.DateCode === null ? this.state.dateCode : d.DateCode,
                    STONum: d.STONum === null ? this.state.STONum : d.STONum,
                    itemNum: d.VendorItemNumber === null ? this.state.itemNum : d.VendorItemNumber,
                    supplier: d.SupplierKey === null ? this.state.supplier : d.SupplierKey,
                    supplierLocation: d.SupplierLocation === null ? this.state.supplierLocation : d.SupplierLocation,
                    lotCode: d.LotCode === null ? this.state.lotCode : d.LotCode,
                    mfgDate: d.MfgDate === null ? this.state.mfgDate : d.MfgDate,
                    validMfgDate: d.MfgDate === null ? this.state.mfgDate : d.MfgDate,
                    problemDesc: d.IssueDescription === null ? this.state.problemDesc : d.IssueDescription,
                    quantityReworked: d.QtyReworked === null ? this.state.quantityReworked : d.QtyReworked,
                    holdTag: d.HoldTagNumber === null ? this.state.holdTag : d.HoldTagNumber,
                    quantityHeld: d.QtyHeld === null ? this.state.quantityHeld : d.QtyHeld,
                    quantityReleased: d.QtyReleased === null ? this.state.quantityReleased : d.QtyReleased,
                    quantityDestroyed: d.QtyDestroyed === null ? this.state.quantityDestroyed : d.QtyDestroyed,
                    quantityReturned: d.QtyReturned === null ? this.state.quantityReturned : d.QtyReturned,
                    downTime: d.DownMins === null ? this.state.downTime : d.DownMins,
                    hourRate: d.ManpowerRate === null ? this.state.hourRate : d.ManpowerRate,
                    materialLoss: d.MaterialLost === null ? this.state.materialLoss : d.MaterialLost,
                    materialUnitCost: d.MaterialUnitCost === null ? this.state.materialUnitCost : d.MaterialUnitCost,
                    productLoss: d.ProductLost === null ? this.state.productLoss : d.ProductLost,
                    productUnitCost: d.ProductUnitCost === null ? this.state.productUnitCost : d.ProductUnitCost,
                    destroyReworkCost: d.DestructionReworkCost === null ? 
                        this.state.destroyReworkCost : d.DestructionReworkCost,
                    InvoiceToFollow: d.InvoiceToFollow === null ? this.state.InvoiceToFollow : d.InvoiceToFollow,
                    investigationHold: d.InvestigationOfHold === null ? this.state.investigationHold : d.InvestigationOfHold,
                    dispositionTestResult: d.DispositionTestResults === null ? 
                        this.state.dispositionTestResult : d.DispositionTestResults,
                    possibleCauses: d.PossibleRootCause === null ? this.state.possibleCauses : d.PossibleRootCause,
                    preventativeAction: d.PreventativeAction === null ? this.state.preventativeAction : d.PreventativeAction,
                    returnAuthorization: d.ReturnAuthorization === null ? 
                        this.state.returnAuthorization : d.ReturnAuthorization,
                    invoiceDate: d.InvoiceDate === null ? this.state.invoiceDate : d.InvoiceDate,
                    validInvoiceDate: d.InvoiceDate === null ? this.state.invoiceDate : d.InvoiceDate,
                    invoiceNumber: d.InvoiceNum === null ? this.state.invoiceNumber : d.InvoiceNum,
                    estimatedCost: d.EstimatedCost === null ? this.state.estimatedCost : d.EstimatedCost,
                    finalReworkBy: d.ResponsibleForReworkOrDestruction_UserKey === null ? 
                        this.state.userId : d.ResponsibleForReworkOrDestruction_UserKey,
                    isIssueComplete: d.Complete == null ? this.state.isIssueComplete : d.Complete,
                    completedByManager: d.CompletedBy_UserName === null ? 
                        this.state.completedByManager : d.CompletedBy_UserName,
                    dateCompleted: d.CompletedDateTime === null ? this.state.dateCompleted : d.CompletedDateTime,
                    productId: d.ProductID === null ? this.state.productId : d.ProductID,
                    materialType: d.MaterialTypeKey === null ? this.state.materialType : d.MaterialTypeKey,
                    ItemTypeDesc: d.QAHold_ItemTypeDesc,
                }, this.costChange)
            }
        })
        .catch(err => {
            errorLogMessages(err)
            console.log(err)
        })
    }
    
    loadAttachments = () => {
        axios.get(`${this.state.server}/api/getHoldAttachments?holdKey=${this.state.holdKey}`)
        .then( res => {
            let holdAttachments = new Array()
            res.data.map((d) => {
                holdAttachments.push({
                    fileName: d.QAHold_AttachmentDesc,
                    fileSize: fileSizeCalculator(d.QAHold_Attachment.data.length),
                    fileType: d.QAHold_AttachmentExtension,
                    fileInfo: d.QAHold_Attachment.data,
                    active: true,
                    isArrayBuffer: true,
                    enableDownload: true,
                    fileKey: d.QAHold_AttachmentKey,
                    attachmentKey: d.QAHold_AttachmentKey,
                })
            })
            
            this.setState({
                holdAttachments,
            })
        })
    }

v
    submitHoldEdit = () => {
        isSubmiting = true
        const { server, itemTypeId, userId, lineIncident, incidentLogDateTime, incidentLogs, estimatedCost, invoiceNumber,
            invoiceDate, returnAuthorization, preventativeAction, possibleCauses, dispositionTestResult, investigationHold, 
            InvoiceToFollow, totalCost, destroyReworkCost, productCost, productUnitCost, productLoss, materialCost, 
            materialUnitCost, materialLoss, downtimeCost, hourRate, downTime, quantityRemaining, quantityReturned, 
            quantityDestroyed, quantityReleased, quantityHeld, holdTag, quantityReworked, problemDesc, mfgDate, 
            lotCode, supplierLocation, itemNum, STONum, dateCode, productId, supplier, LMode, holdDescription, 
            secondaryPackage, item, technicianInit, operatorInit, shift, line, holdDate, isPrecautionaryHold, holdNum, 
            holdKey, holdType, isIssueComplete, IssueType, itemType, finalReworkBy, dateCompleted, materialType, 
            validInvoiceDate, validHoldDate, validMfgDate} = this.state
        axios.post(`${server}/api/submitHoldData`, {
            holdTypeKey: holdType,
            holdKey,
            isPrecautionaryHold,
            holdDate: validHoldDate, //DATE
            complete: isIssueComplete,
            userKey: userId,
            lineID: line,
            shiftID: shift,
            productID: productId,
            secondaryPackageID: secondaryPackage,
            operator_Initials: operatorInit,
            technician_Initials: technicianInit,
            dateCode,
            issueTypeKey: IssueType,
            issueDescription: problemDesc,
            lineModeKey: LMode,
            sTONum: STONum,
            investigationOfHold: investigationHold,
            dispositionTestResults: dispositionTestResult,
            possibleRootCause: possibleCauses,
            preventativeAction,
            qtyHeld: quantityHeld,
            qtyDestroyed: quantityDestroyed,
            qtyReleased: quantityReleased,
            qtyReturned: quantityReturned,
            qtyReworked: quantityReworked,
            downMins: downTime,
            manpowerRate: hourRate,
            materialLost: materialLoss,
            materialUnitCost,
            productLost: productLoss,
            productUnitCost,
            destructionReworkCost: destroyReworkCost,
            totalCost,
            invoiceToFollow: InvoiceToFollow,
            PHREDNum: "",
            responsibleForReworkOrDestruction_UserKey: finalReworkBy,
            supplierKey: supplier,
            supplierLocation,
            lotCode,
            mfgDate: validMfgDate, //DATE
            returnAuthorization,
            invoiceDate: validInvoiceDate, //DATE
            invoiceNum: invoiceNumber,
            estimatedCost,
            vendorItemNumber: itemNum,
            holdTagNumber: holdTag,
            materialTypeKey: materialType,
        })
        .then(res => {
            logMessages( translateString("Success!"), res.status, 
                translateString("The Hold has been successfully inserted!"), 3000, "success" )
                if(this.afterDBUpdate) {
                    this.afterDBUpdate()
                    this.afterDBUpdate = null
                }
                this.insertHoldAttachments()
                this.submitDeleteAttachments()
            this.props.history.goBack()
        })
        .catch(error => {
            errorLogMessages(error)
        })
    }
    
    /*///////////////////
    // FORM FUNCTIONS //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    insertHoldAttachments = async() => {
        const { savedHoldAttachments, holdKey} = this.state
        if(savedHoldAttachments.length > 0) {
            const url = `${this.state.server}/api/insertHoldAttachment`
            for(let i = 0; i < savedHoldAttachments.length; i++) {
                //Convert file variable to buffer array and to hexCode so that the attachment can be saved on the database
                const file = savedHoldAttachments[i]
                let bufferArray = await readUploadedFiles(file, "bufferArray");
                let hexCode = '0x' + Buffer.from(bufferArray).toString('hex').toUpperCase();
    
                let AttachmentData = {
                    holdKey: holdKey,
                    fileName: file.name,
                    fileExtension: file.type,
                    file: hexCode,
                }
    
                axios.post(url, AttachmentData)
                .then((res) => {    
                    if(res.status === 200) {
                        console.log("success", res)
                    }
                }).catch(error => {
                    errorLogMessages(error);
                })
            }
        }
    }

    CancelEdit = (goBack: boolean = true) => {
        isCanceling = true
        const { holdKey, isNewHold} = this.state
        if(isNewHold) {
            axios.put(`${this.state.server}/api/clearHold?holdKey=${holdKey}`)
            .then(res => {
                console.log(res.data, "canceled edit")
            })
            .catch(error => {
                errorLogMessages(error)
            })
        }
        if(goBack){
            this.props.history.goBack()
        }
    }

    softDeleteHold = (holdKey: string) => {
        const {isNewHold} = this.state
        axios.put(`${this.state.server}/api/deleteHold?holdKey=${holdKey}`)
        .then(res => {
            console.log(res.data, "deleted edit")
        })
        .catch(error => {
            errorLogMessages(error)
        })
    }

    //Same parameters as the handleDeleteFilesOptions from the DynamicFormComponent's renderComponent 
    handleDeleteFilesOptions = (isDeleteAll: boolean, selectedRow: any[] = []) => {
        let { holdAttachments, savedHoldAttachments, toDeleteHoldAttachments, } = this.state
        let filteredHoldAttachments = new Array()
        let filteredSavedCalibrationAttachments = new Array()

        //Delete all option
        if(isDeleteAll) {
            this.setState({ holdAttachments: new Array(), savedHoldAttachments: new Array(), toDeleteHoldAttachments: holdAttachments });
        }
        //Delete the selected row
        else {
            //Delete saved attachments
            if(selectedRow[0].attachmentKey !== null && selectedRow[0].attachmentKey !== undefined && selectedRow[0].attachmentKey !== '') {
                toDeleteHoldAttachments.push(selectedRow[0])
                filteredHoldAttachments = filter(holdAttachments, function(attachment) {
                    return attachment.attachmentKey !== selectedRow[0].attachmentKey
                })
                
                this.setState({ holdAttachments: filteredHoldAttachments })
            }
            else {
                filteredHoldAttachments = filter(holdAttachments, function(attachment) {
                    return attachment.ID !== selectedRow[0].ID
                });
                
                this.setState({ holdAttachments: filteredHoldAttachments })
            }

            //Delete non-saved attachments
            if(savedHoldAttachments.length > 0) {
                filteredSavedCalibrationAttachments = filter(savedHoldAttachments, function(attachment) {
                    return attachment.name !== selectedRow[0].fileName
                });

                this.setState({ savedHoldAttachments: filteredSavedCalibrationAttachments })
            }
            
            logMessages("Success!", "200", "Deleted " + selectedRow[0].fileName, 1000, "success")
        }
    }

    submitDeleteAttachments = () => {
        let { toDeleteHoldAttachments } = this.state
        let apiEndpointDeleteAttachment = `${this.state.server}/api/deleteHoldAttachment`
        toDeleteHoldAttachments.forEach((d, i) => {
            if(d.attachmentKey !== null && d.attachmentKey !== undefined && d.attachmentKey !== '') {
                let reqBodyDeleteAttachment = {
                    attachmentKey: d.attachmentKey,
                }
                
                axios.put(apiEndpointDeleteAttachment, reqBodyDeleteAttachment)
                .then((res) => {
                    console.log('Attachments Destroyed')
                }).catch(error => {
                    errorLogMessages(error)
                })
            }
        })
    }

    calculateDateCode = () => {
        const { holdDate, productId } = this.state
        axios.get(`${this.state.server}/api/getDateCode?productionDate=${holdDate}&productID=${productId}`)
        .then(res => {
            if(res.status === 200){
                if(res.data.length > 0){
                    console.log(res.data)
                    this.setState({
                        dateCode: res.data[0].DateCode
                    })
                }
            }
        })
        .catch(error => {
            errorLogMessages(error)
        })
    }

    addLog = () => {
        this.setState({
            isEditIncidentLog: true,
            selectedIncidentLog: null,
            selectedIncidentLogKey: "",
        })
    }

    editLog = (index: number) => {
        const log = this.state.incidentLogs[index]
        this.setState({
            isEditIncidentLog: true,
            selectedIncidentLog: log,
            selectedIncidentLogKey: log.logKey,
            incidentEntryText: log.logEntry,
        })
    }

    deleteLog = (index: number) => {
        const log = this.state.incidentLogs[index]
        this.setState({
            ...this.state,
            isConfirmDeleteLog: true,
            selectedIncidentLogKey: log.logKey,
        })
    }

    confirmDeleteLog = () => {
        axios.put(`${this.state.server}/api/deleteIncidentLogEntry?logKey=${this.state.selectedIncidentLogKey}`)
        .then(res => {
            logMessages( translateString("Success!"), res.status, 
                translateString("The log has been successfully Deleted!"), 3000, "success" )
            this.cancelLog()
            this.loadIncidentLogEntries()
        })
        .catch(error => {
            errorLogMessages(error)
        })
    }
    
    confirmLogAdd =  () => {
        const addFunc = () => {
            const tUserKey = localStorage.userID
            let tUser = this.state.users.find( ({UserId}) => UserId === tUserKey )
            if(tUser){
                tUser = tUser.FirstName ? tUser.FirstName : localStorage.userEmail
            }
            const logDateTime = new Date()
            let newLog = {
                logKey: null,
                holdKey: this.state.holdKey,
                entryDateTime: logDateTime,
                enteredByUserKey: tUserKey,
                enteredByName: tUser,
                logEntry: this.state.incidentEntryText
            }

            axios.post(`${this.state.server}/api/updateIncidentLogEntry`, {
                holdKey: newLog.holdKey,
                userKey: newLog.enteredByUserKey,
                logKey: newLog.logKey,
                logEntry: newLog.logEntry,
            })
            .then(res => {
                logMessages( translateString("Success!"), res.status, 
                    translateString("The log has been successfully Created!"), 3000, "success" )
                    newLog.logKey = res.data[0][0].QAHold_IncidentLogKey
            })
            .catch(error => {
                errorLogMessages(error)
            })
            let tempLogs = this.state.incidentLogs
            tempLogs.push(newLog)

            this.setState({
                incidentLogs: tempLogs,
                ...this.state
            })
            this.cancelLog()
            this.afterStateUpdate = null
        }

        if(this.isUpdatingState){
            this.afterStateUpdate = addFunc
        }
        else {
            addFunc()
        }
    }

    confirmEditLog = () => {
        const editLog = () => {
            const tUserKey = localStorage.userID
            const newLog = this.state.selectedIncidentLog
            this.updateIncidentLog(newLog.holdKey, newLog.enteredByUserKey, newLog.logKey, this.state.incidentEntryText)
            this.afterDBUpdate = this.loadIncidentLogEntries
            this.cancelLog()
            this.afterStateUpdate = null
        }
        
        if(this.isUpdatingState){
            this.afterStateUpdate = editLog()
        }
        else {
            editLog()
        }
    }

    updateIncidentLog = (holdKey: string, userKey: string, logKey: any, logEntry: string) => {
        axios.post(`${this.state.server}/api/updateIncidentLogEntry`, {
            holdKey,
            userKey,
            logKey,
            logEntry,
        })
        .then(res => {
            logMessages( translateString("Success!"), res.status, 
                translateString("The log has been successfully Updated!"), 3000, "success" )
            if(this.afterDBUpdate) {
                this.afterDBUpdate()
                this.afterDBUpdate = null
            }
        })
        .catch(error => {
            errorLogMessages(error)
        })
    }

    cancelLog = () => {
        this.setState({
            isConfirmDeleteLog: false,
            isEditIncidentLog: false,
            selectedIncidentLog: null,
            selectedIncidentLogKey: "",
            incidentEntryText: "",
        })
    }
    
    /*////////////////////
    // MODAL FUNCTIONS //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    openInstructions = () => {
        this.setState({
            openInstructionsModal: true,
        })
    }

    closeInstructions = () => {
        this.setState({
            openInstructionsModal: false,
        })
    }
    
    openAttachmentsModal = (dataArr: Array<any>) => {
        this.setState({ openAttachmentsModal: true });
    }

    closeAttachmentsModal = () => {
        this.setState({ openAttachmentsModal: false, searchFileTerm: "" });
    }

    openFilePreviewModal = (convertedFileInfo: any) => {
        const self = this;
        const { fileInfo, fileSize, fileType, pageNum } = convertedFileInfo;
        let new_arr: any = Array.from(new Array(pageNum));
        new_arr = new_arr.map((_: any, idx:  number) => idx + 1);
        self.setState({
            selectedPreviewFileInfo: {...convertedFileInfo}, 
            openFilePreviewModal: true,
            showLoadingFileProgress: true,
            totalPagesOfPdfFile: new_arr
        }, () => {
            // console.log(this.state.selectedPreviewFileInfo)
            loadingProcessTimer = setInterval(() => this.setUpFileLoadingProgress(fileInfo, fileType), defineLoadingFileTime(fileSize));
        });
    }

    closeFilePreviewModal = () => this.setState({ selectedPreviewFileInfo: {}, openFilePreviewModal: false });

    setUpFileLoadingProgress = (fileInfo: any, fileType: string) => {
        const self = this;
        const { fileLoadingProgress } = self.state;
        let prev_progressNum: number = fileLoadingProgress,
            cur_progressNum: number = 10,
            cur_loadingFileFlag: boolean = true;
        if(prev_progressNum >= 100) {
            cur_progressNum = 10;
            cur_loadingFileFlag = false;
            clearInterval(loadingProcessTimer);
        }else {
            cur_progressNum = prev_progressNum + 10;
        }
        self.setState({
            fileLoadingProgress: cur_progressNum,
            showLoadingFileProgress: cur_loadingFileFlag
        });
    }

    downloadFiles = (attachmentKey: string, elementId: string) => {
        const self = this;
        const { server } = self.state;
        const downloadLink: HTMLElement | any = document.getElementById(elementId);
        // Just be safe having the attachmentKey
        if(!isNullOrUndefined(attachmentKey, downloadLink)) {
            downloadLink.href = `${server}/api/getHoldAttachmentItem?holdKey=${self.state.holdKey}&attachmentKey=${attachmentKey}`;
            setTimeout(() => {
                downloadLink.removeAttribute('href');
            }, 1000);
        }
    }

    /*////////////////////
    // CHANGE HANDLERS //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = event.currentTarget
        console.log(name + ": " + value)
        this.isUpdatingState = true
        this.setState({
            ...this.state, [name]: value,
        }, () => {
            this.isUpdatingState = false
            if(this.afterStateUpdate){
                this.afterStateUpdate()
            }
            if(name === "productId"){
                this.costChange()
            }
        })
    }

    handleChange = (event: ChangeEvent<any>) => {
        const { name, value } = event.target
        this.isUpdatingState = true
        this.setState({
            ...this.state, [name]: value,
        }, () => {
            this.isUpdatingState = false
            if(this.afterStateUpdate){
                this.afterStateUpdate()
            }
        })
    }

    handleAttachmentChange = (files: any, sectionKey: string, stateName: string) => {
        //hold attachments => Modal
        //saved hold Attachments => API call (File to Buffer Array)
        let { holdAttachments, savedHoldAttachments } = this.state;

        for(let i = 0; i < files.length; i++) {
            savedHoldAttachments.push(files[i]);

            holdAttachments.push({
                fileName: files[i].name,
                fileSize: fileSizeCalculator(files[i].size),
                fileType: files[i].type,
                fileInfo: files[i],
                active: true,
                ID: uuidv4(),
                attachmentKey: uuidv4().toUpperCase(),
                isArrayBuffer: false,
                enableDownload: false,
            });
        }
        
        this.setState({ holdAttachments, savedHoldAttachments });
    }
    
    handleLogChange = (event: ChangeEvent<any>) => {
        const { name, value } = event.target
        this.isUpdatingState = true
        let LogEntry: string = ""
        if(name == "incidentTechInitials") {
            LogEntry = value + "-" + this.state.incidentLogDateTime + "-" + this.state.incidentEntryText
        }
        else if(name == "incidentEntryText") {
            LogEntry = this.state.incidentTechInitials + "-" + this.state.incidentLogDateTime + "-" + value
        }
        console.log(LogEntry)
        this.setState({
            ...this.state, [name]: value,
        }, () => {
            this.isUpdatingState = false
            if(this.afterStateUpdate){
                this.afterStateUpdate()
            }
        })
    }

    handleInvoiceDateChange = (date: any) => {
        if(!isNullOrUndefined(date)){
            this.setState({ invoiceDate: date })
            if(date._isValid){
                this.setState({ validInvoiceDate: date })
            }
        }
    }

    handleHoldDateChange = (date: any) => {
        if(!isNullOrUndefined(date)){
            this.setState({ holdDate: date})
            if(date._isValid){
                this.setState({ validHoldDate: date })
            }
        }
    }

    handleMfgDateChange = (date: any) => {
        if(!isNullOrUndefined(date)){
            this.setState({ mfgDate: date })
            if(date._isValid){
                this.setState({validMfgDate: date})
            }
        }
    }

    handleIncidentDateChange = (date : Date) => {
        let LogEntry: string = this.state.incidentTechInitials + "-" + date + "-" + this.state.incidentEntryText
        console.log(LogEntry)
        this.setState({ 
            incidentLogDateTime : date })
    }

    handleCostChange = (event: ChangeEvent<any>) => {
        const { name, value } = event.target
        console.log(name + ": " + value)
        this.setState({
            ...this.state, [name]: value,
        }, () => this.costChange())
    }

    costChange = () => {
        const { downTime, hourRate, materialLoss, materialUnitCost, productLoss, productUnitCost, quantityHeld, 
            quantityReleased, quantityDestroyed, quantityReworked, quantityReturned, itemType, products, productId, 
            } = this.state
        const prodCost = filter(products, function(prod) {
            return prod.productId == productId;
        })
        const destroyReworkCost: number = parseFloat(this.state.destroyReworkCost)
        const downtimeCost: number = hourRate * (downTime / 60)
        const materialCost: number = materialLoss * materialUnitCost
        const productCost: number = productUnitCost * productLoss
        const totalCost: number = destroyReworkCost + downtimeCost + materialCost + productCost
        const quantityRemaining: number = Number(quantityHeld) - (   
                Number(quantityReleased) +
                Number(quantityDestroyed) +
                Number(itemType == 2 ? quantityReworked : 0) + 
                Number(itemType == 1 ? quantityReturned : 0) )
        // const casesCost = (Number(quantityDestroyed) * (prodCost.length > 0 ? prodCost[0].productCost : 0)).toFixed(2)
        const casesCost = round(Number(quantityDestroyed) * (prodCost.length > 0 ? prodCost[0].productCost : 0), 2);
        this.setState({
            ...this.state, 
            downtimeCost,
            materialCost,
            productCost,
            casesCost,
            totalCost,
            quantityRemaining,
        })
    }

    

/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                          // Render //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
    render(){
        const TextFieldLabelStyle = {color: 'rgba(0, 0, 0, 0.87)'}
        const TextFieldLogStyle = {color: 'rgba(0, 0, 0, 0.87)', borderColor: 'var(--primary-color)'}
        const {holdType, itemType, holdKey, holdNum, holdDate, shift, line, operatorInit, technicianInit, isPrecautionaryHold, 
            item, secondaryPackage, holdDescription, dateCode, LMode, STONum, selectedTab, materialTypes, lines, shifts,
            holdDescriptions, lineModes, secondaryPackages, suppliers, supplier, isMobileWidth, isTabletWidth, downTime,
            hourRate, downtimeCost, materialLoss, materialUnitCost, materialCost, productLoss, productUnitCost, productCost, 
            destroyReworkCost, itemNum, supplierLocation, lotCode, mfgDate, problemDesc, casesCost, holdTag, quantityHeld, 
            quantityReleased, quantityReworked, quantityDestroyed, quantityReturned, quantityRemaining, InvoiceToFollow, 
            investigationHold, dispositionTestResult, possibleCauses, preventativeAction, invoiceDate, returnAuthorization, 
            invoiceNumber, estimatedCost, incidentLogDateTime, lineIncident, incidentTechInitials, isEditIncidentLog, 
            incidentEntryText, incidentLogs, isNewHold, issueTypes, IssueType, dateCompleted, completedByTech, 
            finalReworkBy, completedByManager, isIssueComplete, users, selectedIncidentLog, selectedIncidentLogKey, 
            isConfirmDeleteLog, products, productId, materialType, ItemTypeDesc, holdAttachments, supportFormats,
            openAttachmentsModal, searchFileTerm, selectedPreviewFileInfo, totalPagesOfPdfFile, fileLoadingProgress, 
            openFilePreviewModal, showLoadingFileProgress, addPermission, investigationPermission, completePermission,
            editPermission, deletePermission, } = this.state
        // const totalCost = this.state.totalCost.toFixed(2) as number
        const totalCost = round(this.state.totalCost, 2);
        return(
            <Box>
                {/*////////////////////////////////////////////_  TITLE  _////////////////////////////////////////////////*/}
                <Box 
                className="font-weight-bold d-flex flex-row flex-nowrap justify-content-between align-items-center pt-4 pb-2"
                id="pageTitle"
                style={{ fontSize: '1em' }}>
                    <Tooltip title={translateString("Help?")} placement="right">
                        <Button id="pageFontStyle" onClick={this.openInstructions}>
                            <span>
                                {isNewHold ? 
                                    <StringTranslator>New</StringTranslator>
                                    : 
                                    <StringTranslator>Edit</StringTranslator>
                                }
                                &nbsp;
                                ({ItemTypeDesc}) 
                                &nbsp;
                                <StringTranslator>Quality Hold</StringTranslator>
                            </span>
                        </Button>
                    </Tooltip>
                </Box>
                {/*<LinkTitle openInstructions={this.openInstructions} />*/}
                <Paper style={tabBoxDefault}>
                {/*//////////////////////////////////////////_  TABS SELECTION  _//////////////////////////////////////////*/}
                    <Tabs
                        value={selectedTab}
                        onChange={(e, newValue) => this.setState({ selectedTab: newValue })}
                        indicatorColor="primary"
                        TabIndicatorProps={{
                            style: {
                              visibility: "hidden"
                            }
                        }}
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="on"
                        className="font-weight-bold"
                        style={{backgroundColor:"white", border: "5px"}}
                        >
                        <Tab label={translateString("Incident Entry")} 
                            id="incident-entry" 
                            style={selectedTab === 0 ? activeTab : defaultTab}/>
                        <Tab label={translateString("Investigation")} 
                            id="investigation" 
                            disabled={!investigationPermission}
                            style={investigationPermission ? selectedTab === 1 ? activeTab : defaultTab : disabledTab}/>
                        <Tab label={translateString("Supplier CA")} 
                            id="supplier-ca"
                            disabled={itemType === 2}
                            style={itemType === 1 ? selectedTab === 2 ? activeTab : defaultTab : disabledTab}/>
                        <Tab label={translateString("Incident Log")}  
                            id="incident-log"
                            style={selectedTab === 3 ? activeTab : defaultTab}/>
                        <Tab label={translateString("Attachements")} 
                            id="attachements"
                            style={selectedTab === 4 ? activeTab : defaultTab}/>
                        <Tab label={translateString("Complete")} 
                            id="complete"
                            disabled={!completePermission}
                            style={completePermission ? selectedTab === 5 ? activeTab : defaultTab : disabledTab}/>
                    </Tabs>
                    {/*///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                  // TAB CONTENT //
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////*/
                        /*///////////////////////
                        // INCIDENT ENTRY TAB //
                        ////////////////////////////////////////////////////////////////////////////////////////////////////*/
                        selectedTab === 0 ?
                            <Box p={1} >
                                <Box px={2} py={3}>
                                    <Box  
                                    display="flex" 
                                    flexDirection="row"
                                    border="3px" 
                                    borderColor="var(--primary-color)" 
                                   >
                                       <Grid container item xs={1} ></Grid>
                                        <Box flexGrow={1}>
                                            <Grid container spacing={2} >
                                        <Grid container item xs={12} spacing={4}>
                                            <Grid item xl={1} lg={1} md={2} xs={2}>
                                            <Typography style={{fontSize: '1em',fontWeight: 'bold'}} variant="caption"> 
                                            <StringTranslator>Hold</StringTranslator> 
                                        </Typography>
                                            </Grid>
                                            <Grid item  xl={3} lg={3} md={12} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}> Hold Number</p>
                                            {/* <p style={{color: 'white',fontSize: '8px'}}> hold</p> */}
                                                <TextField 
                                                style={{
                                                borderRadius: 4,
                                                backgroundColor: '#f5f5f5',
                                                }}
                                                disabled
                                                id="hold-num"
                                                variant="outlined"
                                                name="holdNum"
                                                // label={translateString("Hold Number")}
                                                InputLabelProps={{style:{color: "black"}}}
                                                value={holdNum}
                                                onChange={this.handleChange}
                                             /> 
                                             </Grid>
                                             <Grid item xl={4} lg={4} md={12} xs={12}>
                                                 
                                             <p style={{color: 'black',fontSize: '14px'}}> Hold Type</p>
                                                    <SelectComponent
                                                    name="holdType"
                                                    // label="Hold Type"
                                                    InputLabelProps={{shrink: true, style:{color: "var(--primary-color)"}}}
                                                    options={holdDescriptions}
                                                    value={holdType}
                                                    enableSelect={true}
                                                    disabled={holdDescriptions.length === 0}
                                                    handleChange={this.handleSelectChange}
                                                    />
                                             {/* <FormControlLabel style={{float: 'right'}}
                                                control={
                                                    <Checkbox 
                                                        checked={isPrecautionaryHold} 
                                                        onChange={() => {
                                                            this.setState({isPrecautionaryHold: !isPrecautionaryHold})
                                                        }} 
                                                        name="IncompleteOnly"
                                                        style={{color: "var(--secondary-color)", transform: "scale(1.2)"}}
                                                    />
                                                }
                                                label={translateString("Precautionary")}
                                                color='rgba(0, 0, 0, 0.87)'
                                                labelPlacement="top"
                                            /> */}
                                            </Grid>
                                            <Grid item xl={2} lg={2} md={12} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}> Hold Date</p>
                                            <div  id="highlightfield">
                                                <DateComponent 
                                                style={{ boxShadow: ' rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px' }}
                                                    value={holdDate}
                                                    // label="Hold Date"
                                                    handleChange={this.handleHoldDateChange}
                                                    format="MM/DD/YYYY"
                                                /> </div>  
                                            </Grid>
                                            </Grid>
                                            <Grid container item xs={12} spacing={4}>
                                                <Grid item xl={1}  lg={1} md={2} xs={2}>
                                                <Typography style={{fontWeight: 'bold' ,fontSize: '1em'}} variant="caption"> 
                                                    <StringTranslator>Operator</StringTranslator> 
                                                </Typography>
                                                </Grid>
                                         
                                            <Grid item xl={3} lg={3} md={12} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}> {translateString("Operator")}</p>
                                            <div  id="highlightfield">
                                            <TextField
                                                        style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 2px 0px'}}
                                                        name="operatorInit"
                                                        id="operator-initials"
                                                        variant="outlined"
                                                        InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                        value={operatorInit}
                                                        onChange={this.handleChange}
                                            /> 
                                            </div>
                                            </Grid>
                                            <Grid item xl={4} lg={4} md={12} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}> {translateString("Shift")}</p>
                                            <div  id="highlightfield">
                                              <SelectComponent
                                                    name="shift"
                                                    InputLabelProps={{shrink: true, style:{color: "var(--primary-color)"}}}
                                                    options={shifts}
                                                    value={shift}
                                                    enableAll={false}
                                                    handleChange={this.handleSelectChange}/> 
                                                </div>
                                            </Grid>
                                            <Grid item xl={2} lg={2} md={12} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}> {translateString("Line")}</p>
                                                    <div  id="highlightfield"> 
                                                     <SelectComponent
                                                    name="line"
                                                    InputLabelProps={{shrink: true, style:{color: "var(--primary-color)"}}}
                                                    options={lines}
                                                    value={line}
                                                    enableAll={false}
                                                    handleChange={this.handleSelectChange}/>
                                                    </div>
                                                </Grid>
                                      </Grid>
                                     </Grid>
                                     
                                     <Grid container item xs={9} spacing={2} >
                                     <Grid item xl={1}  lg={1} md={6} xs={6}>
                                                <Typography style={{fontWeight: 'bold' ,fontSize: '1em'}} variant="caption"> 
                                                    <StringTranslator>Precautionary</StringTranslator> 
                                                </Typography>
                                                </Grid>
                                         <Grid  item xl={1}  lg={1} md={6} xs={6}>
                                     <FormControlLabel style={{float: 'right'}}
                                                control={
                                                    <Checkbox 
                                                        checked={isPrecautionaryHold} 
                                                        onChange={() => {
                                                            this.setState({isPrecautionaryHold: !isPrecautionaryHold})
                                                        }} 
                                                        name="IncompleteOnly"
                                                        style={{ transform: "scale(1.2)"}}
                                                    />
                                                }
                                                // label={translateString("Precautionary")}
                                                color='rgba(0, 0, 0, 0.87)'
                                                labelPlacement="top"
                                            />
                                            </Grid>
                                     </Grid>
                                            {/* <Box>
                                                <SelectComponent
                                                    name="line"
                                                    label="Line"
                                                    InputLabelProps={{style: TextFieldLabelStyle}}
                                                    options={lines}
                                                    value={line}
                                                    enableAll={false}
                                                    handleChange={this.handleSelectChange}/>
                                            </Box>
                                            <Box>
                                                <SelectComponent
                                                    name="shift"
                                                    label="Shift"
                                                    InputLabelProps={{style: TextFieldLabelStyle}}
                                                    options={shifts}
                                                    value={shift}
                                                    enableAll={false}
                                                    handleChange={this.handleSelectChange}/> 
                                            </Box>
                                            <TextField
                                            style={{
                                                borderRadius: 4,
                                                backgroundColor: '#fcfcfb',
                                            }}
                                                name="operatorInit"
                                                id="operator-initials"
                                                variant="outlined"
                                                label={translateString("Operator")}
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                value={operatorInit}
                                                onChange={this.handleChange}
                                            />
                                            { itemType === 2 &&
                                                <TextField
                                                    name="technicianInit"
                                                    id="technician-initials"
                                                    label={translateString("Technician")}
                                                    InputLabelProps={{style: TextFieldLabelStyle}}
                                                    value={technicianInit}
                                                    onChange={this.handleChange}
                                                />
                                            }
                                            
                                        </Box>
                                        <Box flex="1,1" flexWrap="nowrap">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                    
                                                        checked={isPrecautionaryHold} 
                                                        onChange={() => {
                                                            this.setState({isPrecautionaryHold: !isPrecautionaryHold})
                                                        }} 
                                                        name="IncompleteOnly"
                                                        style={{color: "var(--secondary-color)", transform: "scale(1.2)"}}
                                                    />
                                                }
                                                label={translateString("Precautionary")}
                                                color='rgba(0, 0, 0, 0.87)'
                                                labelPlacement="top"
                                            /> */}
                                        </Box>
                                    </Box>
                                    <Box py={3}><Divider/></Box>
                                    {itemType === 2 ?
                                    <Box 
                                    display="grid"
                                    gridTemplateColumns="repeat(2, 1fr)"
                                    gridGap="1em 1em"
                                    flexWrap="wrap"
                                    alignItems="end">
                                        
                                        <Grid container item xs={12} spacing={4}>
                                                    <Grid item xs={4}>
                                                    <SelectComponent 
                                                name="productId"
                                                options={products}
                                                value={productId}
                                                label={"Product"}
                                                enableAll={false}
                                                enableSelect={true}
                                                disabled={products.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                                 <SelectComponent 
                                                name="secondaryPackage"
                                                options={secondaryPackages}
                                                value={secondaryPackage}
                                                label="Secondary Package"
                                                enableAll={false}
                                                enableSelect={true}
                                                disabled={secondaryPackages.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                                    </Grid>
                                                    <Grid item xs={4}></Grid>
                                                    <SelectComponent
                                                name="IssueType"
                                                label="Issue Type"
                                                options={issueTypes}
                                                value={IssueType}
                                                enableSelect={true}
                                                disabled={issueTypes.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                                  <SelectComponent
                                                name="LMode"
                                                label="Line Mode"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                options={lineModes}
                                                value={LMode}
                                                enableSelect={true}
                                                disabled={lineModes.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                                    <Grid item xs={4}>
                                                    <FormControl>
                                            <InputLabel style={TextFieldLabelStyle}>
                                                <StringTranslator>Date Code</StringTranslator>
                                            </InputLabel>
                                            <Input
                                                name="dateCode"
                                                id="dateCode"
                                                type='text'
                                                value={dateCode}
                                                onChange={this.handleChange}
                                                endAdornment={
                                                <InputAdornment position="end">
                                                    <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={this.calculateDateCode}>
                                                        <MoreHoriz/>
                                                    </IconButton>
                                                </InputAdornment>
                                                }
                                            />
                                        </FormControl>
                                        <TextField
                                            name="STONum"
                                            id="sto-num"
                                            label={translateString("STO Number")}
                                            type="number"
                                            InputLabelProps={{style: TextFieldLabelStyle}}
                                            value={STONum}
                                            onChange={this.handleChange}
                                        />
                                                    </Grid>
                                         </Grid>
                                    </Box>
                                    :
                                    <Box  
                                    display="flex" 
                                    flexDirection="row"
                                    border="3px" 
                                    borderColor="var(--primary-color)" 
                                   >
                                       <Grid container item xs={1} ></Grid>
                                        <Box flexGrow={1}>
                                            <Grid container spacing={2}>
                                           <Grid container item xs={12} spacing={4}>
                                           <Grid item xl={1} lg={1} md={2} xs={2}>
                                                <Typography style={{fontWeight: 'bold' ,fontSize: '1em'}} variant="caption"> 
                                                    <StringTranslator>Material</StringTranslator> 
                                                </Typography>
                                                </Grid>
                                                    <Grid item xl={3} lg={3} md={12} xs={12}>
                                                    <p style={{color: 'black',fontSize: '14px'}}> {translateString("Material Type")}</p>
                                            <div  id="highlightfield">
                                        <SelectComponent 
                                                style={{paddingBottom: '2px'}}
                                                name="materialType"
                                                options={materialTypes}
                                                value={materialType}
                                                enableSelect={true}
                                                enableAll={false}
                                                disabled={materialTypes.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                            </div>
                                            <p style={{color: 'black',fontSize: '14px'}}> {translateString("Supplier")}</p>
                                            <div  id="highlightfield">
                                                <SelectComponent
                                                name="supplier"
                                                options={suppliers}
                                                value={supplier}
                                                enableSelect={true}
                                                disabled={suppliers.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                                </div>
                                                <p style={{color: 'black',fontSize: '14px'}}> {translateString("Issue Type")}</p>
                                                <div  id="highlightfield">
                                                <SelectComponent
                                                name="IssueType"
                                                options={issueTypes}
                                                value={IssueType}
                                                enableSelect={true}
                                                disabled={issueTypes.length === 0}
                                                handleChange={this.handleSelectChange}/>
                                                </div>
                                                </Grid>
                                                <Grid item xl={4} lg={4} md={12} xs={12}>
                                                <p style={{color: 'black',fontSize: '14px'}}> {translateString("Item Number")}</p>
                                                    <div  id="highlightfield">
                                        <TextField
                                                name="itemNum"
                                                id="item-num"
                                                type="number"
                                                variant="outlined"
                                                value={itemNum}
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                onChange={this.handleChange}/>
                                                </div>
                                            <p style={{color: 'black',fontSize: '14px'}}> {translateString("Supplier Location")}</p>
                                            <div  id="highlightfield">
                                                <TextField
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                name="supplierLocation"
                                                id="supplier-location"
                                                value={supplierLocation}
                                                onChange={this.handleChange}/>
                                                </div>
                                                <p style={{color: 'black',fontSize: '14px'}}> {translateString("Mfg Date")}</p>
                                                <div  id="highlightfield">
                                            <DateComponent
                                                name="mfgDate"
                                                id="mfg-date"
                                                value={mfgDate}
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                handleChange={this.handleMfgDateChange}
                                                format="MM/DD/YYYY"
                                            />
                                            </div>
                                                </Grid>
                                                <Grid item xl={2} lg={2} md={12} xs={12} >
                                                    <p style={{color: 'black',fontSize: '14px'}}> {translateString("Lot Code")}</p>
                                                    <div  id="highlightfield">
                                                  <TextField
                                                name="lotCode"
                                                id="lot-code"
                                                value={lotCode}
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                onChange={this.handleChange}/>
                                                </div>
                                                </Grid>
                                        </Grid> 
                                    </Grid>
                                    </Box>
                                    </Box>
                                    }
                                </Box>
                                {/*/////////////////////////////////////_  HOLD DESC.  _///////////////////////////////////*/}
                                <Box
                                //  border="3px solid var(--primary-color)" borderRadius="5px" 
                                >
                                    <Box display="flex" py={1} px={2}>
                                        <Grid container item xs={1}></Grid>
                                    <Grid container item xs={10} spacing={4}>
                                        
                                        <TextField
                                        style={{
                                            borderRadius: 4,
                                            //backgroundColor: '#fcfcfb',
                                            boxShadow:  'rgba(33, 35, 38, 0.1) 0px 10px 10px -10px',fontWeight: 'bold' 
                                        }}
                                            name="problemDesc"
                                            id="hold-desc"
                                            variant="outlined"
                                            label={translateString("Problem Description")}
                                            value={problemDesc}
                                            InputLabelProps={{shrink: true}}
                                            multiline
                                            rows={4}
                                            onChange={this.handleChange}
                                        />
                                        </Grid>
                                    </Box>
                                </Box>
                                {/*//////////////////////////////////////_  COUNTS  _//////////////////////////////////////*/}
                                {itemType === 2 ?
                                    <Box  px={3} marginTop={1}>
                                        {/* <Box 
                                            // display="grid"
                                            // gridTemplateColumns="repeat(2, 1fr)"
                                            // gridGap="1em 1em"
                                            // flexWrap="wrap"
                                            // py={1}
                                        > */}
                                        <Box flexGrow={1}>
                                         <Grid container item xs={1} ></Grid>
                                            <Grid container spacing={2}>
                                           <Grid container item xs={12} spacing={4}>
                                           {/* <Grid item xs={1}></Grid> */}
                                        <Grid item xs={1} md={1}> 
                                        <Typography style={{fontWeight: 'bold' ,fontSize: '1em'}} variant="caption"> 
                                            <StringTranslator>Count</StringTranslator> 
                                        </Typography></Grid>
                                              <Grid item xs={3}  md={3}>
                                            <TextField
                                                name="quantityHeld"
                                                id="cases-held"
                                                label="Cases Held"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                value={quantityHeld}
                                                onChange={this.handleCostChange}
                                            />
                                            </Grid>
                                            <Grid item xs={4}   md={4}>
                                                
                                            <TextField
                                                name="quantityReleased"
                                                id="cases-released"
                                                label="Cases Released"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                value={quantityReleased}
                                                onChange={this.handleCostChange}
                                            />
                                            </Grid>
                                            <Grid item xs={4}  md={4}>
                                            <TextField
                                                name="quantityDestroyed"
                                                id="cases-destroyed"
                                                label="Cases Destroyed"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                value={quantityDestroyed}
                                                onChange={this.handleCostChange}
                                            />
                                            </Grid>
                                            <Grid item xs={4}   md={4}>
                                            <TextField
                                                name="quantityReworked"
                                                id="cases-repacked"
                                                label="Cases Repacked"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                value={quantityReworked}
                                                onChange={this.handleCostChange}
                                            />
                                            </Grid>
                                            <Grid item xs={4}   md={4}>
                                            <TextField
                                                name="casesCost"
                                                id="cost"
                                                label="Cost"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                value={casesCost}
                                                disabled
                                                onChange={this.handleCostChange}
                                            />
                                              </Grid>
                                              <Grid item xs={4}   md={4}>
                                            <TextField
                                                name="quantityRemaining"
                                                id="remaining"
                                                label="Remaining"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                disabled
                                                value={quantityRemaining}
                                            />
                                                      </Grid>
                                                      </Grid>
                                                      </Grid>
                                                      </Box>
                                    </Box>
                                :
                                <Box flexGrow={1} px={3} marginTop={5}>
                                    <hr/>
                                   <Grid container spacing={2}>
                                        {/* <Typography style={{color: "var(--primary-color)",fontSize: '1em'}} variant="caption"> 
                                            <StringTranslator>Count</StringTranslator> 
                                        </Typography> */}
                                        {/* <Box 
                                            display="grid"
                                            gridTemplateColumns="repeat(2, 1fr)"
                                            gridGap="1em 1em"
                                            flexWrap="wrap"
                                            py={1}
                                        > */}
                                      <Grid container item xs={1} ></Grid>
                                             <Grid container item xs={11} spacing={4} style={{paddingBottom: '12px'}}>
                                          <Grid item xs={1} > 
                                        <Typography style={{fontWeight: 'bold',fontSize: '1em'}} variant="caption"> 
                                            <StringTranslator>Count   </StringTranslator> 
                                        </Typography></Grid>
                                          <Grid item xl={3} lg={3} md={3} xs={12} >
                                          <p style={{color: 'black',fontSize: '14px'}}> {translateString("Hold Tag #")}</p>
                                          <div  id="highlightfield">
                                            <TextField
                                                name="holdTag"
                                                id="hold-tag-num"
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                type="number"
                                                value={holdTag}
                                                onChange={this.handleCostChange}
                                            />
                                            </div>
                                             <p style={{color: 'black',fontSize: '14px'}}> {translateString("Destroyed")}</p>
                                               <TextField
                                                name="quantityDestroyed"
                                                id="destroyed"
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                type="number"
                                                value={quantityDestroyed}
                                                onChange={this.handleCostChange}
                                            />
                                            </Grid>
                                            <Grid item xl={4} lg={4} md={3} xs={12}>
                                                
                                             <p style={{color: 'black',fontSize: '14px'}}> {translateString("Quatity Held")}</p>
                                            <TextField
                                               className="highlightfield"
                                                name="quantityHeld"
                                                id="quantity-held"
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                type="number"
                                                value={quantityHeld}
                                                onChange={this.handleCostChange}
                                            />
                                            <p style={{color: 'black',fontSize: '14px'}}> {translateString("Returned")}</p>
                                              <TextField
                                               className="highlightfield"
                                                name="quantityReturned"
                                                id="retured"
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                type="number"
                                                value={quantityReturned}
                                                onChange={this.handleCostChange}
                                            />
                                            </Grid>
                                               <Grid item  xl={3} lg={3} md={3} xs={12} >
                                               <p style={{color: 'black',fontSize: '14px'}}> {translateString("Released")}</p>
                                            <TextField
                                             className="highlightfield"
                                                name="quantityReleased"
                                                id="released"
                                                variant="outlined"
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                type="number"
                                                value={quantityReleased}
                                                onChange={this.handleCostChange}
                                            />
                                           <p style={{color: 'black',fontSize: '14px'}}> {translateString("Remaining")}</p>
                                             <TextField
                                                style={{
                                                    borderRadius: 4,
                                                    backgroundColor: '#f5f5f5',
                                                    }}
                                                    className="highlightfield"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                name="quantityRemaining"
                                                id="remaining"
                                                // InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                disabled
                                                value={quantityRemaining}
                                            />
                                            </Grid>
                                       </Grid>
                                    </Grid>
                                    </Box>
                                }
                                {/*//////////////////////////////////////_  COSTs  _//////////////////////////////////////*/}
                                {itemType === 1 &&
                                //  <Box border="3px solid var(--primary-color)" borderRadius="5px" px={3} paddingBottom={1}>
                                       <Box flexGrow={1} px={3} marginTop={5} paddingBottom={1} >
                                            <Grid container spacing={2}> 
                                             <Grid container item xs={1} ></Grid>
                                     <Grid container item xs={11} spacing={4}>
                                            <Grid item xs={1}>
                                                <Typography style={{fontWeight: 'bold',fontSize: '1em'}} variant="caption"> 
                                            <StringTranslator>Cost</StringTranslator> 
                                                </Typography>
                                            </Grid>
                                            <Grid item xl={3} lg={3} md={3} xs={12}>
                                           <p style={{color: 'black',fontSize: '14px'}}> {translateString("Down Time (min)")}</p>
                                            <TextField
                                                name="downTime"
                                                className="highlightfield"
                                                id="down-time"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                type="number"
                                                value={downTime}
                                                onChange={this.handleCostChange}
                                                />
                                          <p style={{color: 'black',fontSize: '14px'}}> {translateString("Material Lost")}</p>
                                                  <TextField
                                                name="materialLoss"
                                                className="highlightfield"
                                                id="material-lost"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                type="number"
                                                value={materialLoss}
                                                onChange={this.handleCostChange}
                                                />
                                                <p style={{color: 'black',fontSize: '14px'}}> {translateString("Product Lost")}</p>
                                                  <TextField
                                                className="highlightfield"
                                                name="productLoss"
                                                id="product-lost"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                type="number"
                                                value={productLoss}
                                                onChange={this.handleCostChange}
                                                />
                                              <hr className="quaHoldHR"></hr>
                                                    <FormControlLabel
                                                    id="boldlabel"
                                                        control={
                                                            <Checkbox checked={InvoiceToFollow}
                                                                style={InvoiceToFollow? {color:"var(--secondary-color)"} :{}} 
                                                                onChange={() => {
                                                                    this.setState({InvoiceToFollow: !InvoiceToFollow})
                                                                }} 
                                                                name="InvoiceToFollow"
                                                            />
                                                        }
                                                        label={translateString("Invoice To Follow")}
                                                        labelPlacement="start"
                                                        color='rgba(0, 0, 0, 0.87)'
                                                    />
                                               </Grid>
                                             
                                            <Grid item xl={4} lg={4} md={3} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}>{translateString("Hour Rate")}</p>
                                            <TextField
                                               className="highlightfield"
                                                name="hourRate"
                                                id="std-rate"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                type="number"
                                                value={hourRate}
                                                onChange={this.handleCostChange}
                                                />
                                            <p style={{color: 'black',fontSize: '14px'}}>{translateString("Material Unit Cost")}</p>
                                                 <TextField
                                                className="highlightfield"
                                                name="materialUnitCost"
                                                id="material-unit-cost"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                type="number"
                                                value={materialUnitCost}
                                                onChange={this.handleCostChange}
                                                />
                                          <p style={{color: 'black',fontSize: '14px'}}> {translateString("Product Unit Cost")}</p>
                                                 <TextField
                                                className="highlightfield"
                                                name="productUnitCost"
                                                id="product-unit-cost"
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                type="number"
                                                value={productUnitCost}
                                                onChange={this.handleCostChange}
                                                />
                                            </Grid>
                                            <Grid item xl={3} lg={3} md={3} xs={12}>
                                            <p style={{color: 'black',fontSize: '14px'}}>{translateString("Downtime Cost")}</p>
                                            <TextField
                                                style={{
                                                    borderRadius: 4,
                                                    backgroundColor: '#f5f5f5',
                                                    }}
                                                className="highlightfield"   
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                name="downtimeCost"
                                                id="downtime-cost"
                                                type="number"
                                                disabled={true}
                                                // value={downtimeCost.toFixed(2) as number}
                                                value={round(downtimeCost, 2)}
                                            />
                                           <p style={{color: 'black',fontSize: '14px'}}>{translateString("Material Cost")}</p>
                                             <TextField
                                                className="highlightfield"
                                                style={{
                                                    borderRadius: 4,
                                                    backgroundColor: '#f5f5f5',
                                                    }}
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                name="materialCost"
                                                id="material-cost"
                                                type="number"
                                                disabled={true}
                                                // value={materialCost.toFixed(2) as number}
                                                value={round(materialCost, 2)}
                                                />
                                              <p style={{color: 'black',fontSize: '14px'}}>{translateString("Product Cost")}</p>
                                             <TextField
                                                className="highlightfield"
                                                style={{
                                                    borderRadius: 4,
                                                    backgroundColor: '#f5f5f5',
                                                    }}
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                name="productCost"
                                                id="product-cost"
                                                type="number"
                                                disabled={true}
                                                // value={productCost.toFixed(2) as number}
                                                value={round(productCost, 2)}
                                                />
                                                   <hr className="quaHoldHR"></hr>
                                        {isMobileWidth ? null : <Grid item sm={8}/>}
                                        <Grid item xs={12} >
                                          <p style={{color: 'black',fontSize: '14px'}}> {translateString("Destruction/Rework Cost")}</p>
                                            <TextField
                                               className="highlightfield"
                                                name="destroyReworkCost"
                                                id="rework-cost"
                                                variant="outlined"
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                type="number"
                                                value={destroyReworkCost}
                                                onChange={this.handleCostChange}
                                                />
                                        </Grid>
                                        <hr className="quaHoldHR"></hr>
                                            {!isMobileWidth ?
                                            <Grid item xs={8} >
                                                {/* <FormControlLabel
                                                    control={
                                                        <Checkbox checked={InvoiceToFollow}
                                                            style={InvoiceToFollow ? {color:"var(--secondary-color)"} :{}} 
                                                            onChange={() => {
                                                                this.setState({InvoiceToFollow: !InvoiceToFollow})
                                                            }} 
                                                            name="InvoiceToFollow"
                                                        />
                                                    }
                                                    label={translateString("Invoice To Follow")}
                                                    labelPlacement="start"
                                                    color='rgba(0, 0, 0, 0.87)'
                                                /> */}
                                            </Grid>
                                            :
                                            <Grid item sm={3} xs={12}>
                                          <p style={{color: 'black',fontSize: '14px'}}>{translateString("Total Cost")}</p>
                                            <TextField
                                               className="highlightfield"
                                                style={{
                                                    borderRadius: 4,
                                                    backgroundColor: '#f5f5f5',
                                                    }}
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                name="totalCost"
                                                id="total-cost"
                                                type="number"
                                                value={totalCost}
                                                disabled={true}
                                                />
                                            </Grid>
                                            }
                                            {isMobileWidth ?
                                            <Grid item xs={4}>
                                                <Box alignSelf="center" display="flex">
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox checked={InvoiceToFollow}
                                                                style={InvoiceToFollow? {color:"var(--primary-color)"} :{}} 
                                                                onChange={() => {
                                                                    this.setState({InvoiceToFollow: !InvoiceToFollow})
                                                                }} 
                                                                name="InvoiceToFollow"
                                                            />
                                                        }
                                                        label={translateString("Invoice To Follow")}
                                                        labelPlacement="start"
                                                        color='rgba(0, 0, 0, 0.87)'
                                                    />
                                                </Box>
                                            </Grid>
                                            :
                                            <Grid item  xs={12}>
                                          <p style={{color: 'black',fontSize: '14px'}}>{translateString("Total Cost")}</p>
                                            <TextField
                                               className="highlightfield"
                                                style={{
                                                    borderRadius: 4,
                                                    backgroundColor:'#f5f5f5',
                                                    }}
                                                variant="outlined"
                                                InputLabelProps={{style:{color: "black"}}}
                                                name="totalCost"
                                                id="total-cost"
                                                type="number"
                                                value={totalCost}
                                                disabled={true}/>
                                            </Grid> }
                                            </Grid>
                                     </Grid>
                                     </Grid>
                                </Box>}
                            </Box>
                        /*//////////////////////
                        // INVESTIGATION TAB //
                        ////////////////////////////////////////////////////////////////////////////////////////////////////*/
                        : selectedTab === 1 ?
                            <Box p={3}>
                                <Grid container spacing={3}>
                                    <Grid container item xs={12} spacing={2} >
                                    <Grid item xs={6} >
                                        <Typography variant="h6" style={{fontWeight: 'bold'}} >{translateString("Investigation of hold")}</Typography>
                                        <TextField
                                           className="highlightfield"
                                            name="investigationHold"
                                            id="investigationHold"
                                            // label={translateString("Investigation of hold")}
                                            value={investigationHold}
                                            InputLabelProps={{style: TextFieldLabelStyle}}
                                            variant="outlined"
                                            multiline
                                            rows={investigationHold === "" ? 2 : 4}
                                            onChange={this.handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                    <Typography variant="h6" style={{fontWeight: 'bold'}} >{translateString("Disposition test result")}</Typography>
                                        <TextField
                                           className="highlightfield"
                                            name="dispositionTestResult"
                                            id="dispositionTestResult"
                                            // label={translateString("Disposition test result")}
                                            value={dispositionTestResult}
                                            InputLabelProps={{style: TextFieldLabelStyle}}
                                            variant="outlined"
                                            multiline
                                            rows={dispositionTestResult === "" ? 2 : 4}
                                            onChange={this.handleChange}
                                        />
                                    </Grid>
                                    </Grid>
                                    <Grid item xs={6} xl={6} md={6}>
                                    <Typography variant="h6" style={{fontWeight: 'bold'}} >{translateString("Possible causes")}</Typography>
                                        <TextField
                                            name="possibleCauses"
                                            id="possibleCauses"
                                            // label={translateString("Possible causes")}
                                            value={possibleCauses}
                                            InputLabelProps={{style: TextFieldLabelStyle}}
                                            variant="outlined"
                                            multiline
                                            rows={possibleCauses === "" ? 2 : 4}
                                            onChange={this.handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={6} xl={6} md={6}>
                                    <Typography variant="h6" style={{fontWeight: 'bold'}} >{translateString("Preventative action")}</Typography>
                                        <TextField
                                            name="preventativeAction"
                                            id="preventativeAction"
                                            // label={translateString("Preventative action")}
                                            value={preventativeAction}
                                            InputLabelProps={{style: TextFieldLabelStyle}}
                                            variant="outlined"
                                            multiline
                                            rows={preventativeAction === "" ? 2 : 4}
                                            onChange={this.handleChange}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        
                        /*////////////////////
                        // SUPPLIER CA TAB //
                        ////////////////////////////////////////////////////////////////////////////////////////////////////*/
                        : selectedTab === 2 ?
                            <Box p={1}>
                                {/* <Box border="3px solid var(--primary-color)" borderRadius="5px" px={3} paddingBottom={3}> */}
                                <Box px={3}>
                                    <Typography style={{fontWeight: 'bold'}} variant="h6">
                                        <StringTranslator>Return Information</StringTranslator>
                                    </Typography>
                                    <Grid spacing={2} container>
                                        <Grid item lg={1} ></Grid>
                                        <Grid item xs={12} lg={4} pb={8}>
                                        <p style={{color: 'black',fontSize: '14px'}}>{translateString("Return authorization")}</p>
                                            <TextField
                                            variant="outlined" 
                                                name="returnAuthorization"
                                                id="returnAuthorization"
                                                value={returnAuthorization}
                                                InputLabelProps={{shrink: true, style:{color: "black"}}}
                                                onChange={this.handleChange}
                                            />
                                               <p style={{color: 'black',fontSize: '14px'}}>{translateString("Invoice number")}</p>
                                             <TextField
                                                // variant="outlined"
                                                name="invoiceNumber"
                                                id="invoiceNumber"
                                                value={invoiceNumber}
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                onChange={this.handleChange}
                                            />
                                        </Grid>
                                        <Grid item lg={1} ></Grid>
                                        <Grid item xs={12} lg={4}>
                                        <p style={{color: 'black',fontSize: '14px'}}>{translateString("Invoice date")}</p>
                                            <DateComponent
                                                handleChange={this.handleInvoiceDateChange}
                                                format="MM/DD/YYYY"
                                                value={invoiceDate}
                                            />
                                            <div  style={{paddingTop: "5px"}}>
                                        <p style={{color: 'black',fontSize: '14px'}}>{translateString("Estimated cost")}</p>
                                               <TextField
                                                name="estimatedCost"
                                                id="estimatedCost"
                                                type="number"
                                                value={estimatedCost}
                                                InputLabelProps={{style: TextFieldLabelStyle}}
                                                onChange={this.handleChange}
                                            />
                                            </div>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        /*////////////////////
                        // INCIDENT LOG TAB//
                        ///////////////////////////////////////////////////////////////////////////////////////////////////*/
                        : selectedTab === 3 ?
                            <Box>
                                {incidentLogs.length === 0 && !isEditIncidentLog &&
                                    <Box display="block" paddingTop={3}>
                                        <Typography 
                                        style={{ fontSize: '16px', alignSelf: "center", textAlign: "center"}}>
                                            <StringTranslator>
                                                no data
                                            </StringTranslator>
                                        </Typography>
                                    </Box >}
                                   <Box 
                                    display="flex" 
                                    flex={1}
                                    gridTemplateColumns={isTabletWidth ? "1fr" : "225px 2px auto"}
                                    gridTemplateRows={isTabletWidth ? "auto 2px 1fr" : "1fr"}>
                                    {/*/////////////////////////////////_  Log Entries  _/////////////////////////////////*/}
                                    <Box gridArea="1 3 1 4" display="flex" flex={1}>
                                        <List key="listParent"
                                        className="commentsArea" 
                                            style={{ borderColor: 'white', flexGrow: 1}}>
                                            &nbsp; &nbsp; &nbsp; 
                                            {incidentLogs.map((comment: any, index: number) => (
                                                <div key={"listItemDiv" + index}>
                                                    <ListItem 
                                                    key={"listItem" + index} 
                                                    disabled={(isEditIncidentLog || isConfirmDeleteLog) && selectedIncidentLogKey != comment.logKey}>
                                                        {comment.enteredByName && 
                                                        <ListItemAvatar >
                                                            <Avatar style={{ backgroundColor: `${grey[500]}`}}>
                                                                {comment.enteredByName.charAt(0)}
                                                            </Avatar>
                                                        </ListItemAvatar>}
                                                        { isConfirmDeleteLog && selectedIncidentLogKey == comment.logKey ?
                                                        <Box flexGrow={1} display="flex" justifyContent="center">
                                                            <Typography variant="h4">
                                                                <StringTranslator>Are you sure?</StringTranslator>
                                                            </Typography>
                                                        </Box>
                                                        :
                                                        <Box flexGrow={1} display="flex" flexDirection="column">
                                                            <ListItemText key={"listItemText" + index}
                                                                primary={
                                                                    <div>
                                                                        <span key={"listItemName" + index}
                                                                        style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                                                        {comment.enteredByName}
                                                                        </span>
                                                                        &nbsp; &nbsp;
                                                                        <span key={"listItemTextEntryTime" + index}
                                                                        style={{ fontSize: '10px', color: `${grey[400]}` }}>
                                                                        {Moment(comment.entryDateTime).fromNow()}
                                                                        </span>
                                                                    </div>
                                                                }
                                                                secondary={ selectedIncidentLogKey != comment.logKey &&
                                                                    <Typography 
                                                                    key={"listItemTextEntry" + index}
                                                                    variant="body1"> 
                                                                        {comment.logEntry}
                                                                    </Typography>
                                                                }
                                                            />
                                                            {isEditIncidentLog && selectedIncidentLogKey == comment.logKey &&
                                                            <Box display="flex">
                                                                <TextField
                                                                    key="logEntry"
                                                                    name="incidentEntryText"
                                                                    id="incidentEntryText"
                                                                    placeholder={translateString("incident Entry Text")}
                                                                    variant="outlined"
                                                                    size="small"
                                                                    multiline
                                                                    rows={3}
                                                                    onBlur={this.handleChange}
                                                                />
                                                            </Box>}
                                                        </Box>}
                                                        { selectedIncidentLogKey != comment.logKey &&
                                                        <Box display="flex" flex="1 0 auto" justifyContent="flex-end">
                                                            <IconButton 
                                                                disabled={isEditIncidentLog || isConfirmDeleteLog}
                                                                edge="end" 
                                                                aria-label="delete"
                                                                onClick={() => {
                                                                    this.deleteLog(index)
                                                                }}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                            <IconButton 
                                                                disabled={isEditIncidentLog || isConfirmDeleteLog}
                                                                edge="end" 
                                                                aria-label="edit"
                                                                onClick={() => {
                                                                    this.editLog(index)
                                                                }}>
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Box>}
                                                        {(isEditIncidentLog || isConfirmDeleteLog) && 
                                                        selectedIncidentLogKey == comment.logKey &&
                                                        <Box 
                                                            display="flex" 
                                                            flexDirection={isConfirmDeleteLog ? "row" : "column"}>
                                                            <Box  paddingLeft={1} paddingBottom={0.5}>
                                                                <Tooltip title={translateString("Done")}>
                                                                    <Fab
                                                                    size="small"
                                                                    onClick={() => { isConfirmDeleteLog ? 
                                                                        this.confirmDeleteLog() : this.confirmEditLog()}} 
                                                                    style={{backgroundColor:"green", color:"white"}}>
                                                                        <Done/>
                                                                    </Fab>
                                                                </Tooltip>
                                                            </Box>
                                                            <Box paddingLeft={1}>
                                                                <Tooltip title={translateString("Cancel")}>
                                                                    <Fab
                                                                    size="small"
                                                                    onClick={this.cancelLog} 
                                                                    style={{backgroundColor:"var(--error)", color:"white"}}>
                                                                        <Close/>
                                                                    </Fab>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>}
                                                    </ListItem>
                                                    <Divider variant="inset" component="li"/>
                                                </div>
                                            ))}
                                            {/*////////////////////////////_  Add New Entry  _////////////////////////////*/}
                                            <Box 
                                            display={isEditIncidentLog && selectedIncidentLogKey == "" ? "block" : "flex"} 
                                            justifyContent="center" 
                                            alignItems="center">
                                                { isEditIncidentLog && selectedIncidentLogKey == "" ? 
                                                <ListItem autoFocus={true}>
                                                    <Box flex={1}>
                                                        <TextField
                                                            key="logEntry"
                                                            name="incidentEntryText"
                                                            id="incidentEntryText"
                                                            placeholder={translateString("incident Entry Text")}
                                                            variant="outlined"
                                                            size="small"
                                                            multiline
                                                            rows={3}
                                                            onBlur={this.handleChange}
                                                        />
                                                    </Box>
                                                    <Box display="flex" flexDirection="column">
                                                            <Box  paddingLeft={1} paddingBottom={0.5}>
                                                                <Tooltip title={translateString("Confirm")}>
                                                                    <Fab
                                                                    size="small"
                                                                    onClick={this.confirmLogAdd} 
                                                                    style={{backgroundColor:"green", color:"white"}}>
                                                                        <Done/>
                                                                    </Fab>
                                                                </Tooltip>
                                                            </Box>
                                                            <Box paddingLeft={1}>
                                                                <Tooltip title={translateString("Cancel")}>
                                                                    <Fab
                                                                    size="small"
                                                                    onClick={this.cancelLog} 
                                                                    style={{backgroundColor:"var(--error)", color:"white"}}>
                                                                        <Close/>
                                                                    </Fab>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                </ListItem>
                                                : selectedIncidentLogKey == "" &&
                                                <Box paddingTop={1}>
                                                    <Tooltip title={translateString("New Incident")}>
                                                        <Fab 
                                                            onClick={this.addLog} 
                                                            style={{backgroundColor:"var(--secondary-color)", color:"white"}}>
                                                            <Add/>
                                                        </Fab>
                                                    </Tooltip>
                                                </Box>
                                                }
                                            </Box>
                                        </List>
                                    </Box>
                                </Box>
                            </Box>

                        /*/////////////////////
                        // ATTACHEMENTS TAB //
                        ////////////////////////////////////////////////////////////////////////////////////////////////////*/
                        : selectedTab === 4 ?
                        <Grid container xs={12} >
                            <Grid item xl={4} lg={4} md={1} xs={1}></Grid>
                            <Grid item xl={6} lg={6} md={10} xs={10}>
                            <Box  p={3} >
                                {renderComponents({
                                    compTypeDesc: 'Attachments',
                                    stateName: 'HoldAttachments',
                                    labelName: translateString("Attachments"),
                                    dataArr: holdAttachments,
                                    isShowForm: true,
                                    sectionKey: '',
                                    func: this.handleAttachmentChange,
                                    fileDetailsFun: this.openAttachmentsModal,
                                    cameraPhotoFunc: null,
                                })}
                                <AttachmentsModal
                                    openModal={openAttachmentsModal}
                                    closeModal={this.closeAttachmentsModal}
                                    filesColsName={['File Name', 'Size', '']}
                                    data={holdAttachments}
                                    isPreviewFiles={true}
                                    height="305px"
                                    searchTerm={searchFileTerm}
                                    handleChange={this.handleChange}
                                    handleDeleteFilesOptions={this.handleDeleteFilesOptions}
                                    downloadFiles={this.downloadFiles}
                                />
                                {/* [XQ: 3/5/2021] - removed preview modal since attachments modal includes preview modal if set the isPreview to be true */}
                                {/* <PreviewFilesModal
                                    file={selectedPreviewFileInfo.bufferData}
                                    filename={selectedPreviewFileInfo.fileName}
                                    fileType={selectedPreviewFileInfo.fileType}
                                    enableDownload={!isNullOrUndefined(selectedPreviewFileInfo.fileKey)}
                                    fileKey={selectedPreviewFileInfo.fileKey || ''}
                                    previewFileHTML={selectedPreviewFileInfo.fileInfo}
                                    excelSheets={selectedPreviewFileInfo.excelSheets || {}}
                                    numPdfPages={totalPagesOfPdfFile}
                                    showLoadProgress={showLoadingFileProgress}
                                    progressNum={fileLoadingProgress}
                                    filePreviewWidth={70}
                                    openFileModal={openFilePreviewModal}
                                    closeFileModal={this.closeFilePreviewModal}
                                    downloadFiles={this.downloadFiles}
                                /> */}
                            </Box>
                            </Grid>
                            <Grid item xl={2} lg={2} md={1} xs={1}></Grid>
                        </Grid>
                        /*/////////////////
                        // COMPLETE TAB //
                        ////////////////////////////////////////////////////////////////////////////////////////////////////*/
                        : selectedTab === 5 ?
                            <Box p={3}>
                                      <Typography style={{fontWeight: 'bold'}} variant="h6">
                                        <StringTranslator>Responsable for final rework / destruction</StringTranslator>
                                    </Typography>
                                    <Grid container item>
                                    <Grid item xs={4}></Grid>
                                    <Grid item  xs={4}> <Box>
                                    <SelectComponent
                                        key="finalReworkByUserSelect"
                                        name="users"
                                        options={users}
                                        enableSelect={true}
                                        value={finalReworkBy}
                                        InputLabelProps={{style: TextFieldLabelStyle}}
                                        handleChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                            this.setState({
                                                finalReworkBy: event.target.value,
                                                dateCompleted: new Date(),
                                                completedByManager: "",
                                            })
                                        }}
                                    />
                                </Box></Grid>
                                    <Grid item xs={4} ></Grid>
                                    </Grid>
                                    <Grid container item xs={12}> 
                                    <Grid  item xl={1} xs={6}>  <Typography style={{fontWeight: 'bold'}} variant="h6">
                                        <StringTranslator>Completed </StringTranslator>
                                    </Typography></Grid>
                                    <Grid  item xl={1} xs={6}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isIssueComplete} 
                                                onChange={() => {
                                                    this.setState({isIssueComplete: !isIssueComplete})
                                                }} 
                                                name="IsComplete"
                                                style={{color: "gray", transform: "scale(1.3)"}}
                                            />
                                        }
                                        color='rgba(0, 0, 0, 0.87)'
                                        labelPlacement="top"
                                    />
                                    </Grid>
                                    <Grid  item xl={8}></Grid>
                                   </Grid>
                                <Box display="flex" justifyContent="center" p={3}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isIssueComplete} 
                                                onChange={() => {
                                                    this.setState({isIssueComplete: !isIssueComplete})
                                                }} 
                                                name="IsComplete"
                                                style={{color: "var(--secondary-color)", transform: "scale(1.6)"}}
                                                    />}
                                        label={
                                            <Typography 
                                                style={{
                                                    color: "var(--secondary-color)", 
                                                    fontWeight: 700,  
                                                    fontSize: "150%"}}
                                            >
                                                <StringTranslator>Completed</StringTranslator>
                                            </Typography>
                                        }
                                        color='rgba(0, 0, 0, 0.87)'
                                        labelPlacement="top"
                                    />
                                    <div/>
                                </Box>
                            </Box>
                        /*///////////////////////////////////_  DEFAULT TAB (ERROR)  _//////////////////////////////////////*/
                        :   <Typography variant="h1">
                                Tabs error see QualityHoldEntry.tsx
                            </Typography>
                    }
                </Paper>
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "row",
                        justifyContent: "flex-end", padding: "1em", fontSize: '1em'
                    }}>
                        <button   style={editPermission ? 
                                {padding: "0.5em 2em"} : 
                                {backgroundColor: "grey", borderColor: "grey"}}
                                className=" submbutton ml-4" 
                            disabled={!editPermission}
                            onClick={this.submitHoldEdit}>
                                <StringTranslator>Submit</StringTranslator>
                            <br/>
                            {!editPermission && 
                                <Typography variant="caption">
                                    <StringTranslator>no edit permission</StringTranslator>
                                </Typography>
                            }</button>
                        {/* <button 
                            style={editPermission ? 
                                {padding: "0.5em 2em"} : 
                                {backgroundColor: "grey", borderColor: "grey"} }
                            className="font-weight-bold"
                            disabled={!editPermission}
                            onClick={this.submitHoldEdit}>
                            <StringTranslator>Submit</StringTranslator>
                            <br/>
                            {!editPermission && 
                                <Typography variant="caption">
                                    <StringTranslator>no edit permission</StringTranslator>
                                </Typography>
                            }
                        </button> */}
                        <Button style={{ padding: "0.5em 2em" }}
                            className="font-weight-bold ml-4"
                            variant="contained" 
                            onClick={() => this.CancelEdit(true)}>
                                 <StringTranslator>CANCEL</StringTranslator>
                            </Button>
                        {/* <button style={{ padding: "0.5em 2em" }}
                            className="font-weight-bold ml-4"
                            onClick={() => this.CancelEdit(true)}>
                            <StringTranslator>CANCEL</StringTranslator>
                        </button> */}
                    </div>
                    <InstructionsModal
                        showInstructionsModal={this.state.openInstructionsModal}
                        closeInstructionsModal={() => { this.closeInstructions() }}
                        curWebRoute={"qualityHoldEntry"/*this.state.pathArray[this.state.pathArray.length - 1]*/} />
            </Box>
        )
    }
}

export default QualityHoldEntry
