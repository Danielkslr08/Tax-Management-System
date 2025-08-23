import { StrictMode , useEffect, useState, useContext} from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import NavBarComponent from './components/NavigationBar/NavBar.jsx'
import TextBox from './TextBox/TextBox.jsx'

import HomePage from './pages/Home/Home.jsx'
import PageIntro from './components/PageIntro/PageIntro.jsx'
import TravelGrid from './pages/Travel Log/TravelGrid.jsx'
import SignUp from './components/Account/SignUp/SignUpForm.jsx'
import LogIn from './components/Account/LogIn/LogInForm.jsx'
import UserContext from './components/Account/UserContext.jsx'
import {BrowserRouter as Router, Route, Link, Routes, useLocation, useNavigate} from 'react-router-dom'
//import 'materialize-css/dist/css/materialize.min.css';
//import 'materialize-css/dist/js/materialize.min.js';

const API_BASE = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_PORT || 3002}`;

let pageLinks = [
  'Overview',
  'Properties',
  'Travel Log',
  'Receipts',
  'Sign Up',
  'Log In',
];

const NavBarWrapper = () => {
  const { user , setUser} = useContext(UserContext)
  const navigate = useNavigate()

  const handleLogOut = () => {
    setUser(null)
    navigate(0) // 👈 soft reload of current route
  }

  return <NavBarComponent data={pageLinks} location={useLocation()} user={user} onLogout={handleLogOut}></NavBarComponent>
}

const Home = () => {

  const { user } = useContext(UserContext)

  return(
    <HomePage user={user}/>
  )
}

const PropertiesPage = () => {

  const { user } = useContext(UserContext)

  return(
    <>
      <PageIntro 
        page="Properties"
        description="Track all your business travels effortlessly!"
        buttonText="Add Property"
        user={user}

        fields={[
          { value: "", label: "Property Name", type: "input", placeholder: "Enter the property..." },
          { value: "", label: "Address", type: "input", placeholder: "Enter the address..." },
          { value: "", label: "Distance (km)", type: "input", placeholder: "Enter the distance..." },
          { value: "", label: "Property Type", type: "select", options: ["Main Residence", "Rental Property", "Other"] }
        ]}
      />
    </>
  )
};

const TravelLogPage = () => {

  const { user } = useContext(UserContext)
  
  const defaultOptions = [
    "Suburban Bungalow",
    "Downtown Loft",
    "Lakeview Rental",
    "University Flat",
    "Uptown Duplex",
    "City Condo",
    "Mountain House",
    "Garden Suite",
    "Harbourview Apartment"
  ]

  const defaultIds = [
    0, 1, 2, 3, 4, 5, 6, 7, 8
  ]
  const [propertyOptions, setPropertyOptions] = useState(user ? [] : defaultOptions);
  const [idList, setIdList] = useState(user ? [] : defaultIds);

  useEffect(() => {
    if (user) {
      axios.get(`${API_BASE}/api/properties/names`,
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      .then(res => {
        setPropertyOptions(res.data.names);
        setIdList(res.data.idList)
      })
      .catch(err => {
        console.error("Failed to fetch property names:", err);
      });
    }
  }, [user]);


  return(
    <TravelGrid
      page="Travel Logs"
      description="Record all of your trips here!"
      buttonText="Add Trip"
      user={user}
      idList = {idList}

      fields={[
        { value: "", label: "Property Name", type: "select", options: propertyOptions },
        { value: "", label: "Date", type: "date", placeholder: "Enter the date..." },
        { value: "", label: "Travel Reason", type: "input", placeholder: "Enter the reason..." }
      ]}

      colDefs={[
        { field: "Order", headerName: "#", minWidth: 60, maxWidth: 80, flex: 0, filter: 'agNumberColumnFilter'},
        { field: "Property Name", minWidth: 120, maxWidth: 300, flex: 0},
        { field: "Distance", headerName: 'Distance (km)',minWidth: 100, maxWidth: 150, flex: 0, filter: 'agNumberColumnFilter', valueFormatter: (params) => {
          // For pinned row, format as total string
          if (params.node?.rowPinned) {
            return params.value;
          }
          return params.value != null ? `${params.value}` : '';
        }},
        { field: "Date", minWidth: 100, maxWidth: 150, flex: 0, filter: 'agDateColumnFilter'},
        { field: "Travel Reason", minWidth: 300, flex: 1 , resizable: false, filter: 'agTextColumnFilter'}, // <--- flex: 1 makes this take remaining space
        {
          field: "actions",
          headerName: "",
          cellRenderer: "actionCellRenderer",
          cellClass: 'ag-cell-actionCellRenderer',
          pinned: "right",
          resizable: false,
          sortable: false,
          filter: false,
          minWidth: 90,
          maxWidth: 90,
          flex: 0,
        }
      ]}
    />
  )
};

const LogInPage = () => {
  const { user , setUser} = useContext(UserContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate("/")
    }
  }, [user, navigate])

  const handleLogIn = (userLoggedIn) => {
    setUser(userLoggedIn)
  }

  if (user) {
    return null
  } else {
    return <LogIn logUserIn={handleLogIn}/>
  }
}

const SignUpPage = () => {
  const { user , setUser} = useContext(UserContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate("/")
    }
  }, [user, navigate])

  const handleSignUp = (newUser) => {
    setUser(newUser)
  }

  if (user) {
    return null
  } else {
    return <SignUp logUserIn={handleSignUp}/>
  }
}

const Application = () => {

  const [user, setUser] = useState(null)

  return(
    <UserContext.Provider value={{ user, setUser}}>
      <NavBarWrapper />
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/Properties" element={<PropertiesPage key="Properties" />} />
        <Route exact path="/Travel Log" element={<TravelLogPage key="TravelLog" />} />
        <Route exact path="/Receipts" element={<h1>Receipts Page</h1>} />
        <Route exact path="/Sign Up" element={<SignUpPage />} />
        <Route exact path="/Log In" element={<LogInPage />} />
      </Routes>
    </UserContext.Provider>
  )
}

createRoot(document.getElementById('root')).render(
  <>
    <Router>
      <Application></Application>
    </Router>
    {/*<PageSummary></PageSummary>*/}
  </>
)
