import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json"
    }
});


axiosClient.interceptors.request.use(
    (config) => {

        const user = JSON.parse(
            localStorage.getItem("user")
        );


        if (user && user.id) {

            config.headers["X-User-Id"] = user.id;

        }


        console.log(
            "Sending Header X-User-Id:",
            config.headers["X-User-Id"]
        );


        return config;
    },


    (error) => {
        return Promise.reject(error);
    }
);


export default axiosClient;