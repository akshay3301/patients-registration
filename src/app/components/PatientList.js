// components/PatientList.js
import { useState, useEffect } from "react";
import { getAllPatients } from "../lib/db.js";

export default function PatientList({ refreshTrigger }) {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "-";
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const data = await getAllPatients();
        console.log("Fetched patients:", data);
        setPatients(data || []);
        setError(null);
      } catch (err) {
        setError(`Failed to load patients: ${err.message}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-800">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No patients registered yet.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
          <thead className="bg-gray-100 text-gray-900">
            <tr>
              <th className="py-3 px-4 border-b text-left font-medium">ID</th>
              <th className="py-3 px-4 border-b text-left font-medium">Name</th>
              <th className="py-3 px-4 border-b text-left font-medium">
                Date of Birth
              </th>
              <th className="py-3 px-4 border-b text-left font-medium">
                Gender
              </th>
              <th className="py-3 px-4 border-b text-left font-medium">
                Email
              </th>
              <th className="py-3 px-4 border-b text-left font-medium">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 border-b font-medium">
                  {patient.id || "-"}
                </td>
                <td className="py-3 px-4 border-b">
                  <span className="font-medium">
                    {patient.firstname || patient.firstName || ""}{" "}
                    {patient.lastname || patient.lastName || ""}
                  </span>
                </td>
                <td className="py-3 px-4 border-b">
                  {formatDate(patient.dateofbirth || patient.dateOfBirth)}
                </td>
                <td className="py-3 px-4 border-b">
                  <span className="capitalize">{patient.gender || "-"}</span>
                </td>
                <td className="py-3 px-4 border-b">
                  {patient.email ? (
                    <a
                      href={`mailto:${patient.email}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {patient.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-3 px-4 border-b">
                  {patient.phone ? (
                    <a
                      href={`tel:${patient.phone}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {patient.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Total patients: {patients.length}
      </div>
    </div>
  );
}
