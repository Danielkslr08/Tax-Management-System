import { Component } from 'react';
import axios from 'axios';
import styles from './TravelGrid.module.css';

import AdvancedModal from '../../components/AdvancedModal/AdvancedModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

const API_BASE = `https://tax-management-api-ob9y.onrender.com`

const propertyDistances = {
  [0]: 18,
  [1]: 2,
  [2]: 120,
  [3]: 90,
  [4]: 5,
  [5]: 1,
  [6]: 150,
  [7]: 25,
  [8]: 65,
};

class TravelGrid extends Component {
  constructor() {
    super();
    this.state = {
      modalOpen: false,
      modalAction: null,
      travelLogs: [],
      showConfirm: false,
      selectedId: null,
      pinnedBottomRowData: [], // initialize pinned rows
      selectedPropertyId: -1,
      selectedYear: "NONE"
    };
  }

  componentDidMount() {
    const { user , idList} = this.props;

    if (user) {
      axios
        .get(`${API_BASE}/api/logs/user`,
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then((res) => {
          this.setState({ travelLogs: res.data.logs });
          console.log(res.data.logs)
        })
        .catch((err) => {
          console.error('Failed to fetch logs:', err);
        });
    } else {
      const propertyNames = [
        'Suburban Bungalow',
        'Downtown Loft',
        'Lakeview Rental',
        'University Flat',
        'Uptown Duplex',
        'City Condo',
        'Mountain House',
        'Garden Suite',
        'Harbourview Apartment',
      ];

      this.setState({
        travelLogs: Array.from({ length: 100 }, (_, i) => {
          const propertyId = idList[i % propertyNames.length]; // 9 but keep it for now
          const property = propertyNames[i % propertyNames.length]; 
          return {
            id: i,
            'Property Id': propertyId,
            'Property Name': property,
            Date: `2025-07-${(i % 28 + 1).toString().padStart(2, '0')}`,
            'Travel Reason': `Reason #${i + 1}`,
          };
        }),
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedPropertyId !== this.state.selectedPropertyId) {
      this.updatePinnedBottomRow();
    }
  }

  getAvailableYears = () => {
    const { travelLogs } = this.state;
    if (travelLogs.length === 0) return [];

    // Get earliest year across ALL logs (ignore filters)
    const years = travelLogs.map((log) => {
      const yearStr = log.Date?.substring(0, 4);
      return parseInt(yearStr, 10);
    }).filter(y => !isNaN(y));

    if (years.length === 0) return [];

    const earliestYear = Math.min(...years);
    const latestYear = Math.max(...years);
    const currentYear = new Date().getFullYear();

    const highestYear = currentYear >= latestYear ? currentYear : latestYear;

    const yearList = [];
    for (let y = highestYear; y >= earliestYear; y--) {
      yearList.push(y);
    }
    return yearList;
  };

  idToPropertyName = (id) => {
    if (id === -1) {
      return "All"
    } else {
      const propertyIndex = this.props.idList.findIndex(idChild => idChild === id);
      const propertyName = this.props.fields[0].options[propertyIndex]
      return propertyName;
    }
  }

  getRowDataWithDistances = () => {
    const { travelLogs , selectedPropertyId} = this.state;
    const { user, colDefs } = this.props;

    const filteredLogs = travelLogs
    .filter(log => 
      this.idToPropertyName(selectedPropertyId) === 'All' 
        ? true 
        : log['Property Id'] === selectedPropertyId
    )
    .filter(log => 
      this.state.selectedYear === "NONE" 
        ? true 
        : log.Date.includes(this.state.selectedYear)
    );

    return filteredLogs.map((log, i) => {
      const row = {
        ...log,
        [colDefs[0].field]: i + 1,
      };

      if (!user) {
        row[`${colDefs[2].field}`] = propertyDistances[log['Property Id']] ?? null;
      }

      return row;
    });
  };

  updatePinnedBottomRow = () => {
    if (!this.gridApi) return;

    const displayedRowCount = this.gridApi.getDisplayedRowCount();
    if (displayedRowCount === 0) {
      this.gridApi.showNoRowsOverlay();
    } else {
      this.gridApi.hideOverlay();
    }

    let totalDistance = 0;

    const hasGridFilter = this.gridApi.isAnyFilterPresent();

    if (hasGridFilter) {
      // Use filtered/sorted grid rows
      this.gridApi.forEachNodeAfterFilterAndSort((node) => {
        if (node.data?.isSummary) return;
        const distance = node.data['Distance'];
        if (typeof distance === 'number') {
          totalDistance += distance;
        }
      });
    } else {
      // Use selectedProperty + raw rowData
      this.getRowDataWithDistances().forEach((row) => {
        const distance = row['Distance'];
        if (typeof distance === 'number') {
          totalDistance += distance;
        }
      });
    }

    const summaryRow = {};
    this.props.colDefs.forEach((col) => {
      if (col.field === 'Distance') {
        summaryRow[col.field] = `Total: ${totalDistance} km`;
      } else if (col.field === 'Order') {
        summaryRow[col.field] = null;
      } else {
        summaryRow[col.field] = '';
      }
    });

    summaryRow.isSummary = true;

     // Check if pinnedBottomRowData has changed to prevent infinite loop
    const oldPinned = this.state.pinnedBottomRowData[0];
    const newPinned = summaryRow;

    const isSame =
      oldPinned &&
      Object.keys(newPinned).every(
        (key) => oldPinned[key] === newPinned[key]
      );

    if (!isSame) {
      this.setState({ pinnedBottomRowData: [summaryRow] });
    }
  };


  deleteCard = (logId) => {
    this.setState({ showConfirm: true, selectedId: logId });
  };

  handleDeleteConfirmed = () => {
    const { user } = this.props;
    const { selectedId } = this.state;

    if (user) {
      axios.delete(
          `${API_BASE}/api/user/delete-log-and-get-all`,
          { 
            data: { logId: selectedId },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        )
        .then((res) => {
          this.setState({
            showConfirm: false,
            travelLogs: res.data.logs,
            selectedId: null,
          });
        })
        .catch((err) => {
          console.error('Failed to delete log:', err);
          this.setState({ showConfirm: false });
        });
    } else {
      this.setState((prevState) => ({
        travelLogs: prevState.travelLogs.filter((log) => log.id !== selectedId),
        showConfirm: false,
        selectedId: null,
      }));
    }
  };

  handleDeleteCancelled = () => {
    this.setState({ showConfirm: false, selectedId: null });
  };

  modalClicked = (action, logId) => {
    this.setState({
      modalOpen: true,
      modalAction: action,
      selectedId: logId,
    });
  };

  closeModal = () => {
    this.setState({
      modalOpen: false,
      modalAction: null,
      selectedId: null
    });
  };

  updateCard = (logId, updatedCard, selectedPropertyIdInModal) => {
    const { user } = this.props;

    console.log(logId)
    console.log(updatedCard)
    console.log(typeof(selectedPropertyIdInModal))
    console.log(selectedPropertyIdInModal)

    if (user) {
      const minimalLog = {
        id: logId,
        date: updatedCard['Date'],
        reason: updatedCard['Travel Reason'],
      };

      axios.put(
        `${API_BASE}/api/user/edit-log-and-get-all`,
        {
          log: minimalLog,
          propertyId: selectedPropertyIdInModal
        },
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      )
      .then((res) => {
        this.setState({
          modalOpen: false,
          modalAction: null,
          travelLogs: res.data.logs,
          selectedId: null,
        });
      })
      .catch((err) => {
        console.error('Failed to update log:', err);
      });
    } else {
      this.setState((prevState) => ({
        travelLogs: prevState.travelLogs.map((log) =>
          log.id === logId ? { ...updatedCard, id: logId, 'Property Id': selectedPropertyIdInModal } : log
        ),
        modalOpen: false,
        modalAction: null,
        selectedId: null,
      }));
    }
  };

  saveClicked = (arrayOfInputValues, selectedPropertyIdInModal) => {
    let newCard = {};
    const { user, fields } = this.props;

    console.log(selectedPropertyIdInModal)
    console.log(typeof(selectedPropertyIdInModal))

    fields.forEach((field, i) => {
      newCard[field.label] = arrayOfInputValues[i];
    });

    if (user) {
      const minimalLog = {
        date: newCard['Date'],
        reason: newCard['Travel Reason'],
        //id: undefined, // Let server assign ID // no need to send id, DB will auto-increment
      };

      console.log(minimalLog)

      axios
        .post(`${API_BASE}/api/user/add-log-and-get-all`, {
          log: minimalLog,
          propertyId: selectedPropertyIdInModal,
        },
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then((res) => {
          this.setState({
            modalOpen: false,
            modalAction: null,
            travelLogs: res.data.logs,
          });
        })
        .catch((err) => {
          console.error('Failed to add log:', err);
        });
    } else {
      const nextId = this.state.travelLogs.length
        ? Math.max(...this.state.travelLogs.map((l) => l.id)) + 1
        : 0;

      this.setState((prevState) => ({
        travelLogs: [...prevState.travelLogs, {
          ...newCard,
          'Property Id': selectedPropertyIdInModal,
          'Property Name': this.idToPropertyName(selectedPropertyIdInModal),
          id: nextId,
        }],
        modalOpen: false,
        modalAction: null,
      }));
    }
  };

  displayModal = (modalTitle, action, logId) => {
    const { fields , idList} = this.props;
    const card = action !== 'Add' ? this.state.travelLogs.find((log) => log.id === logId) : {};

    const modalFields =
      action === 'Add' ? fields
      : fields.map((field) => ({
          ...field,
          value: field.type === "select"
            ? card?.["Property Id"] ?? ""
            : card?.[field.label] ?? "",
        }));

    console.log(modalFields)

    const initialSelectedId =
      action !== 'Add' && card && card["Property Id"]
        ? parseInt(card["Property Id"], 10)
        : null;
    
    console.log(logId)
    console.log(this.state.travelLogs)
    console.log(card);
    console.log("typeof =", typeof card?.["Property Id"]);

    return (
      <AdvancedModal
        title={modalTitle}
        fields={modalFields}
        idList={idList}
        {...(action !== 'Add' ? { initialSelectedId: initialSelectedId } : {})}

        onSave={
          action === 'Add'
            ? this.saveClicked
            : (updatedValues, selectedPropertyIdInModal) => {
                const updatedCard = {};
                fields.forEach((field, i) => {
                  updatedCard[field.label] = i === 0 ? this.idToPropertyName(updatedValues[i]): updatedValues[i]
                })
                console.log(updatedValues)
                console.log(updatedCard)
                this.updateCard(logId, updatedCard, selectedPropertyIdInModal);
              }
        }
        onCancel={this.closeModal}
      />
    );
  };

  render() {
    const { travelLogs, modalOpen, modalAction, selectedId } = this.state;
    const { idList, colDefs, page, description, buttonText } = this.props;

    const rowData = this.getRowDataWithDistances();

    return (
      <div className={styles.container}>
        <div className={styles['properties-header']}>
          <div className={styles['properties-left']}>
            <div className={styles['properties-text']}>
              <h2>{page}</h2>
              <p>{description}</p>
            </div>
            <div className={styles['properties-actions']}>
              <select className="browser-default"
                value={this.state.selectedPropertyId}
                onChange={(e) =>  this.setState({ selectedPropertyId: parseInt(e.target.value, 10) })}
              >
                <option value={"-1"}>All</option>
                {(this.props.fields?.[0]?.options || []).map((opt, i) => (
                  <option key={idList[i]} value={idList[i]}>
                    {opt}
                  </option>
                ))}
              </select>
              <select className="browser-default"
                value={this.state.selectedYear}
                onChange={(e) => this.setState({ selectedYear: e.target.value })}
              >
                <option value="NONE">NONE</option>
                {this.getAvailableYears().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button
                className={`btn blue waves-effect waves-light ${styles.addButton}`}
                onClick={() => this.modalClicked('Add', null)}
              >
                <i className="material-icons left">add</i>
                {buttonText}
              </button>
            </div>
          </div>
        </div>

        <div className={styles['grid-wrapper']}>
          <div className={`${styles['ag-theme-alpine']} ${styles['grid-container']}`}>
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              getRowClass={(params) => {
                if (params.data?.isSummary) return styles.pinnedRow; // style summary row differently
                return params.node.rowIndex % 2 === 0 ? styles.agRowEven : styles.agRowOdd;
              }}
              components={{
                actionCellRenderer: (props) => {

                  if (props.data?.isSummary) return null; // no buttons for summary row

                  const logId = props.data.id;
                  return (
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => this.modalClicked('Edit', logId)}
                        className="btn-small blue"
                      >
                        <i className="material-icons">edit</i>
                      </button>
                      <button
                        onClick={() => this.deleteCard(logId)}
                        className="btn-small red"
                      >
                        <i className="material-icons">delete</i>
                      </button>
                    </div>
                  );
                },
              }}
              domLayout="normal"
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[10, 15, 20, 50, 100]}
              onGridReady={(params) => {
                this.gridApi = params.api;
                this.gridColumnApi = params.columnApi;

                // Initial pinned row data set
                this.updatePinnedBottomRow();

                // Update pinned row on filter or sort changes
                params.api.addEventListener('filterChanged', this.updatePinnedBottomRow);
                params.api.addEventListener('sortChanged', this.updatePinnedBottomRow);
                params.api.addEventListener('modelUpdated', this.updatePinnedBottomRow); // <-- important
              }}
              pinnedBottomRowData={this.state.pinnedBottomRowData}
              overlayNoRowsTemplate={`<div class="${styles.noLogsOverlay}">No travel logs</div>`}
            />
          </div>
        </div>

        {modalOpen &&
          (modalAction === 'Add'
            ? this.displayModal('Add Trip', 'Add', null)
            : this.displayModal('Edit Travel Log', 'Edit', selectedId))}

        {this.state.showConfirm && (
          <ConfirmModal
            onYes={this.handleDeleteConfirmed}
            onNo={this.handleDeleteCancelled}
          />
        )}
      </div>
    );
  }
}

export default TravelGrid;
