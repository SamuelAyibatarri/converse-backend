import * as Interfaces from '@/Interfaces'
import type { APIResponseUserData } from './components/data';
import { UseUserDataState } from './lib/zus';

const LOGIN_API_ENDPOINT = 'http://localhost:8787/api/auth/login';
const SIGNUP_API_ENDPOINT = 'http://localhost:8787/api/auth/signup';


export async function login(formData: Interfaces.LAI) {
    console.log(formData) /// -> For debugging
    try {
        const passwordHash = formData.hashedPassword; 
        formData.hashedPassword = passwordHash;
        
        console.log("This is the form data to login: ", formData);
        
        const response = await fetch(LOGIN_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || "Failed to login")
        }

        const data = await response.json();
        const localData: APIResponseUserData = {
            isLoggedIn: true,
            userData: data.userData,
            token: data.token
        }

        UseUserDataState.getState().updateState(
            localData.userData.email, 
            localData.userData.id, 
            localData.userData.lastLogin, 
            localData.userData.name, 
            localData.userData.role as "agent" | "customer", 
            localData.token
        );
        
        localStorage.setItem("user_data", JSON.stringify(localData))
        return data;        
    } catch (error) {
        console.error({message: "An Error Occured", Error: error});
        throw error;        
    }
};

export async function signup(formData: Interfaces.CAI) {
    console.log(formData) /// -> For debugging
    try {
        const passwordHash = formData.hashedPassword; 
        formData.hashedPassword = passwordHash;
        
        console.log("This is the form data to signup: ", formData);
        
        const response = await fetch(SIGNUP_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })

        if (!response.ok) { 
            const errorData = await response.json();
            throw new Error(errorData.details || "Failed to sign up");
        }
        
        const data = await response.json();
        const localData = {
            isLoggedIn: true,
            userData: data.userData,
            token: data.token
        }

        UseUserDataState.getState().updateState(
            localData.userData.email, 
            localData.userData.id, 
            localData.userData.lastLogin, 
            localData.userData.name, 
            localData.userData.role as "agent" | "customer", 
            localData.token
        );
        
        localStorage.setItem("user_data", JSON.stringify(localData))
        return data; 

    } catch (error) {
        console.error({message: "An Error Occured", Error: error});
        throw error;
    }
};

export async function hashPasswordSHA256(password: string): Promise<string> {
    const passUint8Arr = new TextEncoder().encode(password);
    const passBuffer = await crypto.subtle.digest('SHA-256', passUint8Arr);
    const hashArray = Array.from(new Uint8Array(passBuffer));
    const hashHex = hashArray.map(x => x.toString(16).padStart(2, '0')).join('');

    return hashHex;
};

export function logOut() {
    localStorage.setItem("user_data", JSON.stringify({}));
    window.location.reload();
};