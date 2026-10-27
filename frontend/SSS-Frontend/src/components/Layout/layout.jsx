import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import "./Layout.css";

import LanguageSelector from "../LanguageSelector";
import BackButton from "../BackButton/BackButton";

import {
  FaBars,
  FaTasks,
  FaClipboardList,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaUserPlus,
  FaFileExcel,
  FaChartBar,
  FaBell,
  FaMoon,
  FaProjectDiagram,
  FaSearch,
  FaHome,
  FaPlus,
  FaClipboardCheck,
  FaBoxes,
  FaCog,
} from "react-icons/fa";


const AppModulesContext = createContext(null);

export function DashboardAppModules() {
  const modules = useContext(AppModulesContext);
  return modules;
}
function Layout({ title, children }) {

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("sss_dark_mode") === "true");

  useEffect(() => { const syncTheme = () => setDarkMode(localStorage.getItem("sss_dark_mode") === "true"); window.addEventListener("sss-theme-change", syncTheme); return () => window.removeEventListener("sss-theme-change", syncTheme); }, []);
  const navigate = useNavigate();


  const toggleSidebar = () =>
    setIsSidebarOpen((prev) => !prev);


  const closeSidebar = () =>
    setIsSidebarOpen(false);


  const closeSearch = () =>
    setTimeout(() => setSearchOpen(false), 150);



  useEffect(() => {

    document.body.classList.toggle("dark-theme", darkMode);
    document.documentElement.classList.toggle(
      "dark-theme",
      darkMode
    );
    localStorage.setItem("sss_dark_mode", String(darkMode));

  }, [darkMode]);




  const parseLocalStorage = (key) => {

    try {

      return JSON.parse(
        localStorage.getItem(key)
      );

    } catch {

      return null;

    }

  };



  const user =
    parseLocalStorage("user") || {};



  const userName =
    typeof user.name === "string" &&
    user.name.trim()
      ? user.name
      : "Employee";



  const roleRaw =
    user?.roleName ||
    user?.role?.roleName ||
    "EMPLOYEE";



  const role =
    String(roleRaw).toUpperCase();




  const nameParts =
    userName.trim().split(" ");




  const isDirector =
    role === "DIRECTOR";



  const isSupervisor =
    role === "SUPERVISOR";


  const isSP001 =
    String(user?.employeeId || "").trim().toUpperCase() === "SP001";



  const isAdmin =
    role === "OWNER/ADMIN";




  const dashboardPath =
    isDirector
      ? "/director-dashboard"
      : isSupervisor
      ? "/supervisor-dashboard"
      : "/dashboard";




  const taskLabel =
    isDirector
      ? "All Tasks"
      : "My Tasks";




  const navItems = [

    {
      label: "Dashboard",
      path: dashboardPath,
      icon: <FaHome />
    },


    {
      label: taskLabel,
      path: "/task",
      icon: <FaTasks />
    },


    {
      label: "Checklist",
      path: "/checklist",
      icon: <FaClipboardList />
    },


    {
      label: "Attendance",
      path: "/attendance",
      icon: <FaCalendarAlt />
    },


    {
      label: "Calendar",
      path: "/calendar",
      icon: <FaCalendarAlt />
    },


    {
      label: "Projects",
      path: "/projects",
      icon: <FaProjectDiagram />
    },


    {
      label: "Inventory",
      path: "/inventory",
      icon: <FaBoxes />
    },

    {
      label: "Client Management",
      path: "/clients",
      icon: <FaUsers />
    },

    {
      label: "Weekly Control Center",
      path: "/weekly-control-center",
      icon: <FaChartBar />
    },
    {
      label: "Incident / Complaint",
      path: "/incidents",
      icon: <FaClipboardCheck />
    },



    {
      label: "Site Management",
      path: "/site-management",
      icon: <FaProjectDiagram />
    },

    {
      label: "Team",
      path: "/team",
      icon: <FaUsers />
    },


    {
      label: "Reports",
      path: "/reports",
      icon: <FaChartBar />
    },


    {
      label: "Add Task",
      path: "/add-task",
      icon: <FaPlus />
    },


    {
      label: "Notifications",
      path: "/notifications",
      icon: <FaBell />
    },


    {
      label: "Profile",
      path: "/profile",
      icon: <FaUser />
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <FaCog />
    },
    {
      label: "Logout",
      path: "/logout",
      icon: <FaUser />
    },


    {
      label: "Employees",
      path: "/director-dashboard?tab=employees",
      icon: <FaUsers />,
      directorOnly: true
    },


    {
      label: "Add Employee",
      path: "/director-dashboard?tab=add-employee",
      icon: <FaUserPlus />,
      directorOnly: true
    },


{
      label: "Upload Excel",
      path: "/director-dashboard?tab=upload-excel",
      icon: <FaFileExcel />,
      directorOnly: true
    },


    {
      label: "Updated Checklist",
      path: "/updated-checklist",
      icon: <FaClipboardCheck />,
      directorOnly: true
    },

  ];




  const handleLogout = (event) => {
    if (event) {
      event.preventDefault();
    }

    // Sirf login/session data remove karo.
    // Language aur baaki preferences preserve rahengi.
    localStorage.removeItem("token");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");

    // Session storage me agar old auth data ho to usse bhi hatao.
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("tokenType");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userId");

    setIsSidebarOpen(false);
    setSearchOpen(false);
    setSearchQuery("");

    navigate("/login", { replace: true });
  };

  const filteredNavItems =
    navItems.filter((item) => {


      // Supervisor ke liye Dashboard hide
      if(
        isSupervisor &&
        item.label === "Dashboard"
      ){

        return false;

      }



      if(item.directorOnly){

        return isDirector || isAdmin;

      }




      if(isDirector || isAdmin){

        return true;

      }




      if(isSupervisor){

        if(item.path === "/site-management"){
          return isSP001;
        }

        return [
          "/task",
          "/checklist",
          "/attendance",
          "/reports",
          "/team",
          "/calendar",
          "/projects",
          "/inventory",
          "/clients",
          "/weekly-control-center",
          "/incidents",
          "/profile",
          "/settings",
          "/logout"
        ].includes(item.path);

      }





      if(role === "EMPLOYEE"){

        return [
          "/dashboard",
          "/task",
          "/checklist",
          "/add-task",
          "/attendance",
          "/calendar",
          "/reports",
          "/inventory",
          "/incidents",
          "/notifications",
          "/profile",
          "/settings",
          "/logout"
        ].includes(item.path);

      }



      return false;


    });




  const searchResults =
    searchQuery.trim()
      ? filteredNavItems.filter((item)=>
          item.label
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
        )
      : [];




  const initials =
    nameParts.length > 1
      ?
      (
        nameParts[0][0] +
        nameParts[nameParts.length - 1][0]
      ).toUpperCase()

      :
      nameParts[0]?.[0]?.toUpperCase()
      || "E";
        return (

    <div
      className={`app-layout ${
        isSidebarOpen ? "sidebar-open" : ""
      }`}
    >


      <aside
        className={`layout-sidebar ${
          isSidebarOpen ? "open" : ""
        }`}
      >


        <div className="logo-box">

          <img
            src="/logo.png"
            alt="SSS Logo"
            className="logo"
          />


          <div className="logo-text">

            <h2>
              SSS FMS (I) PVT. LTD. Services
            </h2>

            <p>
              Services
            </p>

          </div>


        </div>




        <nav
          className="sidebar-menu"
          onClick={closeSidebar}
        >


          {
            filteredNavItems.map((item)=>(

              <NavLink
                  key={item.path}
                  to={item.label === "Logout" ? "/login" : item.path}
                  onClick={item.label === "Logout" ? handleLogout : undefined}
                >

                {item.icon}

                {item.label}


              </NavLink>


            ))
          }


        </nav>




        <div className="user-card">


          <div className="user-avatar">

            {initials}

          </div>



          <div>

            <h4>
              {userName}
            </h4>


            <p>
              {role}
            </p>


          </div>


        </div>


      </aside>





      <div

        className={`layout-overlay ${
          isSidebarOpen
            ? "visible"
            : ""
        }`}

        onClick={closeSidebar}

      />






      <main className="layout-main-content">



        <header className="topbar">



          <div className="mobile-navigation-controls">


            <button

              className="mobile-menu-btn"

              type="button"

              onClick={toggleSidebar}

            >

              <FaBars />

            </button>



            <BackButton />


          </div>





          <h1>

            {title}

          </h1>





          <div className="top-actions">



            <LanguageSelector />





            <div className="search-box">


              <FaSearch className="search-icon" />



              <input

                type="text"

                placeholder="Search anything..."

                value={searchQuery}

                onChange={(e)=>{

                  setSearchQuery(
                    e.target.value
                  );

                  setSearchOpen(true);

                }}

                onFocus={()=>setSearchOpen(true)}

                onBlur={closeSearch}

              />





              {
                searchOpen && (

                  <div className="search-dropdown">


                    {
                      searchQuery.trim().length===0 ?

                      (

                        <div className="search-empty">

                          Type to search pages

                        </div>

                      )

                      :

                      searchResults.length>0 ?

                      (

                        searchResults.map((item)=>(

                          <button

                            key={item.path}

                            type="button"

                            className="search-result"


                            onMouseDown={(e)=>
                              e.preventDefault()
                            }


                            onClick={()=>{

                              navigate(item.path);

                              setSearchQuery("");

                              setSearchOpen(false);

                            }}

                          >


                            <span className="search-result-icon">

                              {item.icon}

                            </span>


                            {item.label}


                          </button>


                        ))

                      )


                      :

                      (

                        <div className="search-empty">

                          No results found

                        </div>

                      )

                    }



                  </div>


                )
              }




            </div>







            <div className="notification-box">


              <button

                onClick={()=>
                  setShowNotifications(
                    !showNotifications
                  )
                }

              >

                <FaBell />

              </button>





              {
                showNotifications && (

                  <div className="notification-dropdown">


                    <h4>
                      Notifications
                    </h4>


                    <p>
                      Checklist Updated
                    </p>


                    <p>
                      5 Tasks Pending
                    </p>


                    <p>
                      Attendance Report Ready
                    </p>



                  </div>

                )

              }



            </div>







            <button

              type="button"

              className={
                darkMode
                ?
                "dark-toggle active"
                :
                "dark-toggle"
              }


              onClick={()=>
                setDarkMode(
                  (prev)=>!prev
                )
              }


              aria-label="Toggle dark mode"

            >


              <FaMoon />


            </button>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="header-logout-btn"
            title="Logout"
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              padding: "9px 14px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#dc2626",
              fontWeight: 600,
              cursor: "pointer",
              zIndex: 20
            }}
          >
            Logout
          </button>
        </header>

        <AppModulesContext.Provider value={
          <section className="app-module-section">
            <h2>Quick Access</h2>
            <div className="app-module-grid">
              {filteredNavItems
                .filter((item) => item.label !== "Dashboard" && item.label !== "Logout")
                .map((item, index) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="app-module-item"
                  >
                    <span className={`app-module-circle app-module-color-${index % 8}`}>
                      {item.icon}
                    </span>
                    <span className="app-module-label">{item.label}</span>
                  </NavLink>
                ))}
            </div>
          </section>
        }>
          {children}
        </AppModulesContext.Provider>

        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {filteredNavItems
            .filter((item) =>
              ["Dashboard", taskLabel, "Attendance"].includes(item.label)
            )
            .map((item) => (
              <NavLink key={item.path} to={item.path} end>
                {item.icon}
                <span>{item.label === taskLabel ? "Tasks" : item.label === "Dashboard" ? "Home" : item.label}</span>
              </NavLink>
            ))}

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="More navigation options"
          >
            <FaBars />
            <span>More</span>
          </button>
        </nav>



      </main>



    </div>


  );

}


export default Layout;
