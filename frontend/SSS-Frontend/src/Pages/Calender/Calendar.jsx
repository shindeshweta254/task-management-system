import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./Calendar.css";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";

function Calendar() {
  const [year, setYear] = useState(2026);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const schedule = [
    { date: "02 Jul 2026", time: "11:00 AM", event: "Team Meeting", type: "Meeting" },
    { date: "05 Jul 2026", time: "03:00 PM", event: "Site Visit", type: "Visit" },
    { date: "10 Jul 2026", time: "12:30 PM", event: "Monthly Review", type: "Review" },
    { date: "15 Aug 2026", time: "09:00 AM", event: "Independence Day", type: "Holiday" },
  ];

  const getDaysInMonth = (month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month) => new Date(year, month, 1).getDay();

  return (
    <Layout title="Calendar">
      <div className="calendar-page">
        <div className="calendar-main-header">
          <div className="calendar-title">
            <div className="calendar-icon">
              <FaCalendarAlt />
            </div>
            <div>
              <h2>{year} Full Year Calendar</h2>
              <p>Yearly calendar with upcoming schedule</p>
            </div>
          </div>

          <div className="calendar-actions">
            <button onClick={() => setYear(year - 1)}>
              <FaChevronLeft /> Previous
            </button>
            <button className="add-event-btn">
              <FaPlus /> Add Event
            </button>
            <button onClick={() => setYear(year + 1)}>
              Next <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="months-grid">
          {months.map((month, index) => {
            const blanks = Array(getFirstDay(index)).fill(null);
            const days = Array.from({ length: getDaysInMonth(index) }, (_, i) => i + 1);

            return (
              <div className="month-card" key={month}>
                <h3>{month}</h3>

                <div className="week-row">
                  {weekDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="days-grid">
                  {[...blanks, ...days].map((day, i) => (
                    <div key={i} className={day ? "day-cell" : "day-cell empty"}>
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="schedule-card">
          <div className="schedule-head">
            <h2>Upcoming Schedule</h2>
            <span>{schedule.length} Events</span>
          </div>

          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Event</th>
                <th>Type</th>
              </tr>
            </thead>

            <tbody>
              {schedule.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td>{item.time}</td>
                  <td>{item.event}</td>
                  <td>
                    <span className="schedule-badge">{item.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Calendar;