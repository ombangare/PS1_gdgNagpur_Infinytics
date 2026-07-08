import axios from 'axios';

/**
 * DYNAMIC API URL CONFIGURATION
 * -------------------------------------------------------------------------
 * Hardcoded to connect directly to the live Python backend on Render.
 * -------------------------------------------------------------------------
 */
const API_BASE_URL = 'http://127.0.0.1:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Add a new patient and get AI Triage results
export const addPatientSymptoms = async (patientData) => {
  try {
    const response = await apiClient.post('/add_patient', patientData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 2. Fetch the live prioritized queue
export const getQueueData = async () => {
  try {
    const response = await apiClient.get('/queue');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 3. Mark patient as treated and save doctor's advice (prescription)
export const completePatient = async (patientId, adviceText) => {
  try {
    const response = await apiClient.post(`/complete_patient/${patientId}`, { 
      advice: adviceText 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 4. Check live queue position and wait time for a specific patient
export const getPatientStatus = async (patientId) => {
  try {
    const response = await apiClient.get(`/patient_status/${patientId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 5. Trigger a "Call Patient" notification (Doctor side)
export const callPatient = async (patientId) => {
  try {
    const response = await apiClient.post(`/call_patient/${patientId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 6. Fetch a patient's historical medical records
export const getPatientHistory = async (patientId) => {
  try {
    const response = await apiClient.get(`/patient_history/${patientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching history", error);
    return []; // Return empty array if no history exists yet
  }
};

// 7. Manually add an external medical record to history
export const addExternalHistory = async (patientId, historyData) => {
  try {
    const response = await apiClient.post(`/add_external_history/${patientId}`, historyData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 8. Find an existing patient session by phone number (for Login/Status check)
export const retrieveExistingPatient = async (phone) => {
  try {
    const response = await apiClient.post('/retrieve_patient', { phone });
    return response.data; 
  } catch (error) {
    throw error.response?.data || { error: "Server connection failed" };
  }
};

// 9. NEW: Stream AI Triage Chat (Multilingual Groq LLM)
export const streamTriageChat = async (message, chatHistory, language) => {
  try {
    // Native fetch is used here to handle the readable stream from Groq
    const response = await fetch(`${API_BASE_URL}/stream-triage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        history: chatHistory,
        language: language // Dynamically passes the selected language!
      }),
    });
    return response;
  } catch (error) {
    console.error("Streaming API Error:", error);
    throw error;
  }
};

export default apiClient;