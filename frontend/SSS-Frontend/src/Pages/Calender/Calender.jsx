import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calender.css";
const CalendarPage = () => {
  const [date, setDate] = useState(new Date());

  const events = [
    { date: "2026-06-26", title: "Supervisor Meeting", type: "Meeting", time: "10:30 AM" },
    { date: "2026-06-27", title: "Housekeeping Audit", type: "Audit", time: "02:00 PM" },
    { date: "2026-06-30", title: "Monthly Attendance Report", type: "Report", time: "05:00 PM" },
  ];

  const selectedDate = date.toLocaleDateString("en-CA");
  const selectedEvents = events.filter((event) => event.date === selectedDate);

  return (
    <div className="calendar-page">
      <div className="calendar-top">
        <div>
          <h2>Calendar</h2>
          <p>Track meetings, audits, reports and schedules</p>
        </div>

        <button className="add-event-btn">+ Add Event</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-card">
          <Calendar onChange={setDate} value={date} />
        </div>

        <div className="events-card">
          <h3>Events</h3>
          <p className="event-date">{selectedDate}</p>

          {selectedEvents.length > 0 ? (
            selectedEvents.map((event, index) => (
              <div className="event-item" key={index}>
                <div className="event-icon">{event.type.charAt(0)}</div>
                <div>
                  <h4>{event.title}</h4>
                  <p>{event.time} • {event.type}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">
              <h4>No Events</h4>
              <p>No meeting or schedule for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;