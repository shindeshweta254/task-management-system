import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./Calendar.css";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";

function Calendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Basic CRUD UI state (works even if backend endpoint is not available yet)
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create | update
  const [activeId, setActiveId] = useState(null);

  const [form, setForm] = useState({
    date: "",
    time: "",
    event: "",
    type: "Meeting",
  });

  const userId = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user")) || {};
      return u.employeeId ?? u.id ?? null;
    } catch {
      return null;
    }
  }, []);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month) => new Date(year, month, 1).getDay();

  const normalizeDateLabel = (isoOrLabel) => {
    if (!isoOrLabel) return "";
    // If backend returns ISO date, show dd Mon yyyy
    const d = new Date(isoOrLabel);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    }
    return isoOrLabel;
  };

  const schedulesStorageKey = useMemo(() => {
    const base = "schedulesData";
    return userId ? `${base}_${userId}` : `${base}_anonymous`;
  }, [userId]);

  const readLocalSchedules = () => {
    try {
      const raw = localStorage.getItem(schedulesStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeLocalSchedules = (list) => {
    try {
      localStorage.setItem(schedulesStorageKey, JSON.stringify(Array.isArray(list) ? list : []));
    } catch {
      // ignore
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/schedules${userId ? `/user/${userId}` : ""}`);
      if (!res.ok) throw new Error("Schedule API not available");
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : [];
      setEvents(normalized);
      writeLocalSchedules(normalized);
    } catch (e) {
      // Backend unavailable => show locally saved schedules.
      const local = readLocalSchedules();
      setEvents(local);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openCreate = () => {
    setFormMode("create");
    setActiveId(null);
    setForm({ date: "", time: "", event: "", type: "Meeting" });
    setFormOpen(true);
  };

  const openUpdate = (item) => {
    setFormMode("update");
    setActiveId(item.id ?? item.scheduleId ?? item._id ?? null);
    setForm({
      date: item.date ?? "",
      time: item.time ?? "",
      event: item.event ?? "",
      type: item.type ?? "Meeting",
    });
    setFormOpen(true);
  };

  const handleDelete = async (item) => {
    const id = item.id ?? item.scheduleId ?? item._id;
    if (!id) return;

    // Always update local immediately so user sees it saved.
    setEvents((prev) => {
      const next = prev.filter((x) => (x.id ?? x.scheduleId ?? x._id) !== id);
      writeLocalSchedules(next);
      return next;
    });

    try {
      // PUT/DELETE endpoint assumption; replace with real endpoint later.
      await fetch(`http://localhost:8080/api/schedules/${id}`, { method: "DELETE" });
    } catch {
      // backend failed => local already updated
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: form.date,
      time: form.time,
      event: form.event,
      type: form.type,
      userId,
    };

    if (formMode === "create") {
      try {
        const res = await fetch("http://localhost:8080/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created = await res.json();
          setEvents((prev) => {
            const next = [created, ...prev];
            writeLocalSchedules(next);
            return next;
          });
        } else {
          // backend fail => local add
          const localItem = { ...payload, id: Date.now() };
          setEvents((prev) => {
            const next = [localItem, ...prev];
            writeLocalSchedules(next);
            return next;
          });
        }
      } catch {
        const localItem = { ...payload, id: Date.now() };
        setEvents((prev) => {
          const next = [localItem, ...prev];
          writeLocalSchedules(next);
          return next;
        });
      }
    } else {
      try {
        const res = await fetch(`http://localhost:8080/api/schedules/${activeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          setEvents((prev) => {
            const next = prev.map((x) => (x.id ?? x.scheduleId ?? x._id) === activeId ? updated : x);
            writeLocalSchedules(next);
            return next;
          });
        } else {
          setEvents((prev) => {
            const next = prev.map((x) => (x.id ?? x.scheduleId ?? x._id) === activeId ? { ...x, ...payload } : x);
            writeLocalSchedules(next);
            return next;
          });
        }
      } catch {
        setEvents((prev) => {
          const next = prev.map((x) => (x.id ?? x.scheduleId ?? x._id) === activeId ? { ...x, ...payload } : x);
          writeLocalSchedules(next);
          return next;
        });
      }
    }


    setFormOpen(false);
  };

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
              <p>Manage upcoming schedules</p>
            </div>
          </div>

          <div className="calendar-actions">
            <button onClick={() => setYear(year - 1)}>
              <FaChevronLeft /> Previous
            </button>
            <button className="add-event-btn" onClick={openCreate}>
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
            <span>{loading ? "Loading" : `${events.length} Events`}</span>
          </div>

          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Event</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>
                    {loading ? "Loading schedules..." : "No schedules found"}
                  </td>
                </tr>
              ) : (
                events.map((item, index) => (
                  <tr key={item.id ?? item.scheduleId ?? item._id ?? index}>
                    <td>{normalizeDateLabel(item.date)}</td>
                    <td>{item.time || "-"}</td>
                    <td>{item.event || "-"}</td>
                    <td>
                      <span className="schedule-badge">{item.type || "-"}</span>
                    </td>
                    <td className="schedule-actions">
                      <button type="button" className="action-btn edit" onClick={() => openUpdate(item)}>
                        Edit
                      </button>
                      <button type="button" className="action-btn delete" onClick={() => handleDelete(item)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {formOpen && (
          <div className="modal-overlay" onClick={() => setFormOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>{formMode === "create" ? "Add Schedule" : "Update Schedule"}</h3>
                <button className="modal-close" onClick={() => setFormOpen(false)} type="button">
                  ✕
                </button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                <label>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Time
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Event
                  <input
                    type="text"
                    value={form.event}
                    onChange={(e) => setForm((p) => ({ ...p, event: e.target.value }))}
                    placeholder="e.g. Team Meeting"
                    required
                  />
                </label>

                <label>
                  Type
                  <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                    <option>Meeting</option>
                    <option>Visit</option>
                    <option>Review</option>
                    <option>Holiday</option>
                    <option>Other</option>
                  </select>
                </label>

                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    {formMode === "create" ? "Add" : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Calendar;
