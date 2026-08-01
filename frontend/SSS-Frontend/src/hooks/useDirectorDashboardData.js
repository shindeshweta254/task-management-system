import { useEffect, useState } from "react";

import {
  fetchAllUsers,
  fetchDeadlineToday,
  fetchTaskCountCompleted,
  fetchTaskCountPending,
  fetchTaskCountTotal,
  fetchTasksAll,
  fetchAllAttendance,
} from "../api/directorDashboardApi";


export function useDirectorDashboardData() {

  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    deadlines: 0,
  });


  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");


  const [employees, setEmployees] = useState([]);

  const [attendance, setAttendance] = useState([]);


  const loadAll = async () => {

    try {

      const [
        users,
        attendanceData,
        total,
        pending,
        completed,
        deadlines
      ] = await Promise.all([

        fetchAllUsers(),

        fetchAllAttendance(),

        fetchTaskCountTotal(),

        fetchTaskCountPending(),

        fetchTaskCountCompleted(),

        fetchDeadlineToday(),

      ]);


      setEmployees(
        Array.isArray(users)
          ? users
          : []
      );


      setAttendance(
        Array.isArray(attendanceData)
          ? attendanceData
          : []
      );


      setStats({

        totalEmployees:
          Array.isArray(users)
            ? users.length
            : 0,


        todayAttendance:
          Array.isArray(attendanceData)
            ? attendanceData.filter(
                (a) =>
                  a.attendanceDate ===
                  new Date()
                    .toISOString()
                    .split("T")[0]
              ).length
            : 0,


        pendingTasks:
          pending || 0,


        completedTasks:
          completed || 0,


        totalTasks:
          total || 0,


        deadlines:
          deadlines || 0,

      });


    } catch (error) {

      console.error(
        "Director dashboard load error:",
        error
      );

    }

  };



  const fetchTasks = async () => {

    try {

      setTasksLoading(true);

      setTasksError("");


      const data =
        await fetchTasksAll();


      setTasks(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (error) {

      setTasksError(
        error?.message ||
        "Error loading tasks"
      );


    } finally {

      setTasksLoading(false);

    }

  };



  useEffect(() => {

    loadAll();

    fetchTasks();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  return {

    stats,

    tasks,

    tasksLoading,

    tasksError,

    employees,

    attendance,


    reload: () => {

      loadAll();

      fetchTasks();

    },


    reloadStats: loadAll,


    fetchTasks,

  };

}