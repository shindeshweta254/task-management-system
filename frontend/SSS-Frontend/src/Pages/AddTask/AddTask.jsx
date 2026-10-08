import Layout from "../../components/Layout/Layout";
import "./AddTask.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { createTask } from "../../api/createTaskApi";
import { useCreateTask } from "../../hooks/useCreateTask";
import { getUserFromStorage } from "../../utils/userStorage";
import { getActiveSites } from "../../api/siteApi";

function AddTask() {
  const navigate = useNavigate();
  const [activeSites, setActiveSites] = useState([]);

  const user = getUserFromStorage("user");

  const {
    employees,
    message,
    setMessage,
    task,
    setTask,
    init,
    handleChange,
  } = useCreateTask();
    const isEmployee = user?.roleName === "EMPLOYEE";

    const assignToEmployees = isEmployee
      ? employees.filter(
          (emp) => Number(emp.id) === Number(user?.id)
        )
      : employees;

    const reviewerEmployees = employees.filter((emp) => {
      const name = String(emp?.name || "").trim().toLowerCase();

      return [
        "ananta vathore",
        "krushna vathore",
        "manisha vathore",
      ].includes(name);
    });

    const allowedEmployeeSites = activeSites.map((site) =>
      String(site?.siteCode || "").trim().toUpperCase()
    );


    const groupedAssignEmployees = assignToEmployees
      .filter((emp) => {
        const roleId = Number(emp?.role?.id || emp?.roleId || emp?.role?.roleId);
        const roleName = String(
          emp?.role?.roleName || emp?.roleName || emp?.role || ""
        ).toUpperCase();

        const isRealEmployee =
          roleId === 3 ||
          roleName === "EMPLOYEE";

        const isActive =
          String(emp?.status || "ACTIVE").toUpperCase() === "ACTIVE";

        return isRealEmployee && isActive && emp?.name && emp?.employeeId;
      })
      .reduce((groups, emp) => {
        const siteCode = String(emp?.siteCode || "").trim().toUpperCase();
        const department = String(emp?.department || "").trim().toUpperCase();

        let groupName = "";

        if (allowedEmployeeSites.includes(siteCode)) {
          groupName = siteCode;
        } else if (!siteCode && department === "OFFICE STAFF") {
          groupName = "OFFICE STAFF";
        } else {
          return groups;
        }

        if (!groups[groupName]) {
          groups[groupName] = [];
        }

        groups[groupName].push(emp);
        return groups;
      }, {});
  // Load employees after component mount
  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    let mounted = true;

    const loadSites = async () => {
      try {
        const data = await getActiveSites();
        if (mounted) {
          setActiveSites(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("[AddTask] Failed to load active sites:", error);
      }
    };

    loadSites();

    return () => {
      mounted = false;
    };
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedEmployeeId = Number(task.assignedToId);
    const reviewerUserId = task.reviewerId
      ? Number(task.reviewerId)
      : null;

    const requestBody = {
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      priority: task.priority,
      status: task.status,
      progressPercentage:
        Number(task.progressPercentage) || 0,

      startDate: task.startDate
        ? task.startDate
        : null,

      dueDate: task.dueDate
        ? task.dueDate
        : null,

      assignedTo: {
        id: selectedEmployeeId,
      },

      reviewer: reviewerUserId
        ? { id: reviewerUserId }
        : null,
    };


    try {
      await createTask(requestBody);

      setMessage("Task Created Successfully âœ…");

      setTimeout(() => {
        navigate("/task");
      }, 1200);

    } catch (error) {
      console.error(error);
      setMessage("Backend server not connected âŒ");
    }
  };


  return (
    <Layout title="Add Task">

      <div className="add-task-page">

        <div className="add-task-card">

          <h2>Create New Task</h2>

          <p>
            Assign task to employee from database
          </p>


          <form onSubmit={handleSubmit}>


            <div className="form-group">

              <label>Task Title</label>

              <input
                type="text"
                name="taskTitle"
                value={task.taskTitle}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />

            </div>



            <div className="form-group">

              <label>
                Task Description
              </label>

              <textarea
                name="taskDescription"
                value={task.taskDescription}
                onChange={handleChange}
                placeholder="Enter task description"
                required
              ></textarea>

            </div>



            <div className="form-row">


              <div className="form-group">

                <label>
                  Assign To
                </label>

                <select
                  name="assignedToId"
                  value={task.assignedToId}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select Employee
                  </option>


                  {Object.entries(groupedAssignEmployees)
  .sort(([a], [b]) => {
    if (a === "OFFICE STAFF") return -1;
    if (b === "OFFICE STAFF") return 1;
    return a.localeCompare(b);
  })
  .map(([groupName, groupEmployees]) => (
    <optgroup key={groupName} label={groupName}>
      {groupEmployees
        .sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || ""))
        )
        .map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name} - {emp.employeeId}
          </option>
        ))}
    </optgroup>
  ))}


                </select>

              </div>




              <div className="form-group">

                <label>
                  Reviewer
                </label>


                <select
                  name="reviewerId"
                  value={task.reviewerId}
                  onChange={handleChange}
                >

                  <option value="">
                    Select Reviewer
                  </option>


                  {reviewerEmployees.map((emp) => (

                    <option
                      key={emp.id}
                      value={emp.id}
                    >
                      {emp.name} - {emp.employeeId}
                    </option>

                  ))}


                </select>

              </div>


            </div>





            <div className="form-row">


              <div className="form-group">

                <label>
                  Priority
                </label>


                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                >

                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                </select>


              </div>




              <div className="form-group">

                <label>
                  Status
                </label>


                <select
                  name="status"
                  value={task.status}
                  onChange={handleChange}
                >

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>


                </select>


              </div>


            </div>






            <div className="form-row">


              <div className="form-group">

                <label>
                  Start Date
                </label>


                <input
                  type="date"
                  name="startDate"
                  value={task.startDate}
                  onChange={handleChange}
                  required
                />

              </div>




              <div className="form-group">

                <label>
                  Due Date
                </label>


                <input
                  type="date"
                  name="dueDate"
                  value={task.dueDate}
                  onChange={handleChange}
                  required
                />

              </div>


            </div>




            <button
              type="submit"
              className="create-task-btn"
            >
              Create Task
            </button>



            {message && (
              <p className="task-message">
                {message}
              </p>
            )}



          </form>


        </div>


      </div>


    </Layout>
  );
}


export default AddTask;
