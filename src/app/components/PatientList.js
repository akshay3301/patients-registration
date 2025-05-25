// components/PatientList.js
import { useState, useEffect } from "react";
import { getAllPatients, deletePatient, updatePatient } from "../lib/db.js";

export default function PatientList({
  refreshTrigger,
  onPatientUpdated,
  onPatientDeleted,
}) {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Fix: Added missing state

  // Load patients data
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const patientsData = await getAllPatients();
      setPatients(patientsData);
      console.log(`Loaded ${patientsData.length} patients from database`);
    } catch (err) {
      console.error("Error loading patients:", err);
      setError(`Failed to load patients: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load patients on component mount and when refresh is triggered
  useEffect(() => {
    loadPatients();
  }, [refreshTrigger]);

  // Handle edit start
  const handleEditStart = (patient) => {
    setEditingId(patient.id);
    setEditForm({
      firstName: patient.firstname || patient.firstName || "",
      lastName: patient.lastname || patient.lastName || "",
      dateOfBirth: patient.dateofbirth || patient.dateOfBirth || "",
      gender: patient.gender || "",
      email: patient.email || "",
      phone: patient.phone || "",
      address: patient.address || "",
    });
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle edit save - Fixed
  const handleEditSave = async (patientId) => {
    try {
      setError(null); // Clear any previous errors

      // Validate required fields
      if (
        !editForm.firstName.trim() ||
        !editForm.lastName.trim() ||
        !editForm.dateOfBirth
      ) {
        setError("First name, last name, and date of birth are required");
        return;
      }

      const success = await updatePatient(patientId, editForm);

      if (success) {
        setEditingId(null);
        setEditForm({});
        await loadPatients(); // Refresh the list
        if (onPatientUpdated) onPatientUpdated(); // Notify parent component
        console.log("Patient updated successfully");
      } else {
        setError("Failed to update patient - no rows affected");
      }
    } catch (err) {
      console.error("Error updating patient:", err);
      setError(`Error updating patient: ${err.message}`);
    }
  };

  // Fixed delete handler
  const handleDelete = async (patientId) => {
    try {
      setError(null); // Clear previous errors
      const success = await deletePatient(patientId);

      if (success) {
        setDeleteConfirm(null);
        await loadPatients(); // Refresh local list
        if (onPatientDeleted) onPatientDeleted(); // Trigger cross-tab refresh
        console.log("Patient deleted successfully");
      } else {
        setError("Failed to delete patient - patient may not exist");
      }
    } catch (err) {
      console.error("Error deleting patient:", err);
      setError(`Error deleting patient: ${err.message}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Format gender for display
  const formatGender = (gender) => {
    if (!gender) return "";
    return gender.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
        <button
          onClick={() => {
            setError(null);
            loadPatients();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadPatients}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <span className="text-sm text-gray-600">
            Total: {patients.length} patients
          </span>
        </div>
      </div>

      {isLoading && patients.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-4">
            <svg
              className="h-12 w-12 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p>No patients registered yet</p>
          <p className="text-sm mt-2">
            Add your first patient using the registration form
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  ID
                </th>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  Name
                </th>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  Date of Birth
                </th>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  Gender
                </th>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  Email
                </th>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  Phone
                </th>
                <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                  Address
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-gray-800">
                    {patient.id}
                  </td>

                  {editingId === patient.id ? (
                    <>
                      <td className="py-3 px-4 border-b">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                firstName: e.target.value,
                              })
                            }
                            className="w-24 px-2 py-1 text-sm border rounded"
                            placeholder="First"
                          />
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                lastName: e.target.value,
                              })
                            }
                            className="w-24 px-2 py-1 text-sm border rounded"
                            placeholder="Last"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="date"
                          value={editForm.dateOfBirth}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              dateOfBirth: e.target.value,
                            })
                          }
                          className="w-32 px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <select
                          value={editForm.gender}
                          onChange={(e) =>
                            setEditForm({ ...editForm, gender: e.target.value })
                          }
                          className="w-24 px-2 py-1 text-sm border rounded"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">
                            Prefer not to say
                          </option>
                        </select>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-32 px-2 py-1 text-sm border rounded"
                          placeholder="Email"
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          className="w-28 px-2 py-1 text-sm border rounded"
                          placeholder="Phone"
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditSave(patient.id)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {isLoading ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 border-b text-gray-800">
                        {patient.firstname || patient.firstName || ""}{" "}
                        {patient.lastname || patient.lastName || ""}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-800">
                        {formatDate(patient.dateofbirth || patient.dateOfBirth)}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-800">
                        {formatGender(patient.gender)}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-800">
                        {patient.email || "-"}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-800">
                        {patient.phone || "-"}
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="flex space-x-2">
                          {"address" in patient && patient.address ? (
                            <span className="text-gray-800">
                              {patient.address}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this patient? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay when updating - Only show for edit operations */}
      {isLoading && editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <span className="text-gray-700">Updating...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
