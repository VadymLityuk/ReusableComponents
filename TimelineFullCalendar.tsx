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
