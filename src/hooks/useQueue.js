import { useState, useEffect } from 'react';
import { getQueueData, completePatient as apiCompletePatient } from '../api';
import { toast } from 'react-toastify';

export const useQueue = () => {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const data = await getQueueData();
      
      // CRITICAL FIX: Smart Queue Logic - Sort by priority (Highest first)
      const sortedData = (data || []).sort((a, b) => {
        // Assuming priority is a number (1-100 or 1-10 as per your prompt)
        const priorityA = parseInt(a.priority) || 0;
        const priorityB = parseInt(b.priority) || 0;
        return priorityB - priorityA; 
      });

      setQueue(sortedData);
    } catch (error) {
      toast.error(`Error fetching queue: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Inside src/hooks/useQueue.js, update this specific function:
  const markPatientAsTreated = async (patientId, prescriptionText) => {
    try {
      // Pass the prescription text to the API
      await apiCompletePatient(patientId, prescriptionText);
      setQueue(queue.filter((patient) => patient.id !== patientId));
      toast.success('Prescription sent and patient marked as treated.');
    } catch (error) {
      // This safely unpacks the JSON error message sent from Python
      toast.error(`Error: ${error.error || error.message || 'Server connection failed'}`);
    }
  };

  useEffect(() => {
    fetchQueue();
    // To make it truly breathe in real-time, you could set an interval here:
    // const interval = setInterval(fetchQueue, 10000); 
    // return () => clearInterval(interval);
  }, []);

  return { queue, isLoading, markPatientAsTreated };
};