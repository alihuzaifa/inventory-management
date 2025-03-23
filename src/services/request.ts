import axios, { AxiosResponse } from "axios";
import store from "../store";

const request = async function (options: any): Promise<any> {
    const onSuccess = function (response: AxiosResponse<any>): any {
        return response.data;
    };

    const onError = function (err: any): Promise<any> {
        if (err.response) {
            if (
                err.response.status === 401 ||
                err.response.status === 431 ||
                err.response.status === 500
            ) {
                console.error("Data:", err);
            }
            // Request was made but server responded with something other than 2xx
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
            console.error("Headers:", err.response.headers);
        } else {
            // Something else happened while setting up the request triggered the error
            console.error("Error Message:", err.message);
        }
        return Promise.reject(err.response?.data || err.message);
    };
    // Get token from Redux store
    const token = store.getState().themeConfig.token;
    console.log('token', token);

    const client = axios.create({
        headers: {
            pragma: "no-cache",
            Authorization: token ? `Bearer ${token}` : undefined, // Set the token in the header if available
        },
    });

    return client(options).then(onSuccess).catch(onError);
};

export default request;