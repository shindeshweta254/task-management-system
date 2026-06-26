import React from "react";
import "./Attendance.css";

const Attendance = () => {
  const employees = [
    {
      id: 1,
      name: "Rahul Sharma",
      status: "Present",
    },
    {
      id: 2,
      name: "Amit Kumar",
      status: "Absent",
    },
    {
      id: 3,
      name: "Priya Singh",
      status: "Present",
    },
    {
      id: 4,
      name: "Neha Patel",
      status: "Leave",
    },
    {
      id: 5,
      name: "Rohit Verma",
      status: "Present",
    },
  ];

  return (
    <div className="attendance-container">
      <h2>Employee Attendance</h2>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee Name</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.name}</td>
              <td>
                <span
                  className={
                    emp.status === "Present"
                      ? "present"
                      : emp.status === "Absent"
                      ? "absent"
                      : "leave"
                  }
                >
                  {emp.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Attendance;